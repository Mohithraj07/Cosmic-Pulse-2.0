"""
Cosmic Pulse 2.0 / SpaceSage AI: integrated backend.

Combines two earlier projects behind one FastAPI app:
  * Computer Vision (YOLOv8)  : POST /detect, /api/cv/detect  (+ original /app page)
  * GenAI reasoning module     : /api/genai/*

It also serves the built React app (../dist) when it exists, so one process
and one port are enough to share the whole project.

Run from this folder:   python -m uvicorn main:app --host 0.0.0.0 --port 8000
"""
import io
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import Body, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from genai import spacesage_genai as genai
from genai.ask import answer_question

BASE_DIR = Path(__file__).resolve().parent
CV_DIR = BASE_DIR / "computer_vision"
GENAI_DIR = BASE_DIR / "genai"
DIST_DIR = BASE_DIR.parent / "dist"

PROJECT = "Cosmic Pulse 2.0"
CLASSES = ["person", "hvac_unit", "antenna"]
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Trained model location (override with SPACESAGE_MODEL=/path/to/best.pt)
MODEL_PATH = Path(
    os.environ.get(
        "SPACESAGE_MODEL",
        CV_DIR / "runs" / "detect" / "outputs" / "spacesage_cv" / "weights" / "best.pt",
    )
)

app = FastAPI(title="Cosmic Pulse 2.0 - SpaceSage AI API")

# CORS: open by default so friends' browsers can call the API.
# Restrict in production, e.g. CORS_ORIGINS="https://my-site.example".
_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Computer Vision model (loaded lazily so the GenAI/Twin features still work
# if ultralytics or the model file is missing on a friend's machine).
# --------------------------------------------------------------------------
_model = None
_model_error: Optional[str] = None


def get_model():
    global _model, _model_error
    if _model is not None:
        return _model
    if not MODEL_PATH.is_file():
        _model_error = f"Trained model not found: {MODEL_PATH}"
        raise HTTPException(status_code=503, detail=_model_error)
    try:
        from ultralytics import YOLO  # imported here: heavy dependency
    except ImportError:
        _model_error = "Computer Vision needs the 'ultralytics' package: pip install ultralytics"
        raise HTTPException(status_code=503, detail=_model_error)
    try:
        _model = YOLO(str(MODEL_PATH))
    except Exception as exc:  # corrupted weights, incompatible torch, ...
        _model_error = f"Could not load the model: {exc}"
        raise HTTPException(status_code=503, detail=_model_error)
    _model_error = None
    return _model


def _status() -> Dict[str, Any]:
    return {
        "project": PROJECT,
        "status": "healthy",
        "model_loaded": _model is not None,
        "model_file_present": MODEL_PATH.is_file(),
        "model_error": _model_error,
        "genai_module": "loaded",
        "classes": CLASSES,
    }


@app.get("/health")
@app.get("/api/health")
def health():
    return _status()


if not DIST_DIR.is_dir():
    # Original Computer Vision home route (the SPA owns "/" once built).
    @app.get("/")
    def home():
        return {
            "project": PROJECT,
            "status": "CV API is running",
            "classes": CLASSES,
            "hint": "Run `npm run build` to serve the full web app from this server.",
        }


# --------------------------------------------------------------------------
# Computer Vision
# --------------------------------------------------------------------------
@app.post("/detect")
@app.post("/api/cv/detect")
async def detect(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WEBP image.")

    try:
        contents = await file.read(MAX_UPLOAD_BYTES + 1)

        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image is larger than 15 MB.")

        model = get_model()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = model.predict(image, conf=0.25, verbose=False)[0]

        detections = []
        for box in result.boxes:
            class_id = int(box.cls.item())
            detections.append(
                {
                    "class": model.names[class_id],
                    "confidence": round(float(box.conf.item()), 3),
                    "box_xyxy": [round(float(v), 1) for v in box.xyxy[0].tolist()],
                }
            )

        return {
            "project": PROJECT,
            "detections_count": len(detections),
            "detections": detections,
            "image_width": image.width,
            "image_height": image.height,
            "note": (
                "Visual detections only. Energy recommendations require "
                "telemetry or clearly labelled simulation data."
            ),
        }

    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")
    finally:
        await file.close()


@app.get("/app", response_class=HTMLResponse)
def upload_page():
    """The original stand-alone upload page from the Computer Vision project."""
    return (CV_DIR / "upload_page.html").read_text(encoding="utf-8")


# --------------------------------------------------------------------------
# GenAI reasoning module
# --------------------------------------------------------------------------
def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


@app.post("/api/genai/analyze")
def genai_analyze(request: Dict[str, Any] = Body(...)):
    """Full pipeline: validation, energy estimate, safety decision, advice."""
    return genai.spacesage_genai_entry(request)


@app.post("/api/genai/energy-savings")
def genai_energy_savings(body: Dict[str, Any] = Body(...)):
    return genai.spacesage_calculate_energy_savings(
        body.get("baseline_power_kw"),
        body.get("scenario_power_kw"),
        body.get("duration_hours"),
    )


@app.post("/api/genai/passaware")
def genai_passaware(body: Dict[str, Any] = Body(...)):
    """PassAware check. Times use the format YYYY-MM-DD HH:MM."""
    return genai.spacesage_check_passaware(
        body.get("satellite_aos"),
        body.get("satellite_los"),
        body.get("station_start"),
        body.get("station_end"),
        other_activities=body.get("other_activities"),
        equipment_ready=body.get("equipment_ready", True),
        warmup_seconds=body.get("warmup_seconds", 60),
        manual_override=body.get("manual_override", False),
    )


_VALIDATORS = {
    "computer-vision": genai.spacesage_process_cv_input,
    "digital-twin": genai.spacesage_validate_digital_twin,
    "user-modified-digital-twin": genai.spacesage_process_user_modified_dt,
}


@app.post("/api/genai/validate/{kind}")
def genai_validate(kind: str, body: Dict[str, Any] = Body(...)):
    validator = _VALIDATORS.get(kind)
    if validator is None:
        raise HTTPException(status_code=404, detail=f"Unknown input kind. Use one of: {', '.join(_VALIDATORS)}")
    return validator(body)


@app.post("/api/genai/insights")
def genai_insights(body: Dict[str, Any] = Body(...)):
    """Local rule-based insights (the module's external-AI fallback)."""
    return {"insights": genai.generate_spacesage_insights(body.get("prompt", ""))}


@app.post("/api/genai/ask")
def genai_ask(body: Dict[str, Any] = Body(...)):
    """Free-text question for the Energy Advisor chat box."""
    return answer_question(body.get("question", ""), body.get("equipment"))


@app.get("/api/genai/examples")
def genai_examples():
    return _read_json(GENAI_DIR / "spacesage_genai_examples.json")


@app.get("/api/genai/contract")
def genai_contract():
    return _read_json(GENAI_DIR / "spacesage_genai_contract.json")


@app.exception_handler(Exception)
async def unexpected_error(_request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"Unexpected server error: {exc}"})


# --------------------------------------------------------------------------
# Built React app (production / sharing mode). Must be registered last.
# --------------------------------------------------------------------------
if DIST_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="web")

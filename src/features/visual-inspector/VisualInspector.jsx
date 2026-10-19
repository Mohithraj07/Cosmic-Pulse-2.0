import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, apiFetch } from "../../config";
import { localIsoTimestamp } from "../digital-twin/twinSnapshot";
import "../modules.css";

const CLASS_COLORS = {
  person: "#ffb454",
  hvac_unit: "#5ee0a0",
  antenna: "#7cc4ff",
};
const colorFor = (name) => CLASS_COLORS[name] ?? "#d49bff";

const SAMPLES = [
  { label: "Sample: test.jpg", url: "/samples/test.jpg", name: "test.jpg" },
  { label: "Sample: antenna", url: "/samples/antenna_sample.jpg", name: "antenna_sample.jpg" },
];

export default function VisualInspector({ onSendToAdvisor }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [minConfidence, setMinConfidence] = useState(0.25);
  const [zone, setZone] = useState("Zone A");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // Release the object URL when the image changes or the view closes.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const chooseFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  };

  const loadSample = async (sample) => {
    try {
      const blob = await (await fetch(sample.url)).blob();
      chooseFile(new File([blob], sample.name, { type: blob.type || "image/jpeg" }));
    } catch {
      setError("Could not load the sample image.");
    }
  };

  const detect = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    try {
      setResult(await apiFetch("/api/cv/detect", { method: "POST", body: form }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const visible = useMemo(
    () => (result?.detections ?? []).filter((d) => d.confidence >= minConfidence),
    [result, minConfidence],
  );

  const counts = useMemo(() => {
    const tally = {};
    visible.forEach((d) => (tally[d.class] = (tally[d.class] ?? 0) + 1));
    return tally;
  }, [visible]);

  const meanConfidence = visible.length
    ? visible.reduce((sum, d) => sum + d.confidence, 0) / visible.length
    : null;

  const sendToAdvisor = () => {
    const { person = 0, ...equipment } = counts;
    onSendToAdvisor({
      room_or_zone: zone.trim() || "Zone A",
      occupancy: person,
      timestamp: localIsoTimestamp(),
      ...(meanConfidence !== null && { confidence: Number(meanConfidence.toFixed(3)) }),
      equipment_status: equipment,
    });
  };

  return (
    <div className="module-body">
      <div className="vi-layout">
        <section className="mod-card">
          <h3 className="mod-card-title">1 · Choose an image</h3>
          <div
            className={`vi-drop ${dragging ? "dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              chooseFile(e.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => chooseFile(e.target.files?.[0])}
            />
            <strong>{file ? file.name : "Drop a JPG, PNG or WEBP here"}</strong>
            <small>or click to browse</small>
          </div>

          <div className="mod-row">
            {SAMPLES.map((s) => (
              <button key={s.url} type="button" className="mod-btn ghost" onClick={() => loadSample(s)}>
                {s.label}
              </button>
            ))}
          </div>

          <button type="button" className="mod-btn primary" disabled={!file || loading} onClick={detect}>
            {loading ? "Detecting…" : "Detect assets"}
          </button>

          {error && <p className="mod-error" role="alert">{error}</p>}
          <p className="mod-note">
            Detects people, HVAC units and antennas with the trained YOLOv8 model. Visual detections only.{" "}
            <a href={`${API_BASE}/app`} target="_blank" rel="noreferrer">Original upload page ↗</a>
          </p>
        </section>

        <section className="mod-card vi-stage">
          <h3 className="mod-card-title">2 · Result</h3>
          {previewUrl ? (
            <div className="vi-image-wrap">
              <img src={previewUrl} alt="Uploaded for inspection" />
              {result &&
                visible.map((d, i) => {
                  const [x1, y1, x2, y2] = d.box_xyxy;
                  const w = result.image_width;
                  const h = result.image_height;
                  return (
                    <div
                      key={i}
                      className="vi-box"
                      style={{
                        left: `${(x1 / w) * 100}%`,
                        top: `${(y1 / h) * 100}%`,
                        width: `${((x2 - x1) / w) * 100}%`,
                        height: `${((y2 - y1) / h) * 100}%`,
                        borderColor: colorFor(d.class),
                      }}
                    >
                      <span style={{ background: colorFor(d.class) }}>
                        {d.class} {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="mod-empty">No image selected yet.</p>
          )}

          {result && (
            <>
              <label className="mod-field">
                <span>Minimum confidence: {(minConfidence * 100).toFixed(0)}%</span>
                <input
                  type="range"
                  min="0.25"
                  max="0.95"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                />
              </label>

              <div className="vi-chips">
                {visible.length === 0 && <span className="vi-chip">No detections at this confidence</span>}
                {Object.entries(counts).map(([name, n]) => (
                  <span key={name} className="vi-chip" style={{ borderColor: colorFor(name) }}>
                    <i style={{ background: colorFor(name) }} /> {n} × {name}
                  </span>
                ))}
                {meanConfidence !== null && (
                  <span className="vi-chip">avg confidence {(meanConfidence * 100).toFixed(0)}%</span>
                )}
              </div>

              {visible.length > 0 && (
                <table className="vi-table">
                  <thead>
                    <tr><th>Class</th><th>Confidence</th><th>Box (x1, y1, x2, y2)</th></tr>
                  </thead>
                  <tbody>
                    {visible.map((d, i) => (
                      <tr key={i}>
                        <td>{d.class}</td>
                        <td>{(d.confidence * 100).toFixed(1)}%</td>
                        <td>{d.box_xyxy.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="vi-handoff">
                <label className="mod-field">
                  <span>Room / zone name</span>
                  <input value={zone} onChange={(e) => setZone(e.target.value)} />
                </label>
                <button type="button" className="mod-btn primary" onClick={sendToAdvisor}>
                  Send to Energy Advisor ⚡
                </button>
                <p className="mod-note">
                  Sends people count as occupancy plus detected equipment. The Energy Advisor holds any decision
                  when average confidence is below 70%.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

# Cosmic Pulse 2.0 · SpaceSage AI (integrated)

One project that combines your four original zips:

| Original zip | Where it lives now | How you reach it in the app |
|---|---|---|
| `spacesage.zip` (React dashboard) | `src/App.jsx`, `src/App.css`, `src/assets` | The home screen: Mission Control sidebar, hero, electricity meters, 2015–2025 history, six equipment energy popups |
| `satellite-digital-twin.zip` (3D ground station) | `src/features/digital-twin/` | Sidebar → **Network Simulator** |
| `Computer-Vision_zip.zip` (YOLOv8 API + model) | `backend/main.py` + `backend/computer_vision/` | Sidebar → **Visual Inspector** (also `POST /detect` and the original `/app` page) |
| `SpaceSage_AI_GenAI_Corrected.zip` (reasoning module) | `backend/genai/` | Sidebar → **Energy Advisor** (plus PassAware scheduler) |

## Run it in VS Code (Windows / macOS / Linux)

Prerequisites: **Node.js 20+** and **Python 3.10+**.

1. Open this folder in VS Code (`File → Open Folder`).
2. Open the terminal (`Ctrl+` `` ` ``) and run, once:
   ```
   npm install
   npm run setup:backend
   ```
   (`setup:backend` creates `.venv` and installs the Python packages. `ultralytics` pulls in PyTorch, so it takes a few minutes.)
3. Every time:
   ```
   npm run dev:all
   ```
   Open **http://localhost:5173**.

You can also press `Ctrl+Shift+B` to run the "Cosmic Pulse: run everything" task.

Useful variants: `npm run dev` (web only), `npm run backend` (API only, http://localhost:8000/health to check it).

> The Energy Advisor and Digital Twin work even if PyTorch/ultralytics is not installed. Only the Visual Inspector needs it, and it shows a clear message if it is missing.

## Let friends use it

**A. Same Wi-Fi.** Run `npm run dev:all`. Vite prints a `Network:` address such as `http://192.168.1.20:5173`. Friends open that in their browser. Allow Node/Python through the Windows firewall when asked. Only port 5173 is needed because Vite forwards `/api` to the backend.

**B. Anywhere on the internet (temporary link).** While `dev:all` is running, in a second terminal:
```
npx cloudflared tunnel --url http://localhost:5173
```
(or `ngrok http 5173`). Send friends the https link it prints. It stops when you close it.

**C. Permanent hosting (one server, one port).**
```
npm run build
npm run backend
```
The backend now also serves the built web app at http://localhost:8000. Deploy the folder to any host that runs Python (Render, Railway, Fly.io, a VPS) with start command `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`. PyTorch is large, so check the host's memory limit; without `ultralytics` everything but the Visual Inspector still works.

**D. Share the code.** Send `cosmic-pulse-share.zip`, or push the folder to GitHub (`.gitignore` already skips `.venv`, `node_modules` and the 137 MB `dataset_zips`, which GitHub would reject). Friends follow the "Run it in VS Code" steps.

## How the modules talk to each other

- **Digital Twin → Energy Advisor.** The twin's state lives in the app (`useDigitalTwin`), so it keeps simulating while you use other modules. In Energy Advisor choose *Live Digital Twin* to analyse the current racks (switch equipment off in the twin and re-run to see the difference).
- **Computer Vision → Energy Advisor.** In Visual Inspector, "Send to Energy Advisor" turns people count into `occupancy` and detected antennas/HVAC units into `equipment_status`.
- The Energy Advisor also has a *Raw JSON / examples* tab with the module's three bundled scenarios, which is where `user_modified_digital_twin` requests go.

## Backend API

| Route | Purpose |
|---|---|
| `GET /health`, `/api/health` | Status, model loaded or not |
| `POST /detect`, `/api/cv/detect` | YOLOv8 detection (JPG/PNG/WEBP, max 15 MB) |
| `GET /app` | Original stand-alone upload page |
| `POST /api/genai/analyze` | Full GenAI pipeline (`spacesage_genai_entry`) |
| `POST /api/genai/passaware` | Satellite pass scheduling check |
| `POST /api/genai/energy-savings` | Energy-saving estimate |
| `POST /api/genai/validate/{computer-vision\|digital-twin\|user-modified-digital-twin}` | Input validators |
| `POST /api/genai/insights` | Rule-based insight text |
| `GET /api/genai/examples`, `/api/genai/contract` | Bundled examples and request contract |

Interactive docs: http://localhost:8000/docs

## Changes made while integrating (everything else is untouched)

1. **Bug fix in the GenAI module:** `spacesage_check_passaware` and `spacesage_process_user_modified_dt` used `datetime` without importing it at the top of the file, so they crashed with a `NameError`. Added `from datetime import datetime`.
2. **Twin CSS scoped.** The twin's stylesheet styled `body`, `h1`, `.app`, etc. globally. It is now scoped under `.dt-root`, and its `.app`/`.status-dot` classes were renamed `dt-app`/`dt-status-dot` so they cannot clash with the dashboard.
3. **Twin split into hook + view** (`useDigitalTwin.ts`, `DigitalTwinView.tsx`) with the original logic and JSX unchanged, so the Energy Advisor can read live twin state. The 3D scene loads only when opened.
4. **Sidebar buttons** now open the modules. Mapping: Energy Advisor → GenAI, Visual Inspector → Computer Vision, Network Simulator → Digital Twin. To change it, edit `VIEWS` and the three `openView(...)` calls in `src/App.jsx`.
5. **Backend merged** into one FastAPI app. The model now loads on first use so the server starts even when PyTorch or the model is missing. The original `/detect`, `/health`, `/app` routes still exist at their old paths.
6. `build` no longer runs `tsc -b`; use `npm run typecheck` for TypeScript checks.

## Things to know

- **Assumptions in `src/features/digital-twin/twinSnapshot.ts`:** the twin tracks load %, not kW, so each rack has an assumed rated power (adding up to the twin's 18 kW) and a mission-critical flag (RF TX/RX, modem, network = critical). Edit these to match reality.
- **Everything is simulated/advisory.** As designed in the GenAI module, it never changes the twin or equipment, and energy savings are estimates, not measurements.
- **CV model:** `best.pt` and `last.pt` are both kept. The last training epoch (20, YOLOv8n) shows precision 0.69, recall 0.77, mAP50 0.75, which is moderate, so expect misses. The Energy Advisor deliberately returns HOLD when average detection confidence is under 70%.
- `backend/computer_vision/dataset_zips/` holds the three Roboflow training sets (antenna, HVAC, server rack). They are not needed to run the app.

## Project layout

```
cosmic-pulse/
├─ src/                      React app (Vite)
│  ├─ App.jsx                dashboard + module switching
│  └─ features/
│     ├─ digital-twin/       3D ground station (three.js)
│     ├─ visual-inspector/   upload + bounding boxes
│     └─ energy-advisor/     GenAI UI + PassAware
├─ backend/
│  ├─ main.py                FastAPI: CV + GenAI (+ serves dist/)
│  ├─ genai/                 spacesage_genai.py, examples, contract, README
│  └─ computer_vision/       trained model (runs/), samples, datasets
├─ scripts/backend.mjs       cross-platform Python launcher
└─ .vscode/                  tasks for one-click start
```

## Ask SpaceSage AI (chat box)
The Energy Advisor screen now has an "Ask SpaceSage AI" chat box. It calls `POST /api/genai/ask`
(backend/genai/ask.py), which wraps the original GenAI module and adds the live Digital Twin context.
The backend must be running (`npm run dev:all`) for answers to appear.

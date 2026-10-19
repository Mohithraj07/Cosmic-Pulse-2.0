import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../config";
import { buildTwinSnapshot, totalPowerKW } from "../digital-twin/twinSnapshot";
import "../modules.css";

const SOURCES = [
  { id: "twin", label: "Live Digital Twin" },
  { id: "cv", label: "Computer Vision" },
  { id: "raw", label: "Raw JSON / examples" },
];

const FACILITIES = [
  { value: "ground_station", label: "Ground station" },
  { value: "data_center", label: "Data center" },
  { value: "antenna", label: "Antenna system" },
];

const DECISION_HELP = {
  AUTO_APPLY: "Low-risk. Simulated decision only; nothing is applied.",
  REVIEW: "A person must review this before any action.",
  BLOCK: "Blocked by a manual override or a schedule conflict.",
  HOLD: "Input is invalid, incomplete or unrecognised.",
};

function Decision({ decision, reason }) {
  return (
    <div className={`ea-decision ${String(decision).toLowerCase()}`}>
      <strong>{decision}</strong>
      <span>{reason}</span>
      {DECISION_HELP[decision] && <small>{DECISION_HELP[decision]}</small>}
    </div>
  );
}

function Result({ result }) {
  const energy = result.energy_analysis;
  const errors = result.validation?.errors ?? [];
  return (
    <div className="ea-result">
      <Decision decision={result.automation?.decision} reason={result.automation?.reason} />

      {energy && (
        <div className="ea-stats">
          <div><small>Potential reduction</small><strong>{energy.potential_reduction_kw} kW</strong></div>
          <div><small>Reduction</small><strong>{energy.potential_reduction_percent}%</strong></div>
          <div><small>Duration</small><strong>{energy.duration_hours} h</strong></div>
          <div><small>Potential energy saved</small><strong>{energy.potential_energy_saved_kwh} kWh</strong></div>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mod-error-list">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      {result.recommendation && (
        <>
          <h4>Recommendation</h4>
          <p className="ea-reco">{result.recommendation}</p>
        </>
      )}

      <p className="mod-note">
        {result.note ?? "Analysis only."} Energy figures are estimates calculated from the supplied values, not
        measured savings. This module is advisory: it never changes the Digital Twin or equipment.
      </p>

      <details>
        <summary>Raw response</summary>
        <pre className="mod-pre">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function PassAware() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    aos: `${today}T10:00`,
    los: `${today}T10:30`,
    start: `${today}T10:05`,
    end: `${today}T10:25`,
    warmup: 60,
    ready: true,
    override: false,
    otherOn: false,
    otherStart: `${today}T10:20`,
    otherEnd: `${today}T10:40`,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const fmt = (v) => v.replace("T", " ");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(
        await apiFetch("/api/genai/passaware", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            satellite_aos: fmt(form.aos),
            satellite_los: fmt(form.los),
            station_start: fmt(form.start),
            station_end: fmt(form.end),
            warmup_seconds: Number(form.warmup),
            equipment_ready: form.ready,
            manual_override: form.override,
            other_activities: form.otherOn ? [{ start: fmt(form.otherStart), end: fmt(form.otherEnd) }] : [],
          }),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mod-card">
      <h3 className="mod-card-title">PassAware · satellite pass scheduling</h3>
      <p className="mod-note">
        Checks that a station tracking block fits inside the satellite visibility window and does not clash with
        other activities. A scheduling prototype, not a live orbit predictor.
      </p>
      <div className="mod-grid">
        <label className="mod-field"><span>Satellite AOS</span><input type="datetime-local" value={form.aos} onChange={set("aos")} /></label>
        <label className="mod-field"><span>Satellite LOS</span><input type="datetime-local" value={form.los} onChange={set("los")} /></label>
        <label className="mod-field"><span>Station start</span><input type="datetime-local" value={form.start} onChange={set("start")} /></label>
        <label className="mod-field"><span>Station end</span><input type="datetime-local" value={form.end} onChange={set("end")} /></label>
        <label className="mod-field"><span>Warm-up (seconds)</span><input type="number" min="0" value={form.warmup} onChange={set("warmup")} /></label>
      </div>
      <div className="mod-row">
        <label className="mod-check"><input type="checkbox" checked={form.ready} onChange={set("ready")} /> Equipment ready</label>
        <label className="mod-check"><input type="checkbox" checked={form.override} onChange={set("override")} /> Manual override</label>
        <label className="mod-check"><input type="checkbox" checked={form.otherOn} onChange={set("otherOn")} /> Another activity</label>
      </div>
      {form.otherOn && (
        <div className="mod-grid">
          <label className="mod-field"><span>Other activity start</span><input type="datetime-local" value={form.otherStart} onChange={set("otherStart")} /></label>
          <label className="mod-field"><span>Other activity end</span><input type="datetime-local" value={form.otherEnd} onChange={set("otherEnd")} /></label>
        </div>
      )}
      <button type="button" className="mod-btn primary" onClick={run} disabled={loading}>
        {loading ? "Checking…" : "Check pass schedule"}
      </button>
      {error && <p className="mod-error" role="alert">{error}</p>}
      {result && (
        <div className="ea-result">
          <Decision decision={result.decision} reason={result.reason} />
          {result.proposed_wakeup && (
            <p className="mod-note">
              Proposed wake-up: <strong>{result.proposed_wakeup}</strong> (tracking start minus warm-up).{" "}
              {result.note}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

const SUGGESTIONS = [
  "How can I reduce transmitter power use?",
  "How do I cut cooling energy?",
  "What do REVIEW and BLOCK mean?",
  "How should I schedule equipment around satellite passes?",
];

function AskAdvisor({ equipment }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm SpaceSage AI. Ask me anything about energy use in your ground station, data center or antenna system." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const ask = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/genai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, equipment }),
      });
      setMessages((m) => [...m, { role: "ai", text: data.answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: err.message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mod-card ask-card">
      <h3 className="mod-card-title">Ask SpaceSage AI</h3>
      <div className="mod-row">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="mod-btn ghost" onClick={() => ask(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>
      <div className="ask-log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`ask-msg ${m.role}${m.error ? " error" : ""}`}>{m.text}</div>
        ))}
        {loading && <div className="ask-msg ai">Thinking…</div>}
        <div ref={endRef} />
      </div>
      <div className="ask-input">
        <input
          type="text"
          value={input}
          placeholder="Type your question and press Enter"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button type="button" className="mod-btn primary" onClick={() => ask()} disabled={loading || !input.trim()}>
          Ask
        </button>
      </div>
    </section>
  );
}

export default function EnergyAdvisor({ twin, cvObservation, startMode }) {
  const [mode, setMode] = useState(startMode === "cv" && cvObservation ? "cv" : "twin");
  const [facility, setFacility] = useState("ground_station");
  const [baseline, setBaseline] = useState(100);
  const [scenario, setScenario] = useState(75);
  const [duration, setDuration] = useState(2);
  const [risk, setRisk] = useState("low");
  const [flags, setFlags] = useState({ manual_override: false, critical_data_complete: true, schedule_conflict: false });
  const [raw, setRaw] = useState("");
  const [examples, setExamples] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/genai/examples")
      .then(setExamples)
      .catch(() => setExamples([]));
  }, []);

  // Re-sampled whenever the live twin changes so the preview never goes stale.
  const snapshot = useMemo(() => buildTwinSnapshot(twin.equipmentStates), [twin.equipmentStates]);
  const twinKW = totalPowerKW(snapshot);

  const buildRequest = () => {
    if (mode === "raw") return JSON.parse(raw);
    return {
      source: mode === "twin" ? "fixed_digital_twin" : "computer_vision",
      facility_type: facility,
      payload: mode === "twin" ? snapshot : cvObservation,
      energy_scenario: {
        baseline_power_kw: Number(baseline),
        scenario_power_kw: Number(scenario),
        duration_hours: Number(duration),
      },
      risk_level: risk,
      ...flags,
    };
  };

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const request = buildRequest();
      setResult(
        await apiFetch("/api/genai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );
    } catch (err) {
      setError(err instanceof SyntaxError ? `The JSON is not valid: ${err.message}` : err.message);
    } finally {
      setLoading(false);
    }
  };

  const useTwinTotals = () => {
    setBaseline(twinKW);
    setScenario(Number((twinKW * 0.75).toFixed(2)));
  };

  const loadExample = (example) => {
    setRaw(JSON.stringify(example.request, null, 2));
    setMode("raw");
    setResult(null);
  };

  const toggle = (key) => (e) => setFlags((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <div className="module-body">
      <div className="ea-layout">
        <section className="mod-card">
          <h3 className="mod-card-title">Energy scenario</h3>

          <div className="mod-tabs" role="tablist">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={mode === s.id}
                className={mode === s.id ? "active" : ""}
                onClick={() => setMode(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {mode === "twin" && (
            <p className="mod-note">
              Uses the live Digital Twin: {snapshot.equipment.length} equipment racks, about{" "}
              <strong>{twinKW} kW</strong> estimated draw (rated power is a simulation assumption). Switch racks
              on or off in the twin and re-run.
            </p>
          )}
          {mode === "cv" &&
            (cvObservation ? (
              <pre className="mod-pre">{JSON.stringify(cvObservation, null, 2)}</pre>
            ) : (
              <p className="mod-empty">
                No Computer Vision observation yet. Run Visual Inspector and choose “Send to Energy Advisor”.
              </p>
            ))}

          {mode === "raw" ? (
            <>
              <div className="mod-row">
                {examples.map((ex) => (
                  <button key={ex.scenario} type="button" className="mod-btn ghost" onClick={() => loadExample(ex)}>
                    {ex.scenario}
                  </button>
                ))}
              </div>
              <label className="mod-field">
                <span>Request JSON (see backend/genai/spacesage_genai_contract.json)</span>
                <textarea
                  rows={14}
                  spellCheck={false}
                  value={raw}
                  placeholder="Pick an example above, or paste a request. Digital Twin edits (user_modified_digital_twin) go here."
                  onChange={(e) => setRaw(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <div className="mod-grid">
                <label className="mod-field">
                  <span>Facility type</span>
                  <select value={facility} onChange={(e) => setFacility(e.target.value)}>
                    {FACILITIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </label>
                <label className="mod-field">
                  <span>Risk level</span>
                  <select value={risk} onChange={(e) => setRisk(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="mod-field"><span>Baseline power (kW)</span><input type="number" min="0" step="any" value={baseline} onChange={(e) => setBaseline(e.target.value)} /></label>
                <label className="mod-field"><span>Scenario power (kW)</span><input type="number" min="0" step="any" value={scenario} onChange={(e) => setScenario(e.target.value)} /></label>
                <label className="mod-field"><span>Duration (hours)</span><input type="number" min="0" step="any" value={duration} onChange={(e) => setDuration(e.target.value)} /></label>
              </div>
              {mode === "twin" && (
                <button type="button" className="mod-btn ghost" onClick={useTwinTotals}>
                  Use twin draw as baseline (scenario = 75%)
                </button>
              )}
              <div className="mod-row">
                <label className="mod-check"><input type="checkbox" checked={flags.manual_override} onChange={toggle("manual_override")} /> Manual override</label>
                <label className="mod-check"><input type="checkbox" checked={flags.schedule_conflict} onChange={toggle("schedule_conflict")} /> Schedule conflict</label>
                <label className="mod-check"><input type="checkbox" checked={flags.critical_data_complete} onChange={toggle("critical_data_complete")} /> Critical data complete</label>
              </div>
            </>
          )}

          <button
            type="button"
            className="mod-btn primary"
            onClick={run}
            disabled={loading || (mode === "cv" && !cvObservation) || (mode === "raw" && !raw.trim())}
          >
            {loading ? "Analysing…" : "Analyse scenario"}
          </button>
          {error && <p className="mod-error" role="alert">{error}</p>}
        </section>

        <section className="mod-card">
          <h3 className="mod-card-title">Advisor result</h3>
          {result ? <Result result={result} /> : <p className="mod-empty">Run an analysis to see the safety decision and recommendations.</p>}
        </section>
      </div>

      <AskAdvisor equipment={snapshot.equipment} />

      <PassAware />
    </div>
  );
}

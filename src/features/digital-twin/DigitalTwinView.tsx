import { Canvas } from "@react-three/fiber";
import GroundStation from "./components/GroundStation";
import type { DigitalTwin } from "./useDigitalTwin";
import "./digital-twin.css";

export default function DigitalTwinView({ twin }: { twin: DigitalTwin }) {
  const {
    setSelectedEquipment,
    events,
    setEvents,
    utilityAvailable,
    setUtilityAvailable,
    solarAvailable,
    setSolarAvailable,
    generatorRunning,
    setGeneratorRunning,
    batteryCharge,
    setBatteryCharge,
    power,
    equipment,
    selectedState,
    toggleSelectedEquipment,
  } = twin;

  return (
    <div className="dt-root">
    <main className="dt-app">
      <header className="topbar">
        <div>
          <div className="eyebrow">SATELLITE OPERATIONS / DIGITAL TWIN</div>
          <h1>Ground Station Control</h1>
        </div>
        <div className="connection">
          <span className="dt-status-dot" />
          SIMULATION ONLINE
        </div>
      </header>

      <section className="workspace">
        <div className="scene-panel">
          <div className="scene-label">3D FACILITY VIEW</div>
          <div className="scene-hint">
            Click equipment to inspect · Drag to orbit · Scroll to zoom
          </div>

          <div className="scene-canvas">
            <Canvas camera={{ position: [18, 14, 23], fov: 45 }} dpr={[1, 2]}>
              <GroundStation onEquipmentSelect={setSelectedEquipment} />
            </Canvas>
          </div>

          <section className="equipment-dashboard">
            <div className="equipment-dashboard-header">
              <div>
                <div className="panel-heading">EQUIPMENT INFORMATION</div>
                <h2>
                  {equipment ? equipment.name : "Select an Equipment Rack"}
                </h2>
              </div>

              {equipment && (
                <span
                  className={`equipment-status ${equipment.status.toLowerCase()}`}
                >
                  {selectedState?.status ?? equipment.status}
                </span>
              )}
            </div>

            {!equipment ? (
              <p className="equipment-empty">
                Select RF TX, RF RX, MODEM, NETWORK, SERVERS, or MONITOR in the
                3D model to view its technical details here.
              </p>
            ) : (
              <>
                <p className="equipment-description">{equipment.description}</p>
                {selectedState && (
                  <div style={{ margin: "16px 0" }}>
                    <button
                      className="control-button active"
                      onClick={toggleSelectedEquipment}
                    >
                      {selectedState.enabled
                        ? "Turn Equipment OFF"
                        : "Turn Equipment ON"}
                    </button>

                    <span style={{ marginLeft: "12px" }}>
                      Current state: <strong>{selectedState.status}</strong>
                    </span>
                  </div>
                )}

                <div className="equipment-metrics">
                  <div className="equipment-metric">
                    <span>Category</span>
                    <strong>{equipment.category}</strong>
                  </div>

                  <div className="equipment-metric">
                    <span>Temperature</span>
                    <strong>
                      {selectedState
                        ? `${selectedState.temperature}°C`
                        : equipment.temperature}
                    </strong>
                  </div>

                  <div className="equipment-metric">
                    <span>Signal Quality</span>
                    <strong>
                      {selectedState
                        ? `${selectedState.signalQuality}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="equipment-metric">
                    <span>Equipment Load</span>
                    <strong>
                      {selectedState ? `${selectedState.load}%` : "N/A"}
                    </strong>
                  </div>

                  <div className="equipment-metric">
                    <span>Equipment Health</span>
                    <strong>
                      {selectedState ? `${selectedState.health}%` : "N/A"}
                    </strong>
                  </div>

                  <div className="equipment-metric">
                    <span>Uptime</span>
                    <strong>{equipment.uptime}</strong>
                  </div>
                  <div className="equipment-metric">
                    <span>Input</span>
                    <strong>{equipment.input}</strong>
                  </div>
                  <div className="equipment-metric">
                    <span>Output</span>
                    <strong>{equipment.output}</strong>
                  </div>
                </div>

                <h3 className="technical-heading">Technical Details</h3>
                <ul className="technical-list">
                  {equipment.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>

                <p className="simulation-note">
                  Simulated demonstration data — not live equipment readings.
                </p>
              </>
            )}
          </section>
        </div>

        <aside className="side-panel">
          <div className="panel-heading">SYSTEM OVERVIEW</div>

          <div className="metric-card">
            <span>Station status</span>
            <strong className={power.powerSufficient ? "green" : "red"}>
              {power.status}
            </strong>
            <small>Simulated operational state</small>
          </div>

          <div className="metric-card">
            <span>Active power source</span>
            <strong>{power.activeSource}</strong>
            <small>{power.availableKW} kW available / 18 kW load</small>
          </div>

          <div className="metric-card">
            <span>Solar generation</span>
            <strong>{power.solarKW} kW</strong>
            <small>{solarAvailable ? "Solar enabled" : "Solar disabled"}</small>
          </div>

          <div className="metric-card">
            <span>Battery charge</span>
            <strong>{batteryCharge}%</strong>
            <input
              aria-label="Battery charge"
              type="range"
              min="0"
              max="100"
              value={batteryCharge}
              onChange={(event) => setBatteryCharge(Number(event.target.value))}
            />
          </div>

          <div className="panel-heading controls-heading">POWER CONTROLS</div>

          <button
            className={
              utilityAvailable ? "control-button active" : "control-button"
            }
            onClick={() => setUtilityAvailable((value) => !value)}
          >
            Utility grid: {utilityAvailable ? "ON" : "OFF"}
          </button>

          <button
            className={
              solarAvailable ? "control-button active" : "control-button"
            }
            onClick={() => setSolarAvailable((value) => !value)}
          >
            Solar array: {solarAvailable ? "ON" : "OFF"}
          </button>

          <button
            className={
              generatorRunning ? "control-button active" : "control-button"
            }
            onClick={() => setGeneratorRunning((value) => !value)}
          >
            Generator: {generatorRunning ? "RUNNING" : "STOPPED"}
          </button>

          <div className="notice">
            <strong>Simulation environment</strong>
            <p>
              Power values are illustrative. No physical equipment is connected.
              The battery slider changes its simulated charge.
            </p>
          </div>
        </aside>
      </section>

      <section className="event-log-panel">
        <div className="event-log-header">
          <div>
            <div className="panel-heading">SYSTEM MONITORING</div>
            <h2>Alerts &amp; Event Logs</h2>
          </div>

          <button className="control-button" onClick={() => setEvents([])}>
            Clear Logs
          </button>
        </div>

        <div className="event-log-list">
          {events.length === 0 ? (
            <p className="equipment-empty">No events recorded.</p>
          ) : (
            events.map((event) => (
              <div className="event-log-entry" key={event.id}>
                <span
                  className={`event-severity ${event.severity.toLowerCase()}`}
                >
                  {event.severity}
                </span>

                <div className="event-log-message">
                  <strong>{event.equipment}</strong>
                  <p>{event.message}</p>
                </div>

                <time>{event.time}</time>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="footer">
        <span>GROUND STATION DIGITAL TWIN</span>
        <span>DEVELOPMENT BUILD · V0.2</span>
      </footer>
    </main>
    </div>
  );
}

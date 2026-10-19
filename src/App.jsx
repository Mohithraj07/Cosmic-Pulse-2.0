
import { lazy, Suspense, useState } from "react";
import "./App.css";
import "./features/modules.css";
import { useDigitalTwin } from "./features/digital-twin/useDigitalTwin";
import EnergyAdvisor from "./features/energy-advisor/EnergyAdvisor";
import VisualInspector from "./features/visual-inspector/VisualInspector";

// The 3D scene (three.js) is large, so it is only downloaded when opened.
const DigitalTwinView = lazy(() => import("./features/digital-twin/DigitalTwinView"));

const VIEWS = {
  advisor: { title: "ENERGY ADVISOR", subtitle: "GenAI safety decisions, energy estimates and pass scheduling" },
  inspector: { title: "VISUAL INSPECTOR", subtitle: "Detect people, HVAC units and antennas with computer vision" },
  twin: { title: "NETWORK SIMULATOR", subtitle: "Ground-station Digital Twin: equipment, network and power" },
};

function App() {
  const [showPreviousYears, setShowPreviousYears] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Which module is open in the main area ("home" = the original dashboard).
  const [view, setView] = useState("home");
  const [advisorStart, setAdvisorStart] = useState("twin");
  const [cvObservation, setCvObservation] = useState(null);
  // Digital Twin state lives here so it keeps running between modules and
  // the Energy Advisor can analyse the live twin.
  const twin = useDigitalTwin();

  const openView = (name) => setView((current) => (current === name ? "home" : name));

  const sendCvToAdvisor = (observation) => {
    setCvObservation(observation);
    setAdvisorStart("cv");
    setView("advisor");
  };

  const yearlyData = [
    { year: 2015, used: 4.5, wasted: 1.0 },
    { year: 2016, used: 4.6, wasted: 1.1 },
    { year: 2017, used: 5.0, wasted: 1.2 },
    { year: 2018, used: 5.3, wasted: 1.3 },
    { year: 2019, used: 5.5, wasted: 1.4 },
    { year: 2020, used: 5.9, wasted: 1.4 },
    { year: 2021, used: 6.2, wasted: 1.7 },
    { year: 2022, used: 6.3, wasted: 1.8 },
    { year: 2023, used: 6.4, wasted: 2.0 },
    { year: 2024, used: 7.0, wasted: 2.2 },
    { year: 2025, used: 7.001, wasted: 2.4 },
  ];

  return (
    <main className="app">
      {/* Left dashboard */}
      <aside className="dashboard">
        <div className="dashboard-heading">
          <span className="dashboard-indicator"></span>
          <h2>MISSION CONTROL</h2>
        </div>

        <p className="dashboard-subtitle">COSMIC PULSE 2.0</p>

        <div className="dashboard-features">
          <button
            type="button"
            className={`feature-card energy-advisor${view === "advisor" ? " active" : ""}`}
            onClick={() => openView("advisor")}
            aria-pressed={view === "advisor"}
          >
            <span className="feature-icon">⚡</span>
            <span className="feature-text">
              <strong>Energy Advisor</strong>
              <small>Energy insights and optimization</small>
            </span>
            <span className="feature-arrow">↗</span>
          </button>

          <button
            type="button"
            className={`feature-card visual-inspector${view === "inspector" ? " active" : ""}`}
            onClick={() => openView("inspector")}
            aria-pressed={view === "inspector"}
          >
            <span className="feature-icon">◎</span>
            <span className="feature-text">
              <strong>Visual Inspector</strong>
              <small>Inspect satellite systems</small>
            </span>
            <span className="feature-arrow">↗</span>
          </button>

          <button
            type="button"
            className={`feature-card network-simulator${view === "twin" ? " active" : ""}`}
            onClick={() => openView("twin")}
            aria-pressed={view === "twin"}
          >
            <span className="feature-icon">⌘</span>
            <span className="feature-text">
              <strong>Network Simulator</strong>
              <small>Explore network performance</small>
            </span>
            <span className="feature-arrow">↗</span>
          </button>
        </div>
        
<div className="equipment-section">
  <div className="equipment-heading">
    <span className="equipment-heading-dot"></span>
    <div>
      <h3>Equipment Energy</h3>
      <p>Power consumption analysis</p>
    </div>
  </div>

  {[
    {
      id: "transmitters",
      name: "Transmitters & Power Amplifiers",
      icon: "📡",
      used: 1240,
      share: 30,
      explanation:
        "Amplifies radio signals for transmission. Power demand depends on output power and operating hours.",
      tip:
        "Optimize amplifier output and use energy-efficient amplification equipment.",
      breakdown: [
        { name: "Power amplifiers", value: 68 },
        { name: "Transmitter units", value: 32 },
      ],
    },
    {
      id: "servers",
      name: "Server & Storage Arrays",
      icon: "🖥️",
      used: 910,
      share: 22,
      explanation:
        "Processes, stores, and manages satellite data, often running continuously.",
      tip:
        "Consolidate workloads and use efficient servers and storage systems.",
      breakdown: [
        { name: "Servers", value: 70 },
        { name: "Storage arrays", value: 30 },
      ],
    },
    {
      id: "motors",
      name: "Azimuth & Elevation Motors",
      icon: "⚙️",
      used: 330,
      share: 8,
      explanation:
        "Moves ground-station antennas horizontally and vertically to track satellites.",
      tip:
        "Optimize antenna tracking schedules and motor-control settings.",
      breakdown: [
        { name: "Azimuth motors", value: 55 },
        { name: "Elevation motors", value: 45 },
      ],
    },
    {
      id: "cooling",
      name: "Chillers & Cooling Towers",
      icon: "❄️",
      used: 745,
      share: 18,
      explanation:
        "Removes heat from equipment rooms and server facilities.",
      tip:
        "Optimize cooling setpoints and maintain chillers and cooling towers.",
      breakdown: [
        { name: "Chillers", value: 70 },
        { name: "Cooling towers", value: 30 },
      ],
    },
    {
      id: "network",
      name: "Network Switches & Routers",
      icon: "🌐",
      used: 495,
      share: 12,
      explanation:
        "Routes data between antennas, servers, and communication networks.",
      tip:
        "Use energy-efficient network equipment and retire unused devices.",
      breakdown: [
        { name: "Switches", value: 60 },
        { name: "Routers", value: 40 },
      ],
    },
    {
      id: "auxiliary",
      name: "Equipment Heaters & Auxiliary Gear",
      icon: "🌡️",
      used: 410,
      share: 10,
      explanation:
        "Includes cabinet heaters, auxiliary power supplies, and supporting equipment.",
      tip:
        "Use temperature-controlled heaters and switch off nonessential equipment.",
      breakdown: [
        { name: "Heaters", value: 55 },
        { name: "Auxiliary gear", value: 45 },
      ],
    },
  ].map((item) => (
    <button
      type="button"
      className="equipment-item equipment-launch-button"
      key={item.id}
      onClick={() => setSelectedEquipment(item)}
      aria-label={`Open energy details for ${item.name}`}
    >
      <span className="equipment-summary">
        <span className="equipment-icon">{item.icon}</span>
        <span className="equipment-name">{item.name}</span>
        <span className="equipment-chevron">↗</span>
      </span>
    </button>
  ))}

  <p className="equipment-footer-note">
    Six equipment categories · Sample energy data
  </p>
</div>


        <div className="dashboard-footer">
          <span className="status-dot"></span>
          SYSTEM READY
        </div>
      </aside>

      {/* Main content */}
      <section className="main-content">
        {view === "home" && (
        <>
        <section className="hero">
          <h1 className="hero-title">
            Cosmic Pu<span className="rocket">🚀</span>se 2.0
          </h1>

          <div className="hero-poem">
            <p>Beyond the stars, every signal carries a cost.</p>

            <p>
              Satellites connect the world,
              <br />
              ground stations power the connection.
            </p>

            <p>
              Every signal, every station, every watt—
              <br />
              smarter energy, a better future.
            </p>

            <p className="poem-ending">
              Connect the universe.
              <br />
              Optimize every watt.
            </p>
          </div>
        </section>

        {/* Electricity meters and previous year details */}
        <section className="energy-overview">
          <section className="features-section energy-meters">
            {/* Electricity used */}
            <div className="energy-meter used-meter">
              <svg
                className="meter-ring"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <circle
                  className="meter-track"
                  cx="80"
                  cy="80"
                  r="61"
                />

                <circle
                  className="meter-progress used-progress"
                  cx="80"
                  cy="80"
                  r="61"
                  strokeDasharray="276 383"
                  transform="rotate(-90 80 80)"
                />

                <circle
                  className="meter-inner"
                  cx="80"
                  cy="80"
                  r="47"
                />
              </svg>

              <div className="meter-content">
                <span className="meter-caption">ELECTRICITY</span>
                <strong className="meter-value">72%</strong>
                <span className="meter-label">USED</span>
              </div>
            </div>

            {/* Electricity wasted */}
            <div className="energy-meter wasted-meter">
              <svg
                className="meter-ring"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <circle
                  className="meter-track"
                  cx="80"
                  cy="80"
                  r="61"
                />

                <circle
                  className="meter-progress wasted-progress"
                  cx="80"
                  cy="80"
                  r="61"
                  strokeDasharray="107 383"
                  transform="rotate(-90 80 80)"
                />

                <circle
                  className="meter-inner"
                  cx="80"
                  cy="80"
                  r="47"
                />
              </svg>

              <div className="meter-content">
                <span className="meter-caption">ELECTRICITY</span>
                <strong className="meter-value">28%</strong>
                <span className="meter-label">WASTED</span>
              </div>
            </div>
          </section>

          {/* Click to show previous years */}
          <section className="previous-years">
            <button
              className="previous-years-toggle"
              onClick={() =>
                setShowPreviousYears(!showPreviousYears)
              }
              aria-expanded={showPreviousYears}
            >
              <span>
                <strong>Previous Year Details</strong>
                <small>Electricity used and wasted · 2015–2025</small>
              </span>

              <span className="previous-years-arrow">
                {showPreviousYears ? "−" : "+"}
              </span>
            </button>

            {showPreviousYears && (
              <div className="yearly-details">
                <div className="yearly-header">
                  <span>YEAR</span>
                  <span>USED</span>
                  <span>WASTED</span>
                </div>

                {yearlyData.map((item) => (
                  <div className="yearly-row" key={item.year}>
                    <strong>{item.year}</strong>
                    <span className="year-used">
                      {item.used.toFixed(1)} billion kWh
                    </span>
                    <span className="year-wasted">
                      {item.wasted.toFixed(1)} billion kWh
                    </span>
                  </div>
                ))}

                <p className="yearly-note">
                  Illustrative sample data, not verified
                  historical measurements.
                </p>
              </div>
            )}
          </section>
        </section>
        </>
        )}

        {view !== "home" && (
          <section
            className={`module-panel${view === "twin" ? " flush" : ""}`}
            aria-label={VIEWS[view].title}
          >
            <div className="module-header">
              <div>
                <h2>{VIEWS[view].title}</h2>
                <p>{VIEWS[view].subtitle}</p>
              </div>
              <button type="button" className="mod-btn ghost module-back" onClick={() => setView("home")}>
                ← Mission Control
              </button>
            </div>

            {view === "advisor" && (
              <EnergyAdvisor twin={twin} cvObservation={cvObservation} startMode={advisorStart} />
            )}
            {view === "inspector" && <VisualInspector onSendToAdvisor={sendCvToAdvisor} />}
            {view === "twin" && (
              <Suspense fallback={<div className="module-loading">Loading 3D ground station…</div>}>
                <DigitalTwinView twin={twin} />
              </Suspense>
            )}
          </section>
        )}
      </section>

      {/* Animated equipment details overlay - added without changing the dashboard layout */}
      {selectedEquipment && (
        <div
          className="equipment-modal-backdrop"
          onClick={() => setSelectedEquipment(null)}
          role="presentation"
        >
          <div className="equipment-modal-stage" onClick={(event) => event.stopPropagation()}>
            <div className="equipment-modal-rocket" aria-hidden="true">🚀</div>
            <section
              className="equipment-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipment-modal-title"
            >
              <button
                type="button"
                className="equipment-modal-close"
                onClick={() => setSelectedEquipment(null)}
                aria-label="Close equipment details"
              >
                ×
              </button>

              <div className="equipment-modal-heading">
                <span className="equipment-modal-icon">{selectedEquipment.icon}</span>
                <div>
                  <p className="equipment-modal-eyebrow">COSMIC PULSE · ENERGY REPORT</p>
                  <h2 id="equipment-modal-title">{selectedEquipment.name}</h2>
                  <p className="equipment-modal-subtitle">Equipment consumption overview</p>
                </div>
              </div>

              <div className="equipment-modal-stats">
                <div className="equipment-modal-stat">
                  <small>Monthly electricity</small>
                  <strong>{selectedEquipment.used.toLocaleString()} kWh</strong>
                </div>
                <div className="equipment-modal-stat">
                  <small>Share of total</small>
                  <strong>{selectedEquipment.share}%</strong>
                </div>
              </div>

              <div className="equipment-modal-progress-track">
                <div
                  className="equipment-modal-progress-fill"
                  style={{ width: `${selectedEquipment.share}%` }}
                />
              </div>

              <div className="equipment-modal-info">
                <h3>Why it uses electricity</h3>
                <p>{selectedEquipment.explanation}</p>
              </div>

              <div className="equipment-modal-info equipment-modal-tip">
                <h3>Energy-saving recommendation</h3>
                <p>{selectedEquipment.tip}</p>
              </div>

              <div className="equipment-modal-info">
                <h3>Equipment breakdown</h3>
                {selectedEquipment.breakdown.map((part) => (
                  <div className="equipment-breakdown-row" key={part.name}>
                    <span>{part.name}</span>
                    <strong>{part.value}%</strong>
                  </div>
                ))}
              </div>

              <div className="equipment-modal-info">
                <h3>Usage analysis</h3>
                <p>
                  Record daily or monthly meter readings to build a real usage trend
                  and compare historical consumption.
                </p>
                <button
                  type="button"
                  className="equipment-history-button"
                  onClick={() =>
                    window.alert(
                      `${selectedEquipment.name}\n\nMonthly sample usage: ${selectedEquipment.used} kWh\nShare of total: ${selectedEquipment.share}%\n\nConnect historical meter readings here to display a real usage graph.`
                    )
                  }
                >
                  View energy details ↗
                </button>
              </div>

              <p className="equipment-disclaimer">
                Illustrative sample values, not live meter readings.
              </p>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;

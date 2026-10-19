"""
Question answering for the Energy Advisor chat box (ADDED during integration).

Wraps the original, unchanged `generate_spacesage_insights` rule-based engine
from spacesage_genai.py and adds:
  * topic detection for the six equipment categories on the dashboard
  * optional live Digital Twin context (equipment list sent by the frontend)
  * greetings / empty-question handling
Advisory only: nothing here changes equipment or the Digital Twin.
"""
import re
from typing import Any, Dict, List, Optional

from . import spacesage_genai as genai

TOPICS = [
    (("transmitter", "power amplifier", "amplifier", "rf tx", "hpa"),
     "Transmitters & power amplifiers (about 30% of station energy in the sample data)",
     "Amplifier demand follows output power and operating hours. Keep transmitters in standby "
     "between passes when warm-up time allows, right-size output power to the link budget, and "
     "prefer energy-efficient amplifier hardware."),
    (("server", "storage", "data center", "datacenter", "workload"),
     "Server & storage arrays (about 22%)",
     "These often run continuously. Consolidate workloads, retire idle servers or move them to "
     "approved low-power modes where redundancy allows, and keep cooling within equipment limits."),
    (("azimuth", "elevation", "motor", "antenna", "tracking", "dish"),
     "Azimuth & elevation motors (about 8%)",
     "Optimise tracking schedules and motor-control settings, use smoother motion planning, and "
     "avoid needless slewing between passes, while keeping tracking accuracy."),
    (("chiller", "cooling", "hvac", "temperature", "setpoint"),
     "Chillers & cooling towers (about 18%)",
     "Compare cooling runtime with equipment load, tune setpoints gradually inside equipment "
     "limits, and keep chillers and towers well maintained."),
    (("network", "switch", "router", "routers", "switches"),
     "Network switches & routers (about 12%)",
     "Use energy-efficient networking gear, retire unused devices and ports, and keep critical "
     "links redundant."),
    (("heater", "auxiliary", "cabinet"),
     "Equipment heaters & auxiliary gear (about 10%)",
     "Use temperature-controlled heaters and switch off non-essential auxiliary equipment."),
]

GENERAL = [
    (("waste", "wasted", "reduce", "save", "saving", "lower", "cut", "optimi", "efficien"),
     "General ways to cut waste: find idle runtime first (equipment on with no pass or workload), "
     "then schedule standby around satellite passes, then tune cooling to the real heat load. "
     "Savings figures from the Analyse scenario box are estimates, not measured savings."),
    (("safe", "safety", "risk", "block", "hold", "review", "auto_apply", "decision"),
     "Safety decisions: BLOCK = manual override or schedule conflict; HOLD = invalid or incomplete "
     "input; REVIEW = mission-critical or higher-risk, a person must approve; AUTO_APPLY = low-risk "
     "and simulated only (nothing is ever applied by this module)."),
    (("pass", "passaware", "aos", "los", "schedule", "warm"),
     "Pass scheduling: tracking must fit inside the satellite's AOS-LOS window, and equipment "
     "should wake up early enough to finish warm-up. Use the PassAware card below to test a schedule."),
]


def _context_summary(equipment: Optional[List[Dict[str, Any]]]) -> str:
    if not equipment:
        return ""
    rows = [e for e in equipment if isinstance(e, dict)]
    if not rows:
        return ""
    total = sum(float(e.get("power_kw") or 0) for e in rows)
    on = [e for e in rows if str(e.get("state", "")).lower() == "on"]
    critical = [str(e.get("id")) for e in rows if e.get("mission_critical") is True]
    off = [str(e.get("id")) for e in rows if str(e.get("state", "")).lower() != "on"]
    text = (f"\n\nLive Digital Twin: {len(on)} of {len(rows)} racks on, about {round(total, 2)} kW "
            f"estimated draw.")
    if off:
        text += " Off: " + ", ".join(off) + "."
    if critical:
        text += " Mission-critical (do not switch off without review): " + ", ".join(critical) + "."
    return text


def answer_question(question: str, equipment: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    q = (question or "").strip()
    if not q:
        return {"answer": "Please type a question, for example: How can I reduce transmitter power use?",
                "topics": []}
    lower = q.lower()
    if re.fullmatch(r"(hi|hello|hey|hii|good (morning|afternoon|evening))[!. ]*", lower):
        return {"answer": "Hello! I'm SpaceSage AI. Ask me about energy use in a ground station, "
                          "data center or antenna system: transmitters, servers, cooling, motors, "
                          "networking, pass scheduling or safety decisions.", "topics": []}

    parts, topics = [], []
    for keys, title, advice in TOPICS:
        if any(k in lower for k in keys):
            topics.append(title)
            parts.append(f"{title}\n{advice}")
    for keys, advice in GENERAL:
        if any(k in lower for k in keys):
            parts.append(advice)

    if not parts:
        # Fall back to the original module's engine (unchanged), minus its
        # "Safety decision" boilerplate, which only applies to scenario analysis.
        base = genai.generate_spacesage_insights(q)
        base = base.split("\n\nSafety decision:")[0].replace("SPACESAGE AI - ENERGY INSIGHTS\n\n", "")
        parts.append(base)

    answer = "\n\n".join(parts) + _context_summary(equipment)
    answer += ("\n\nThese are rule-based recommendations, not live AI-generated analysis. "
               "Nothing has been applied to equipment or the Digital Twin.")
    return {"answer": answer, "topics": topics}

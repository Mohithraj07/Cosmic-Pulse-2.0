"""SpaceSage AI GenAI Reasoning Module.
Advisory-only prototype; no equipment changes are applied."""
import math
import json
from datetime import datetime


def validate_automation_proposal(
    action,
    data_valid=True,
    schedule_conflict=False,
    mission_critical=False,
    manual_override=False
):
    """
    Decide whether a proposed action may be applied to the
    simulated Digital Twin.
    """

    if manual_override:
        return {
            "decision": "BLOCK",
            "reason": "Manual override takes priority."
        }

    if not data_valid:
        return {
            "decision": "HOLD",
            "reason": "Input is invalid or incomplete."
        }

    if schedule_conflict:
        return {
            "decision": "BLOCK",
            "reason": "A schedule conflict must be resolved first."
        }

    if mission_critical:
        return {
            "decision": "REVIEW",
            "reason": "Mission-critical equipment requires review."
        }

    risk = action.get("risk_level", "unknown")

    if risk == "low":
        return {
            "decision": "AUTO_APPLY",
            "reason": "Low-risk proposal passed the supplied checks."
        }

    if risk in {"medium", "high"}:
        return {
            "decision": "REVIEW",
            "reason": "This change requires review before application."
        }

    return {
        "decision": "HOLD",
        "reason": "Risk level is missing or unrecognized."
    }


def validate_spacesage_input(data):
    """Validate incoming data without changing the existing advisor."""

    if not isinstance(data, dict):
        return {
            "valid": False,
            "errors": ["Input must be a dictionary."]
        }

    errors = []
    source = data.get("source")

    allowed_sources = {
        "computer_vision",
        "fixed_digital_twin",
        "user_modified_digital_twin"
    }

    if source not in allowed_sources:
        errors.append("Unknown or missing input source.")

    # Validate power values when supplied.
    baseline = data.get("baseline_power_kw")
    optimized = data.get("optimized_power_kw")

    if baseline is not None:
        if not isinstance(baseline, (int, float)) or isinstance(baseline, bool):
            errors.append("Baseline power must be numeric.")
        elif baseline <= 0:
            errors.append("Baseline power must be greater than zero.")

    if optimized is not None:
        if not isinstance(optimized, (int, float)) or isinstance(optimized, bool):
            errors.append("Optimized power must be numeric.")
        elif optimized < 0:
            errors.append("Optimized power cannot be negative.")

    if (
        isinstance(baseline, (int, float))
        and not isinstance(baseline, bool)
        and isinstance(optimized, (int, float))
        and not isinstance(optimized, bool)
        and baseline > 0
        and optimized > baseline
    ):
        errors.append(
            "Optimized power cannot exceed baseline power "
            "in this savings scenario."
        )

    # Reject malformed station schedules if one is provided.
    schedule = data.get("station_schedule")

    if schedule is not None:
        if not isinstance(schedule, list):
            errors.append("Station schedule must be a list.")
        else:
            for index, block in enumerate(schedule):
                if not isinstance(block, dict):
                    errors.append(
                        f"Station schedule entry {index} must be a dictionary."
                    )
                    continue

                start = block.get("start")
                end = block.get("end")

                if not start or not end:
                    errors.append(
                        f"Schedule entry {index} needs a start and end."
                    )

                if start and end and start >= end:
                    errors.append(
                        f"Schedule entry {index} has an invalid time range."
                    )

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }




def spacesage_calculate_energy_savings(
    baseline_power_kw,
    scenario_power_kw,
    duration_hours
):
    values = [baseline_power_kw, scenario_power_kw, duration_hours]

    if any(
        not isinstance(v, (int, float)) or isinstance(v, bool)
        for v in values
    ):
        return {"status": "HOLD", "error": "All inputs must be numeric."}

    if any(v < 0 for v in values):
        return {"status": "HOLD", "error": "Inputs cannot be negative."}

    if baseline_power_kw == 0:
        return {
            "status": "HOLD",
            "error": "Baseline power must be greater than zero."
        }

    if scenario_power_kw > baseline_power_kw:
        return {
            "status": "REVIEW",
            "error": "The proposed scenario uses more power than the baseline."
        }

    saved_kw = baseline_power_kw - scenario_power_kw
    saved_kwh = saved_kw * duration_hours

    return {
        "status": "ESTIMATE",
        "baseline_power_kw": baseline_power_kw,
        "scenario_power_kw": scenario_power_kw,
        "potential_reduction_kw": round(saved_kw, 2),
        "potential_reduction_percent": round(
            saved_kw / baseline_power_kw * 100, 2
        ),
        "duration_hours": duration_hours,
        "potential_energy_saved_kwh": round(saved_kwh, 2),
        "evidence": "SIMULATED_ESTIMATE_NOT_MEASURED"
    }


def spacesage_check_passaware(
    satellite_aos,
    satellite_los,
    station_start,
    station_end,
    other_activities=None,
    equipment_ready=True,
    warmup_seconds=60,
    manual_override=False
):
    """
    Validate a PassAware schedule proposal.
    Times must use the format YYYY-MM-DD HH:MM.
    This is a scheduling prototype, not a live orbital predictor.
    """

    def parse_time(value):
        return datetime.strptime(value, "%Y-%m-%d %H:%M")

    if manual_override:
        return {
            "decision": "BLOCK",
            "reason": "Manual override takes priority."
        }

    try:
        aos = parse_time(satellite_aos)
        los = parse_time(satellite_los)
        station_start_dt = parse_time(station_start)
        station_end_dt = parse_time(station_end)
    except (ValueError, TypeError):
        return {
            "decision": "HOLD",
            "reason": "Invalid date/time format."
        }

    if not (aos < los and station_start_dt < station_end_dt):
        return {
            "decision": "HOLD",
            "reason": "Invalid visibility or station time window."
        }

    if not equipment_ready:
        return {
            "decision": "HOLD",
            "reason": "Equipment readiness has not been confirmed."
        }

    if warmup_seconds < 0:
        return {
            "decision": "HOLD",
            "reason": "Warm-up duration cannot be negative."
        }

    # The scheduled station tracking block must fit inside
    # the predicted satellite visibility window.
    if station_start_dt < aos or station_end_dt > los:
        return {
            "decision": "REVIEW",
            "reason": (
                "The station tracking block extends outside "
                "the satellite visibility window."
            )
        }

    # Check overlap with other station activities.
    for activity in other_activities or []:
        try:
            other_start = parse_time(activity["start"])
            other_end = parse_time(activity["end"])
        except (ValueError, TypeError, KeyError):
            return {
                "decision": "HOLD",
                "reason": "Another activity has invalid schedule data."
            }

        if other_start >= other_end:
            return {
                "decision": "HOLD",
                "reason": "Another activity has an invalid time range."
            }

        overlaps = (
            station_start_dt < other_end
            and other_start < station_end_dt
        )

        if overlaps:
            return {
                "decision": "BLOCK",
                "reason": (
                    "The proposed tracking block conflicts with "
                    "another scheduled station activity."
                )
            }

    proposed_wakeup = station_start_dt.timestamp() - warmup_seconds

    return {
        "decision": "REVIEW",
        "reason": (
            "No schedule conflict was found in the supplied data. "
            "Confirm orbital prediction accuracy and all mission "
            "readiness requirements before applying changes."
        ),
        "proposed_wakeup": datetime.fromtimestamp(
            proposed_wakeup
        ).strftime("%Y-%m-%d %H:%M:%S"),
        "tracking_start": station_start,
        "tracking_end": station_end,
        "note": (
            "This proposal uses supplied times; it does not retrieve "
            "live satellite data or control a transmitter."
        )
    }


def spacesage_process_cv_input(cv_data):
    """
    Process Computer Vision observations for SpaceSage AI.
    This function accepts structured observations; it does not
    run a camera or perform computer vision itself.
    """

    if not isinstance(cv_data, dict):
        return {
            "status": "HOLD",
            "errors": ["CV input must be a dictionary."]
        }

    required_fields = [
        "room_or_zone",
        "occupancy",
        "timestamp"
    ]

    missing = [
        field for field in required_fields
        if field not in cv_data
    ]

    if missing:
        return {
            "status": "HOLD",
            "errors": [
                "Missing required CV fields: " + ", ".join(missing)
            ]
        }

    occupancy = cv_data["occupancy"]

    if not isinstance(occupancy, int) or isinstance(occupancy, bool):
        return {
            "status": "HOLD",
            "errors": ["Occupancy must be a non-negative integer."]
        }

    if occupancy < 0:
        return {
            "status": "HOLD",
            "errors": ["Occupancy cannot be negative."]
        }

    if not isinstance(cv_data["room_or_zone"], str) or not cv_data["room_or_zone"].strip():
        return {
            "status": "HOLD",
            "errors": ["Room or zone must be a non-empty string."]
        }

    if not isinstance(cv_data["timestamp"], str) or not cv_data["timestamp"].strip():
        return {
            "status": "HOLD",
            "errors": ["Timestamp must be a non-empty string."]
        }

    # Accept only a valid ISO-format timestamp.
    from datetime import datetime

    try:
        datetime.fromisoformat(cv_data["timestamp"])
    except ValueError:
        return {
            "status": "HOLD",
            "errors": [
                "Timestamp must be ISO format, e.g. "
                "2026-10-16T10:00:00"
            ]
        }

    # Avoid passing unnecessary identity or image information
    # into the GenAI reasoning stage.
    safe_observation = {
        "room_or_zone": cv_data["room_or_zone"],
        "occupancy": occupancy,
        "timestamp": cv_data["timestamp"],
        "confidence": cv_data.get("confidence"),
        "equipment_status": cv_data.get("equipment_status", {})
    }

    confidence = safe_observation["confidence"]

    if confidence is not None:
        if (
            not isinstance(confidence, (int, float))
            or isinstance(confidence, bool)
            or not 0 <= confidence <= 1
        ):
            return {
                "status": "HOLD",
                "errors": [
                    "Confidence must be between 0 and 1."
                ]
            }

        if confidence < 0.7:
            return {
                "status": "HOLD",
                "errors": [
                    "CV confidence is too low for an automated decision."
                ],
                "observation": safe_observation
            }

    return {
        "status": "VALIDATED",
        "source": "computer_vision",
        "observation": safe_observation
    }


def spacesage_process_user_modified_dt(dt_data):
    """Validate updated Digital Twin data for GenAI reasoning."""

    if not isinstance(dt_data, dict):
        return {
            "status": "HOLD",
            "errors": ["Input must be a dictionary."]
        }

    required_fields = [
        "facility_id",
        "timestamp",
        "satellite_id",
        "satellite_aos",
        "satellite_los",
        "station_start",
        "station_end",
        "equipment_ready",
        "warmup_seconds",
        "equipment"
    ]

    errors = []

    for field in required_fields:
        if field not in dt_data:
            errors.append(f"Missing required field: {field}")

    if errors:
        return {"status": "HOLD", "errors": errors}

    # Validate timestamps
    time_fields = [
        "timestamp",
        "satellite_aos",
        "satellite_los",
        "station_start",
        "station_end"
    ]

    parsed_times = {}

    for field in time_fields:
        try:
            parsed_times[field] = datetime.fromisoformat(
                dt_data[field].replace("Z", "+00:00")
            )
        except (ValueError, TypeError, AttributeError):
            errors.append(f"Invalid date/time: {field}")

    if errors:
        return {"status": "HOLD", "errors": errors}

    # All schedule times must use compatible time zones
    try:
        aos = parsed_times["satellite_aos"]
        los = parsed_times["satellite_los"]
        start = parsed_times["station_start"]
        end = parsed_times["station_end"]

        if not (aos < los):
            errors.append("Satellite visibility window is invalid.")

        if not (start < end):
            errors.append("Station tracking window is invalid.")

        if start < aos or end > los:
            errors.append(
                "Tracking window must fit inside the satellite visibility window."
            )

    except TypeError:
        errors.append("Schedule timestamps use incompatible time zones.")

    # Validate equipment readiness input
    if not isinstance(dt_data["equipment_ready"], bool):
        errors.append("equipment_ready must be True or False.")

    if not isinstance(dt_data["warmup_seconds"], int) or isinstance(
        dt_data["warmup_seconds"], bool
    ) or dt_data["warmup_seconds"] < 0:
        errors.append("warmup_seconds must be a non-negative integer.")

    equipment = dt_data["equipment"]

    if not isinstance(equipment, list) or not equipment:
        errors.append("Equipment must be a non-empty list.")
    else:
        for item in equipment:
            if not isinstance(item, dict):
                errors.append("Each equipment entry must be a dictionary.")
                continue

            if not item.get("id"):
                errors.append("Equipment ID is missing.")

            if item.get("state") not in [
                "on", "standby", "off", "unknown"
            ]:
                errors.append("Equipment state is invalid.")

            if not isinstance(item.get("mission_critical"), bool):
                errors.append(
                    "Each equipment item needs a Boolean mission_critical value."
                )

    other_activities = dt_data.get("other_activities", [])

    if not isinstance(other_activities, list):
        errors.append("other_activities must be a list.")

    if errors:
        return {"status": "HOLD", "errors": errors}

    # Do not proceed if readiness has not been confirmed
    if dt_data["equipment_ready"] is not True:
        return {
            "status": "HOLD",
            "errors": ["Equipment readiness is not confirmed."]
        }

    # Return only the fields needed for GenAI reasoning
    return {
        "status": "VALIDATED",
        "source": "user_modified_digital_twin",
        "observation": {
            "facility_id": dt_data["facility_id"],
            "timestamp": dt_data["timestamp"],
            "satellite_id": dt_data["satellite_id"],
            "satellite_aos": dt_data["satellite_aos"],
            "satellite_los": dt_data["satellite_los"],
            "station_start": dt_data["station_start"],
            "station_end": dt_data["station_end"],
            "equipment_ready": dt_data["equipment_ready"],
            "warmup_seconds": dt_data["warmup_seconds"],
            "equipment": equipment,
            "other_activities": other_activities,
            "manual_override": dt_data.get("manual_override", False)
        },
        "note": "Validated supplied data; live satellite data has not been verified."
    }


def spacesage_validate_digital_twin(dt_data):
    """Validate a snapshot of the existing Digital Twin state."""

    if not isinstance(dt_data, dict):
        return {
            "status": "HOLD",
            "errors": ["Digital Twin input must be a dictionary."]
        }

    required = ["facility_id", "timestamp", "equipment"]

    missing = [key for key in required if key not in dt_data]

    if missing:
        return {
            "status": "HOLD",
            "errors": ["Missing fields: " + ", ".join(missing)]
        }

    if not isinstance(dt_data["facility_id"], str) or not dt_data["facility_id"].strip():
        return {
            "status": "HOLD",
            "errors": ["facility_id must be a non-empty string."]
        }

    from datetime import datetime

    try:
        datetime.fromisoformat(dt_data["timestamp"])
    except (ValueError, TypeError):
        return {
            "status": "HOLD",
            "errors": ["Timestamp must be a valid ISO-format date/time."]
        }

    equipment = dt_data["equipment"]

    if not isinstance(equipment, list) or not equipment:
        return {
            "status": "HOLD",
            "errors": ["Equipment must be a non-empty list."]
        }

    errors = []
    safe_equipment = []
    seen_ids = set()

    for index, item in enumerate(equipment):
        if not isinstance(item, dict):
            errors.append(f"Equipment entry {index} must be a dictionary.")
            continue

        required_item_fields = [
            "id", "power_kw", "state", "mission_critical"
        ]

        missing_item_fields = [
            field for field in required_item_fields if field not in item
        ]

        if missing_item_fields:
            errors.append(
                f"Equipment entry {index} is missing: "
                + ", ".join(missing_item_fields)
            )
            continue

        equipment_id = item["id"]
        power = item["power_kw"]
        state = item["state"]
        critical = item["mission_critical"]

        if not isinstance(equipment_id, str) or not equipment_id.strip():
            errors.append(f"Equipment entry {index} has an invalid ID.")
            continue

        if equipment_id in seen_ids:
            errors.append(f"Duplicate equipment ID: {equipment_id}.")
            continue

        seen_ids.add(equipment_id)

        if (
            not isinstance(power, (int, float))
            or isinstance(power, bool)
            or power < 0
        ):
            errors.append(
                f"Equipment {equipment_id} has invalid power data."
            )
            continue

        if state not in {"on", "standby", "off", "unknown"}:
            errors.append(
                f"Equipment {equipment_id} has an invalid state."
            )
            continue

        if not isinstance(critical, bool):
            errors.append(
                f"Equipment {equipment_id} needs a Boolean "
                "mission_critical value."
            )
            continue

        safe_equipment.append({
            "id": equipment_id,
            "power_kw": power,
            "state": state,
            "mission_critical": critical
        })

    if errors:
        return {
            "status": "HOLD",
            "errors": errors
        }

    return {
        "status": "VALIDATED",
        "facility_id": dt_data["facility_id"],
        "timestamp": dt_data["timestamp"],
        "equipment": safe_equipment
    }


def spacesage_local_recommendations(
    facility_type,
    baseline_power_kw,
    scenario_power_kw,
    duration_hours,
    automation_decision,
    mission_critical=False
):
    energy = spacesage_calculate_energy_savings(
        baseline_power_kw,
        scenario_power_kw,
        duration_hours
    )

    if energy["status"] != "ESTIMATE":
        return {
            "status": "HOLD",
            "recommendations": [
                "Correct the energy inputs before estimating savings."
            ]
        }

    recommendations = []

    facility = facility_type.lower()

    if "ground_station" in facility or "ground station" in facility:
        recommendations.extend([
            "Compare transmitter power use with validated satellite pass schedules.",
            "Consider standby only during verified idle windows.",
            "Account for warm-up time, mission readiness, and emergency communications."
        ])

    if "data_center" in facility or "server" in facility:
        recommendations.extend([
            "Identify eligible idle servers and background workloads.",
            "Review cooling demand against actual workload and temperature limits."
        ])

    if "antenna" in facility:
        recommendations.append(
            "Review antenna movement schedules while respecting tracking requirements."
        )

    if mission_critical:
        recommendations.append(
            "Keep mission-critical equipment protected; require appropriate review."
        )

    if automation_decision != "AUTO_APPLY":
        recommendations.append(
            f"Do not apply the proposed change automatically: "
            f"current decision is {automation_decision}."
        )
    else:
        recommendations.append(
            "The safety rules permit this low-risk proposal, but the "
            "Digital Twin must validate and apply it separately."
        )

    recommendations.append(
        f"Illustrative scenario: potential reduction of "
        f"{energy['potential_reduction_kw']} kW and "
        f"{energy['potential_energy_saved_kwh']} kWh over "
        f"{duration_hours} hours. These are estimates, not measurements."
    )

    return {
        "status": "LOCAL_RECOMMENDATIONS",
        "recommendations": recommendations,
        "energy_analysis": energy,
        "automation_decision": automation_decision,
        "ai_provider": "local_rule_based_fallback"
    }


def spacesage_decision_engine(
    source,
    facility_type="ground_station",
    baseline_power_kw=100,
    optimized_power_kw=75,
    question="How can energy wastage be reduced?",
    station_schedule=None,
    proposed_action="review_energy_usage",
    risk_level="low",
    schedule_conflict=False,
    mission_critical=False,
    manual_override=False,
    critical_data_complete=True
):
    """
    Shared GenAI decision engine for all three SpaceSage AI cases.
    This creates proposals; it does not directly control real equipment.
    """

    # 1. Validate incoming data
    data = {
        "source": source,
        "baseline_power_kw": baseline_power_kw,
        "optimized_power_kw": optimized_power_kw,
        "station_schedule": station_schedule
    }

    validation = validate_spacesage_input(data)

    if not critical_data_complete:
        validation["valid"] = False
        validation["errors"].append(
            "Critical data is incomplete; automation is on hold."
        )

    # 2. Stop if the input is invalid
    if not validation["valid"]:
        return {
            "project": "SpaceSage AI",
            "source": source,
            "validation": validation,
            "recommendation": (
                "Resolve the input errors before generating an "
                "automation decision."
            ),
            "automation": {
                "decision": "HOLD",
                "reason": "Input validation failed."
            },
            "digital_twin_change": None
        }

    # 3. Calculate a scenario estimate
    saved_kw = baseline_power_kw - optimized_power_kw
    savings_percent = round(
        saved_kw / baseline_power_kw * 100, 2
    )

    energy_summary = {
        "baseline_power_kw": baseline_power_kw,
        "scenario_power_kw": optimized_power_kw,
        "potential_reduction_kw": round(saved_kw, 2),
        "potential_savings_percent": savings_percent,
        "status": "simulation_estimate"
    }

    # 4. Build a proposed action
    proposal = {
        "action": proposed_action,
        "risk_level": risk_level,
        "facility_type": facility_type,
        "source": source
    }

    # 5. Apply deterministic safety checks
    automation = validate_automation_proposal(
        proposal,
        data_valid=validation["valid"],
        schedule_conflict=schedule_conflict,
        mission_critical=mission_critical,
        manual_override=manual_override
    )

    # 6. Only describe a simulated change if approved
    digital_twin_change = None

    if automation["decision"] == "AUTO_APPLY":
        digital_twin_change = {
            "target": proposed_action,
            "status": "proposed_for_simulated_application",
            "note": (
                "This is a prototype proposal. Connect a dedicated "
                "Digital Twin state manager before applying changes."
            )
        }

    # 7. Ask Gemini for explanatory recommendations
    # The deterministic validation result takes priority.
    ai_prompt = f"""
You are SpaceSage AI, an energy optimization assistant for
space-support facilities.

User question: {question}
Input source: {source}
Facility type: {facility_type}
Energy scenario: {energy_summary}
Proposed action: {proposed_action}
Safety decision: {automation["decision"]}
Safety reason: {automation["reason"]}

Give concise recommendations and explain the decision.
Do not invent sensor readings, satellite passes, schedules,
or measured savings. Treat savings as simulation estimates.
Never reveal credentials or confidential mission information.
Do not claim that physical equipment has been controlled.
If the decision is HOLD, BLOCK, or REVIEW, do not suggest
that the proposed change was applied.
"""

    try:
        ai_text = generate_spacesage_insights(ai_prompt)
    except Exception:
        ai_text = (
            "AI explanation is temporarily unavailable. "
            "The validated local decision is still available."
        )

    # 8. Return a structured result
    return {
        "project": "SpaceSage AI",
        "source": source,
        "validation": validation,
        "energy_summary": energy_summary,
        "recommendation": ai_text,
        "automation": automation,
        "digital_twin_change": digital_twin_change
    }


def spacesage_energy_advisor(
    facility_type="data_center",
    baseline_power_kw=100,
    optimized_power_kw=75,
    question="How can this facility reduce electricity wastage?"
):
    allowed_facilities = [
        "data_center",
        "ground_station",
        "communication_facility",
        "space_support_facility"
    ]

    if facility_type not in allowed_facilities:
        raise ValueError("Unsupported facility type.")

    if baseline_power_kw <= 0 or optimized_power_kw < 0:
        raise ValueError("Baseline must be positive and optimized power cannot be negative.")

    if optimized_power_kw > baseline_power_kw:
        raise ValueError(
            "Optimized power cannot exceed baseline power."
        )

    saved = baseline_power_kw - optimized_power_kw

    energy_report = {
        "project": "SpaceSage AI",
        "facility_type": facility_type,
        "baseline_power_kw": baseline_power_kw,
        "optimized_power_kw": optimized_power_kw,
        "potential_power_reduction_kw": round(saved, 2),
        "potential_savings_percent": round(
            saved / baseline_power_kw * 100, 2
        ),
        "status": "simulation_estimate",
        "note": "Estimated scenario, not measured or guaranteed savings."
    }

    equipment_features = globals().get("EQUIPMENT_FEATURES", [])

    prompt = f"""
You are SpaceSage AI, an energy optimization advisor for
space-support facilities.

ENERGY SCENARIO:
{json.dumps(energy_report, indent=2)}

EQUIPMENT FEATURES:
{json.dumps(equipment_features, indent=2)}

USER QUESTION:
{question}

Explain:
1. Energy summary
2. Likely sources of energy wastage
3. Recommended actions for all six equipment categories
4. Safety checks
5. Implementation priorities
6. Limitations

Rules:
- Distinguish possible causes from confirmed findings.
- Never invent sensor readings, satellite schedules, or weather data.
- Do not claim physical equipment was controlled.
- Preserve mission uptime, redundancy, and equipment safety.
- Treat savings as simulated estimates, not guaranteed results.
- Give a clear, useful answer.
"""

    ai_insights = generate_spacesage_insights(prompt)

    return {
        "energy_report": energy_report,
        "equipment_categories": 6,
        "ai_insights": ai_insights
    }


def spacesage_analyze_energy(
    source,
    baseline_power_kw,
    scenario_power_kw,
    duration_hours,
    question,
    facility_type="ground_station",
    risk_level="medium",
    mission_critical=False,
    schedule_conflict=False,
    manual_override=False,
    critical_data_complete=True
):
    # 1. Calculate the energy scenario
    energy = spacesage_calculate_energy_savings(
        baseline_power_kw,
        scenario_power_kw,
        duration_hours
    )

    # 2. Stop if the energy inputs are invalid or need review
    if energy["status"] != "ESTIMATE":
        return {
            "project": "SpaceSage AI",
            "source": source,
            "energy_analysis": energy,
            "automation": {
                "decision": (
                    "HOLD" if energy["status"] == "HOLD"
                    else "REVIEW"
                ),
                "reason": energy.get("error", "Energy scenario needs review.")
            },
            "digital_twin_change": None
        }

    # 3. Validate the source and decision inputs
    data = {
        "source": source,
        "baseline_power_kw": baseline_power_kw,
        "optimized_power_kw": scenario_power_kw,
        "station_schedule": None
    }

    validation = validate_spacesage_input(data)

    if not critical_data_complete:
        validation["valid"] = False
        validation["errors"].append(
            "Critical data is incomplete; automation is on hold."
        )

    if not validation["valid"]:
        return {
            "project": "SpaceSage AI",
            "source": source,
            "validation": validation,
            "energy_analysis": energy,
            "automation": {
                "decision": "HOLD",
                "reason": "Input validation failed."
            },
            "digital_twin_change": None
        }

    # 4. Run deterministic safety rules
    proposal = {
        "action": "review_energy_optimization",
        "risk_level": risk_level
    }

    automation = validate_automation_proposal(
        proposal,
        data_valid=True,
        schedule_conflict=schedule_conflict,
        mission_critical=mission_critical,
        manual_override=manual_override
    )

    # 5. Ask GenAI for an explanation, not the safety decision
    prompt = f"""
    You are SpaceSage AI, an energy optimization assistant.

    Facility type: {facility_type}
    Input source: {source}
    User question: {question}
    Energy analysis: {energy}
    Safety decision: {automation['decision']}
    Safety reason: {automation['reason']}

    Explain the energy estimate and suggest practical ways to
    reduce unnecessary energy use.

    Never invent measurements, equipment readings, or savings.
    Treat all savings as simulated estimates.
    Do not recommend bypassing mission safety or equipment readiness.
    If the safety decision is not AUTO_APPLY, do not imply that
    an action has been applied.
    Do not claim to control physical equipment.
    """

    try:
        recommendation = generate_spacesage_insights(prompt)
    except Exception:
        recommendation = (
            "AI explanation unavailable. Use the validated energy "
            "estimate and deterministic safety decision."
        )

    return {
        "project": "SpaceSage AI",
        "source": source,
        "validation": validation,
        "energy_analysis": energy,
        "recommendation": recommendation,
        "automation": automation,
        "digital_twin_change": None,
        "note": (
            "Analysis only. No Digital Twin or physical equipment "
            "was changed."
        )
    }


def spacesage_validate_output(result):
    errors = []

    if not isinstance(result, dict):
        return {"valid": False, "errors": ["Output must be a dictionary."]}

    if result.get("project") != "SpaceSage AI":
        errors.append("Missing or invalid project name.")

    automation = result.get("automation")

    if not isinstance(automation, dict):
        errors.append("Automation result must be a dictionary.")
    else:
        allowed_decisions = {
            "AUTO_APPLY", "REVIEW", "BLOCK", "HOLD"
        }

        if automation.get("decision") not in allowed_decisions:
            errors.append("Invalid automation decision.")

        if not automation.get("reason"):
            errors.append("Automation reason is missing.")

        if automation.get("decision") in {"BLOCK", "HOLD", "REVIEW"}:
            if result.get("digital_twin_change") is not None:
                errors.append(
                    "A blocked, held, or review-only result must not "
                    "contain an applicable Digital Twin change."
                )

    energy = result.get("energy_analysis")

    if energy is not None:
        if not isinstance(energy, dict):
            errors.append("Energy analysis must be a dictionary.")
        elif energy.get("status") == "ESTIMATE":
            required = [
                "baseline_power_kw",
                "scenario_power_kw",
                "potential_reduction_kw",
                "potential_energy_saved_kwh",
                "evidence"
            ]

            for field in required:
                if field not in energy:
                    errors.append(f"Energy analysis is missing {field}.")

            if energy.get("evidence") != "SIMULATED_ESTIMATE_NOT_MEASURED":
                errors.append("Energy estimate must be labelled as simulated.")

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def spacesage_contextual_recommendations(
    facility_type,
    automation_decision,
    mission_critical=False,
    schedule_conflict=False
):
    # Safety checks always take priority
    if schedule_conflict or automation_decision == "BLOCK":
        return (
            "BLOCKED: Resolve the schedule conflict and validate the "
            "operating window before considering optimization."
        )

    if automation_decision == "HOLD":
        return (
            "ON HOLD: Required information is missing or invalid. "
            "Collect and validate it before continuing."
        )

    facility = str(facility_type).lower().replace(" ", "_")

    # Facility-specific recommendations
    if facility in {"data_center", "server", "servers"}:
        advice = (
            "DATA CENTER: Review server utilization and consolidate eligible "
            "workloads. Consider approved sleep modes for idle non-critical "
            "servers. Maintain required cooling and redundancy."
        )

    elif facility in {"ground_station", "groundstation"}:
        advice = (
            "GROUND STATION: Compare equipment demand with approved satellite "
            "pass schedules. Evaluate standby only for eligible non-critical "
            "equipment while preserving communication readiness."
        )

    elif facility in {"antenna", "antenna_system"}:
        advice = (
            "ANTENNA SYSTEM: Evaluate standby opportunities between approved "
            "tracking windows. Preserve warm-up time, pointing accuracy, "
            "and mechanical safety limits."
        )

    else:
        advice = (
            "FACILITY: Review equipment-level energy data and operating "
            "schedules to identify non-critical loads for evaluation."
        )

    # Review requirements are added without losing facility-specific advice
    if mission_critical or automation_decision == "REVIEW":
        advice += (
            "\nREVIEW REQUIRED: These are recommendations only. Preserve "
            "mission-critical operation and verify expected savings before "
            "authorizing any change."
        )

    return advice


def spacesage_genai_entry_original(request):
    """Common entry point for all three SpaceSage AI scenarios."""

    if not isinstance(request, dict):
        request = {}

    source = request.get("source")
    payload = request.get("payload")
    energy = request.get("energy_scenario")
    question = request.get(
        "question",
        "Recommend safe ways to reduce unnecessary energy use."
    )

    def stop(decision, reason, validation=None, passaware=None):
        return {
            "project": "SpaceSage AI",
            "source": source,
            "validation": validation or {
                "valid": False,
                "errors": [reason]
            },
            "energy_analysis": None,
            "recommendation": reason,
            "automation": {
                "decision": decision,
                "reason": reason
            },
            "digital_twin_change": None,
            "passaware_result": passaware
        }

    # Every request must identify its source and provide an energy scenario.
    allowed_sources = {
        "computer_vision",
        "fixed_digital_twin",
        "user_modified_digital_twin"
    }

    if source not in allowed_sources:
        return stop("HOLD", "Unsupported or missing input source.")

    if not isinstance(payload, dict):
        return stop("HOLD", "Payload must be a dictionary.")

    if not isinstance(energy, dict):
        return stop("HOLD", "Energy scenario is required.")

    required_energy_fields = [
        "baseline_power_kw",
        "scenario_power_kw",
        "duration_hours"
    ]

    if any(field not in energy for field in required_energy_fields):
        return stop("HOLD", "Energy scenario is incomplete.")

    # Validate the energy scenario before further processing.
    energy_result = spacesage_calculate_energy_savings(
        energy["baseline_power_kw"],
        energy["scenario_power_kw"],
        energy["duration_hours"]
    )

    if energy_result["status"] != "ESTIMATE":
        return stop(
            "HOLD" if energy_result["status"] == "HOLD" else "REVIEW",
            energy_result.get("error", "Energy scenario needs review.")
        )

    validation = None
    passaware = None
    mission_critical = False

    # Route the payload to the appropriate input validator.
    if source == "computer_vision":
        validation = spacesage_process_cv_input(payload)

        if validation.get("status") != "VALIDATED":
            return stop(
                "HOLD",
                "Computer Vision input was not validated.",
                validation=validation
            )

    elif source == "fixed_digital_twin":
        validation = spacesage_validate_digital_twin(payload)

        if validation.get("status") != "VALIDATED":
            return stop(
                "HOLD",
                "Digital Twin snapshot was not validated.",
                validation=validation
            )

        mission_critical = any(
            item["mission_critical"]
            for item in validation["equipment"]
        )

    else:
        validation = spacesage_process_user_modified_dt(payload)

        if validation.get("status") != "VALIDATED":
            return stop(
                "HOLD",
                "User-modified Digital Twin input was not validated.",
                validation=validation
            )

        obs = validation["observation"]

        mission_critical = any(
            item["mission_critical"] for item in obs["equipment"]
        )

        passaware = spacesage_check_passaware(
            satellite_aos=obs["satellite_aos"],
            satellite_los=obs["satellite_los"],
            station_start=obs["station_start"],
            station_end=obs["station_end"],
            other_activities=obs["other_activities"],
            equipment_ready=obs["equipment_ready"],
            warmup_seconds=obs["warmup_seconds"],
            manual_override=obs["manual_override"]
        )

        if passaware["decision"] in {"BLOCK", "HOLD"}:
            return stop(
                passaware["decision"],
                passaware["reason"],
                validation=validation,
                passaware=passaware
            )

    # Critical equipment always raises the risk level.
    requested_risk = request.get("risk_level", "medium")

    if requested_risk not in {"low", "medium", "high"}:
        return stop("HOLD", "Invalid risk level.")

    risk_level = "high" if mission_critical else requested_risk

    # The deterministic decision engine remains authoritative.
    result = spacesage_analyze_energy(
        source=source,
        baseline_power_kw=energy["baseline_power_kw"],
        scenario_power_kw=energy["scenario_power_kw"],
        duration_hours=energy["duration_hours"],
        question=question + "\nValidated equipment context: " + json.dumps(payload, default=str),
        facility_type=request.get("facility_type", "ground_station"),
        risk_level=risk_level,
        mission_critical=mission_critical,
        schedule_conflict=False,
        manual_override=request.get("manual_override", False),
        critical_data_complete=request.get(
            "critical_data_complete", True
        )
    )

    result["input_validation"] = validation

    if passaware is not None:
        result["passaware_result"] = passaware

    # This entry point only returns proposals; it never applies changes.
    result["digital_twin_change"] = None
    result["integration_status"] = "NOT_CONNECTED"

    return result


def spacesage_entry_before_advisory(request):
    # Reject malformed requests safely
    if not isinstance(request, dict):
        request = {}

    source = request.get("source")
    payload = request.get("payload", {})

    if not isinstance(payload, dict):
        payload = {}

    # Safety guard 1: manual override always wins
    manual_override = (
        request.get("manual_override") is True
        or payload.get("manual_override") is True
    )

    if manual_override:
        return {
            "project": "SpaceSage AI",
            "source": source,
            "validation": {
                "valid": True,
                "errors": []
            },
            "energy_analysis": None,
            "recommendation": (
                "Manual override is active. Automated action is blocked."
            ),
            "automation": {
                "decision": "BLOCK",
                "reason": "Manual override takes priority."
            },
            "digital_twin_change": None,
            "integration_status": "NOT_CONNECTED"
        }

    # Safety guard 2: incomplete critical data means HOLD
    if request.get("critical_data_complete") is False:
        return {
            "project": "SpaceSage AI",
            "source": source,
            "validation": {
                "valid": False,
                "errors": ["Critical data is incomplete."]
            },
            "energy_analysis": None,
            "recommendation": (
                "Provide the missing critical data before proceeding."
            ),
            "automation": {
                "decision": "HOLD",
                "reason": "Critical data is incomplete."
            },
            "digital_twin_change": None,
            "integration_status": "NOT_CONNECTED"
        }

    # Safety guard 3: known schedule conflicts block the proposal
    schedule_conflict = (
        request.get("schedule_conflict") is True
        or payload.get("schedule_conflict") is True
    )

    if schedule_conflict:
        return {
            "project": "SpaceSage AI",
            "source": source,
            "validation": {
                "valid": True,
                "errors": []
            },
            "energy_analysis": None,
            "recommendation": (
                "Resolve the schedule conflict before considering optimization."
            ),
            "automation": {
                "decision": "BLOCK",
                "reason": "A schedule conflict was reported."
            },
            "digital_twin_change": None,
            "integration_status": "NOT_CONNECTED"
        }

    # Continue to the existing implementation for other requests
    result = spacesage_genai_entry_original(request)

    # Never claim that the Digital Twin was changed
    if isinstance(result, dict):
        result["digital_twin_change"] = None
        result["integration_status"] = "NOT_CONNECTED"

    return result


def spacesage_entry_before_context(request):
    result = spacesage_entry_before_advisory(request)

    if not isinstance(result, dict):
        return {
            "project": "SpaceSage AI",
            "source": None,
            "automation": {
                "decision": "HOLD",
                "reason": "Unexpected response format."
            },
            "energy_analysis": None,
            "recommendation": "Please review the request.",
            "digital_twin_change": None,
            "integration_status": "NOT_CONNECTED"
        }

    automation = result.get("automation", {})

    if automation.get("decision") == "AUTO_APPLY":
        automation["decision"] = "REVIEW"
        automation["reason"] = (
            "Advisory-only prototype: review the proposal before "
            "any action. No equipment changes are authorized."
        )

    result["automation"] = automation
    result["digital_twin_change"] = None
    result["integration_status"] = "NOT_CONNECTED"

    return result


def spacesage_genai_entry(request):
    # Run the existing guarded energy-analysis pipeline
    result = spacesage_entry_before_context(request)

    if not isinstance(result, dict):
        return result

    # Read the decision from the existing safety checks
    automation = result.get("automation", {})
    decision = automation.get("decision", "HOLD")

    payload = request.get("payload", {})
    equipment = payload.get("equipment", [])

    # Detect mission-critical equipment
    mission_critical = any(
        isinstance(item, dict)
        and item.get("mission_critical") is True
        for item in equipment
    )

    # Detect reported schedule conflicts
    schedule_conflict = (
        request.get("schedule_conflict") is True
        or payload.get("schedule_conflict") is True
    )

    # Identify the facility type
    facility_type = request.get("facility_type")

    if not facility_type:
        equipment_ids = " ".join(
            str(item.get("id", "")).lower()
            for item in equipment
            if isinstance(item, dict)
        )

        if "transmitter" in equipment_ids or "ground_station" in equipment_ids:
            facility_type = "ground_station"
        elif "antenna" in equipment_ids:
            facility_type = "antenna"
        elif "server" in equipment_ids:
            facility_type = "data_center"
        else:
            facility_type = "ground_station"

    # Generate local, facility-specific recommendations
    recommendation = spacesage_contextual_recommendations(
        facility_type=facility_type,
        automation_decision=decision,
        mission_critical=mission_critical,
        schedule_conflict=schedule_conflict
    )

    result["recommendation"] = recommendation

    # Keep this prototype advisory-only
    result["digital_twin_change"] = None
    result["integration_status"] = "NOT_CONNECTED"

    return result


def generate_spacesage_insights(prompt):
    """Local rule-based recommendations when the external AI is unavailable."""
    import re

    text = str(prompt)
    lower = text.lower()

    match = re.search(
        r"Safety decision:\s*(AUTO_APPLY|REVIEW|HOLD|BLOCK)",
        text,
        re.IGNORECASE
    )
    decision = match.group(1).upper() if match else "REVIEW"

    if decision in ("HOLD", "BLOCK"):
        return (
            "SPACESAGE AI - SAFETY CHECK\n\n"
            "Decision: " + decision + ".\n"
            "Do not proceed until the validation or safety issue is resolved. "
            "No equipment or Digital Twin changes have been applied."
        )

    if any(word in lower for word in (
        "ground_station", "ground station", "transmitter",
        "power amplifier", "satellite pass", "passaware"
    )):
        advice = (
            "Ground station: Compare transmitter and amplifier operation "
            "with the satellite-pass and station schedule. Consider standby "
            "only for eligible idle equipment. Preserve warm-up, calibration, "
            "tracking readiness, interlocks, emergency requirements and "
            "operator override."
        )
    elif any(word in lower for word in (
        "data_center", "data center", "server", "storage array"
    )):
        advice = (
            "Data center: Review server utilization and workload demand. "
            "Where capacity and redundancy permit, consolidate workloads "
            "and place eligible idle servers in approved low-power modes. "
            "Keep cooling within equipment limits."
        )
    elif any(word in lower for word in (
        "azimuth", "elevation", "antenna", "tracking motor"
    )):
        advice = (
            "Antenna systems: Review tracking schedules and motor-current "
            "peaks. Consider smoother motion planning while preserving "
            "tracking accuracy and mission requirements."
        )
    elif any(word in lower for word in (
        "chiller", "cooling tower", "cooling system", "hvac"
    )):
        advice = (
            "Cooling systems: Compare cooling runtime with equipment "
            "workloads and schedules. Consider approved gradual adjustments "
            "while maintaining temperature and equipment limits."
        )
    elif any(word in lower for word in (
        "pump", "compressor", "launch facility"
    )):
        advice = (
            "Launch facilities: Review pump and compressor runtime against "
            "approved operating schedules. Do not compromise pressure, "
            "readiness or safety requirements."
        )
    else:
        advice = (
            "Review equipment utilization, operating schedules and idle "
            "runtime. Prioritize changes that preserve mission readiness, "
            "redundancy and approved operating limits."
        )

    return (
        "SPACESAGE AI - ENERGY INSIGHTS\n\n"
        + advice
        + "\n\nSafety decision: " + decision + ". "
        + ("Human review is required before proceeding. "
           if decision == "REVIEW" else "")
        + "These are rule-based recommendations, not live AI-generated "
        "analysis. No physical equipment or Digital Twin changes have "
        "been applied."
    )


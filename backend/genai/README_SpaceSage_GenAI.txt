# SpaceSage AI — GenAI Reasoning Module

## Purpose
Advisory-only reasoning for energy scenarios at space-support facilities. This is the GenAI module only; it does not replace the team's frontend, Computer Vision, or Digital Twin modules.

## Included files
- `spacesage_genai.py` — validation, energy calculations, safety decisions, contextual recommendations, and local rule-based fallback.
- `spacesage_genai_examples.json` — sample inputs and scenarios.
- `spacesage_genai_contract.json` — expected request/response contract.
- `README_SpaceSage_GenAI.txt` — this handoff guide.

## Current behavior
- Python module imports and compiles successfully.
- JSON examples and contract parse successfully.
- A local rule-based fallback returns facility-specific guidance when external AI generation is unavailable.
- No live Computer Vision telemetry or Digital Twin connection is included in this package.
- `integration_status: NOT_CONNECTED` and `digital_twin_change: null` are intentional handoff placeholders until the team integrator connects the modules.
- `AUTO_APPLY` is only a simulated decision in the response; this module does not execute equipment actions or write changes to the Digital Twin.
- Energy savings are estimates calculated from supplied values, not measured real-world savings.

## Typical request fields
`source`, `facility_type`, `payload`, `energy_scenario`, `risk_level`, `manual_override`, `critical_data_complete`, and `schedule_conflict`. See `spacesage_genai_contract.json` for the reference shape.

## Safety behavior
- `BLOCK`: manual override or schedule conflict prevents proceeding.
- `HOLD`: input is invalid, incomplete, or unrecognized.
- `REVIEW`: mission-critical or higher-risk proposals need human review.
- `AUTO_APPLY`: a simulated low-risk decision only; no real action is applied.

## Example calculation
For a baseline of 100 kW and scenario power of 75 kW over 2 hours, the estimated reduction is 25 kW and potential energy saved is 50 kWh. These values are scenario calculations, not verified savings.

## Integration next step
The responsible integrator must call this module from the team's application, map the actual Computer Vision/Digital Twin fields to the request contract, and separately implement authenticated, reviewed Digital Twin updates. Do not treat the current placeholders as a live connection.

import type { EquipmentState } from "./systems/equipmentSystem";

/**
 * Maps the Digital Twin's live equipment state onto the request format the
 * GenAI module expects (`equipment: [{ id, power_kw, state, mission_critical }]`).
 *
 * The twin tracks load % but not kilowatts, so the rated power and the
 * mission-critical flags below are ASSUMPTIONS for this simulation.
 * Edit them to match your real station. The rated values add up to the
 * 18 kW station load already used by the twin's power system.
 */
export const EQUIPMENT_PROFILE: Record<
  string,
  { id: string; ratedKW: number; missionCritical: boolean }
> = {
  "RF TX": { id: "rf_transmitter", ratedKW: 6, missionCritical: true },
  "RF RX": { id: "rf_receiver", ratedKW: 1.5, missionCritical: true },
  MODEM: { id: "satellite_modem", ratedKW: 1.5, missionCritical: true },
  NETWORK: { id: "network_switch", ratedKW: 1, missionCritical: true },
  SERVERS: { id: "server_rack", ratedKW: 6, missionCritical: false },
  MONITOR: { id: "monitoring_system", ratedKW: 2, missionCritical: false },
};

/** Idle draw as a fraction of rated power; the rest scales with load %. */
const IDLE_FRACTION = 0.3;

export function localIsoTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export interface TwinSnapshotPayload {
  facility_id: string;
  timestamp: string;
  equipment: {
    id: string;
    power_kw: number;
    state: "on" | "off";
    mission_critical: boolean;
  }[];
}

export function buildTwinSnapshot(
  equipmentStates: Record<string, EquipmentState>,
  facilityId = "GS-TWIN-01",
): TwinSnapshotPayload {
  const equipment = Object.entries(equipmentStates)
    .filter(([name]) => EQUIPMENT_PROFILE[name])
    .map(([name, state]) => {
      const profile = EQUIPMENT_PROFILE[name];
      const power = state.enabled
        ? profile.ratedKW * (IDLE_FRACTION + (1 - IDLE_FRACTION) * (state.load / 100))
        : 0;
      return {
        id: profile.id,
        power_kw: Number(power.toFixed(2)),
        state: state.enabled ? ("on" as const) : ("off" as const),
        mission_critical: profile.missionCritical,
      };
    });

  return { facility_id: facilityId, timestamp: localIsoTimestamp(), equipment };
}

export function totalPowerKW(snapshot: TwinSnapshotPayload): number {
  return Number(
    snapshot.equipment.reduce((sum, item) => sum + item.power_kw, 0).toFixed(2),
  );
}

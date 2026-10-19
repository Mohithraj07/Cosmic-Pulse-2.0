export type EquipmentStatus = "ONLINE" | "WARNING" | "OFFLINE";

export interface EquipmentState {
  enabled: boolean;
  status: EquipmentStatus;
  temperature: number;
  signalQuality: number;
  load: number;
  health: number;
}

export const initialEquipmentStates: Record<string, EquipmentState> = {
  "RF TX": {
    enabled: true,
    status: "ONLINE",
    temperature: 42,
    signalQuality: 98,
    load: 45,
    health: 99,
  },
  "RF RX": {
    enabled: true,
    status: "ONLINE",
    temperature: 38,
    signalQuality: 96,
    load: 35,
    health: 99,
  },
  MODEM: {
    enabled: true,
    status: "ONLINE",
    temperature: 40,
    signalQuality: 97,
    load: 50,
    health: 98,
  },
  NETWORK: {
    enabled: true,
    status: "ONLINE",
    temperature: 35,
    signalQuality: 99,
    load: 42,
    health: 99,
  },
  SERVERS: {
    enabled: true,
    status: "WARNING",
    temperature: 68,
    signalQuality: 95,
    load: 78,
    health: 82,
  },
  MONITOR: {
    enabled: true,
    status: "ONLINE",
    temperature: 32,
    signalQuality: 99,
    load: 25,
    health: 100,
  },
};

export function getEquipmentStatus(state: EquipmentState): EquipmentStatus {
  if (!state.enabled) return "OFFLINE";
  if (state.temperature >= 65 || state.health < 85) return "WARNING";
  return "ONLINE";
}

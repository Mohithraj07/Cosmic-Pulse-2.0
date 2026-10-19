export type EventSeverity = "INFO" | "WARNING" | "ERROR";

export interface SystemEvent {
  id: number;
  time: string;
  equipment: string;
  message: string;
  severity: EventSeverity;
}

export function createSystemEvent(
  equipment: string,
  message: string,
  severity: EventSeverity = "INFO",
): SystemEvent {
  return {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString(),
    equipment,
    message,
    severity,
  };
}

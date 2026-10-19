import { useEffect, useState } from "react";
import { equipmentData } from "./data/equipmentData";
import { calculatePower } from "./systems/powerSystem";
import { createSystemEvent, type SystemEvent } from "./systems/eventLogSystem";
import {
  initialEquipmentStates,
  getEquipmentStatus,
} from "./systems/equipmentSystem";

/**
 * All Digital Twin state (equipment simulation, power sources, event log).
 * It lives in a hook so the simulation keeps running while the user visits
 * other modules, and so the Energy Advisor can read the live twin state.
 */
export function useDigitalTwin() {
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [equipmentStates, setEquipmentStates] = useState(() =>
    structuredClone(initialEquipmentStates),
  );
  const [events, setEvents] = useState<SystemEvent[]>(() => [
    createSystemEvent(
      "SYSTEM",
      "Satellite base station simulation initialized",
      "INFO",
    ),
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setEquipmentStates((previous) => {
        const next = { ...previous };

        for (const [name, current] of Object.entries(previous)) {
          // Keep switched-off equipment at zero readings.
          if (!current.enabled) {
            continue;
          }

          // Simulate small changes in equipment readings.
          const temperature = Math.max(
            20,
            Math.min(85, current.temperature + (Math.random() * 2 - 1)),
          );

          const signalQuality = Math.max(
            0,
            Math.min(100, current.signalQuality + (Math.random() * 2 - 1.5)),
          );

          const load = Math.max(
            5,
            Math.min(100, current.load + (Math.random() * 4 - 2)),
          );

          // Health slowly decreases only when temperature is high.
          const health =
            temperature >= 75
              ? Math.max(0, current.health - 0.2)
              : Math.min(100, current.health + 0.05);

          const updated = {
            ...current,
            temperature: Number(temperature.toFixed(1)),
            signalQuality: Number(signalQuality.toFixed(1)),
            load: Number(load.toFixed(1)),
            health: Number(health.toFixed(1)),
          };

          updated.status = getEquipmentStatus(updated);
          next[name] = updated;
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const [utilityAvailable, setUtilityAvailable] = useState(true);
  const [solarAvailable, setSolarAvailable] = useState(true);
  const [generatorRunning, setGeneratorRunning] = useState(false);
  const [batteryCharge, setBatteryCharge] = useState(85);

  const power = calculatePower({
    utilityAvailable,
    solarAvailable,
    batteryCharge,
    generatorRunning,
    upsOnline: true,
    loadKW: 18,
  });

  const equipment = selectedEquipment ? equipmentData[selectedEquipment] : null;
  const selectedState = selectedEquipment
    ? equipmentStates[selectedEquipment]
    : null;

  const toggleSelectedEquipment = () => {
    if (!selectedEquipment) return;

    setEquipmentStates((previous) => {
      const current = previous[selectedEquipment];
      if (!current) return previous;

      const turningOn = !current.enabled;

      const updated = {
        ...current,
        enabled: turningOn,
        temperature: turningOn ? 40 : 0,
        signalQuality: turningOn ? 95 : 0,
        load: turningOn ? 25 : 0,
        health: turningOn ? current.health : 0,
      };

      updated.status = getEquipmentStatus(updated);

      return {
        ...previous,
        [selectedEquipment]: updated,
      };
    });

    const current = equipmentStates[selectedEquipment];
    const turningOn = !current.enabled;

    const newEvent = createSystemEvent(
      selectedEquipment,
      turningOn ? "Equipment switched ON" : "Equipment switched OFF",
      turningOn ? "INFO" : "WARNING",
    );

    setEvents((previous) => [newEvent, ...previous].slice(0, 50));
  };

  return {
    selectedEquipment,
    setSelectedEquipment,
    equipmentStates,
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
  };
}

export type DigitalTwin = ReturnType<typeof useDigitalTwin>;

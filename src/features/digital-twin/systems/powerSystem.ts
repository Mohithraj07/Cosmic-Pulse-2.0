export type PowerSource = "Utility Grid" | "Solar" | "Battery" | "Generator";

export interface PowerState {
  utilityAvailable: boolean;
  solarAvailable: boolean;
  batteryCharge: number;
  generatorRunning: boolean;
  upsOnline: boolean;
  loadKW: number;
}

export function calculatePower(state: PowerState) {
  const solarKW = state.solarAvailable ? 8 : 0;
  const utilityKW = state.utilityAvailable ? 30 : 0;
  const batteryKW = !state.utilityAvailable && state.batteryCharge > 0 ? 12 : 0;
  const generatorKW = state.generatorRunning ? 25 : 0;

  const availableKW = utilityKW + solarKW + batteryKW + generatorKW;
  const powerSufficient = availableKW >= state.loadKW;

  let activeSource: PowerSource = "Utility Grid";

  if (state.utilityAvailable) {
    activeSource = "Utility Grid";
  } else if (state.solarAvailable && solarKW >= state.loadKW) {
    activeSource = "Solar";
  } else if (batteryKW >= state.loadKW) {
    activeSource = "Battery";
  } else if (state.generatorRunning) {
    activeSource = "Generator";
  } else if (state.solarAvailable) {
    activeSource = "Solar";
  } else {
    activeSource = "Battery";
  }

  return {
    utilityKW,
    solarKW,
    batteryKW,
    generatorKW,
    availableKW,
    powerSufficient,
    activeSource,
    status: powerSufficient ? "NORMAL" : "POWER SHORTAGE",
  };
}

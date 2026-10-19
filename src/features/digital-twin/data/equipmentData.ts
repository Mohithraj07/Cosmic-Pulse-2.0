export interface EquipmentInfo {
  name: string;
  category: string;
  status: "ONLINE" | "WARNING" | "OFFLINE";
  description: string;
  input: string;
  output: string;
  temperature: string;
  uptime: string;
  details: string[];
}

export const equipmentData: Record<string, EquipmentInfo> = {
  "RF TX": {
    name: "RF Transmitter",
    category: "Radio Frequency",
    status: "ONLINE",
    description:
      "Transmits radio-frequency signals from the ground station toward the satellite.",
    input: "Modulated signal",
    output: "RF signal",
    temperature: "42°C",
    uptime: "99.8%",
    details: [
      "Frequency band: Ku-band (example)",
      "Transmit power: 100 W (simulated)",
      "Signal status: Stable",
    ],
  },

  "RF RX": {
    name: "RF Receiver",
    category: "Radio Frequency",
    status: "ONLINE",
    description:
      "Receives weak radio-frequency signals arriving from the satellite.",
    input: "Incoming satellite RF signal",
    output: "Received signal data",
    temperature: "38°C",
    uptime: "99.9%",
    details: [
      "Frequency band: Ku-band (example)",
      "Signal quality: Good (simulated)",
      "Noise level: Within expected range (simulated)",
    ],
  },

  MODEM: {
    name: "Satellite Modem",
    category: "Signal Processing",
    status: "ONLINE",
    description:
      "Modulates and demodulates signals to convert data between network and satellite communication formats.",
    input: "Digital network data",
    output: "Modulated or decoded data",
    temperature: "40°C",
    uptime: "99.7%",
    details: [
      "Modulation: QPSK (example)",
      "Data rate: 50 Mbps (simulated)",
      "Connection: Synchronized (simulated)",
    ],
  },

  NETWORK: {
    name: "Network Switch",
    category: "Networking",
    status: "ONLINE",
    description:
      "Connects station equipment and forwards data between network devices.",
    input: "Ethernet data packets",
    output: "Forwarded network packets",
    temperature: "35°C",
    uptime: "99.9%",
    details: [
      "Ports: 24 (example)",
      "Link status: Active (simulated)",
      "Network load: 42% (simulated)",
    ],
  },

  SERVERS: {
    name: "Server Rack",
    category: "Computing",
    status: "WARNING",
    description:
      "Processes, stores, and manages data used by the ground station.",
    input: "Network requests and telemetry",
    output: "Processed data and services",
    temperature: "68°C",
    uptime: "98.5%",
    details: [
      "CPU usage: 78% (simulated)",
      "Memory usage: 71% (simulated)",
      "Warning: Temperature is elevated (simulated)",
    ],
  },

  MONITOR: {
    name: "Monitoring System",
    category: "Monitoring",
    status: "ONLINE",
    description:
      "Displays equipment health, communication status, and station telemetry.",
    input: "Equipment telemetry",
    output: "Health status and alerts",
    temperature: "32°C",
    uptime: "99.9%",
    details: [
      "Telemetry: Receiving (simulated)",
      "Active alerts: 1 (simulated)",
      "Last update: Just now (simulated)",
    ],
  },
};

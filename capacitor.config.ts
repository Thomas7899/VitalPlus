import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.vitalplus.app",
  appName: "VitalPlus",
  webDir: "public",
  server: {
    url: "http://192.168.178.29:3000", 
    cleartext: true,
  },
};

export default config;
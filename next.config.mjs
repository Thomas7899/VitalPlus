import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔧 wichtig: auf Root-Ebene
  outputFileTracingRoot: __dirname,

  // erlaubt auch lokale Netzwerkzugriffe (für Playwright)
  allowedDevOrigins: ["http://localhost:*", "http://192.168.178.29:*"],
};

export default nextConfig;

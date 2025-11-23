// db/client.ts
import * as schema from "./schema";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NeonQueryFunction } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL ist nicht gesetzt");
}

let db:
  | ReturnType<typeof drizzleHttp<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>;

// --- Serverless / Vercel: HTTP-Verbindung ---
if (process.env.VERCEL || process.env.NEON_HTTP) {
  const { neon } = await import("@neondatabase/serverless");

  const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL!);
  console.log("🔌 Verwende HTTP-Verbindung (Neon Serverless)");
  db = drizzleHttp(sql, { schema });
}
// --- Lokal: TCP-Verbindung ---
else {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("🖥️ Verwende lokale Postgres-Verbindung (TCP)");
  db = drizzlePg(pool, { schema });
}

export { db };

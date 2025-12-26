// db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  real,
  integer,
  vector,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

//
// ======================
// 🧍 USERS TABLE
// ======================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: text("name"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 50 }),
  height: real("height"),
  // 🆕 Profil-Erweiterungen für Personalisierung
  activityLevel: varchar("activity_level", { length: 50 }).default("normal"), // sedentary, normal, active, athlete
  healthGoal: varchar("health_goal", { length: 100 }).default("gesund_bleiben"), // abnehmen, zunehmen, muskelaufbau, gesund_bleiben
  targetWeight: real("target_weight"),
  // 🎯 Personalisierte Alert-Grenzwerte (überschreiben Defaults)
  customAlertThresholds: jsonb("custom_alert_thresholds").$type<{
    maxHeartRate?: number;
    minHeartRate?: number;
    maxSystolic?: number;
    maxDiastolic?: number;
    minOxygen?: number;
    minSteps?: number;
    minSleep?: number;
    maxCalories?: number;
  }>(),
});

//
// ======================
// ❤️ HEALTH DATA TABLE
// ======================
export const healthData = pgTable(
  "health_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),

    // optionale Metriken (keine Default-0s)
    steps: integer("steps"),
    heartRate: integer("heart_rate"),
    sleepHours: real("sleep_hours"),
    weight: real("weight"),
    calories: real("calories"), // war integer -> auf real gestellt
    respiratoryRate: integer("respiratory_rate"),
    bloodPressureSystolic: integer("blood_pressure_systolic"),
    bloodPressureDiastolic: integer("blood_pressure_diastolic"),
    bloodGroup: varchar("blood_group", { length: 10 }),
    bmi: real("bmi"),
    bodyTemp: real("body_temp"),
    oxygenSaturation: real("oxygen_saturation"),
    stairSteps: integer("stair_steps"),
    elevation: real("elevation"),
    muscleMass: real("muscle_mass"),
    bodyFat: real("body_fat"),
    mealType: varchar("meal_type", { length: 50 }),
    medications: text("medications"),
  },
  (table) => [
    index("health_data_user_idx").on(table.userId),
    index("health_data_date_idx").on(table.date),
  ]
);

//
// ======================
// 🧠 HEALTH EMBEDDINGS
// ======================
export const healthEmbeddings = pgTable(
  "health_embeddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("health_embeddings_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

//
// ======================
// 🔔 ALERT HISTORY
// ======================
export const alertHistory = pgTable(
  "alert_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    alertType: varchar("alert_type", { length: 50 }).notNull(), // blood_pressure, heart_rate, oxygen, steps, sleep, calories
    severity: varchar("severity", { length: 20 }).notNull(), // warning, critical
    message: text("message").notNull(),
    value: real("value"), // Der gemessene Wert
    threshold: real("threshold"), // Der Grenzwert
    acknowledged: boolean("acknowledged").default(false),
  },
  (table) => [
    index("alert_history_user_idx").on(table.userId),
    index("alert_history_date_idx").on(table.createdAt),
  ]
);

//
// ======================
// 💾 AI RESPONSE CACHE
// ======================
export const aiResponseCache = pgTable(
  "ai_response_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cacheKey: varchar("cache_key", { length: 255 }).notNull(), // z.B. "daily_plan", "coach_analysis", "alerts"
    response: jsonb("response").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    index("ai_cache_user_key_idx").on(table.userId, table.cacheKey),
    index("ai_cache_expires_idx").on(table.expiresAt),
  ]
);
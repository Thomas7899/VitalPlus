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
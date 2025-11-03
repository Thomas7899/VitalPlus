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

// User
export const users = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: text("name"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: varchar("gender", { length: 50 }),
  height: real("height"),
});

// HealthData
export const healthData = pgTable("HealthData", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  steps: integer("steps"),
  heartRate: integer("heartRate"),
  sleepHours: real("sleepHours"),
  weight: real("weight"),
  calories: real("calories"),
  respiratoryRate: integer("respiratoryRate"),
  bloodPressureSystolic: integer("bloodPressureSystolic"),
  bloodPressureDiastolic: integer("bloodPressureDiastolic"),
  bloodGroup: varchar("bloodGroup", { length: 10 }),
  bmi: real("bmi"), 
  bodyTemp: real("bodyTemp"),
  oxygenSaturation: real("oxygenSaturation"),
  stairSteps: integer("stairSteps"),
  elevation: real("elevation"),
  muscleMass: real("muscleMass"),
  bodyFat: real("bodyFat"),
  mealType: varchar("mealType", { length: 50 }),
  medications: text("medications"),
});

// HealthEmbedding
export const healthEmbeddings = pgTable(
  "HealthEmbedding",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("embedding_hnsw_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);
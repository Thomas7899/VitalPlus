CREATE TABLE "health_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"steps" integer DEFAULT 0,
	"heart_rate" integer DEFAULT 0,
	"sleep_hours" real DEFAULT 0,
	"weight" real DEFAULT 0,
	"calories" integer DEFAULT 0,
	"respiratory_rate" integer DEFAULT 0,
	"blood_pressure_systolic" integer DEFAULT 0,
	"blood_pressure_diastolic" integer DEFAULT 0,
	"blood_group" varchar(10),
	"bmi" real DEFAULT 0,
	"body_temp" real DEFAULT 0,
	"oxygen_saturation" real DEFAULT 0,
	"stair_steps" integer DEFAULT 0,
	"elevation" real DEFAULT 0,
	"muscle_mass" real DEFAULT 0,
	"body_fat" real DEFAULT 0,
	"meal_type" varchar(50),
	"medications" text
);
--> statement-breakpoint
CREATE TABLE "health_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	CONSTRAINT "health_embeddings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date_of_birth" timestamp,
	"gender" varchar(50),
	"height" real,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_embeddings" ADD CONSTRAINT "health_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_data_user_idx" ON "health_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "health_data_date_idx" ON "health_data" USING btree ("date");--> statement-breakpoint
CREATE INDEX "health_embeddings_hnsw_idx" ON "health_embeddings" USING hnsw ("embedding" vector_cosine_ops);
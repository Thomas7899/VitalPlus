CREATE TABLE "ai_response_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cache_key" varchar(255) NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"value" real,
	"threshold" real,
	"acknowledged" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "steps" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "heart_rate" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "sleep_hours" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "weight" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "calories" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "calories" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "respiratory_rate" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "blood_pressure_systolic" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "blood_pressure_diastolic" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "bmi" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "body_temp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "oxygen_saturation" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "stair_steps" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "elevation" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "muscle_mass" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_data" ALTER COLUMN "body_fat" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activity_level" varchar(50) DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "health_goal" varchar(100) DEFAULT 'gesund_bleiben';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "target_weight" real;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_alert_thresholds" jsonb;--> statement-breakpoint
ALTER TABLE "ai_response_cache" ADD CONSTRAINT "ai_response_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_cache_user_key_idx" ON "ai_response_cache" USING btree ("user_id","cache_key");--> statement-breakpoint
CREATE INDEX "ai_cache_expires_idx" ON "ai_response_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "alert_history_user_idx" ON "alert_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_history_date_idx" ON "alert_history" USING btree ("created_at");
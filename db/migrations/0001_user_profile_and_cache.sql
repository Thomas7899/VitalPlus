-- Migration: Add user profile extensions, alert history, and AI cache
-- Run this after the initial migration

-- Add profile columns to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "activity_level" varchar(50) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "health_goal" varchar(100) DEFAULT 'gesund_bleiben',
ADD COLUMN IF NOT EXISTS "target_weight" real,
ADD COLUMN IF NOT EXISTS "custom_alert_thresholds" jsonb;

-- Create alert_history table
CREATE TABLE IF NOT EXISTS "alert_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "alert_type" varchar(50) NOT NULL,
  "severity" varchar(20) NOT NULL,
  "message" text NOT NULL,
  "value" real,
  "threshold" real,
  "acknowledged" boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS "alert_history_user_idx" ON "alert_history" ("user_id");
CREATE INDEX IF NOT EXISTS "alert_history_date_idx" ON "alert_history" ("created_at");

-- Create ai_response_cache table
CREATE TABLE IF NOT EXISTS "ai_response_cache" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "cache_key" varchar(255) NOT NULL,
  "response" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_cache_user_key_idx" ON "ai_response_cache" ("user_id", "cache_key");
CREATE INDEX IF NOT EXISTS "ai_cache_expires_idx" ON "ai_response_cache" ("expires_at");

-- Add unique constraint for user_id + cache_key combination
ALTER TABLE "ai_response_cache" 
ADD CONSTRAINT "ai_cache_user_key_unique" UNIQUE ("user_id", "cache_key");

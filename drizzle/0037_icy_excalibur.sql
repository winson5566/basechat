CREATE TYPE "public"."paid_status" AS ENUM('trial', 'active', 'expired', 'legacy');--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "trial_expires_at" timestamp with time zone DEFAULT '2025-06-05T12:00:00.000Z' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "paid_status" "paid_status" DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenants_paid_status_idx" ON "tenants" USING btree ("paid_status");
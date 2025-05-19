CREATE TYPE "public"."paid_status" AS ENUM('trial', 'active', 'expired');--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "trial_ends_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "paid_status" "paid_status" DEFAULT 'active' NOT NULL;
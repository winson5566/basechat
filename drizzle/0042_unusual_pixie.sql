ALTER TABLE "tenants" ADD COLUMN "slack_channels" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "slack_channel";
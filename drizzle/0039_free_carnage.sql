ALTER TABLE "tenants" ADD COLUMN "slack_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slack_webhook_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slack_channel" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slack_bot_token" text;
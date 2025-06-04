ALTER TABLE "conversations" ADD COLUMN "slack_event" json;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "slack_channel_id";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "slack_message_id";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "slack_user_id";
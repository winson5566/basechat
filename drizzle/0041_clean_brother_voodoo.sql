ALTER TABLE "conversations" ADD COLUMN "slack_channel_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "slack_message_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "slack_thread_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "slack_user_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slack_user_id" text;
ALTER TABLE "users" ADD COLUMN "slack_user_info" json;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_slack_user_id_unique" UNIQUE("slack_user_id");
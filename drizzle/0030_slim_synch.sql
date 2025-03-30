ALTER TABLE "sessions" RENAME COLUMN "session_token" TO "token";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_session_token_unique";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_unique" UNIQUE("token");
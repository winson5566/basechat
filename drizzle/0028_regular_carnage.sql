CREATE TABLE IF NOT EXISTS "verifications" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE "verification_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "token_type";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "session_state";
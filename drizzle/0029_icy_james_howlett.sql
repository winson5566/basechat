-- Verifications
CREATE TABLE IF NOT EXISTS "verifications" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL
);

--> statement-breakpoint
DROP TABLE "verification_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "token_type";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "session_state";


-- Sessions
ALTER TABLE "sessions" RENAME COLUMN "expires" TO "expires_at";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "session_token" TO "token";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_unique" UNIQUE("token");


-- Accounts
ALTER TABLE "accounts" RENAME COLUMN "provider" TO "provider_id";--> statement-breakpoint
ALTER TABLE "accounts" RENAME COLUMN "provider_account_id" TO "account_id";--> statement-breakpoint
ALTER TABLE "accounts" RENAME COLUMN "expires_at" TO "access_token_expires_at";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "password" text;
ALTER TABLE "accounts" ADD COLUMN _access_token_expires_at timestamp;
UPDATE "accounts" SET _access_token_expires_at = TO_TIMESTAMP(access_token_expires_at);
ALTER TABLE "accounts" DROP COLUMN access_token_expires_at;
ALTER TABLE "accounts" RENAME COLUMN _access_token_expires_at TO access_token_expires_at;
INSERT INTO "accounts" (user_id, provider_id, account_id, password)
SELECT
  id,
  'credential',
  id,
  password
FROM "users"
WHERE password IS NOT NULL;
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";


-- Users
ALTER TABLE "users" ADD COLUMN _email_verified boolean NOT NULL DEFAULT false;
UPDATE "users" SET _email_verified = (email_verified is not null);
ALTER TABLE "users" DROP COLUMN email_verified;
ALTER TABLE "users" RENAME COLUMN _email_verified TO email_verified;

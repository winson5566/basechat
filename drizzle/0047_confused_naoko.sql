CREATE TYPE "public"."agentic_level" AS ENUM('low', 'medium', 'high', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."message_retrieval_types" AS ENUM('agentic', 'standard');--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "type" "message_retrieval_types" DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "agentic_info" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "override_agentic_level" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "agentic_level" "agentic_level" DEFAULT 'medium';
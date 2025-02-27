ALTER TABLE "tenants" ADD COLUMN "grounding_prompt" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "system_prompt" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "expand_system_prompt" text;
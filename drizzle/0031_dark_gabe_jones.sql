CREATE TABLE IF NOT EXISTS "search_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_breadth" boolean DEFAULT false NOT NULL,
	"rerank_enabled" boolean DEFAULT false NOT NULL,
	"prioritize_recent" boolean DEFAULT false NOT NULL,
	"override_breadth" boolean DEFAULT true NOT NULL,
	"override_rerank" boolean DEFAULT true NOT NULL,
	"override_prioritize_recent" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "search_settings_id" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_model" text DEFAULT 'claude-3-7-sonnet-latest';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenants" ADD CONSTRAINT "tenants_search_settings_id_search_settings_id_fk" FOREIGN KEY ("search_settings_id") REFERENCES "public"."search_settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

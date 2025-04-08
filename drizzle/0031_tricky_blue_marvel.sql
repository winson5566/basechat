CREATE TABLE IF NOT EXISTS "search_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_breadth" boolean DEFAULT false NOT NULL,
	"rerank_enabled" boolean DEFAULT false NOT NULL,
	"prioritize_recent" boolean DEFAULT false NOT NULL,
	"override_breadth" boolean DEFAULT true NOT NULL,
	"override_rerank" boolean DEFAULT true NOT NULL,
	"override_prioritize_recent" boolean DEFAULT true NOT NULL,
	CONSTRAINT "search_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_model" text DEFAULT 'claude-3-7-sonnet-latest';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_settings" ADD CONSTRAINT "search_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

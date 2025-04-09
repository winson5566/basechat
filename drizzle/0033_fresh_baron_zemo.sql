DROP TABLE "search_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "is_breadth" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "rerank_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "prioritize_recent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "override_breadth" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "override_rerank" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "override_prioritize_recent" boolean DEFAULT true;
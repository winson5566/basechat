ALTER TABLE "messages" ADD COLUMN "is_breadth" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "rerank_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "prioritize_recent" boolean DEFAULT false NOT NULL;
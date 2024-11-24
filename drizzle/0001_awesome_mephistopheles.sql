ALTER TABLE "connections" ADD COLUMN "status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_connection_id_unique" UNIQUE("connection_id");
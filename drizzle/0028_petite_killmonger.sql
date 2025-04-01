CREATE INDEX IF NOT EXISTS "conversations_profile_idx" ON "conversations" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_tenant_profile_idx" ON "conversations" USING btree ("tenant_id","profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_tenant_conversation_idx" ON "messages" USING btree ("tenant_id","conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_role_idx" ON "profiles" USING btree ("role");
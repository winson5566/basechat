DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_current_profile_id_profiles_id_fk" FOREIGN KEY ("current_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

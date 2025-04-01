ALTER TABLE "users" ADD COLUMN _email_verified boolean;
UPDATE "users" SET _email_verified = (email_verified is not null);
ALTER TABLE "users" DROP COLUMN email_verified;
ALTER TABLE "users" RENAME COLUMN _email_verified TO email_verified;
ALTER TABLE "users" ALTER COLUMN email_verified SET NOT NULL;
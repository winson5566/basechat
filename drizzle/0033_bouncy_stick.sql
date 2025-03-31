ALTER TABLE "accounts" ADD COLUMN _access_token_expires_at timestamp;
UPDATE "accounts" SET _access_token_expires_at = TO_TIMESTAMP(access_token_expires_at);
ALTER TABLE "accounts" DROP COLUMN access_token_expires_at;
ALTER TABLE "accounts" RENAME COLUMN _access_token_expires_at TO access_token_expires_at;

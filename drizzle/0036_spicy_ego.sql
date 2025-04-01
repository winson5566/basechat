INSERT INTO "accounts" (user_id, provider_id, account_id, password)
SELECT
  id,
  'credential',
  id,
  password
FROM "users"
WHERE password IS NOT NULL;

ALTER TABLE "users" DROP COLUMN IF EXISTS "password";
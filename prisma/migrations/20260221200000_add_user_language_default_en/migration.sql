-- User language
CREATE TYPE "UserLanguage" AS ENUM ('EN', 'ES');

ALTER TABLE "User"
  ADD COLUMN "language" "UserLanguage";

-- Explicit backfill for existing users.
UPDATE "User"
SET "language" = 'EN'
WHERE "language" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "language" SET DEFAULT 'EN';

ALTER TABLE "User"
  ALTER COLUMN "language" SET NOT NULL;

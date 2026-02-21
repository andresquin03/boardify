-- User notification preferences
ALTER TABLE "User"
  ADD COLUMN "notifyFriendshipEvents" BOOLEAN;

ALTER TABLE "User"
  ADD COLUMN "notifyGroupEvents" BOOLEAN;

ALTER TABLE "User"
  ADD COLUMN "notifySystemEvents" BOOLEAN;

UPDATE "User"
SET
  "notifyFriendshipEvents" = TRUE,
  "notifyGroupEvents" = TRUE,
  "notifySystemEvents" = TRUE
WHERE
  "notifyFriendshipEvents" IS NULL
  OR "notifyGroupEvents" IS NULL
  OR "notifySystemEvents" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "notifyFriendshipEvents" SET DEFAULT TRUE,
  ALTER COLUMN "notifyGroupEvents" SET DEFAULT TRUE,
  ALTER COLUMN "notifySystemEvents" SET DEFAULT TRUE;

ALTER TABLE "User"
  ALTER COLUMN "notifyFriendshipEvents" SET NOT NULL,
  ALTER COLUMN "notifyGroupEvents" SET NOT NULL,
  ALTER COLUMN "notifySystemEvents" SET NOT NULL;

-- Remove redundant notification columns now represented by event catalog + eventKey.
DROP INDEX IF EXISTS "Notification_userId_scope_deletedAt_isSeen_idx";
DROP INDEX IF EXISTS "Notification_entityType_entityId_idx";

ALTER TABLE "Notification"
  DROP COLUMN "scope",
  DROP COLUMN "entityType";

CREATE INDEX IF NOT EXISTS "Notification_userId_eventKey_deletedAt_isSeen_idx"
  ON "Notification"("userId", "eventKey", "deletedAt", "isSeen");

CREATE INDEX IF NOT EXISTS "Notification_eventKey_entityId_idx"
  ON "Notification"("eventKey", "entityId");

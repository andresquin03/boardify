-- CreateEnum
CREATE TYPE "NotificationEventKey" AS ENUM (
  'FRIEND_REQUEST_RECEIVED',
  'FRIEND_REQUEST_ACCEPTED',
  'GROUP_INVITE_RECEIVED',
  'GROUP_INVITE_ACCEPTED'
);

-- Normalize historical lowercase values before casting.
UPDATE "Notification"
SET "eventKey" = CASE
  WHEN "eventKey" = 'friend_request_received' THEN 'FRIEND_REQUEST_RECEIVED'
  WHEN "eventKey" = 'friend_request_accepted' THEN 'FRIEND_REQUEST_ACCEPTED'
  WHEN "eventKey" = 'group_invite_received' THEN 'GROUP_INVITE_RECEIVED'
  WHEN "eventKey" = 'group_invite_accepted' THEN 'GROUP_INVITE_ACCEPTED'
  ELSE "eventKey"
END;

-- AlterTable
ALTER TABLE "Notification"
ALTER COLUMN "eventKey" TYPE "NotificationEventKey"
USING ("eventKey"::"NotificationEventKey");

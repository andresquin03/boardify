-- Notification scope enum + event catalog
CREATE TYPE "NotificationScope" AS ENUM ('friendship', 'group', 'system');

CREATE TABLE "NotificationEvent" (
  "id" "NotificationEventKey" NOT NULL,
  "scope" "NotificationScope" NOT NULL,

  CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

INSERT INTO "NotificationEvent" ("id", "scope")
VALUES
  ('FRIEND_REQUEST_RECEIVED', 'friendship'),
  ('FRIEND_REQUEST_ACCEPTED', 'friendship'),
  ('GROUP_INVITE_RECEIVED', 'group'),
  ('GROUP_INVITE_ACCEPTED', 'group'),
  ('GROUP_JOIN_REQUEST_RECEIVED', 'group'),
  ('GROUP_JOIN_REQUEST_ACCEPTED', 'group'),
  ('GROUP_MEMBER_JOINED', 'group'),
  ('GROUP_MEMBER_PROMOTED_TO_ADMIN', 'group'),
  ('GROUP_MEMBER_REMOVED', 'group');

ALTER TABLE "Notification"
  ALTER COLUMN "scope" TYPE "NotificationScope"
  USING (
    CASE
      WHEN lower("scope") = 'friendship' THEN 'friendship'::"NotificationScope"
      WHEN lower("scope") = 'group' THEN 'group'::"NotificationScope"
      ELSE 'system'::"NotificationScope"
    END
  );

UPDATE "Notification" AS n
SET "scope" = e."scope"
FROM "NotificationEvent" AS e
WHERE n."eventKey" = e."id";

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_eventKey_fkey"
  FOREIGN KEY ("eventKey")
  REFERENCES "NotificationEvent"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

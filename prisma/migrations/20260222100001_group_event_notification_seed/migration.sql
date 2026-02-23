-- Seed NotificationEvent catalog entry for GROUP_EVENT_CREATED
-- Must run in a separate migration after the ADD VALUE is committed
INSERT INTO "NotificationEvent" ("id", "scope")
VALUES ('GROUP_EVENT_CREATED', 'group')
ON CONFLICT DO NOTHING;

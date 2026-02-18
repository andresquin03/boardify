-- Enums
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- User visibility
ALTER TABLE "User"
  ADD COLUMN "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Friendship graph (also supports pending requests)
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Friendship_requesterId_addresseeId_diff" CHECK ("requesterId" <> "addresseeId")
);

CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");
CREATE INDEX "Friendship_addresseeId_status_idx" ON "Friendship"("addresseeId", "status");
CREATE INDEX "Friendship_requesterId_status_idx" ON "Friendship"("requesterId", "status");

ALTER TABLE "Friendship"
  ADD CONSTRAINT "Friendship_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Friendship"
  ADD CONSTRAINT "Friendship_addresseeId_fkey"
  FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill missing usernames from email prefix. Ensures uniqueness by appending numeric suffixes.
DO $$
DECLARE
  u RECORD;
  raw_base TEXT;
  base_slug TEXT;
  candidate TEXT;
  suffix INTEGER;
BEGIN
  FOR u IN
    SELECT "id", "email"
    FROM "User"
    WHERE "username" IS NULL OR btrim("username") = ''
    ORDER BY "createdAt" ASC
  LOOP
    raw_base := split_part(lower(u."email"), '@', 1);
    base_slug := regexp_replace(raw_base, '[^a-z0-9._-]+', '', 'g');

    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'user';
    END IF;

    candidate := base_slug;
    suffix := 1;

    WHILE EXISTS (
      SELECT 1
      FROM "User"
      WHERE "username" = candidate
        AND "id" <> u."id"
    ) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix::text;
    END LOOP;

    UPDATE "User"
    SET "username" = candidate
    WHERE "id" = u."id";
  END LOOP;
END $$;

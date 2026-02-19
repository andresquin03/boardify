-- Keep historical group slugs to support redirects after renames.

CREATE TABLE "GroupSlug" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GroupSlug_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupSlug_slug_key" ON "GroupSlug"("slug");
CREATE INDEX "GroupSlug_groupId_idx" ON "GroupSlug"("groupId");

ALTER TABLE "GroupSlug"
  ADD CONSTRAINT "GroupSlug_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

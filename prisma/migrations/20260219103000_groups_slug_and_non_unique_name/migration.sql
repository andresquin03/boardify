-- Make group names non-unique and add unique slugs for URL routing.

-- Drop previous unique index on display name.
DROP INDEX IF EXISTS "Group_name_key";

-- Add slug column first as nullable so existing rows can be backfilled.
ALTER TABLE "Group" ADD COLUMN "slug" TEXT;

WITH base_slugs AS (
  SELECT
    g."id",
    CASE
      WHEN lower(regexp_replace(trim(g."name"), '\s+', '', 'g')) = '' THEN 'group'
      ELSE lower(regexp_replace(trim(g."name"), '\s+', '', 'g'))
    END AS base_slug,
    row_number() OVER (
      PARTITION BY
        CASE
          WHEN lower(regexp_replace(trim(g."name"), '\s+', '', 'g')) = '' THEN 'group'
          ELSE lower(regexp_replace(trim(g."name"), '\s+', '', 'g'))
        END
      ORDER BY g."createdAt", g."id"
    ) AS row_num
  FROM "Group" g
)
UPDATE "Group" g
SET "slug" = CASE
  WHEN b.row_num = 1 THEN b.base_slug
  ELSE b.base_slug || '_' || b.row_num::text
END
FROM base_slugs b
WHERE g."id" = b."id";

ALTER TABLE "Group"
  ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

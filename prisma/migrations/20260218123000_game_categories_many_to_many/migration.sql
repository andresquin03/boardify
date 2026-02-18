-- Create category tables
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameCategory" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "GameCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "GameCategory_gameId_categoryId_key" ON "GameCategory"("gameId", "categoryId");

ALTER TABLE "GameCategory"
  ADD CONSTRAINT "GameCategory_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameCategory"
  ADD CONSTRAINT "GameCategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing single-category values into Category + GameCategory
WITH raw_categories AS (
  SELECT DISTINCT trim("category") AS name
  FROM "Game"
  WHERE "category" IS NOT NULL AND trim("category") <> ''
),
slugged AS (
  SELECT
    name,
    trim(both '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) AS base_slug
  FROM raw_categories
),
ranked AS (
  SELECT
    name,
    base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY name) AS slug_rank
  FROM slugged
)
INSERT INTO "Category" ("id", "name", "slug")
SELECT
  'cat_' || substr(md5(name || ':' || slug_rank::text), 1, 24),
  name,
  CASE WHEN slug_rank = 1 THEN base_slug ELSE base_slug || '-' || slug_rank::text END
FROM ranked;

INSERT INTO "GameCategory" ("id", "gameId", "categoryId")
SELECT
  'gcat_' || substr(md5(g."id" || ':' || c."id"), 1, 24),
  g."id",
  c."id"
FROM "Game" g
JOIN "Category" c ON c."name" = trim(g."category")
WHERE g."category" IS NOT NULL AND trim(g."category") <> '';

-- Drop legacy single-category column
ALTER TABLE "Game" DROP COLUMN "category";

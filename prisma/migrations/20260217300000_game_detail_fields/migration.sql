-- Step 1: Add new columns with defaults
ALTER TABLE "Game" ADD COLUMN "slug" TEXT;
ALTER TABLE "Game" ADD COLUMN "description" TEXT;
ALTER TABLE "Game" ADD COLUMN "minPlayers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Game" ADD COLUMN "maxPlayers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Game" ADD COLUMN "minPlaytime" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Game" ADD COLUMN "maxPlaytime" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Game" ADD COLUMN "yearPublished" INTEGER;
ALTER TABLE "Game" ADD COLUMN "complexity" DOUBLE PRECISION;
ALTER TABLE "Game" ADD COLUMN "designer" TEXT;
ALTER TABLE "Game" ADD COLUMN "category" TEXT;

-- Step 2: Populate slug from existing id (which is already title-based slug)
UPDATE "Game" SET "slug" = "id";

-- Step 3: Parse playerCount "X-Y" into minPlayers/maxPlayers
UPDATE "Game" SET
  "minPlayers" = CAST(SPLIT_PART("playerCount", '-', 1) AS INTEGER),
  "maxPlayers" = CASE
    WHEN "playerCount" LIKE '%-%' THEN CAST(SPLIT_PART("playerCount", '-', 2) AS INTEGER)
    ELSE CAST("playerCount" AS INTEGER)
  END;

-- Step 4: Parse playtime "X-Y min" or "X min" into minPlaytime/maxPlaytime
UPDATE "Game" SET
  "minPlaytime" = CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE("playtime", ' min', ''), '-', 1), '[^0-9]', '', 'g') AS INTEGER),
  "maxPlaytime" = CASE
    WHEN REPLACE("playtime", ' min', '') LIKE '%-%'
    THEN CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE("playtime", ' min', ''), '-', 2), '[^0-9]', '', 'g') AS INTEGER)
    ELSE CAST(REGEXP_REPLACE(REPLACE("playtime", ' min', ''), '[^0-9]', '', 'g') AS INTEGER)
  END;

-- Step 5: Make slug NOT NULL and add unique constraint
ALTER TABLE "Game" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- Step 6: Remove defaults from int columns (schema doesn't have defaults)
ALTER TABLE "Game" ALTER COLUMN "minPlayers" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "maxPlayers" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "minPlaytime" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "maxPlaytime" DROP DEFAULT;

-- Step 7: Drop old string columns
ALTER TABLE "Game" DROP COLUMN "playerCount";
ALTER TABLE "Game" DROP COLUMN "playtime";

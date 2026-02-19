-- Rename existing complexity column to difficulty to preserve data.
ALTER TABLE "Game" RENAME COLUMN "complexity" TO "difficulty";

-- Add community rating column.
ALTER TABLE "Game" ADD COLUMN "rating" DOUBLE PRECISION;

-- Keep values in expected ranges.
ALTER TABLE "Game"
  ADD CONSTRAINT "Game_difficulty_range"
  CHECK ("difficulty" IS NULL OR ("difficulty" >= 0 AND "difficulty" <= 5));

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_rating_range"
  CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 10));

-- Add configurable icon color for groups.

CREATE TYPE "GroupColor" AS ENUM (
  'SKY',
  'EMERALD',
  'AMBER',
  'ROSE',
  'VIOLET',
  'INDIGO',
  'CYAN',
  'LIME'
);

ALTER TABLE "Group"
  ADD COLUMN "color" "GroupColor" NOT NULL DEFAULT 'SKY';

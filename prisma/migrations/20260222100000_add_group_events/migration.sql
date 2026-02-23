-- Add GROUP_EVENT_CREATED to NotificationEventKey enum
ALTER TYPE "NotificationEventKey" ADD VALUE IF NOT EXISTS 'GROUP_EVENT_CREATED';

-- CreateTable GroupEvent
CREATE TABLE "GroupEvent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "locationUserId" TEXT,
    "locationText" TEXT,
    "notes" TEXT,
    "googleCalendarEventId" TEXT,
    "googleCalendarEventLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable GroupEventGame
CREATE TABLE "GroupEventGame" (
    "id" TEXT NOT NULL,
    "groupEventId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "carriedByUserId" TEXT,

    CONSTRAINT "GroupEventGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupEvent_groupId_date_idx" ON "GroupEvent"("groupId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GroupEventGame_groupEventId_gameId_key" ON "GroupEventGame"("groupEventId", "gameId");

-- AddForeignKey GroupEvent
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_locationUserId_fkey" FOREIGN KEY ("locationUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey GroupEventGame
ALTER TABLE "GroupEventGame" ADD CONSTRAINT "GroupEventGame_groupEventId_fkey" FOREIGN KEY ("groupEventId") REFERENCES "GroupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupEventGame" ADD CONSTRAINT "GroupEventGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupEventGame" ADD CONSTRAINT "GroupEventGame_carriedByUserId_fkey" FOREIGN KEY ("carriedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

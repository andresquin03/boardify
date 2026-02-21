ALTER TYPE "GroupInvitationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "NotificationEventKey" ADD VALUE IF NOT EXISTS 'GROUP_JOIN_REQUEST_RECEIVED';
ALTER TYPE "NotificationEventKey" ADD VALUE IF NOT EXISTS 'GROUP_JOIN_REQUEST_ACCEPTED';
ALTER TYPE "NotificationEventKey" ADD VALUE IF NOT EXISTS 'GROUP_MEMBER_JOINED';

CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

CREATE TABLE "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "groupId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupJoinRequest_groupId_requesterId_key" ON "GroupJoinRequest"("groupId", "requesterId");
CREATE INDEX "GroupJoinRequest_requesterId_status_idx" ON "GroupJoinRequest"("requesterId", "status");
CREATE INDEX "GroupJoinRequest_groupId_status_idx" ON "GroupJoinRequest"("groupId", "status");

ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

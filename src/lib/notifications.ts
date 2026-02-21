import { NotificationEventKey, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const NOTIFICATION_SCOPE = {
  FRIENDSHIP: "friendship",
  GROUP: "group",
  SYSTEM: "system",
} as const;

export const NOTIFICATION_EVENT_KEY = {
  FRIEND_REQUEST_RECEIVED: NotificationEventKey.FRIEND_REQUEST_RECEIVED,
  FRIEND_REQUEST_ACCEPTED: NotificationEventKey.FRIEND_REQUEST_ACCEPTED,
  GROUP_INVITE_RECEIVED: NotificationEventKey.GROUP_INVITE_RECEIVED,
  GROUP_INVITE_ACCEPTED: NotificationEventKey.GROUP_INVITE_ACCEPTED,
} as const;

type NotificationCreateInput = {
  userId: string;
  actorId?: string | null;
  eventKey: NotificationEventKey;
  scope?: string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Prisma.InputJsonValue;
  createdAt?: Date;
};

export async function createNotification({
  userId,
  actorId = null,
  eventKey,
  scope = NOTIFICATION_SCOPE.SYSTEM,
  entityType = null,
  entityId = null,
  payload,
  createdAt,
}: NotificationCreateInput) {
  return prisma.notification.create({
    data: {
      userId,
      actorId,
      eventKey,
      scope,
      entityType,
      entityId,
      payload,
      ...(createdAt ? { createdAt } : {}),
    },
  });
}

export async function countUnreadNotifications(userId: string, scopes?: string[]) {
  return prisma.notification.count({
    where: {
      userId,
      isSeen: false,
      deletedAt: null,
      ...(scopes && scopes.length > 0 ? { scope: { in: scopes } } : {}),
    },
  });
}

export async function listNotifications(userId: string, limit = 100) {
  return prisma.notification.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markAllNotificationsSeen(userId: string) {
  const now = new Date();
  return prisma.notification.updateMany({
    where: {
      userId,
      deletedAt: null,
      isSeen: false,
    },
    data: {
      isSeen: true,
      seenAt: now,
    },
  });
}

export async function markNotificationsSeenByScopes(userId: string, scopes: string[]) {
  if (scopes.length === 0) {
    return { count: 0 };
  }

  const now = new Date();
  return prisma.notification.updateMany({
    where: {
      userId,
      scope: { in: scopes },
      deletedAt: null,
      isSeen: false,
    },
    data: {
      isSeen: true,
      seenAt: now,
    },
  });
}

export async function deleteNotificationForUser(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function softDeleteFriendRequestReceivedNotification(
  addresseeId: string,
  friendshipId: string,
) {
  return prisma.notification.updateMany({
    where: {
      userId: addresseeId,
      eventKey: NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_RECEIVED,
      entityType: "friendship",
      entityId: friendshipId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function notifyFriendRequestReceived({
  addresseeId,
  requesterId,
  friendshipId,
}: {
  addresseeId: string;
  requesterId: string;
  friendshipId: string;
}) {
  return createNotification({
    userId: addresseeId,
    actorId: requesterId,
    eventKey: NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_RECEIVED,
    scope: NOTIFICATION_SCOPE.FRIENDSHIP,
    entityType: "friendship",
    entityId: friendshipId,
    payload: { status: "PENDING" },
  });
}

export async function notifyFriendRequestAccepted({
  requesterId,
  addresseeId,
  friendshipId,
}: {
  requesterId: string;
  addresseeId: string;
  friendshipId: string;
}) {
  return createNotification({
    userId: requesterId,
    actorId: addresseeId,
    eventKey: NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_ACCEPTED,
    scope: NOTIFICATION_SCOPE.FRIENDSHIP,
    entityType: "friendship",
    entityId: friendshipId,
    payload: { status: "ACCEPTED" },
  });
}

export async function notifyGroupInviteReceived({
  inviteeId,
  inviterId,
  invitationId,
  groupId,
  groupSlug,
  groupName,
}: {
  inviteeId: string;
  inviterId: string;
  invitationId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  return createNotification({
    userId: inviteeId,
    actorId: inviterId,
    eventKey: NOTIFICATION_EVENT_KEY.GROUP_INVITE_RECEIVED,
    scope: NOTIFICATION_SCOPE.GROUP,
    entityType: "group_invitation",
    entityId: invitationId,
    payload: {
      status: "PENDING",
      groupId,
      groupSlug,
      groupName,
    },
  });
}

export async function notifyGroupInviteAccepted({
  inviterId,
  inviteeId,
  invitationId,
  groupId,
  groupSlug,
  groupName,
}: {
  inviterId: string;
  inviteeId: string;
  invitationId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  return createNotification({
    userId: inviterId,
    actorId: inviteeId,
    eventKey: NOTIFICATION_EVENT_KEY.GROUP_INVITE_ACCEPTED,
    scope: NOTIFICATION_SCOPE.GROUP,
    entityType: "group_invitation",
    entityId: invitationId,
    payload: {
      status: "ACCEPTED",
      groupId,
      groupSlug,
      groupName,
    },
  });
}

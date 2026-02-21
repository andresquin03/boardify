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
  GROUP_JOIN_REQUEST_RECEIVED: NotificationEventKey.GROUP_JOIN_REQUEST_RECEIVED,
  GROUP_JOIN_REQUEST_ACCEPTED: NotificationEventKey.GROUP_JOIN_REQUEST_ACCEPTED,
  GROUP_MEMBER_JOINED: NotificationEventKey.GROUP_MEMBER_JOINED,
  GROUP_MEMBER_PROMOTED_TO_ADMIN: NotificationEventKey.GROUP_MEMBER_PROMOTED_TO_ADMIN,
  GROUP_MEMBER_REMOVED: NotificationEventKey.GROUP_MEMBER_REMOVED,
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

export async function markGroupNotificationsSeen(userId: string, groupId: string) {
  const now = new Date();
  return prisma.notification.updateMany({
    where: {
      userId,
      scope: NOTIFICATION_SCOPE.GROUP,
      deletedAt: null,
      isSeen: false,
      OR: [
        {
          entityType: "group",
          entityId: groupId,
        },
        {
          payload: {
            path: ["groupId"],
            equals: groupId,
          },
        },
      ],
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

export async function deleteAllNotificationsForUser(userId: string) {
  return prisma.notification.updateMany({
    where: {
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

export async function softDeleteGroupInviteReceivedNotification(
  inviteeId: string,
  invitationId: string,
) {
  return prisma.notification.updateMany({
    where: {
      userId: inviteeId,
      eventKey: NOTIFICATION_EVENT_KEY.GROUP_INVITE_RECEIVED,
      entityType: "group_invitation",
      entityId: invitationId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function softDeleteGroupJoinRequestReceivedNotifications(joinRequestId: string) {
  return prisma.notification.updateMany({
    where: {
      eventKey: NOTIFICATION_EVENT_KEY.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group_join_request",
      entityId: joinRequestId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function notifyGroupJoinRequestReceived({
  adminIds,
  requesterId,
  joinRequestId,
  groupId,
  groupSlug,
  groupName,
}: {
  adminIds: string[];
  requesterId: string;
  joinRequestId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  const recipientIds = [...new Set(adminIds)].filter((id) => id !== requesterId);
  if (recipientIds.length === 0) {
    return [];
  }

  return Promise.all(
    recipientIds.map((adminId) =>
      createNotification({
        userId: adminId,
        actorId: requesterId,
        eventKey: NOTIFICATION_EVENT_KEY.GROUP_JOIN_REQUEST_RECEIVED,
        scope: NOTIFICATION_SCOPE.GROUP,
        entityType: "group_join_request",
        entityId: joinRequestId,
        payload: {
          status: "PENDING",
          groupId,
          groupSlug,
          groupName,
        },
      }),
    ),
  );
}

export async function notifyGroupJoinRequestAccepted({
  requesterId,
  adminId,
  joinRequestId,
  groupId,
  groupSlug,
  groupName,
}: {
  requesterId: string;
  adminId: string;
  joinRequestId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  return createNotification({
    userId: requesterId,
    actorId: adminId,
    eventKey: NOTIFICATION_EVENT_KEY.GROUP_JOIN_REQUEST_ACCEPTED,
    scope: NOTIFICATION_SCOPE.GROUP,
    entityType: "group_join_request",
    entityId: joinRequestId,
    payload: {
      status: "ACCEPTED",
      groupId,
      groupSlug,
      groupName,
    },
  });
}

export async function notifyGroupMemberJoined({
  recipientIds,
  actorId,
  groupId,
  groupSlug,
  groupName,
}: {
  recipientIds: string[];
  actorId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  const uniqueRecipientIds = [...new Set(recipientIds)].filter((id) => id !== actorId);
  if (uniqueRecipientIds.length === 0) {
    return [];
  }

  return Promise.all(
    uniqueRecipientIds.map((recipientId) =>
      createNotification({
        userId: recipientId,
        actorId,
        eventKey: NOTIFICATION_EVENT_KEY.GROUP_MEMBER_JOINED,
        scope: NOTIFICATION_SCOPE.GROUP,
        entityType: "group",
        entityId: groupId,
        payload: {
          groupId,
          groupSlug,
          groupName,
        },
      }),
    ),
  );
}

export async function notifyGroupMemberPromotedToAdmin({
  memberId,
  adminId,
  groupId,
  groupSlug,
  groupName,
}: {
  memberId: string;
  adminId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  return createNotification({
    userId: memberId,
    actorId: adminId,
    eventKey: NOTIFICATION_EVENT_KEY.GROUP_MEMBER_PROMOTED_TO_ADMIN,
    scope: NOTIFICATION_SCOPE.GROUP,
    entityType: "group",
    entityId: groupId,
    payload: {
      groupId,
      groupSlug,
      groupName,
    },
  });
}

export async function notifyGroupMemberRemoved({
  memberId,
  adminId,
  groupId,
  groupSlug,
  groupName,
}: {
  memberId: string;
  adminId: string;
  groupId: string;
  groupSlug?: string;
  groupName?: string;
}) {
  return createNotification({
    userId: memberId,
    actorId: adminId,
    eventKey: NOTIFICATION_EVENT_KEY.GROUP_MEMBER_REMOVED,
    scope: NOTIFICATION_SCOPE.GROUP,
    entityType: "group",
    entityId: groupId,
    payload: {
      groupId,
      groupSlug,
      groupName,
    },
  });
}

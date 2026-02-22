import { NotificationEventKey, NotificationScope, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const NOTIFICATION_SCOPE = NotificationScope;

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
  entityId?: string | null;
  payload?: Prisma.InputJsonValue;
  createdAt?: Date;
};

const NOTIFICATION_EVENT_SCOPE_CACHE_TTL_MS = 60_000;

type NotificationEventScopeCache = {
  loadedAt: number;
  byEventKey: Map<NotificationEventKey, NotificationScope>;
  byScope: Map<NotificationScope, NotificationEventKey[]>;
};

let notificationEventScopeCache: NotificationEventScopeCache | null = null;

async function getNotificationEventScopeCache(): Promise<NotificationEventScopeCache> {
  const now = Date.now();
  const cacheIsValid = Boolean(
    notificationEventScopeCache &&
      now - notificationEventScopeCache.loadedAt < NOTIFICATION_EVENT_SCOPE_CACHE_TTL_MS,
  );

  if (!cacheIsValid) {
    const rows = await prisma.notificationEvent.findMany({
      select: {
        id: true,
        scope: true,
      },
    });

    const byScope = new Map<NotificationScope, NotificationEventKey[]>(
      Object.values(NotificationScope).map((scope) => [scope, []]),
    );
    for (const row of rows) {
      const bucket = byScope.get(row.scope);
      if (bucket) {
        bucket.push(row.id);
      } else {
        byScope.set(row.scope, [row.id]);
      }
    }

    notificationEventScopeCache = {
      loadedAt: now,
      byEventKey: new Map(rows.map((row) => [row.id, row.scope])),
      byScope,
    };
  }

  if (!notificationEventScopeCache) {
    throw new Error("Notification event scope cache is unavailable.");
  }

  return notificationEventScopeCache;
}

async function getNotificationScopeByEventKey(eventKey: NotificationEventKey) {
  const cache = await getNotificationEventScopeCache();

  const scope = cache.byEventKey.get(eventKey);
  if (!scope) {
    throw new Error(`Missing notification event config for ${eventKey}`);
  }

  return scope;
}

async function getNotificationEventKeysByScopes(scopes: NotificationScope[]) {
  const cache = await getNotificationEventScopeCache();
  return scopes.flatMap((scope) => cache.byScope.get(scope) ?? []);
}

async function isScopeEnabledForUser(userId: string, scope: NotificationScope) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyFriendshipEvents: true,
      notifyGroupEvents: true,
      notifySystemEvents: true,
    },
  });

  if (!user) return false;
  if (scope === NOTIFICATION_SCOPE.FRIENDSHIP) return user.notifyFriendshipEvents;
  if (scope === NOTIFICATION_SCOPE.GROUP) return user.notifyGroupEvents;
  if (scope === NOTIFICATION_SCOPE.SYSTEM) return user.notifySystemEvents;

  return true;
}

export async function createNotification({
  userId,
  actorId = null,
  eventKey,
  entityId = null,
  payload,
  createdAt,
}: NotificationCreateInput) {
  const scope = await getNotificationScopeByEventKey(eventKey);
  const isEnabled = await isScopeEnabledForUser(userId, scope);
  if (!isEnabled) {
    return null;
  }

  return prisma.notification.create({
    data: {
      userId,
      actorId,
      eventKey,
      entityId,
      payload,
      ...(createdAt ? { createdAt } : {}),
    },
  });
}

export async function countUnreadNotifications(userId: string, scopes?: NotificationScope[]) {
  const scopedEventKeys =
    scopes && scopes.length > 0 ? await getNotificationEventKeysByScopes(scopes) : null;

  if (scopedEventKeys && scopedEventKeys.length === 0) {
    return 0;
  }

  return prisma.notification.count({
    where: {
      userId,
      isSeen: false,
      deletedAt: null,
      ...(scopedEventKeys ? { eventKey: { in: scopedEventKeys } } : {}),
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
      event: {
        select: {
          scope: true,
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

export async function markNotificationsSeenByScopes(userId: string, scopes: NotificationScope[]) {
  if (scopes.length === 0) {
    return { count: 0 };
  }

  const scopedEventKeys = await getNotificationEventKeysByScopes(scopes);
  if (scopedEventKeys.length === 0) {
    return { count: 0 };
  }

  const now = new Date();
  return prisma.notification.updateMany({
    where: {
      userId,
      eventKey: { in: scopedEventKeys },
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
  const groupEventKeys = await getNotificationEventKeysByScopes([NOTIFICATION_SCOPE.GROUP]);
  if (groupEventKeys.length === 0) {
    return { count: 0 };
  }

  const now = new Date();
  return prisma.notification.updateMany({
    where: {
      userId,
      eventKey: { in: groupEventKeys },
      deletedAt: null,
      isSeen: false,
      OR: [
        {
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

export async function markFriendshipNotificationsSeenByActor(userId: string, actorId: string) {
  const friendshipEventKeys = await getNotificationEventKeysByScopes([NOTIFICATION_SCOPE.FRIENDSHIP]);
  if (friendshipEventKeys.length === 0) {
    return { count: 0 };
  }

  const now = new Date();
  return prisma.notification.updateMany({
    where: {
      userId,
      actorId,
      eventKey: { in: friendshipEventKeys },
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
    entityId: groupId,
    payload: {
      groupId,
      groupSlug,
      groupName,
    },
  });
}

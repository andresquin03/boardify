"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  GroupColor,
  GroupIcon,
  GroupVisibility,
  type GroupColor as GroupColorValue,
  type GroupIcon as GroupIconValue,
  type GroupVisibility as GroupVisibilityValue,
} from "@/generated/prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { LANGUAGE_COOKIE_NAME, mapUserLanguageToLocale, normalizeLocale } from "@/lib/locale";
import {
  deleteAllNotificationsForUser,
  deleteNotificationForUser,
  notifyFriendRequestAccepted,
  notifyFriendRequestReceived,
  notifyGroupInviteAccepted,
  notifyGroupInviteReceived,
  notifyGroupJoinRequestAccepted,
  notifyGroupJoinRequestReceived,
  notifyGroupMemberJoined,
  notifyGroupMemberPromotedToAdmin,
  notifyGroupMemberRemoved,
  softDeleteFriendRequestReceivedNotification,
  softDeleteGroupInviteReceivedNotification,
  softDeleteGroupJoinRequestReceivedNotifications,
} from "@/lib/notifications";

// ── Input validation ─────────────────────────────────────

const CUID_RE = /^c[a-z0-9]{20,32}$/;
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;
const PROFILE_PATH_SEGMENT_RE = /^[a-z0-9._-]{3,50}$/;
const GAME_ID_RE = /^[a-z0-9][a-z0-9._-]{0,99}$/;
const GROUP_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._\- ]{1,28}[A-Za-z0-9]$/;
const VALID_GROUP_VISIBILITIES = Object.values(GroupVisibility);
const VALID_GROUP_ICONS = Object.values(GroupIcon);
const VALID_GROUP_COLORS = Object.values(GroupColor);
const RESERVED_GROUP_SLUGS = new Set(["new"]);

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeGroupName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toBaseGroupSlug(groupName: string) {
  return groupName.toLowerCase().replace(/\s+/g, "");
}

async function findAvailableGroupSlug(
  baseSlug: string,
  {
    excludeGroupId,
  }: {
    excludeGroupId?: string;
  } = {},
) {
  for (let suffix = 1; suffix <= 500; suffix += 1) {
    const candidateSlug = suffix === 1 ? baseSlug : `${baseSlug}_${suffix}`;
    if (RESERVED_GROUP_SLUGS.has(candidateSlug)) {
      continue;
    }

    const [currentCollision, historyCollision] = await Promise.all([
      prisma.group.findFirst({
        where: excludeGroupId
          ? { slug: candidateSlug, id: { not: excludeGroupId } }
          : { slug: candidateSlug },
        select: { id: true },
      }),
      prisma.groupSlug.findFirst({
        where: excludeGroupId
          ? { slug: candidateSlug, groupId: { not: excludeGroupId } }
          : { slug: candidateSlug },
        select: { id: true },
      }),
    ]);

    if (!currentCollision && !historyCollision) {
      return candidateSlug;
    }
  }

  return null;
}

function isUniqueConstraintErrorOnField(error: unknown, field: string) {
  let current: unknown = error;
  const normalizedField = field.toLowerCase();

  for (let depth = 0; depth < 8; depth += 1) {
    if (!current || typeof current !== "object") return false;

    const known = current as {
      code?: string;
      message?: string;
      cause?: unknown;
      meta?: { target?: unknown };
    };

    if (known.code === "P2002") {
      const target = known.meta?.target;
      if (Array.isArray(target)) {
        const matched = target.some(
          (item) => typeof item === "string" && item.toLowerCase().includes(normalizedField),
        );
        if (matched) return true;
      }

      if (typeof target === "string" && target.toLowerCase().includes(normalizedField)) {
        return true;
      }
    }

    if (typeof known.message === "string") {
      const message = known.message.toLowerCase();
      const fieldMentioned =
        message.includes(normalizedField) ||
        message.includes(`\`${normalizedField}\``) ||
        message.includes(`(${normalizedField})`) ||
        message.includes(`(\`${normalizedField}\`)`);
      if (fieldMentioned && message.includes("unique constraint")) {
        return true;
      }
    }

    current = known.cause;
  }

  return false;
}

function isUsernameUniqueConstraintError(error: unknown) {
  return isUniqueConstraintErrorOnField(error, "username");
}

function isGroupSlugUniqueConstraintError(error: unknown) {
  return isUniqueConstraintErrorOnField(error, "slug");
}

function assertCuid(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !CUID_RE.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

function assertGameId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !GAME_ID_RE.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

function assertProfilePathSegment(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    !(USERNAME_RE.test(value) || CUID_RE.test(value) || PROFILE_PATH_SEGMENT_RE.test(value))
  ) {
    throw new Error(`Invalid ${label}`);
  }
}

// ── Auth ─────────────────────────────────────────────────

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithGoogleRedirect(formData: FormData) {
  const rawRedirect = formData.get("redirectTo");
  const safeRedirect = getSafeRedirectPath(rawRedirect, "/");
  const redirectTo = safeRedirect.startsWith("/signin") ? "/" : safeRedirect;
  await signIn("google", { redirectTo });
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}

async function getAuthUserId({
  requireOnboardingCompleted = true,
}: {
  requireOnboardingCompleted?: boolean;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (requireOnboardingCompleted && !session.user.username) {
    throw new Error("Onboarding not completed");
  }
  return session.user.id;
}

// ── Game toggle helpers ──────────────────────────────────

async function assertGameExists(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true },
  });
  if (!game) throw new Error("Game not found");
}

function getOrCreateUserGame(userId: string, gameId: string) {
  return prisma.userGame.upsert({
    where: { userId_gameId: { userId, gameId } },
    create: { userId, gameId },
    update: {},
  });
}

export async function toggleFavorite(gameId: string) {
  assertGameId(gameId, "gameId");
  const userId = await getAuthUserId();
  await assertGameExists(gameId);
  const existing = await getOrCreateUserGame(userId, gameId);

  await prisma.userGame.update({
    where: { id: existing.id },
    data: { isFavorite: !existing.isFavorite },
  });

  revalidatePath("/games");
  revalidatePath("/g", "layout");
}

export async function toggleWishlist(gameId: string) {
  assertGameId(gameId, "gameId");
  const userId = await getAuthUserId();
  await assertGameExists(gameId);
  const existing = await getOrCreateUserGame(userId, gameId);

  if (existing.isOwned) {
    revalidatePath("/games");
    return;
  }

  await prisma.userGame.update({
    where: { id: existing.id },
    data: { isWishlist: !existing.isWishlist },
  });

  revalidatePath("/games");
  revalidatePath("/g", "layout");
}

export async function toggleOwned(gameId: string) {
  assertGameId(gameId, "gameId");
  const userId = await getAuthUserId();
  await assertGameExists(gameId);
  const existing = await getOrCreateUserGame(userId, gameId);
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId },
    select: {
      group: {
        select: { slug: true },
      },
    },
  });

  const newOwned = !existing.isOwned;
  await prisma.userGame.update({
    where: { id: existing.id },
    data: {
      isOwned: newOwned,
      ...(newOwned && { isWishlist: false }),
    },
  });

  revalidatePath("/games");
  revalidatePath("/g", "layout");
  for (const groupSlug of new Set(groupMemberships.map((membership) => membership.group.slug))) {
    revalidatePath(`/groups/${groupSlug}`);
  }
}

// ── Friendship ───────────────────────────────────────────

export async function sendFriendRequest(addresseeId: string, profileUsername: string) {
  assertCuid(addresseeId, "addresseeId");
  assertProfilePathSegment(profileUsername, "profileUsername");
  const requesterId = await getAuthUserId();

  if (requesterId === addresseeId) {
    throw new Error("Cannot send friend request to yourself");
  }

  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
    select: { id: true },
  });
  if (!addressee) throw new Error("User not found");

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
    select: { id: true, status: true },
  });

  if (!existing) {
    const createdRequest = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
      },
      select: { id: true },
    });
    await notifyFriendRequestReceived({
      addresseeId,
      requesterId,
      friendshipId: createdRequest.id,
    });
  } else if (
    existing.status === "REJECTED" ||
    existing.status === "CANCELLED" ||
    existing.status === "UNFRIENDED"
  ) {
    const reopenedRequest = await prisma.friendship.update({
      where: { id: existing.id },
      data: {
        requesterId,
        addresseeId,
        status: "PENDING",
      },
      select: { id: true },
    });
    await notifyFriendRequestReceived({
      addresseeId,
      requesterId,
      friendshipId: reopenedRequest.id,
    });
  }

  revalidatePath(`/u/${profileUsername}`);
  revalidatePath("/friends");
  revalidatePath("/notifications");
}

async function getAuthorizedFriendship(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    select: {
      id: true,
      requesterId: true,
      addresseeId: true,
      status: true,
      requester: { select: { username: true } },
      addressee: { select: { username: true } },
    },
  });
  if (!friendship) throw new Error("Friendship not found");
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
    throw new Error("Not authorized");
  }
  return friendship;
}

function revalidateFriendshipProfiles(friendship: {
  requester: { username: string | null };
  addressee: { username: string | null };
}) {
  revalidatePath("/friends");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  if (friendship.requester.username) {
    revalidatePath(`/u/${friendship.requester.username}`);
  }
  if (friendship.addressee.username) {
    revalidatePath(`/u/${friendship.addressee.username}`);
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  assertCuid(friendshipId, "friendshipId");
  const userId = await getAuthUserId();
  const friendship = await getAuthorizedFriendship(friendshipId, userId);

  if (friendship.addresseeId !== userId) {
    throw new Error("Only the recipient can accept a request");
  }
  if (friendship.status !== "PENDING") {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  const result = await prisma.friendship.updateMany({
    where: {
      id: friendshipId,
      status: "PENDING",
      addresseeId: userId,
    },
    data: { status: "ACCEPTED" },
  });
  if (result.count === 0) {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  await notifyFriendRequestAccepted({
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    friendshipId,
  });

  revalidateFriendshipProfiles(friendship);
}

export async function rejectFriendRequest(friendshipId: string) {
  assertCuid(friendshipId, "friendshipId");
  const userId = await getAuthUserId();
  const friendship = await getAuthorizedFriendship(friendshipId, userId);

  if (friendship.addresseeId !== userId) {
    throw new Error("Only the recipient can reject a request");
  }
  if (friendship.status !== "PENDING") {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  const result = await prisma.friendship.updateMany({
    where: {
      id: friendshipId,
      status: "PENDING",
      addresseeId: userId,
    },
    data: { status: "REJECTED" },
  });
  if (result.count === 0) {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  revalidateFriendshipProfiles(friendship);
}

export async function cancelFriendRequest(friendshipId: string) {
  assertCuid(friendshipId, "friendshipId");
  const userId = await getAuthUserId();
  const friendship = await getAuthorizedFriendship(friendshipId, userId);

  if (friendship.requesterId !== userId) {
    throw new Error("Only the requester can cancel a request");
  }
  if (friendship.status !== "PENDING") {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  const result = await prisma.friendship.updateMany({
    where: {
      id: friendshipId,
      status: "PENDING",
      requesterId: userId,
    },
    data: { status: "CANCELLED" },
  });
  if (result.count === 0) {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  await softDeleteFriendRequestReceivedNotification(friendship.addresseeId, friendshipId);

  revalidateFriendshipProfiles(friendship);
}

export async function unfriend(friendshipId: string, profileUsername: string) {
  assertCuid(friendshipId, "friendshipId");
  assertProfilePathSegment(profileUsername, "profileUsername");
  const userId = await getAuthUserId();
  const friendship = await getAuthorizedFriendship(friendshipId, userId);

  if (friendship.status !== "ACCEPTED") {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  const result = await prisma.friendship.updateMany({
    where: {
      id: friendshipId,
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    data: { status: "UNFRIENDED" },
  });
  if (result.count === 0) {
    revalidateFriendshipProfiles(friendship);
    return;
  }

  revalidateFriendshipProfiles(friendship);
}

// ── Notifications ───────────────────────────────────────

export async function deleteNotification(notificationId: string) {
  assertCuid(notificationId, "notificationId");
  const userId = await getAuthUserId();

  const result = await deleteNotificationForUser(userId, notificationId);
  if (result.count === 0) {
    throw new Error("Notification not found");
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function clearAllNotifications() {
  const userId = await getAuthUserId();
  await deleteAllNotificationsForUser(userId);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

// ── Groups ──────────────────────────────────────────────

export type GroupFormState = {
  errors?: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    visibility?: string;
    general?: string;
  };
  values?: {
    name: string;
    description: string;
    icon: GroupIconValue;
    color: GroupColorValue;
    visibility: GroupVisibilityValue;
  };
} | null;

type GroupInput = {
  name: string;
  description: string | null;
  icon: GroupIconValue;
  color: GroupColorValue;
  visibility: GroupVisibilityValue;
};

type ParsedGroupFormData =
  | {
      errors: NonNullable<GroupFormState>["errors"];
      values: NonNullable<GroupFormState>["values"];
    }
  | { data: GroupInput };

type ActionMessageTranslator = Awaited<ReturnType<typeof getTranslations>>;

function getLocaleFromFormData(formData: FormData) {
  const rawLocale = formData.get("locale");
  if (typeof rawLocale !== "string") return null;
  return normalizeLocale(rawLocale);
}

async function getActionMessagesTranslator(formData: FormData): Promise<ActionMessageTranslator> {
  const locale = getLocaleFromFormData(formData);
  if (locale) {
    return getTranslations({ locale, namespace: "ActionMessages" });
  }
  return getTranslations("ActionMessages");
}

function parseGroupFormData(
  formData: FormData,
  t: ActionMessageTranslator,
): ParsedGroupFormData {
  const rawName = formData.get("name");
  const rawDescription = formData.get("description");
  const rawIcon = formData.get("icon");
  const rawColor = formData.get("color");
  const rawVisibility = formData.get("visibility");
  const name = typeof rawName === "string" ? normalizeGroupName(rawName) : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const icon =
    typeof rawIcon === "string" && VALID_GROUP_ICONS.includes(rawIcon as GroupIconValue)
      ? (rawIcon as GroupIconValue)
      : "DICE_1";
  const color =
    typeof rawColor === "string" && VALID_GROUP_COLORS.includes(rawColor as GroupColorValue)
      ? (rawColor as GroupColorValue)
      : "SKY";
  const visibility =
    typeof rawVisibility === "string" &&
    VALID_GROUP_VISIBILITIES.includes(rawVisibility as GroupVisibilityValue)
      ? (rawVisibility as GroupVisibilityValue)
      : "INVITATION";

  const values: NonNullable<GroupFormState>["values"] = {
    name,
    description,
    icon,
    color,
    visibility,
  };
  const errors: NonNullable<GroupFormState>["errors"] = {};

  if (!GROUP_NAME_RE.test(name)) {
    errors.name = t("group.invalidName");
  }

  if (description !== "" && description.length > 160) {
    errors.description = t("group.descriptionTooLong");
  }

  if (
    typeof rawIcon !== "string" ||
    !VALID_GROUP_ICONS.includes(rawIcon as GroupIconValue)
  ) {
    errors.icon = t("group.invalidIcon");
  }

  if (
    typeof rawColor !== "string" ||
    !VALID_GROUP_COLORS.includes(rawColor as GroupColorValue)
  ) {
    errors.color = t("group.invalidColor");
  }

  if (
    typeof rawVisibility !== "string" ||
    !VALID_GROUP_VISIBILITIES.includes(rawVisibility as GroupVisibilityValue)
  ) {
    errors.visibility = t("group.invalidVisibility");
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  return {
    data: {
      name,
      description: description ? description : null,
      icon,
      color,
      visibility,
    },
  };
}

type GroupActionContext = {
  id: string;
  slug: string;
  name: string;
  visibility: GroupVisibilityValue;
  members: Array<{
    userId: string;
    role: "ADMIN" | "MEMBER";
    user: { username: string | null };
  }>;
};

async function getGroupActionContext(groupId: string): Promise<GroupActionContext> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      slug: true,
      name: true,
      visibility: true,
      members: {
        select: {
          userId: true,
          role: true,
          user: { select: { username: true } },
        },
      },
    },
  });
  if (!group) {
    throw new Error("Group not found");
  }
  return group;
}

function getGroupAdminIds(group: GroupActionContext) {
  return group.members
    .filter((member) => member.role === "ADMIN")
    .map((member) => member.userId);
}

function revalidateGroupRelatedPaths(
  groupSlug: string,
  usernames: Array<string | null | undefined> = [],
) {
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupSlug}`);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");

  for (const username of new Set(usernames)) {
    if (!username) continue;
    revalidatePath(`/u/${username}`);
    revalidatePath(`/u/${username}/groups`);
  }
}

export async function createGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const t = await getActionMessagesTranslator(formData);
  const userId = await getAuthUserId();
  const parsed = parseGroupFormData(formData, t);

  if ("errors" in parsed) {
    return { errors: parsed.errors, values: parsed.values };
  }

  const baseSlug = toBaseGroupSlug(parsed.data.name);
  if (!baseSlug) {
    return {
      errors: { name: t("group.slugBaseRequired") },
      values: {
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        icon: parsed.data.icon,
        color: parsed.data.color,
        visibility: parsed.data.visibility,
      },
    };
  }

  let createdGroup: { slug: string } | null = null;
  for (let attempt = 1; attempt <= 500; attempt += 1) {
    const candidateSlug = await findAvailableGroupSlug(baseSlug);
    if (!candidateSlug) {
      break;
    }

    try {
      createdGroup = await prisma.$transaction(async (tx) => {
        const group = await tx.group.create({
          data: {
            name: parsed.data.name,
            slug: candidateSlug,
            description: parsed.data.description,
            icon: parsed.data.icon,
            color: parsed.data.color,
            visibility: parsed.data.visibility,
          },
          select: { id: true, slug: true },
        });

        await tx.groupMember.create({
          data: {
            userId,
            groupId: group.id,
            role: "ADMIN",
          },
        });

        return group;
      });
      break;
    } catch (error) {
      if (isGroupSlugUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (!createdGroup) {
    return {
      errors: { general: t("group.slugGenerationFailed") },
      values: {
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        icon: parsed.data.icon,
        color: parsed.data.color,
        visibility: parsed.data.visibility,
      },
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  revalidatePath("/groups");
  if (currentUser?.username) {
    revalidatePath(`/u/${currentUser.username}`);
    revalidatePath(`/u/${currentUser.username}/groups`);
  }

  redirect(`/groups/${createdGroup.slug}`);
}

export async function updateGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const t = await getActionMessagesTranslator(formData);
  const userId = await getAuthUserId();
  const groupId = formData.get("groupId");
  assertCuid(groupId, "groupId");
  const parsed = parseGroupFormData(formData, t);

  if ("errors" in parsed) {
    return { errors: parsed.errors, values: parsed.values };
  }

  const baseSlug = toBaseGroupSlug(parsed.data.name);
  if (!baseSlug) {
    return {
      errors: { name: t("group.slugBaseRequired") },
      values: {
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        icon: parsed.data.icon,
        color: parsed.data.color,
        visibility: parsed.data.visibility,
      },
    };
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, slug: true },
  });
  if (!group) {
    return {
      errors: { general: t("group.notFound") },
      values: {
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        icon: parsed.data.icon,
        color: parsed.data.color,
        visibility: parsed.data.visibility,
      },
    };
  }

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { role: true },
  });

  if (membership?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  let nextSlug = group.slug;
  let updated = false;

  for (let attempt = 1; attempt <= 500; attempt += 1) {
    const candidateSlug = await findAvailableGroupSlug(baseSlug, {
      excludeGroupId: groupId,
    });
    if (!candidateSlug) {
      break;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.group.update({
          where: { id: groupId },
          data: {
            name: parsed.data.name,
            description: parsed.data.description,
            icon: parsed.data.icon,
            color: parsed.data.color,
            visibility: parsed.data.visibility,
            slug: candidateSlug,
          },
        });

        if (candidateSlug !== group.slug) {
          await tx.groupSlug.createMany({
            data: [{ slug: group.slug, groupId }],
            skipDuplicates: true,
          });
        }
      });

      nextSlug = candidateSlug;
      updated = true;
      break;
    } catch (error) {
      if (isGroupSlugUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (!updated) {
    return {
      errors: { general: t("group.slugGenerationFailed") },
      values: {
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        icon: parsed.data.icon,
        color: parsed.data.color,
        visibility: parsed.data.visibility,
      },
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${group.slug}`);
  revalidatePath(`/groups/${nextSlug}`);
  if (currentUser?.username) {
    revalidatePath(`/u/${currentUser.username}`);
    revalidatePath(`/u/${currentUser.username}/groups`);
  }

  redirect(`/groups/${nextSlug}`);
}

export async function deleteGroup(groupId: string) {
  assertCuid(groupId, "groupId");
  const userId = await getAuthUserId();

  const deleted = await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        slug: true,
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const membership = group.members.find((member) => member.userId === userId);
    if (membership?.role !== "ADMIN") {
      throw new Error("Not authorized");
    }

    await tx.group.delete({
      where: { id: group.id },
    });

    return {
      slug: group.slug,
      memberUsernames: group.members
        .map((member) => member.user.username)
        .filter((username): username is string => Boolean(username)),
    };
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${deleted.slug}`);

  for (const username of new Set(deleted.memberUsernames)) {
    revalidatePath(`/u/${username}`);
    revalidatePath(`/u/${username}/groups`);
  }

  redirect("/groups");
}

export async function leaveGroup(groupId: string) {
  assertCuid(groupId, "groupId");
  const userId = await getAuthUserId();

  const leftGroup = await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        slug: true,
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const membership = group.members.find((member) => member.userId === userId);
    if (!membership) {
      throw new Error("Not a member");
    }

    const adminCount = group.members.reduce(
      (total, member) => total + (member.role === "ADMIN" ? 1 : 0),
      0,
    );

    if (membership.role === "ADMIN" && adminCount === 1) {
      throw new Error("You are the only admin");
    }

    await tx.groupMember.delete({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id,
        },
      },
    });

    return {
      slug: group.slug,
      memberUsernames: group.members
        .map((member) => member.user.username)
        .filter((username): username is string => Boolean(username)),
    };
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${leftGroup.slug}`);

  for (const username of new Set(leftGroup.memberUsernames)) {
    revalidatePath(`/u/${username}`);
    revalidatePath(`/u/${username}/groups`);
  }

  redirect("/groups");
}

export async function promoteGroupMemberToAdmin(groupId: string, targetUserId: string) {
  assertCuid(groupId, "groupId");
  assertCuid(targetUserId, "targetUserId");
  const userId = await getAuthUserId();
  const group = await getGroupActionContext(groupId);

  const viewerMembership = group.members.find((member) => member.userId === userId);
  if (viewerMembership?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  if (targetUserId === userId) {
    throw new Error("Cannot modify self");
  }

  const targetMembership = group.members.find((member) => member.userId === targetUserId);
  if (!targetMembership || targetMembership.role !== "MEMBER") {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }

  const promoted = await prisma.groupMember.updateMany({
    where: {
      userId: targetUserId,
      groupId: group.id,
      role: "MEMBER",
    },
    data: {
      role: "ADMIN",
    },
  });

  if (promoted.count === 0) {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }

  await notifyGroupMemberPromotedToAdmin({
    memberId: targetUserId,
    adminId: userId,
    groupId: group.id,
    groupSlug: group.slug,
    groupName: group.name,
  });

  revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
}

export async function removeGroupMember(groupId: string, targetUserId: string) {
  assertCuid(groupId, "groupId");
  assertCuid(targetUserId, "targetUserId");
  const userId = await getAuthUserId();
  const group = await getGroupActionContext(groupId);

  const viewerMembership = group.members.find((member) => member.userId === userId);
  if (viewerMembership?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  if (targetUserId === userId) {
    throw new Error("Cannot remove self");
  }

  const targetMembership = group.members.find((member) => member.userId === targetUserId);
  if (!targetMembership) {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }
  if (targetMembership.role === "ADMIN") {
    throw new Error("Cannot remove admins");
  }

  const removed = await prisma.groupMember.deleteMany({
    where: {
      userId: targetUserId,
      groupId: group.id,
      role: "MEMBER",
    },
  });

  if (removed.count === 0) {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }

  await notifyGroupMemberRemoved({
    memberId: targetUserId,
    adminId: userId,
    groupId: group.id,
    groupSlug: group.slug,
    groupName: group.name,
  });

  revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
}

export async function joinPublicGroup(groupId: string) {
  assertCuid(groupId, "groupId");
  const userId = await getAuthUserId();
  const [group, user, existingInvitation] = await Promise.all([
    getGroupActionContext(groupId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    }),
    prisma.groupInvitation.findUnique({
      where: {
        groupId_inviteeId: {
          groupId,
          inviteeId: userId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (group.visibility !== "PUBLIC") {
    throw new Error("This group is not open to direct join");
  }

  const alreadyMember = group.members.some((member) => member.userId === userId);
  if (alreadyMember) {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }

  const created = await prisma.groupMember.createMany({
    data: [
      {
        userId,
        groupId: group.id,
        role: "MEMBER",
      },
    ],
    skipDuplicates: true,
  });
  if (created.count === 0) {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }

  await prisma.groupJoinRequest.updateMany({
    where: {
      groupId: group.id,
      requesterId: userId,
      status: "PENDING",
    },
    data: {
      status: "CANCELLED",
      handledById: userId,
    },
  });

  if (existingInvitation?.status === "PENDING") {
    const cancelledInvitation = await prisma.groupInvitation.updateMany({
      where: {
        id: existingInvitation.id,
        inviteeId: userId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });
    if (cancelledInvitation.count > 0) {
      await softDeleteGroupInviteReceivedNotification(userId, existingInvitation.id);
    }
  }

  await notifyGroupMemberJoined({
    recipientIds: group.members.map((member) => member.userId),
    actorId: userId,
    groupId: group.id,
    groupSlug: group.slug,
    groupName: group.name,
  });

  revalidateGroupRelatedPaths(group.slug, [
    ...group.members.map((member) => member.user.username),
    user?.username,
  ]);
}

export async function requestToJoinGroup(groupId: string) {
  assertCuid(groupId, "groupId");
  const requesterId = await getAuthUserId();
  const [group, requester] = await Promise.all([
    getGroupActionContext(groupId),
    prisma.user.findUnique({
      where: { id: requesterId },
      select: { username: true },
    }),
  ]);

  if (group.visibility === "PRIVATE") {
    throw new Error("This group is private");
  }
  if (group.visibility !== "INVITATION") {
    throw new Error("Use direct join for public groups");
  }

  if (group.members.some((member) => member.userId === requesterId)) {
    revalidateGroupRelatedPaths(group.slug, group.members.map((member) => member.user.username));
    return;
  }

  const existing = await prisma.groupJoinRequest.findUnique({
    where: {
      groupId_requesterId: {
        groupId: group.id,
        requesterId,
      },
    },
    select: { id: true, status: true },
  });

  let joinRequestId: string | null = null;
  if (!existing) {
    const created = await prisma.groupJoinRequest.create({
      data: {
        groupId: group.id,
        requesterId,
      },
      select: { id: true },
    });
    joinRequestId = created.id;
  } else if (existing.status !== "PENDING") {
    const reopened = await prisma.groupJoinRequest.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        handledById: null,
      },
      select: { id: true },
    });
    joinRequestId = reopened.id;
  }

  if (joinRequestId) {
    await notifyGroupJoinRequestReceived({
      adminIds: getGroupAdminIds(group),
      requesterId,
      joinRequestId,
      groupId: group.id,
      groupSlug: group.slug,
      groupName: group.name,
    });
  }

  revalidateGroupRelatedPaths(group.slug, [
    ...group.members.map((member) => member.user.username),
    requester?.username,
  ]);
}

export async function cancelGroupJoinRequest(joinRequestId: string) {
  assertCuid(joinRequestId, "joinRequestId");
  const userId = await getAuthUserId();

  const joinRequest = await prisma.groupJoinRequest.findUnique({
    where: { id: joinRequestId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      group: {
        select: {
          id: true,
          slug: true,
          name: true,
          members: {
            select: {
              userId: true,
              user: { select: { username: true } },
            },
          },
        },
      },
      requester: {
        select: {
          username: true,
        },
      },
    },
  });
  if (!joinRequest) {
    throw new Error("Join request not found");
  }
  if (joinRequest.requesterId !== userId) {
    throw new Error("Only the requester can cancel a request");
  }

  if (joinRequest.status !== "PENDING") {
    revalidateGroupRelatedPaths(joinRequest.group.slug, [
      ...joinRequest.group.members.map((member) => member.user.username),
      joinRequest.requester.username,
    ]);
    return;
  }

  const result = await prisma.groupJoinRequest.updateMany({
    where: {
      id: joinRequest.id,
      requesterId: userId,
      status: "PENDING",
    },
    data: {
      status: "CANCELLED",
      handledById: userId,
    },
  });
  if (result.count === 0) {
    revalidateGroupRelatedPaths(joinRequest.group.slug, [
      ...joinRequest.group.members.map((member) => member.user.username),
      joinRequest.requester.username,
    ]);
    return;
  }

  await softDeleteGroupJoinRequestReceivedNotifications(joinRequest.id);

  revalidateGroupRelatedPaths(joinRequest.group.slug, [
    ...joinRequest.group.members.map((member) => member.user.username),
    joinRequest.requester.username,
  ]);
}

export async function acceptGroupJoinRequest(joinRequestId: string) {
  assertCuid(joinRequestId, "joinRequestId");
  const userId = await getAuthUserId();

  const joinRequest = await prisma.groupJoinRequest.findUnique({
    where: { id: joinRequestId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      groupId: true,
      group: {
        select: {
          id: true,
          slug: true,
          name: true,
          members: {
            select: {
              userId: true,
              role: true,
              user: {
                select: { username: true },
              },
            },
          },
        },
      },
      requester: {
        select: {
          username: true,
        },
      },
    },
  });
  if (!joinRequest) {
    throw new Error("Join request not found");
  }

  const viewerMembership = joinRequest.group.members.find((member) => member.userId === userId);
  if (viewerMembership?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  if (joinRequest.status !== "PENDING") {
    revalidateGroupRelatedPaths(joinRequest.group.slug, [
      ...joinRequest.group.members.map((member) => member.user.username),
      joinRequest.requester.username,
    ]);
    return;
  }

  const accepted = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.groupJoinRequest.updateMany({
      where: {
        id: joinRequest.id,
        status: "PENDING",
      },
      data: {
        status: "ACCEPTED",
        handledById: userId,
      },
    });
    if (updateResult.count === 0) {
      return false;
    }

    await tx.groupMember.createMany({
      data: [
        {
          userId: joinRequest.requesterId,
          groupId: joinRequest.groupId,
          role: "MEMBER",
        },
      ],
      skipDuplicates: true,
    });

    await tx.groupInvitation.updateMany({
      where: {
        groupId: joinRequest.groupId,
        inviteeId: joinRequest.requesterId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    return true;
  });

  if (!accepted) {
    revalidateGroupRelatedPaths(joinRequest.group.slug, [
      ...joinRequest.group.members.map((member) => member.user.username),
      joinRequest.requester.username,
    ]);
    return;
  }

  await Promise.all([
    notifyGroupJoinRequestAccepted({
      requesterId: joinRequest.requesterId,
      adminId: userId,
      joinRequestId: joinRequest.id,
      groupId: joinRequest.group.id,
      groupSlug: joinRequest.group.slug,
      groupName: joinRequest.group.name,
    }),
    notifyGroupMemberJoined({
      recipientIds: joinRequest.group.members.map((member) => member.userId),
      actorId: joinRequest.requesterId,
      groupId: joinRequest.group.id,
      groupSlug: joinRequest.group.slug,
      groupName: joinRequest.group.name,
    }),
    softDeleteGroupJoinRequestReceivedNotifications(joinRequest.id),
  ]);

  revalidateGroupRelatedPaths(joinRequest.group.slug, [
    ...joinRequest.group.members.map((member) => member.user.username),
    joinRequest.requester.username,
  ]);
}

export async function rejectGroupJoinRequest(joinRequestId: string) {
  assertCuid(joinRequestId, "joinRequestId");
  const userId = await getAuthUserId();

  const joinRequest = await prisma.groupJoinRequest.findUnique({
    where: { id: joinRequestId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      group: {
        select: {
          slug: true,
          members: {
            select: {
              userId: true,
              role: true,
              user: { select: { username: true } },
            },
          },
        },
      },
      requester: {
        select: {
          username: true,
        },
      },
    },
  });
  if (!joinRequest) {
    throw new Error("Join request not found");
  }

  const viewerMembership = joinRequest.group.members.find((member) => member.userId === userId);
  if (viewerMembership?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  if (joinRequest.status !== "PENDING") {
    revalidateGroupRelatedPaths(joinRequest.group.slug, [
      ...joinRequest.group.members.map((member) => member.user.username),
      joinRequest.requester.username,
    ]);
    return;
  }

  const result = await prisma.groupJoinRequest.updateMany({
    where: {
      id: joinRequest.id,
      status: "PENDING",
    },
    data: {
      status: "REJECTED",
      handledById: userId,
    },
  });
  if (result.count === 0) {
    revalidateGroupRelatedPaths(joinRequest.group.slug, [
      ...joinRequest.group.members.map((member) => member.user.username),
      joinRequest.requester.username,
    ]);
    return;
  }

  await softDeleteGroupJoinRequestReceivedNotifications(joinRequest.id);

  revalidateGroupRelatedPaths(joinRequest.group.slug, [
    ...joinRequest.group.members.map((member) => member.user.username),
    joinRequest.requester.username,
  ]);
}

export async function sendGroupInvitation(groupId: string, inviteeId: string) {
  assertCuid(groupId, "groupId");
  assertCuid(inviteeId, "inviteeId");
  const inviterId = await getAuthUserId();

  if (inviterId === inviteeId) {
    throw new Error("Cannot invite yourself");
  }

  const [group, invitee, friendship] = await Promise.all([
    getGroupActionContext(groupId),
    prisma.user.findUnique({
      where: { id: inviteeId },
      select: { id: true, username: true },
    }),
    prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: inviterId, addresseeId: inviteeId },
          { requesterId: inviteeId, addresseeId: inviterId },
        ],
      },
      select: { id: true },
    }),
  ]);

  const inviterMembership = group.members.find((member) => member.userId === inviterId);
  if (inviterMembership?.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  if (!invitee) {
    throw new Error("User not found");
  }
  if (!friendship) {
    throw new Error("You can only invite your friends");
  }
  if (group.members.some((member) => member.userId === inviteeId)) {
    throw new Error("User is already a member");
  }

  const existing = await prisma.groupInvitation.findUnique({
    where: {
      groupId_inviteeId: {
        groupId: group.id,
        inviteeId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  let invitationId: string | null = null;
  if (!existing) {
    const created = await prisma.groupInvitation.create({
      data: {
        groupId: group.id,
        inviterId,
        inviteeId,
      },
      select: { id: true },
    });
    invitationId = created.id;
  } else if (existing.status !== "PENDING") {
    const reopened = await prisma.groupInvitation.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        inviterId,
      },
      select: { id: true },
    });
    invitationId = reopened.id;
  }

  if (invitationId) {
    await notifyGroupInviteReceived({
      inviteeId,
      inviterId,
      invitationId,
      groupId: group.id,
      groupSlug: group.slug,
      groupName: group.name,
    });
  }

  revalidateGroupRelatedPaths(group.slug, [
    ...group.members.map((member) => member.user.username),
    invitee.username,
  ]);
}

export async function cancelGroupInvitation(invitationId: string) {
  assertCuid(invitationId, "invitationId");
  const userId = await getAuthUserId();

  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      status: true,
      inviterId: true,
      inviteeId: true,
      group: {
        select: {
          slug: true,
          members: {
            select: {
              userId: true,
              user: { select: { username: true } },
            },
          },
        },
      },
      invitee: {
        select: {
          username: true,
        },
      },
    },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  if (invitation.inviterId !== userId) {
    throw new Error("Only the inviter can cancel");
  }

  if (invitation.status !== "PENDING") {
    revalidateGroupRelatedPaths(invitation.group.slug, [
      ...invitation.group.members.map((member) => member.user.username),
      invitation.invitee.username,
    ]);
    return;
  }

  const result = await prisma.groupInvitation.updateMany({
    where: {
      id: invitation.id,
      inviterId: userId,
      status: "PENDING",
    },
    data: {
      status: "CANCELLED",
    },
  });
  if (result.count === 0) {
    revalidateGroupRelatedPaths(invitation.group.slug, [
      ...invitation.group.members.map((member) => member.user.username),
      invitation.invitee.username,
    ]);
    return;
  }

  await softDeleteGroupInviteReceivedNotification(invitation.inviteeId, invitation.id);

  revalidateGroupRelatedPaths(invitation.group.slug, [
    ...invitation.group.members.map((member) => member.user.username),
    invitation.invitee.username,
  ]);
}

export async function acceptGroupInvitation(invitationId: string) {
  assertCuid(invitationId, "invitationId");
  const userId = await getAuthUserId();

  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      status: true,
      groupId: true,
      inviterId: true,
      inviteeId: true,
      group: {
        select: {
          id: true,
          slug: true,
          name: true,
          members: {
            select: {
              userId: true,
              user: { select: { username: true } },
            },
          },
        },
      },
      invitee: {
        select: {
          username: true,
        },
      },
      inviter: {
        select: {
          username: true,
        },
      },
    },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  if (invitation.inviteeId !== userId) {
    throw new Error("Only invitee can accept");
  }

  if (invitation.status !== "PENDING") {
    revalidateGroupRelatedPaths(invitation.group.slug, [
      ...invitation.group.members.map((member) => member.user.username),
      invitation.invitee.username,
      invitation.inviter.username,
    ]);
    return;
  }

  const accepted = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.groupInvitation.updateMany({
      where: {
        id: invitation.id,
        inviteeId: userId,
        status: "PENDING",
      },
      data: {
        status: "ACCEPTED",
      },
    });
    if (updateResult.count === 0) {
      return false;
    }

    await tx.groupMember.createMany({
      data: [
        {
          userId,
          groupId: invitation.groupId,
          role: "MEMBER",
        },
      ],
      skipDuplicates: true,
    });

    await tx.groupJoinRequest.updateMany({
      where: {
        groupId: invitation.groupId,
        requesterId: userId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        handledById: invitation.inviterId,
      },
    });

    return true;
  });
  if (!accepted) {
    revalidateGroupRelatedPaths(invitation.group.slug, [
      ...invitation.group.members.map((member) => member.user.username),
      invitation.invitee.username,
      invitation.inviter.username,
    ]);
    return;
  }

  await Promise.all([
    notifyGroupInviteAccepted({
      inviterId: invitation.inviterId,
      inviteeId: userId,
      invitationId: invitation.id,
      groupId: invitation.group.id,
      groupSlug: invitation.group.slug,
      groupName: invitation.group.name,
    }),
    notifyGroupMemberJoined({
      recipientIds: invitation.group.members.map((member) => member.userId),
      actorId: userId,
      groupId: invitation.group.id,
      groupSlug: invitation.group.slug,
      groupName: invitation.group.name,
    }),
    softDeleteGroupInviteReceivedNotification(userId, invitation.id),
  ]);

  revalidateGroupRelatedPaths(invitation.group.slug, [
    ...invitation.group.members.map((member) => member.user.username),
    invitation.invitee.username,
    invitation.inviter.username,
  ]);
}

export async function rejectGroupInvitation(invitationId: string) {
  assertCuid(invitationId, "invitationId");
  const userId = await getAuthUserId();

  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      status: true,
      inviteeId: true,
      group: {
        select: {
          slug: true,
          members: {
            select: {
              userId: true,
              user: { select: { username: true } },
            },
          },
        },
      },
      invitee: {
        select: {
          username: true,
        },
      },
    },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  if (invitation.inviteeId !== userId) {
    throw new Error("Only invitee can reject");
  }

  if (invitation.status !== "PENDING") {
    revalidateGroupRelatedPaths(invitation.group.slug, [
      ...invitation.group.members.map((member) => member.user.username),
      invitation.invitee.username,
    ]);
    return;
  }

  const result = await prisma.groupInvitation.updateMany({
    where: {
      id: invitation.id,
      inviteeId: userId,
      status: "PENDING",
    },
    data: {
      status: "REJECTED",
    },
  });
  if (result.count === 0) {
    revalidateGroupRelatedPaths(invitation.group.slug, [
      ...invitation.group.members.map((member) => member.user.username),
      invitation.invitee.username,
    ]);
    return;
  }

  await softDeleteGroupInviteReceivedNotification(userId, invitation.id);

  revalidateGroupRelatedPaths(invitation.group.slug, [
    ...invitation.group.members.map((member) => member.user.username),
    invitation.invitee.username,
  ]);
}

// ── Onboarding ──────────────────────────────────────────

const VALID_VISIBILITIES = ["PUBLIC", "FRIENDS", "PRIVATE"] as const;
const VALID_USER_LANGUAGES = ["EN", "ES"] as const;

type ProfileFormState = {
  errors?: {
    username?: string;
    name?: string;
    bio?: string;
    language?: string;
    visibility?: string;
    general?: string;
  };
  values?: {
    username: string;
    name: string;
    bio: string;
    language: "EN" | "ES";
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  };
} | null;

type SettingsFormState = {
  errors?: {
    language?: string;
    visibility?: string;
    notifications?: string;
    general?: string;
  };
  success?: "languageUpdated" | "visibilityUpdated" | "notificationsUpdated";
} | null;

type ProfileInput = {
  username: string;
  name: string;
  bio: string | null;
  language: "EN" | "ES";
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

type ParsedProfileFormData =
  | {
      errors: NonNullable<ProfileFormState>["errors"];
      values: NonNullable<ProfileFormState>["values"];
    }
  | { data: ProfileInput };

function parseProfileFormData(
  formData: FormData,
  t: ActionMessageTranslator,
): ParsedProfileFormData {
  const rawUsername = formData.get("username");
  const rawName = formData.get("name");
  const rawBio = formData.get("bio");
  const rawLanguage = formData.get("language");
  const rawVisibility = formData.get("visibility");
  const username =
    typeof rawUsername === "string" ? normalizeUsername(rawUsername) : "";
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const bio = typeof rawBio === "string" ? rawBio.trim() : "";
  const language =
    typeof rawLanguage === "string" &&
    VALID_USER_LANGUAGES.includes(rawLanguage as typeof VALID_USER_LANGUAGES[number])
      ? (rawLanguage as "EN" | "ES")
      : "EN";
  const visibility =
    typeof rawVisibility === "string" &&
    VALID_VISIBILITIES.includes(rawVisibility as typeof VALID_VISIBILITIES[number])
      ? (rawVisibility as "PUBLIC" | "FRIENDS" | "PRIVATE")
      : "PUBLIC";
  const values: NonNullable<ProfileFormState>["values"] = {
    username,
    name,
    bio,
    language,
    visibility,
  };

  const errors: NonNullable<ProfileFormState>["errors"] = {};

  if (!USERNAME_RE.test(username)) {
    errors.username = t("profile.invalidUsername");
  }

  if (name.length === 0 || name.length > 50) {
    errors.name = t("profile.nameRequired");
  }

  if (bio !== "" && bio.length > 160) {
    errors.bio = t("profile.bioTooLong");
  }

  if (
    typeof rawLanguage !== "string" ||
    !VALID_USER_LANGUAGES.includes(rawLanguage as typeof VALID_USER_LANGUAGES[number])
  ) {
    errors.language = t("profile.invalidLanguage");
  }

  if (
    typeof rawVisibility !== "string" ||
    !VALID_VISIBILITIES.includes(rawVisibility as typeof VALID_VISIBILITIES[number])
  ) {
    errors.visibility = t("profile.invalidVisibility");
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  return {
    data: {
      username,
      name,
      bio: bio ? bio : null,
      language,
      visibility,
    },
  };
}

export async function completeOnboarding(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const t = await getActionMessagesTranslator(formData);
  const userId = await getAuthUserId({ requireOnboardingCompleted: false });
  const parsed = parseProfileFormData(formData, t);
  if ("errors" in parsed) {
    return { errors: parsed.errors, values: parsed.values };
  }

  const taken = await prisma.user.findFirst({
    where: {
      username: {
        equals: parsed.data.username,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (taken && taken.id !== userId) {
    return {
      errors: { username: t("profile.usernameTaken") },
      values: {
        username: parsed.data.username,
        name: parsed.data.name,
        bio: parsed.data.bio ?? "",
        language: parsed.data.language,
        visibility: parsed.data.visibility,
      },
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: LANGUAGE_COOKIE_NAME,
      value: mapUserLanguageToLocale(parsed.data.language) ?? "en",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch (error) {
    if (isUsernameUniqueConstraintError(error)) {
      return {
        errors: { username: t("profile.usernameTaken") },
        values: {
          username: parsed.data.username,
          name: parsed.data.name,
          bio: parsed.data.bio ?? "",
          language: parsed.data.language,
          visibility: parsed.data.visibility,
        },
      };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  revalidatePath("/onboarding");
  revalidatePath(`/u/${parsed.data.username}`);

  redirect(`/u/${parsed.data.username}`);
}

export async function updateProfileSettings(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const t = await getActionMessagesTranslator(formData);
  const userId = await getAuthUserId();
  const name = formData.get("name");
  const bio = formData.get("bio");
  const errors: NonNullable<ProfileFormState>["errors"] = {};

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 50) {
    errors.name = t("profile.nameRequired");
  }

  if (bio !== null && bio !== "" && (typeof bio !== "string" || bio.length > 160)) {
    errors.bio = t("profile.bioTooLong");
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: (name as string).trim(),
      bio: bio ? (bio as string).trim() : null,
    },
  });

  if (currentUser?.username) {
    revalidatePath(`/u/${currentUser.username}`);
    redirect(`/u/${currentUser.username}`);
  }
  revalidatePath("/profile/edit");

  redirect("/");
}

export async function updateUserSettings(
  section: "language" | "visibility" | "notifications",
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const t = await getActionMessagesTranslator(formData);
  const userId = await getAuthUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!user) {
    return {
      errors: {
        general: t("settings.userNotFound"),
      },
    };
  }

  if (section === "language") {
    const language = formData.get("language");
    if (
      typeof language !== "string" ||
      !VALID_USER_LANGUAGES.includes(language as typeof VALID_USER_LANGUAGES[number])
    ) {
      return {
        errors: {
          language: t("settings.invalidLanguage"),
        },
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        language: language as "EN" | "ES",
      },
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: LANGUAGE_COOKIE_NAME,
      value: mapUserLanguageToLocale(language as "EN" | "ES") ?? "en",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath("/settings");
    return { success: "languageUpdated" };
  }

  if (section === "visibility") {
    const visibility = formData.get("visibility");
    if (
      typeof visibility !== "string" ||
      !VALID_VISIBILITIES.includes(visibility as typeof VALID_VISIBILITIES[number])
    ) {
      return {
        errors: {
          visibility: t("settings.invalidVisibility"),
        },
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        visibility: visibility as "PUBLIC" | "FRIENDS" | "PRIVATE",
      },
    });

    revalidatePath("/settings");
    if (user.username) {
      revalidatePath(`/u/${user.username}`);
    }
    return { success: "visibilityUpdated" };
  }

  if (section === "notifications") {
    const notifyFriendshipEvents = formData.has("notifyFriendshipEvents");
    const notifyGroupEvents = formData.has("notifyGroupEvents");
    const notifySystemEvents = formData.has("notifySystemEvents");

    await prisma.user.update({
      where: { id: userId },
      data: {
        notifyFriendshipEvents,
        notifyGroupEvents,
        notifySystemEvents,
      },
    });

    revalidatePath("/settings");
    return { success: "notificationsUpdated" };
  }

  return {
    errors: {
      general: t("settings.invalidSection"),
    },
  };
}

export async function updateLanguageSettings(
  prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  return updateUserSettings("language", prev, formData);
}

export async function updateVisibilitySettings(
  prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  return updateUserSettings("visibility", prev, formData);
}

export async function updateNotificationSettings(
  prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  return updateUserSettings("notifications", prev, formData);
}

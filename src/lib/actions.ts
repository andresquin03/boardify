"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Input validation ─────────────────────────────────────

const CUID_RE = /^c[a-z0-9]{20,32}$/;
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;
const PROFILE_PATH_SEGMENT_RE = /^[a-z0-9._-]{3,50}$/;
const GAME_ID_RE = /^[a-z0-9][a-z0-9._-]{0,99}$/;

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function isUsernameUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const known = error as { code?: string; meta?: { target?: unknown } };
  if (known.code !== "P2002") return false;

  const target = known.meta?.target;
  if (Array.isArray(target)) {
    return target.some((item) => item === "username");
  }

  if (typeof target === "string") {
    return target.includes("username");
  }

  return false;
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
    await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
      },
    });
  } else if (existing.status === "REJECTED" || existing.status === "UNFRIENDED") {
    await prisma.friendship.update({
      where: { id: existing.id },
      data: {
        requesterId,
        addresseeId,
        status: "PENDING",
      },
    });
  }

  revalidatePath(`/u/${profileUsername}`);
  revalidatePath("/friends");
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
    throw new Error("Request is not pending");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
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
    throw new Error("Request is not pending");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "REJECTED" },
  });

  revalidateFriendshipProfiles(friendship);
}

export async function unfriend(friendshipId: string, profileUsername: string) {
  assertCuid(friendshipId, "friendshipId");
  assertProfilePathSegment(profileUsername, "profileUsername");
  const userId = await getAuthUserId();
  const friendship = await getAuthorizedFriendship(friendshipId, userId);

  if (friendship.status !== "ACCEPTED") {
    throw new Error("Only accepted friendships can be unfriended");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "UNFRIENDED" },
  });

  revalidateFriendshipProfiles(friendship);
}

// ── Onboarding ──────────────────────────────────────────

const VALID_VISIBILITIES = ["PUBLIC", "FRIENDS", "PRIVATE"] as const;

type ProfileFormState = {
  errors?: {
    username?: string;
    name?: string;
    bio?: string;
    visibility?: string;
    general?: string;
  };
  values?: {
    username: string;
    name: string;
    bio: string;
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  };
} | null;

type ProfileInput = {
  username: string;
  name: string;
  bio: string | null;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

type ParsedProfileFormData =
  | {
      errors: NonNullable<ProfileFormState>["errors"];
      values: NonNullable<ProfileFormState>["values"];
    }
  | { data: ProfileInput };

function parseProfileFormData(formData: FormData): ParsedProfileFormData {
  const rawUsername = formData.get("username");
  const rawName = formData.get("name");
  const rawBio = formData.get("bio");
  const rawVisibility = formData.get("visibility");
  const username =
    typeof rawUsername === "string" ? normalizeUsername(rawUsername) : "";
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const bio = typeof rawBio === "string" ? rawBio.trim() : "";
  const visibility =
    typeof rawVisibility === "string" &&
    VALID_VISIBILITIES.includes(rawVisibility as typeof VALID_VISIBILITIES[number])
      ? (rawVisibility as "PUBLIC" | "FRIENDS" | "PRIVATE")
      : "PUBLIC";
  const values: NonNullable<ProfileFormState>["values"] = {
    username,
    name,
    bio,
    visibility,
  };

  const errors: NonNullable<ProfileFormState>["errors"] = {};

  if (!USERNAME_RE.test(username)) {
    errors.username = "Invalid username. Use 3-30 lowercase letters, numbers, dots, underscores or hyphens.";
  }

  if (name.length === 0 || name.length > 50) {
    errors.name = "Display name is required (max 50 characters).";
  }

  if (bio !== "" && bio.length > 160) {
    errors.bio = "Bio must be 160 characters or less.";
  }

  if (
    typeof rawVisibility !== "string" ||
    !VALID_VISIBILITIES.includes(rawVisibility as typeof VALID_VISIBILITIES[number])
  ) {
    errors.visibility = "Invalid visibility option.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  return {
    data: {
      username,
      name,
      bio: bio ? bio : null,
      visibility,
    },
  };
}

export async function completeOnboarding(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getAuthUserId({ requireOnboardingCompleted: false });
  const parsed = parseProfileFormData(formData);
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
      errors: { username: "This username is already taken." },
      values: {
        username: parsed.data.username,
        name: parsed.data.name,
        bio: parsed.data.bio ?? "",
        visibility: parsed.data.visibility,
      },
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
    });
  } catch (error) {
    if (isUsernameUniqueConstraintError(error)) {
      return {
        errors: { username: "This username is already taken." },
        values: {
          username: parsed.data.username,
          name: parsed.data.name,
          bio: parsed.data.bio ?? "",
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
  const userId = await getAuthUserId();
  const name = formData.get("name");
  const bio = formData.get("bio");
  const visibility = formData.get("visibility");
  const errors: NonNullable<ProfileFormState>["errors"] = {};

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 50) {
    errors.name = "Display name is required (max 50 characters).";
  }

  if (bio !== null && bio !== "" && (typeof bio !== "string" || bio.length > 160)) {
    errors.bio = "Bio must be 160 characters or less.";
  }

  if (typeof visibility !== "string" || !VALID_VISIBILITIES.includes(visibility as typeof VALID_VISIBILITIES[number])) {
    errors.visibility = "Invalid visibility option.";
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
      visibility: visibility as "PUBLIC" | "FRIENDS" | "PRIVATE",
    },
  });

  if (currentUser?.username) {
    revalidatePath(`/u/${currentUser.username}`);
    redirect(`/u/${currentUser.username}`);
  }
  revalidatePath("/settings/profile");

  redirect("/");
}

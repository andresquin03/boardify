"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Input validation ─────────────────────────────────────

const CUID_RE = /^c[a-z0-9]{24}$/;

function assertCuid(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !CUID_RE.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

function assertSafeString(value: unknown, label: string, maxLength = 100): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
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

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
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
  assertCuid(gameId, "gameId");
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
  assertCuid(gameId, "gameId");
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
  assertCuid(gameId, "gameId");
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
  assertSafeString(profileUsername, "profileUsername", 50);
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
  } else if (existing.status === "REJECTED") {
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
}

// ── Onboarding ──────────────────────────────────────────

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;
const VALID_VISIBILITIES = ["PUBLIC", "FRIENDS", "PRIVATE"] as const;

type ProfileFormState = {
  errors?: {
    username?: string;
    name?: string;
    bio?: string;
    visibility?: string;
    general?: string;
  };
} | null;

type ProfileInput = {
  username: string;
  name: string;
  bio: string | null;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

type ParsedProfileFormData =
  | { errors: NonNullable<ProfileFormState>["errors"]; data?: never }
  | { errors?: never; data: ProfileInput };

function parseProfileFormData(formData: FormData): ParsedProfileFormData {
  const username = formData.get("username");
  const name = formData.get("name");
  const bio = formData.get("bio");
  const visibility = formData.get("visibility");

  const errors: NonNullable<ProfileFormState>["errors"] = {};

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    errors.username = "Invalid username. Use 3-30 lowercase letters, numbers, dots, underscores or hyphens.";
  }

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

  return {
    data: {
      username: username as string,
      name: (name as string).trim(),
      bio: bio ? (bio as string).trim() : null,
      visibility: visibility as "PUBLIC" | "FRIENDS" | "PRIVATE",
    },
  };
}

export async function completeOnboarding(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getAuthUserId();
  const parsed = parseProfileFormData(formData);
  if ("errors" in parsed) {
    return { errors: parsed.errors };
  }

  const taken = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });

  if (taken && taken.id !== userId) {
    return { errors: { username: "This username is already taken." } };
  }

  await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  redirect("/");
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

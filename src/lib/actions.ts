"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

function getOrCreateUserGame(userId: string, gameId: string) {
  return prisma.userGame.upsert({
    where: { userId_gameId: { userId, gameId } },
    create: { userId, gameId },
    update: {},
  });
}

export async function toggleFavorite(gameId: string) {
  const userId = await getAuthUserId();
  const existing = await getOrCreateUserGame(userId, gameId);

  await prisma.userGame.update({
    where: { id: existing.id },
    data: { isFavorite: !existing.isFavorite },
  });

  revalidatePath("/games");
  revalidatePath("/g", "layout");
}

export async function toggleWishlist(gameId: string) {
  const userId = await getAuthUserId();
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
  const userId = await getAuthUserId();
  const existing = await getOrCreateUserGame(userId, gameId);

  const newOwned = !existing.isOwned;
  await prisma.userGame.update({
    where: { id: existing.id },
    data: {
      isOwned: newOwned,
      // If marking as owned, remove from wishlist
      ...(newOwned && { isWishlist: false }),
    },
  });

  revalidatePath("/games");
  revalidatePath("/g", "layout");
}

export async function sendFriendRequest(addresseeId: string, profileUsername: string) {
  const requesterId = await getAuthUserId();

  if (requesterId === addresseeId) {
    return;
  }

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

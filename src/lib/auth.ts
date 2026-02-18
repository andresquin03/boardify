import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function usernameBaseFromEmail(email: string) {
  const localPart = email.toLowerCase().split("@")[0] ?? "";
  const cleaned = localPart.replace(/[^a-z0-9._-]+/g, "");
  return cleaned || "user";
}

async function getUniqueUsername(base: string, excludeUserId: string) {
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing || existing.id === excludeUserId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.id || !user.email) return true;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true },
      });

      if (!dbUser || dbUser.username) return true;

      const base = usernameBaseFromEmail(user.email);
      const uniqueUsername = await getUniqueUsername(base, user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { username: uniqueUsername },
      });

      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

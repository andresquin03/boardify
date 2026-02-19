import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";
const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

const sessionCookieName = isProd
  ? "__Secure-authjs.session-token.v2"
  : "authjs.session-token.v2";

async function getUserSessionProfile(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!dbUser) return null;

  return {
    username: dbUser.username,
    onboardingCompleted: Boolean(dbUser.username),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.sub) return session;
      session.user.id = token.sub;
      try {
        const profile = await getUserSessionProfile(token.sub);
        session.user.username = profile?.username ?? undefined;
        session.user.onboardingCompleted = profile?.onboardingCompleted ?? false;
      } catch {
        session.user.username = undefined;
        session.user.onboardingCompleted = false;
      }
      return session;
    },
  },
});

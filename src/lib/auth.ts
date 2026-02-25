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
    select: { username: true, language: true },
  });

  if (!dbUser) return null;

  return {
    username: dbUser.username,
    language: dbUser.language,
    onboardingCompleted: Boolean(dbUser.username),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
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
    async signIn({ account }) {
      // Auth.js with JWT strategy doesn't update the Account in DB on re-auth.
      // Only persist tokens when this is a calendar re-auth (scope includes calendar.events),
      // so regular sign-ins don't downgrade previously granted calendar permissions.
      if (account?.provider === "google" && account.scope?.includes("calendar.events")) {
        await prisma.account.updateMany({
          where: { providerAccountId: account.providerAccountId, provider: "google" },
          data: {
            access_token: account.access_token,
            expires_at: account.expires_at,
            scope: account.scope,
            ...(account.refresh_token ? { refresh_token: account.refresh_token } : {}),
            ...(account.id_token ? { id_token: account.id_token } : {}),
          },
        });
      }
      return true;
    },
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
        session.user.language = profile?.language ?? null;
        session.user.onboardingCompleted = profile?.onboardingCompleted ?? false;
      } catch {
        session.user.username = undefined;
        session.user.language = null;
        session.user.onboardingCompleted = false;
      }
      return session;
    },
  },
});

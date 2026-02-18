import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      onboardingCompleted?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

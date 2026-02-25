import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const limiters = {
  /** 3 creaciones por minuto por usuario (createGroup, createGroupEvent) */
  creation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    prefix: "rl:creation",
  }),
  /** 10 acciones sociales por minuto por usuario (friend requests, invitaciones, join requests) */
  social: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "1 m"),
    prefix: "rl:social",
  }),
  /** 20 mutaciones por minuto por usuario (updateGroup, updateGroupEvent) */
  mutation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(12, "1 m"),
    prefix: "rl:mutation",
  }),
};

/** Retorna true si el usuario excedió el límite para ese limiter */
export async function isRateLimited(limiter: Ratelimit, userId: string): Promise<boolean> {
  const { success } = await limiter.limit(userId);
  return !success;
}

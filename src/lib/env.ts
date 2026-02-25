/**
 * Validación de variables de entorno al arranque del servidor.
 * Si alguna var crítica falta, el proceso falla inmediatamente con un mensaje claro.
 */

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  AUTH_SECRET: requireEnv("AUTH_SECRET"),
  AUTH_GOOGLE_ID: requireEnv("AUTH_GOOGLE_ID"),
  AUTH_GOOGLE_SECRET: requireEnv("AUTH_GOOGLE_SECRET"),
  UPSTASH_REDIS_REST_URL: requireEnv("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

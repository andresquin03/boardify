export function getSafeRedirectPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;

  const input = value.trim();
  if (!input) return fallback;
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;

  try {
    const url = new URL(input, "https://boardify.local");
    if (url.origin !== "https://boardify.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

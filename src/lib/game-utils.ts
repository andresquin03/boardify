export function formatPlayerCount(min: number, max: number) {
  return min === max ? `${min}` : `${min}-${max}`;
}

export function formatPlaytime(min: number, max: number) {
  return min === max ? `${min} min` : `${min}-${max} min`;
}

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

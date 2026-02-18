export const PLAYER_FILTERS = [
  { value: "2", label: "2 players" },
  { value: "3-4", label: "3-4 players" },
  { value: "5+", label: "5+ players" },
] as const;

export type PlayerFilterValue = (typeof PLAYER_FILTERS)[number]["value"];

export function isPlayerFilterValue(value: string): value is PlayerFilterValue {
  return PLAYER_FILTERS.some((filter) => filter.value === value);
}

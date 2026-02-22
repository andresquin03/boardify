export const PLAYER_FILTERS = [
  "2",
  "3-4",
  "5+",
] as const;

export type PlayerFilterValue = (typeof PLAYER_FILTERS)[number];

export function isPlayerFilterValue(value: string): value is PlayerFilterValue {
  return PLAYER_FILTERS.some((filter) => filter === value);
}

export const DIFFICULTY_FILTERS = [
  "easy",
  "medium",
  "hard",
] as const;

export type DifficultyFilterValue = (typeof DIFFICULTY_FILTERS)[number];

export function isDifficultyFilterValue(value: string): value is DifficultyFilterValue {
  return DIFFICULTY_FILTERS.some((filter) => filter === value);
}

export const SORT_OPTIONS = [
  "abc",
  "difficulty",
  "rating",
] as const;

export type GameSortValue = (typeof SORT_OPTIONS)[number];

export function isGameSortValue(value: string): value is GameSortValue {
  return SORT_OPTIONS.some((option) => option === value);
}

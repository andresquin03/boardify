export const PLAYER_FILTERS = [
  { value: "2", label: "2 players" },
  { value: "3-4", label: "3-4 players" },
  { value: "5+", label: "5+ players" },
] as const;

export type PlayerFilterValue = (typeof PLAYER_FILTERS)[number]["value"];

export function isPlayerFilterValue(value: string): value is PlayerFilterValue {
  return PLAYER_FILTERS.some((filter) => filter.value === value);
}

export const DIFFICULTY_FILTERS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export type DifficultyFilterValue = (typeof DIFFICULTY_FILTERS)[number]["value"];

export function isDifficultyFilterValue(value: string): value is DifficultyFilterValue {
  return DIFFICULTY_FILTERS.some((filter) => filter.value === value);
}

export const SORT_OPTIONS = [
  { value: "abc", label: "A-Z" },
  { value: "difficulty", label: "Difficulty" },
  { value: "rating", label: "Rating" },
] as const;

export type GameSortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isGameSortValue(value: string): value is GameSortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

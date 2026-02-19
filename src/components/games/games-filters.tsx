"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DIFFICULTY_FILTERS,
  PLAYER_FILTERS,
  SORT_OPTIONS,
  isDifficultyFilterValue,
  isGameSortValue,
  type DifficultyFilterValue,
  type GameSortValue,
  type PlayerFilterValue,
} from "@/lib/game-filters";

interface GamesFiltersProps {
  initialQuery: string;
  selectedPlayers: PlayerFilterValue[];
  selectedCategories: string[];
  selectedDifficulty: DifficultyFilterValue | "";
  selectedSort: GameSortValue;
  categoryOptions: string[];
}

export function GamesFilters({
  initialQuery,
  selectedPlayers,
  selectedCategories,
  selectedDifficulty,
  selectedSort,
  categoryOptions,
}: GamesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentQuery = searchParams.get("q") ?? "";
      if (query === currentQuery) return;

      const nextParams = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        nextParams.set("q", query.trim());
      } else {
        nextParams.delete("q");
      }

      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname, query, router, searchParams]);

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(query.trim()) ||
      selectedPlayers.length > 0 ||
      selectedCategories.length > 0 ||
      Boolean(selectedDifficulty) ||
      selectedSort !== "abc"
    );
  }, [
    query,
    selectedPlayers.length,
    selectedCategories.length,
    selectedDifficulty,
    selectedSort,
  ]);

  function replaceMultiParam(key: "players" | "categories", values: string[]) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(key);
    for (const value of values) {
      nextParams.append(key, value);
    }

    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function replaceSingleParam(key: "difficulty" | "sort", value: string | null) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function togglePlayer(value: PlayerFilterValue) {
    const nextPlayers = selectedPlayers.includes(value)
      ? selectedPlayers.filter((item) => item !== value)
      : [...selectedPlayers, value];
    replaceMultiParam("players", nextPlayers);
  }

  function toggleCategory(value: string) {
    const nextCategories = selectedCategories.includes(value)
      ? selectedCategories.filter((item) => item !== value)
      : [...selectedCategories, value];
    replaceMultiParam("categories", nextCategories);
  }

  function changeDifficulty(value: string) {
    if (value === "all") {
      replaceSingleParam("difficulty", null);
      return;
    }

    if (isDifficultyFilterValue(value)) {
      replaceSingleParam("difficulty", value);
    }
  }

  function changeSort(value: string) {
    if (!isGameSortValue(value)) return;
    replaceSingleParam("sort", value === "abc" ? null : value);
  }

  function clearAllFilters() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mt-6 flex flex-col gap-3 2xl:flex-row 2xl:items-center">
      <div className="relative w-full 2xl:min-w-[560px] 2xl:flex-[1.6]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or category..."
          className="pl-9"
        />
      </div>

      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:w-auto 2xl:grid-cols-none 2xl:auto-cols-auto 2xl:grid-flow-col 2xl:items-center">
        <Select
          value={selectedDifficulty || "all"}
          onValueChange={changeDifficulty}
        >
          <SelectTrigger className="w-full justify-between 2xl:w-[160px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All difficulties</SelectItem>
            {DIFFICULTY_FILTERS.map((difficulty) => (
              <SelectItem key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2 2xl:w-[180px]">
              <span>Players</span>
              {selectedPlayers.length > 0 ? <span className="text-xs text-muted-foreground">{selectedPlayers.length}</span> : <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Player count</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PLAYER_FILTERS.map((filter) => (
              <DropdownMenuCheckboxItem
                key={filter.value}
                checked={selectedPlayers.includes(filter.value)}
                onCheckedChange={() => togglePlayer(filter.value)}
                onSelect={(event) => event.preventDefault()}
              >
                {filter.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2 2xl:w-[200px]">
              <span>Categories</span>
              {selectedCategories.length > 0 ? <span className="text-xs text-muted-foreground">{selectedCategories.length}</span> : <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 w-64">
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categoryOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories</div>
            ) : (
              categoryOptions.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={selectedSort} onValueChange={changeSort}>
          <SelectTrigger className="w-full justify-between 2xl:w-[170px]">
            <span className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </span>
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className="w-full text-muted-foreground disabled:text-muted-foreground/40 2xl:w-auto 2xl:justify-self-auto"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

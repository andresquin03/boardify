"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
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
import { PLAYER_FILTERS, type PlayerFilterValue } from "@/lib/game-filters";

interface GamesFiltersProps {
  initialQuery: string;
  selectedPlayers: PlayerFilterValue[];
  selectedCategories: string[];
  categoryOptions: string[];
}

export function GamesFilters({
  initialQuery,
  selectedPlayers,
  selectedCategories,
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
    return Boolean(query.trim()) || selectedPlayers.length > 0 || selectedCategories.length > 0;
  }, [query, selectedPlayers.length, selectedCategories.length]);

  function replaceMultiParam(key: "players" | "categories", values: string[]) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(key);
    for (const value of values) {
      nextParams.append(key, value);
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

  function clearAllFilters() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or category..."
          className="pl-9"
        />
      </div>

      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2 sm:w-[180px]">
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
            <Button variant="outline" className="w-full justify-between gap-2 sm:w-[200px]">
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

        <Button
          variant="ghost"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className="w-full text-muted-foreground disabled:text-muted-foreground/40 sm:w-auto"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

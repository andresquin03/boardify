"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const toggleThemeLabel = t("toggleTheme");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="group relative cursor-pointer overflow-hidden rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-sky-500/20"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={toggleThemeLabel}
      title={toggleThemeLabel}
    >
      <Sun
        className="absolute h-4 w-4 text-amber-500 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100 dark:opacity-100 dark:group-hover:rotate-12 dark:group-hover:scale-110 dark:group-hover:text-amber-400 rotate-45 scale-50 opacity-0"
      />
      <Moon
        className="absolute h-4 w-4 fill-transparent text-slate-700 transition-all duration-300 ease-out group-hover:-rotate-12 group-hover:scale-110 group-hover:fill-slate-900 group-hover:text-slate-900 dark:rotate-45 dark:scale-50 dark:opacity-0 dark:text-slate-300 rotate-0 scale-100 opacity-100"
      />
      <span className="sr-only">{toggleThemeLabel}</span>
    </Button>
  );
}

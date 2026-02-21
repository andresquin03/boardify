"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

export function NotificationBell({
  href,
  initialUnreadCount,
  ariaLabel,
}: {
  href: string;
  initialUnreadCount: number;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const abortRef = useRef<AbortController | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/notifications/unread-count", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUnreadCount(0);
        }
        return;
      }

      const data: unknown = await response.json();
      const nextCount =
        typeof data === "object" && data !== null && "unreadCount" in data
          ? (data as { unreadCount?: unknown }).unreadCount
          : undefined;

      if (typeof nextCount === "number" && Number.isFinite(nextCount)) {
        setUnreadCount(Math.max(0, Math.floor(nextCount)));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }, []);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [pathname, refreshUnreadCount]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [refreshUnreadCount]);

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="group pressable relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-foreground active:translate-y-0 active:scale-95 active:bg-amber-500/20 active:text-amber-400"
    >
      <Bell
        className={`h-4.5 w-4.5 transition-all duration-400 ease-out group-hover:-rotate-12 group-hover:scale-110 group-active:scale-95 group-active:text-amber-400 ${
          unreadCount > 0 ? "text-foreground" : ""
        }`}
      />
      {unreadCount > 0 && (
        <>
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 h-5 w-5 translate-x-1/4 -translate-y-1/4 rounded-full bg-red-300/45 motion-safe:animate-ping dark:bg-red-500/35" />
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full border-2 border-[var(--navbar-background)] bg-red-400 px-1.5 text-[10px] font-semibold leading-none tabular-nums text-black/80 shadow-[0_3px_10px_rgba(248,113,113,0.45)] ring-1 ring-black/5 dark:bg-red-500 dark:text-white dark:ring-white/10">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </>
      )}
    </Link>
  );
}

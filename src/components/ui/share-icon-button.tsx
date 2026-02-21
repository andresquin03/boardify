"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "error";

function buildAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "absolute";
  fallback.style.left = "-9999px";
  document.body.appendChild(fallback);
  fallback.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(fallback);

  if (!copied) throw new Error("Clipboard copy failed");
}

export function ShareIconButton({
  path,
  message,
  tooltipLabel = "Share",
  ariaLabel = "Share",
  size = "sm",
  appearance = "icon",
  label = "Share",
  className,
}: {
  path: string;
  message?: string;
  tooltipLabel?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
  appearance?: "icon" | "button";
  label?: string;
  className?: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [isAnimating, setIsAnimating] = useState(false);

  const absoluteUrl = useMemo(() => buildAbsoluteUrl(path), [path]);
  const shareText = useMemo(() => {
    if (!message) return absoluteUrl;
    return `${message} ${absoluteUrl}`;
  }, [absoluteUrl, message]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timeoutId = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const onShareClick = async () => {
    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), 380);

    try {
      await copyText(shareText);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const tooltipText = copyState === "copied"
    ? "Copied!"
    : copyState === "error"
      ? "Copy failed"
      : tooltipLabel;
  const isCopied = copyState === "copied";
  const isError = copyState === "error";
  const isMedium = size === "md";
  const isButton = appearance === "button";
  const noticeText = isCopied ? "Copied to clipboard" : "Could not copy";

  return (
    <div className="relative inline-flex">
      {(isCopied || isError) && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
            isError
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-400/30 bg-emerald-500/15 text-emerald-500 dark:text-emerald-300",
          )}
        >
          {noticeText}
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onShareClick}
            className={cn(
              "group relative isolate inline-flex cursor-pointer items-center justify-center overflow-hidden border",
              isButton
                ? "h-10 gap-2 rounded-xl px-3.5 text-sm font-medium"
                : isMedium
                  ? "rounded-lg p-2.5"
                  : "size-8 rounded-md p-2",
              "transition-all duration-[260ms] motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
              "active:scale-95",
              isError
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : isCopied
                  ? "scale-105 border-emerald-300/60 bg-emerald-500/20 text-emerald-500 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_22px_rgba(16,185,129,0.35)]"
                  : "border-emerald-400/40 bg-emerald-500/10 text-emerald-500 hover:-translate-y-0.5 hover:bg-emerald-500/20 hover:text-emerald-500 hover:shadow-[0_4px_12px_-4px_rgba(16,185,129,0.7)]",
              isAnimating && "toggle-press scale-105 shadow-lg",
              className,
            )}
            aria-label={ariaLabel}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 opacity-0",
                isButton ? "rounded-xl" : isMedium ? "rounded-lg" : "rounded-md",
                isAnimating && "toggle-glow",
                isError ? "bg-destructive/35" : "bg-emerald-500/35",
              )}
            />
            {copyState === "copied" ? (
              <Check
                className={cn(
                  "relative z-10 text-emerald-500 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6",
                  isButton ? "h-4 w-4" : isMedium ? "h-6 w-6" : "h-4 w-4",
                  isAnimating && "toggle-bump",
                )}
              />
            ) : (
              <Share2
                className={cn(
                  "relative z-10 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6",
                  isButton ? "h-4 w-4" : isMedium ? "h-6 w-6" : "h-4 w-4",
                  isAnimating && "toggle-bump",
                )}
              />
            )}
            {isButton && <span className="relative z-10">{isCopied ? "Copied" : label}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
    </div>
  );
}

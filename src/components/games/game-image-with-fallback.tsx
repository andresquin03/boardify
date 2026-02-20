"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Keep this list in sync with `next.config.ts` (`images.remotePatterns` + CSP).
// TODO: centralize this allowlist in a shared config module.
const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "upload.wikimedia.org",
  "cdn.svc.asmodee.net",
  "allsystemsgo.games",
  "cdn.prod.website-files.com",
  "gamewright.com",
  "www.explodingkittens.com",
  "acdn-us.mitiendanube.com",
  "f.fcdn.app",
]);

type BaseProps = {
  src?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  fallbackClassName?: string;
  diceClassName?: string;
  priority?: boolean;
};

type FillImageProps = BaseProps & {
  fill: true;
};

type FixedImageProps = BaseProps & {
  fill?: false;
  width: number;
  height: number;
};

type GameImageWithFallbackProps = FillImageProps | FixedImageProps;

export function GameImageWithFallback(props: GameImageWithFallbackProps) {
  const { src, alt, sizes, className, fallbackClassName, diceClassName, priority } = props;
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!src || hasLoadError || !isSafeImageSrc(src)) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center", fallbackClassName)}>
        <DiceIcon className={cn("h-10 w-10 text-muted-foreground/45", diceClassName)} />
      </div>
    );
  }

  if (props.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onError={() => setHasLoadError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={props.width}
      height={props.height}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setHasLoadError(true)}
    />
  );
}

function isSafeImageSrc(src: string) {
  if (src.startsWith("/")) return true;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") {
    return false;
  }

  return ALLOWED_REMOTE_IMAGE_HOSTS.has(url.hostname);
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="0.5" fill="currentColor" />
      <circle cx="15" cy="9" r="0.5" fill="currentColor" />
      <circle cx="9" cy="15" r="0.5" fill="currentColor" />
      <circle cx="15" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}

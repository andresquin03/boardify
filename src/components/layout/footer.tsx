import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-[var(--navbar-background)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:text-sm">
        <p className="whitespace-nowrap">© {year} Boardify</p>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/about"
            className="pressable font-medium transition-colors hover:text-foreground"
          >
            {t("about")}
          </Link>
          <Link
            href="/contact"
            className="pressable font-medium transition-colors hover:text-foreground"
          >
            {t("contact")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

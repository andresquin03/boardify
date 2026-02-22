import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGameCard } from "@/components/profile/profile-game-card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Bookmark, CircleCheckBig, Check, UsersRound, Network } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MatchStats = {
  shared: number;
  union: number;
  percent: number;
};

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

type CollectionKind = "favorite" | "wishlist" | "owned";
type CollectionFlag = "isFavorite" | "isWishlist" | "isOwned";
type CollectionRow = { gameId: string } & Record<CollectionFlag, boolean>;
type CollectionSetMap = Record<CollectionKind, Set<string>>;
type CollectionMatchMap = Record<CollectionKind, MatchStats>;
type ProfileGame = {
  id: string;
  slug: string;
  title: string;
  minPlayers: number;
  maxPlayers: number;
  minPlaytime: number;
  maxPlaytime: number;
  image?: string | null;
};

const COLLECTION_CONFIG = {
  favorite: { flag: "isFavorite" },
  wishlist: { flag: "isWishlist" },
  owned: { flag: "isOwned" },
} as const satisfies Record<CollectionKind, { flag: CollectionFlag }>;

const COLLECTION_KINDS = Object.keys(COLLECTION_CONFIG) as CollectionKind[];

function computeMatchStats(a: Set<string>, b: Set<string>): MatchStats {
  let intersectionSize = 0;
  for (const gameId of a) {
    if (b.has(gameId)) intersectionSize += 1;
  }
  const unionSize = new Set([...a, ...b]).size;
  const percent = unionSize > 0 ? Math.round((intersectionSize / unionSize) * 100) : 0;
  return { shared: intersectionSize, union: unionSize, percent };
}

function createFlagPredicate(flag: CollectionFlag) {
  return <TRow extends Record<CollectionFlag, boolean>>(row: TRow) => row[flag];
}

function createIdSetFactory<TRow extends { gameId: string }>(rows: TRow[]) {
  return (predicate: (row: TRow) => boolean) =>
    new Set(rows.filter(predicate).map((row) => row.gameId));
}

function createGameListFactory<TRow extends { game: unknown }>(rows: TRow[]) {
  return (predicate: (row: TRow) => boolean) => rows.filter(predicate).map((row) => row.game);
}

function buildCollectionSets<TRow extends CollectionRow>(
  rows: TRow[],
): { byKind: CollectionSetMap; any: Set<string> } {
  const buildSet = createIdSetFactory(rows);
  const byKind = COLLECTION_KINDS.reduce((acc, kind) => {
    acc[kind] = buildSet(createFlagPredicate(COLLECTION_CONFIG[kind].flag));
    return acc;
  }, {} as CollectionSetMap);

  const any = buildSet((row) =>
    COLLECTION_KINDS.some((kind) => row[COLLECTION_CONFIG[kind].flag]),
  );

  return { byKind, any };
}

function buildCollectionGames<TRow extends CollectionRow & { game: unknown }>(
  rows: TRow[],
): Record<CollectionKind, TRow["game"][]> {
  const buildGames = createGameListFactory(rows);
  return COLLECTION_KINDS.reduce((acc, kind) => {
    acc[kind] = buildGames(createFlagPredicate(COLLECTION_CONFIG[kind].flag));
    return acc;
  }, {} as Record<CollectionKind, TRow["game"][]>);
}

function buildCollectionMatchMap(
  profileSets: CollectionSetMap,
  viewerSets: CollectionSetMap,
): CollectionMatchMap {
  return COLLECTION_KINDS.reduce((acc, kind) => {
    acc[kind] = computeMatchStats(profileSets[kind], viewerSets[kind]);
    return acc;
  }, {} as CollectionMatchMap);
}

async function findUserByUsernameWithRetry(username: string) {
  const attempts = 4;
  const delay = 100;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        visibility: true,
      },
    });

    if (user) return user;
    if (attempt < attempts - 1) await sleep(delay);
  }

  return null;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const t = await getTranslations("UserProfilePage");
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const user = await findUserByUsernameWithRetry(username);

  if (!user) notFound();

  const isOwner = viewerId === user.id;
  const visibility = user.visibility ?? "PUBLIC";
  const relation = viewerId && !isOwner
    ? await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: viewerId, addresseeId: user.id },
            { requesterId: user.id, addresseeId: viewerId },
          ],
        },
        select: { id: true, status: true, requesterId: true, addresseeId: true },
      })
    : null;
  const isFriend = relation?.status === "ACCEPTED";
  const hasPendingRequest = relation?.status === "PENDING";

  const canAccessPage = isOwner || visibility !== "PRIVATE" || isFriend;
  const canViewCollections =
    isOwner ||
    visibility === "PUBLIC" ||
    (isFriend && (visibility === "FRIENDS" || visibility === "PRIVATE"));

  if (!canAccessPage) {
    notFound();
  }

  const userGames = canViewCollections
    ? await prisma.userGame.findMany({
        where: { userId: user.id },
        include: { game: true },
      })
    : [];
  const viewerGames = viewerId && !isOwner && canViewCollections
    ? await prisma.userGame.findMany({
        where: { userId: viewerId },
        select: {
          gameId: true,
          isFavorite: true,
          isWishlist: true,
          isOwned: true,
        },
      })
    : [];

  const [friendCount, groupCount] = await Promise.all([
    prisma.friendship.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
    }),
    prisma.groupMember.count({
      where: { userId: user.id },
    }),
  ]);

  const gamesByCollection = buildCollectionGames(userGames);
  const favoriteGames = gamesByCollection.favorite;
  const wishlistGames = gamesByCollection.wishlist;
  const ownedGames = gamesByCollection.owned;

  const profileCollections = buildCollectionSets(userGames);
  const viewerCollections = buildCollectionSets(viewerGames);
  const sharedFavoriteIds = viewerCollections.byKind.favorite;
  const sharedWishlistIds = viewerCollections.byKind.wishlist;
  const sharedOwnedIds = viewerCollections.byKind.owned;

  const matchMap = buildCollectionMatchMap(profileCollections.byKind, viewerCollections.byKind);
  const favoriteMatchStats = matchMap.favorite;
  const wishlistMatchStats = matchMap.wishlist;
  const ownedMatchStats = matchMap.owned;
  const generalMatchStats = computeMatchStats(profileCollections.any, viewerCollections.any);
  const showCategoryMatch = Boolean(!isOwner && viewerId);
  const generalMatchPercent = generalMatchStats.percent;
  const hasCompatibilityData = viewerCollections.any.size > 0;
  const viewerHasNoCollectionData = viewerCollections.any.size === 0;
  const friendsListHref = isOwner ? "/friends" : isFriend ? `/u/${username}/friends` : undefined;
  const groupsListHref = isOwner || isFriend ? `/u/${username}/groups` : undefined;
  const relationState = isFriend
    ? "FRIEND"
    : hasPendingRequest && relation?.addresseeId === viewerId
      ? "PENDING_RECEIVED"
      : hasPendingRequest
        ? "PENDING_SENT"
        : "NONE" as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section
        className={cn(
          "grid gap-5",
          canViewCollections && "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch",
        )}
      >
        <div className="h-full">
          <ProfileHeader
            user={{
              id: user.id,
              name: user.name,
              username: user.username ?? username,
              bio: canViewCollections ? user.bio : null,
              image: user.image,
              visibility: user.visibility ?? "PUBLIC",
            }}
            profilePathUsername={username}
            isOwner={isOwner}
            relationState={relationState}
            friendshipId={relation?.id}
            canSendRequest={Boolean(viewerId) && !hasPendingRequest && !isFriend}
            generalMatchPercent={
              showCategoryMatch && hasCompatibilityData ? generalMatchPercent : undefined
            }
            generalMatchUnavailable={showCategoryMatch && !hasCompatibilityData}
          />
        </div>

        {canViewCollections && (
          <div className="w-full lg:w-auto">
            <div className="flex h-full min-h-full flex-col rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="rounded-xl border bg-card/70 p-3 shadow-sm">
                  <p className="text-center text-xs font-medium text-muted-foreground sm:text-left">{t("stats.games")}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 justify-items-center sm:justify-items-start">
                    <StatCard
                      icon={Heart}
                      value={favoriteGames.length}
                      tone="text-rose-500"
                      href="#favorites-section"
                      accent="rose"
                      ariaLabel={t("stats.cards.favoritesAria")}
                    />
                    <StatCard
                      icon={Bookmark}
                      value={wishlistGames.length}
                      tone="text-sky-500"
                      href="#wishlist-section"
                      accent="sky"
                      ariaLabel={t("stats.cards.wishlistAria")}
                    />
                    <StatCard
                      icon={Check}
                      value={ownedGames.length}
                      tone="h-3.5 w-3.5 text-white stroke-[3]"
                      iconWrapClassName="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-emerald-500"
                      filledIcon={false}
                      href="#owned-section"
                      accent="emerald"
                      ariaLabel={t("stats.cards.ownedAria")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="rounded-xl border bg-card/70 p-3 shadow-sm">
                    <p className="text-center text-xs font-medium text-muted-foreground sm:text-left">{t("stats.friends")}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 justify-items-center sm:justify-items-start">
                      <StatCard
                        icon={UsersRound}
                        value={friendCount}
                        tone="text-violet-500"
                        href={friendsListHref}
                        ariaLabel={t("stats.cards.friendsAria")}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card/70 p-3 shadow-sm">
                    <p className="text-center text-xs font-medium text-muted-foreground sm:text-left">{t("stats.groups")}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 justify-items-center sm:justify-items-start">
                      <StatCard
                        icon={Network}
                        value={groupCount}
                        tone="text-sky-500"
                        href={groupsListHref}
                        accent="sky"
                        ariaLabel={t("stats.cards.groupsAria")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {!canViewCollections && visibility === "FRIENDS" && !isOwner && (
        <section className="mt-8 rounded-xl border bg-card/70 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("friendsOnlyNotice")}
          </p>
        </section>
      )}

      {canViewCollections && (
        <>
          <CollectionSection
            sectionId="favorites-section"
            kind="favorite"
            t={t}
            title={t("collections.favorite.title")}
            icon={Heart}
            count={favoriteGames.length}
            emptyText={t("collections.favorite.empty")}
            games={favoriteGames}
            isOwner={isOwner}
            iconTone="text-rose-500"
            sharedType="favorite"
            sharedGameIds={!isOwner ? sharedFavoriteIds : undefined}
            matchStats={showCategoryMatch ? favoriteMatchStats : undefined}
            forceMatchUnavailable={showCategoryMatch && viewerHasNoCollectionData}
          />

          <CollectionSection
            sectionId="wishlist-section"
            kind="wishlist"
            t={t}
            title={t("collections.wishlist.title")}
            icon={Bookmark}
            count={wishlistGames.length}
            emptyText={t("collections.wishlist.empty")}
            games={wishlistGames}
            isOwner={isOwner}
            iconTone="text-sky-500"
            sharedType="wishlist"
            sharedGameIds={!isOwner ? sharedWishlistIds : undefined}
            matchStats={showCategoryMatch ? wishlistMatchStats : undefined}
            forceMatchUnavailable={showCategoryMatch && viewerHasNoCollectionData}
          />

          <CollectionSection
            sectionId="owned-section"
            kind="owned"
            t={t}
            title={t("collections.owned.title")}
            icon={CircleCheckBig}
            count={ownedGames.length}
            emptyText={t("collections.owned.empty")}
            games={ownedGames}
            isOwner={isOwner}
            iconTone="text-emerald-500"
            sharedType="owned"
            sharedGameIds={!isOwner ? sharedOwnedIds : undefined}
            matchStats={showCategoryMatch ? ownedMatchStats : undefined}
            forceMatchUnavailable={showCategoryMatch && viewerHasNoCollectionData}
          />
        </>
      )}
    </div>
  );
}

const accentStyles = {
  rose: {
    card: "border-rose-400/25 group-hover:-translate-y-0.5 group-hover:border-rose-400/55 group-hover:bg-rose-500/[0.06] group-hover:shadow-[0_4px_12px_-4px_rgba(244,63,94,0.7)] group-active:translate-y-0 group-active:scale-[0.98] group-active:border-rose-400/70 group-active:bg-rose-500/[0.1]",
    chip: "group-hover:scale-105 group-hover:bg-rose-500/10 group-active:scale-95 group-active:bg-rose-500/15",
    link: "group block cursor-pointer rounded-xl transition-all duration-200 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  },
  violet: {
    card: "border-violet-400/25 group-hover:-translate-y-0.5 group-hover:border-violet-400/55 group-hover:bg-violet-500/[0.06] group-hover:shadow-[0_4px_12px_-4px_rgba(139,92,246,0.7)] group-active:translate-y-0 group-active:scale-[0.98] group-active:border-violet-400/70 group-active:bg-violet-500/[0.1]",
    chip: "group-hover:scale-105 group-hover:bg-violet-500/10 group-active:scale-95 group-active:bg-violet-500/15",
    link: "group block cursor-pointer rounded-xl transition-all duration-200 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  },
  sky: {
    card: "border-sky-400/25 group-hover:-translate-y-0.5 group-hover:border-sky-400/55 group-hover:bg-sky-500/[0.06] group-hover:shadow-[0_4px_12px_-4px_rgba(56,189,248,0.7)] group-active:translate-y-0 group-active:scale-[0.98] group-active:border-sky-400/70 group-active:bg-sky-500/[0.1]",
    chip: "group-hover:scale-105 group-hover:bg-sky-500/10 group-active:scale-95 group-active:bg-sky-500/15",
    link: "group block cursor-pointer rounded-xl transition-all duration-200 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  },
  emerald: {
    card: "border-emerald-400/25 group-hover:-translate-y-0.5 group-hover:border-emerald-400/55 group-hover:bg-emerald-500/[0.06] group-hover:shadow-[0_4px_12px_-4px_rgba(16,185,129,0.7)] group-active:translate-y-0 group-active:scale-[0.98] group-active:border-emerald-400/70 group-active:bg-emerald-500/[0.1]",
    chip: "group-hover:scale-105 group-hover:bg-emerald-500/10 group-active:scale-95 group-active:bg-emerald-500/15",
    link: "group block cursor-pointer rounded-xl transition-all duration-200 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  },
} as const;

function StatCard({
  icon: Icon,
  value,
  tone,
  chipClassName,
  iconWrapClassName,
  filledIcon = true,
  href,
  ariaLabel,
  accent = "violet",
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  tone: string;
  chipClassName?: string;
  iconWrapClassName?: string;
  filledIcon?: boolean;
  href?: string;
  ariaLabel?: string;
  accent?: keyof typeof accentStyles;
}) {
  const isInteractive = Boolean(href);
  const colors = accentStyles[accent];

  const content = (
    <Card
      className={cn(
        "h-20 w-20 rounded-xl border shadow-sm transition-all duration-200 sm:h-24 sm:w-24",
        isInteractive && colors.card,
      )}
    >
      <CardContent className="flex h-full flex-col items-center justify-center p-2 text-center">
        <div
          className={cn(
            "rounded-full bg-muted p-2 transition-all duration-200",
            chipClassName,
            isInteractive && colors.chip,
          )}
        >
          {iconWrapClassName ? (
            <span className={iconWrapClassName}>
              <Icon className={tone} {...(filledIcon ? { fill: "currentColor" } : {})} />
            </span>
          ) : (
            <Icon className={`h-5 w-5 ${tone}`} {...(filledIcon ? { fill: "currentColor" } : {})} />
          )}
        </div>
        <p
          className={cn(
            "mt-2 text-xl font-semibold leading-none transition-transform duration-200 sm:text-2xl",
            isInteractive && "group-hover:scale-105 group-active:scale-95",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={colors.link}
    >
      {content}
    </Link>
  );
}

function CollectionSection({
  sectionId,
  kind,
  t,
  title,
  icon: Icon,
  iconTone,
  count,
  emptyText,
  games,
  isOwner,
  sharedType,
  sharedGameIds,
  matchStats,
  forceMatchUnavailable = false,
}: {
  sectionId?: string;
  kind: "favorite" | "wishlist" | "owned";
  t: TranslateFn;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  count: number;
  emptyText: string;
  games: ProfileGame[];
  isOwner: boolean;
  sharedType?: "favorite" | "wishlist" | "owned";
  sharedGameIds?: Set<string>;
  matchStats?: MatchStats;
  forceMatchUnavailable?: boolean;
}) {
  const matchUnavailable = forceMatchUnavailable;
  const emptyCategoryBothSides = Boolean(matchStats && matchStats.union === 0);
  const effectiveMatchPercent = emptyCategoryBothSides ? 100 : (matchStats?.percent ?? 0);
  const matchBadgeClassName = matchUnavailable
    ? "border-zinc-400/35 bg-zinc-500/10 text-zinc-500 dark:text-zinc-300"
    : sharedType === "favorite"
      ? "border-rose-400/35 bg-rose-500/12 text-rose-500 dark:text-rose-300"
      : sharedType === "wishlist"
        ? "border-sky-400/35 bg-sky-500/12 text-sky-500 dark:text-sky-300"
        : "border-emerald-400/35 bg-emerald-500/12 text-emerald-500 dark:text-emerald-300";
  const matchTooltipClassName = matchUnavailable
    ? "text-zinc-200 dark:text-zinc-700"
    : sharedType === "favorite"
      ? "text-rose-200 dark:text-rose-700"
      : sharedType === "wishlist"
        ? "text-sky-200 dark:text-sky-700"
        : "text-emerald-200 dark:text-emerald-700";

  return (
    <section
      id={sectionId}
      tabIndex={-1}
      className="mt-8 scroll-mt-24 rounded-xl border bg-card/70 p-4 shadow-sm outline-none sm:p-5"
    >
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-4 w-4 ${iconTone}`} />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {matchStats && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-medium",
                    matchBadgeClassName,
                  )}
                >
                  {matchUnavailable ? "-%" : t("collections.match.badge", { percent: effectiveMatchPercent })}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className={matchTooltipClassName}>
                {matchUnavailable
                  ? t("collections.match.unavailable")
                  : emptyCategoryBothSides
                    ? t(`collections.${kind}.matchBothEmpty`)
                    : t(`collections.${kind}.matchShared`, {
                        shared: matchStats.shared,
                        union: matchStats.union,
                      })}
              </TooltipContent>
            </Tooltip>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 sm:items-start">
          <p className="text-center text-sm text-muted-foreground sm:text-left">{emptyText}</p>
          {isOwner && (
            <div className="flex w-full justify-center sm:justify-start">
              <Button asChild size="sm" variant="outline" className="cursor-pointer">
                <Link href="/games">{t("collections.exploreGames")}</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <ProfileGameCard
              key={game.id}
              game={game}
              sharedType={sharedGameIds?.has(game.id) ? sharedType : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

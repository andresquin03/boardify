import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Globe, Lock, Mail, Network, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { GROUP_COLOR_CONFIG } from "@/lib/group-colors";
import { GROUP_ICON_MAP } from "@/lib/group-icons";
import { prisma } from "@/lib/prisma";
import type { GroupColor, GroupVisibility } from "@/generated/prisma/client";
import { GroupActionsMenu } from "@/components/groups/group-actions-menu";
import { ShareIconButton } from "@/components/ui/share-icon-button";

const visibilityConfig = {
  PUBLIC: {
    label: "Public group",
    icon: Globe,
    className: "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
  },
  INVITATION: {
    label: "Invitation only",
    icon: Mail,
    className: "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  PRIVATE: {
    label: "Private group",
    icon: Lock,
    className: "border-violet-400/30 bg-violet-500/10 text-violet-500 dark:text-violet-400",
  },
} as const;

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    const legacy = await prisma.groupSlug.findUnique({
      where: { slug },
      select: {
        group: {
          select: { slug: true },
        },
      },
    });

    if (legacy) {
      redirect(`/groups/${legacy.group.slug}`);
    }

    notFound();
  }

  const IconComponent = GROUP_ICON_MAP[group.icon];
  const colorConfig = GROUP_COLOR_CONFIG[group.color as GroupColor];
  const visibility = visibilityConfig[group.visibility as GroupVisibility];
  const VisibilityIcon = visibility.icon;
  const viewerMembership = group.members.find((member) => member.userId === viewerId);
  const isMember = Boolean(viewerMembership);
  const isAdmin = viewerMembership?.role === "ADMIN";
  const adminCount = group.members.reduce(
    (total, member) => total + (member.role === "ADMIN" ? 1 : 0),
    0,
  );
  const isSoleAdmin = isAdmin && adminCount === 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/groups"
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Network className="h-4 w-4" />
        Back to groups
      </Link>

      <div className="mt-4 rounded-2xl border bg-card/70 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 ${colorConfig.iconClassName}`}
            >
              <IconComponent className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{group.name}</h1>
              {group.description && (
                <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareIconButton
              path={`/groups/${group.slug}`}
              message={isMember ? "Join my Boardify group:" : "Check out this Boardify group:"}
              tooltipLabel="Share group"
              ariaLabel="Share group"
            />
            <GroupActionsMenu
              groupId={group.id}
              groupSlug={group.slug}
              isMember={isMember}
              isAdmin={isAdmin}
              isSoleAdmin={isSoleAdmin}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${visibility.className}`}
                >
                  <VisibilityIcon className="h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">{visibility.label}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {group._count.members} {group._count.members === 1 ? "member" : "members"}
          </span>
          <span>
            Created {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(group.createdAt)}
          </span>
          <span>{isMember ? "You are a member" : "You are not a member"}</span>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Members</h2>

        {group.members.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {group.members.map((member) => {
              const displayName = member.user.name ?? member.user.username ?? "User";

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <Avatar>
                      <AvatarImage src={member.user.image ?? undefined} alt={displayName} />
                      <AvatarFallback>
                        {displayName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      {member.user.username && (
                        <p className="truncate text-xs text-muted-foreground">
                          @{member.user.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                      member.role === "ADMIN"
                        ? "border-amber-400/40 bg-amber-500/10 text-amber-500 dark:text-amber-400"
                        : "border-border/70 bg-background text-muted-foreground"
                    }`}
                  >
                    {member.role === "ADMIN" ? "Admin" : "Member"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

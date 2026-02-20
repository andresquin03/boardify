import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Lock, Mail, Network, Plus, UserCheck, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { GROUP_COLOR_CONFIG } from "@/lib/group-colors";
import { prisma } from "@/lib/prisma";
import { GROUP_ICON_MAP } from "@/lib/group-icons";
import type { GroupColor, GroupVisibility } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

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

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=%2Fgroups");

  const groups = await prisma.group.findMany({
    where: {
      visibility: {
        not: "PRIVATE",
      },
    },
    include: {
      members: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const createGroupCta =
    groups.length === 0 ? "Be the first to add a group" : "Create group";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-24">
      <div className="group flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Network className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">Groups</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse groups and find your community.
      </p>

      <p className="mt-5 text-sm text-muted-foreground">
        {groups.length} {groups.length === 1 ? "group" : "groups"}
      </p>

      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No groups yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const IconComponent = GROUP_ICON_MAP[group.icon];
            const visibility = visibilityConfig[group.visibility as GroupVisibility];
            const colorConfig = GROUP_COLOR_CONFIG[group.color as GroupColor];
            const VisibilityIcon = visibility.icon;
            const isMember = group.members.length > 0;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.slug}`}
                className={cn(
                  "pressable flex flex-col gap-3 rounded-xl p-4 shadow-sm transition-colors",
                  isMember
                    ? "border border-emerald-400/30 bg-emerald-500/[0.06] hover:border-emerald-400/45 hover:bg-emerald-500/[0.11]"
                    : "border bg-card/70 hover:bg-accent/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 ${colorConfig.iconClassName}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isMember && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                            <UserCheck className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">You are a member</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${visibility.className}`}
                        >
                          <VisibilityIcon className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">{visibility.label}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{group.name}</p>
                  {group.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {group._count.members}{" "}
                    {group._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/groups/new"
        className="pressable fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/35 transition-colors hover:bg-emerald-500 active:bg-emerald-700 sm:right-8 sm:bottom-8"
      >
        <Plus className="h-4 w-4" />
        {createGroupCta}
      </Link>
    </div>
  );
}

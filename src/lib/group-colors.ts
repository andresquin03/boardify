import type { GroupColor } from "@/generated/prisma/enums";

type GroupColorConfig = {
  label: string;
  iconClassName: string;
  swatchClassName: string;
  selectedBorderClassName: string;
  selectedBgClassName: string;
  selectedRingClassName: string;
};

export const GROUP_COLOR_CONFIG: Record<GroupColor, GroupColorConfig> = {
  SKY: {
    label: "Sky",
    iconClassName: "text-sky-500 dark:text-sky-400",
    swatchClassName: "bg-sky-500",
    selectedBorderClassName: "border-sky-400/70",
    selectedBgClassName: "bg-sky-500/15",
    selectedRingClassName: "ring-sky-400/45",
  },
  EMERALD: {
    label: "Emerald",
    iconClassName: "text-emerald-500 dark:text-emerald-400",
    swatchClassName: "bg-emerald-500",
    selectedBorderClassName: "border-emerald-400/70",
    selectedBgClassName: "bg-emerald-500/15",
    selectedRingClassName: "ring-emerald-400/45",
  },
  AMBER: {
    label: "Amber",
    iconClassName: "text-amber-500 dark:text-amber-400",
    swatchClassName: "bg-amber-500",
    selectedBorderClassName: "border-amber-400/70",
    selectedBgClassName: "bg-amber-500/15",
    selectedRingClassName: "ring-amber-400/45",
  },
  ROSE: {
    label: "Rose",
    iconClassName: "text-rose-500 dark:text-rose-400",
    swatchClassName: "bg-rose-500",
    selectedBorderClassName: "border-rose-400/70",
    selectedBgClassName: "bg-rose-500/15",
    selectedRingClassName: "ring-rose-400/45",
  },
  VIOLET: {
    label: "Violet",
    iconClassName: "text-violet-500 dark:text-violet-400",
    swatchClassName: "bg-violet-500",
    selectedBorderClassName: "border-violet-400/70",
    selectedBgClassName: "bg-violet-500/15",
    selectedRingClassName: "ring-violet-400/45",
  },
  INDIGO: {
    label: "Indigo",
    iconClassName: "text-indigo-500 dark:text-indigo-400",
    swatchClassName: "bg-indigo-500",
    selectedBorderClassName: "border-indigo-400/70",
    selectedBgClassName: "bg-indigo-500/15",
    selectedRingClassName: "ring-indigo-400/45",
  },
  CYAN: {
    label: "Cyan",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    swatchClassName: "bg-cyan-500",
    selectedBorderClassName: "border-cyan-400/70",
    selectedBgClassName: "bg-cyan-500/15",
    selectedRingClassName: "ring-cyan-400/45",
  },
  LIME: {
    label: "Lime",
    iconClassName: "text-lime-500 dark:text-lime-400",
    swatchClassName: "bg-lime-500",
    selectedBorderClassName: "border-lime-400/70",
    selectedBgClassName: "bg-lime-500/15",
    selectedRingClassName: "ring-lime-400/45",
  },
};

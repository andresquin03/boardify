"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  GroupColor,
  GroupIcon,
  type GroupColor as GroupColorValue,
  type GroupIcon as GroupIconValue,
  type GroupVisibility as GroupVisibilityValue,
} from "@/generated/prisma/enums";
import { createGroup } from "@/lib/actions";
import { GROUP_COLOR_CONFIG } from "@/lib/group-colors";
import { GROUP_ICON_MAP } from "@/lib/group-icons";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormPendingButton } from "@/components/ui/form-pending-button";

const colorOptions = Object.values(GroupColor) as GroupColorValue[];
const iconOptions = Object.values(GroupIcon) as GroupIconValue[];

function formatGroupIconLabel(value: GroupIconValue) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part.length === 1 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

export function CreateGroupForm() {
  const t = useTranslations("GroupForms");
  const [state, action] = useActionState(createGroup, null);

  const initialValues = state?.values ?? {
    name: "",
    description: "",
    icon: "DICE_1",
    color: "SKY",
    visibility: "INVITATION",
  };

  const formKey = `${initialValues.name}|${initialValues.description}|${initialValues.icon}|${initialValues.color}|${initialValues.visibility}`;
  const [selectedColor, setSelectedColor] = useState<GroupColorValue>(initialValues.color);
  const [selectedIcon, setSelectedIcon] = useState<GroupIconValue>(initialValues.icon);
  const selectedColorConfig = GROUP_COLOR_CONFIG[selectedColor];
  const visibilityConfig: Record<GroupVisibilityValue, { label: string }> = {
    PUBLIC: { label: t("visibility.public") },
    INVITATION: { label: t("visibility.invitation") },
    PRIVATE: { label: t("visibility.private") },
  };
  const colorLabels: Record<GroupColorValue, string> = {
    SKY: t("colors.SKY"),
    EMERALD: t("colors.EMERALD"),
    AMBER: t("colors.AMBER"),
    ROSE: t("colors.ROSE"),
    VIOLET: t("colors.VIOLET"),
    INDIGO: t("colors.INDIGO"),
    CYAN: t("colors.CYAN"),
    LIME: t("colors.LIME"),
  };

  return (
    <form key={formKey} action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">{t("name.label")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialValues.name}
          placeholder={t("name.placeholder")}
          maxLength={30}
          autoComplete="off"
        />
        {state?.errors?.name ? (
          <p className="text-sm text-destructive">{state.errors.name}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("name.helper")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description.label")}</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues.description}
          placeholder={t("description.placeholder")}
          maxLength={160}
          rows={3}
        />
        {state?.errors?.description && (
          <p className="text-sm text-destructive">{state.errors.description}</p>
        )}
        <p className="text-xs text-muted-foreground">{t("description.helper")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("color.label")}</Label>
        <div
          role="radiogroup"
          aria-label={t("color.ariaLabel")}
          className="mx-auto inline-flex flex-nowrap items-center gap-2 rounded-lg border border-border/70 bg-muted/20 p-2 max-[450px]:inline-grid max-[450px]:grid-cols-4 max-[450px]:justify-items-center"
        >
          {colorOptions.map((color) => {
            const colorConfig = GROUP_COLOR_CONFIG[color];
            const isSelected = color === selectedColor;
            const colorLabel = colorLabels[color];

            return (
              <Tooltip key={color}>
                <TooltipTrigger asChild>
                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      checked={isSelected}
                      onChange={() => setSelectedColor(color)}
                      aria-label={colorLabel}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "pressable inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background/60 transition-all duration-[260ms] motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring/60",
                        isSelected
                          ? cn(
                              "scale-105 ring-2 ring-offset-1 ring-offset-background",
                              colorConfig.selectedBorderClassName,
                              colorConfig.selectedBgClassName,
                              colorConfig.selectedRingClassName,
                            )
                          : "border-border/60 hover:bg-accent/60",
                      )}
                    >
                      <span className={cn("h-4.5 w-4.5 rounded-full", colorConfig.swatchClassName)} />
                    </span>
                  </label>
                </TooltipTrigger>
                <TooltipContent side="top">{colorLabel}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {state?.errors?.color && <p className="text-sm text-destructive">{state.errors.color}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t("icon.label")}</Label>
        <div
          role="radiogroup"
          aria-label={t("icon.ariaLabel")}
          className="flex flex-wrap gap-2 rounded-lg border border-border/70 bg-muted/20 p-2"
        >
          {iconOptions.map((icon) => {
            const IconComponent = GROUP_ICON_MAP[icon];
            const label = formatGroupIconLabel(icon);

            return (
              <Tooltip key={icon}>
                <TooltipTrigger asChild>
                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value={icon}
                      checked={icon === selectedIcon}
                      onChange={() => setSelectedIcon(icon)}
                      aria-label={label}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "pressable inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border bg-background/60 text-foreground transition-all duration-[260ms] motion-reduce:transition-none hover:bg-accent/60 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/60",
                        icon === selectedIcon
                          ? cn(
                              "scale-105 animate-[toggle-press_360ms_cubic-bezier(0.22,1,0.36,1)]",
                              selectedColorConfig.selectedBorderClassName,
                              selectedColorConfig.selectedBgClassName,
                              selectedColorConfig.iconClassName,
                            )
                          : "border-border/60",
                      )}
                    >
                      <IconComponent
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          icon === selectedIcon && "animate-[toggle-bump_360ms_cubic-bezier(0.22,1,0.36,1)]",
                        )}
                      />
                    </span>
                  </label>
                </TooltipTrigger>
                <TooltipContent side="top">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {state?.errors?.icon && <p className="text-sm text-destructive">{state.errors.icon}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">{t("visibility.label")}</Label>
        <Select name="visibility" defaultValue={initialValues.visibility}>
          <SelectTrigger id="visibility" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(visibilityConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.visibility && (
          <p className="text-sm text-destructive">{state.errors.visibility}</p>
        )}
      </div>

      {state?.errors?.general && (
        <p className="text-sm text-destructive">{state.errors.general}</p>
      )}

      <FormPendingButton
        type="submit"
        className="w-full cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
        pendingText={t("actions.pendingCreate")}
      >
        {t("actions.create")}
      </FormPendingButton>
    </form>
  );
}

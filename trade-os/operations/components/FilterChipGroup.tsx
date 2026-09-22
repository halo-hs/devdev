"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  ChipGroup,
  type ChipItem,
  type ChipSelectionAppearance,
  type ChipTone,
} from "./ChipGroup";

type FilterChipTone = "blue" | "gray" | "yellow" | "red";

type FilterChipItem = {
  id: string;
  label: ReactNode;
  count?: ReactNode;
  tone?: FilterChipTone;
  disabled?: boolean;
};

type FilterChipGroupProps = Omit<ComponentProps<"div">, "onChange" | "onSelect"> & {
  items: FilterChipItem[];
  selectedId?: string;
  onChange?: (id: string) => void;
  selectionAppearance?: ChipSelectionAppearance;
};

const toneMap: Record<FilterChipTone, ChipTone> = {
  blue: "blue",
  gray: "gray",
  yellow: "yellow",
  red: "red",
};

function FilterChipGroup({
  items,
  selectedId,
  onChange,
  selectionAppearance = "solid",
  ...props
}: FilterChipGroupProps) {
  const chips: ChipItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    meta: item.count,
    tone: toneMap[item.tone ?? "gray"],
    disabled: item.disabled,
  }));

  return (
    <ChipGroup
      {...props}
      roleMode="group"
      items={chips}
      selectedId={selectedId}
      selectionAppearance={selectionAppearance}
      onSelect={onChange}
    />
  );
}

export { FilterChipGroup };
export type { FilterChipGroupProps, FilterChipItem, FilterChipTone };

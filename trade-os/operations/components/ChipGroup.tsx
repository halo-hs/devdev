"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cx } from "@trade-os/operations/components/ui/utils";

type ChipTone = "neutral" | "blue" | "green" | "yellow" | "red" | "purple" | "gray";

type ChipItem = {
  id: string;
  label: ReactNode;
  meta?: ReactNode;
  tone?: ChipTone;
  disabled?: boolean;
};

/**
 * Chip geometry. `pill` (default) = canonical radius 24px + font-medium.
 * `square` = canonical square tag (4px radius + font-bold). Default stays `pill`
 * so existing callers are unchanged.
 */
type ChipShape = "pill" | "square";
type ChipSelectionAppearance = "line" | "solid";

type ChipGroupProps = Omit<ComponentProps<"div">, "onSelect"> & {
  items: ChipItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  roleMode?: "group" | "list" | "tabs";
  shape?: ChipShape;
  selectionAppearance?: ChipSelectionAppearance;
};

type ChipTokens = { color: string; badgeColor: string; borderColor: string };

/**
 * Tone → Ecoya CSS-var color tokens (kebab-cased from the canonical colorSet keys).
 * The canonical ChipGroup renders an `atom/Badge` on the raw color/badgeColor/borderColor
 * path; under the styled-port B-plan that raw path maps to an inline span styled with
 * `--ecoya-*` tokens (atom-substitution-map row 21/22).
 */
const toneMap: Record<ChipTone, ChipTokens> = {
  neutral: { color: "gray-4", badgeColor: "gray-12", borderColor: "gray-10" },
  blue: { color: "blue-4", badgeColor: "blue-10", borderColor: "blue-4" },
  green: { color: "system-green-1", badgeColor: "system-green-6", borderColor: "system-green-5" },
  yellow: { color: "system-yellow-1", badgeColor: "system-yellow-6", borderColor: "system-yellow-5" },
  red: { color: "system-red-2", badgeColor: "system-red-8", borderColor: "system-red-7" },
  purple: { color: "system-grape-2", badgeColor: "system-grape-6", borderColor: "system-grape-5" },
  gray: { color: "gray-4", badgeColor: "gray-10", borderColor: "gray-10" },
};

function ecoyaVar(token: string): string {
  return `var(--ecoya-${token})`;
}

/**
 * Badge-equivalent chip body. Mirrors `atom/Badge size="S"`:
 *   radius 24px · padding 2px 10px (py-0.5 px-2.5) · badgeS typo (text-badge-12 font-medium).
 * `active` → badgeType="line": transparent bg + 1px border (borderColor).
 * inactive → badgeType="normal": bg = badgeColor.
 */
function ChipBadge({
  active,
  children,
  selectionAppearance,
  tokens,
  shape = "pill",
}: {
  active: boolean;
  children: ReactNode;
  selectionAppearance: ChipSelectionAppearance;
  tokens: ChipTokens;
  shape?: ChipShape;
}) {
  const style: CSSProperties = {
    color:
      active && selectionAppearance === "solid"
        ? ecoyaVar("gray-12")
        : ecoyaVar(tokens.color),
    ...(active && selectionAppearance === "solid"
      ? {
          backgroundColor: ecoyaVar(tokens.borderColor),
          border: `1px solid ${ecoyaVar(tokens.borderColor)}`,
        }
      : active
      ? { backgroundColor: "transparent", border: `1px solid ${ecoyaVar(tokens.borderColor)}` }
      : { backgroundColor: ecoyaVar(tokens.badgeColor) }),
  };

  return (
    <span
      className={
        shape === "square"
          ? "inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-0.5 text-badge-12 font-bold"
          : "inline-flex items-center justify-center whitespace-nowrap rounded-[24px] px-2.5 py-0.5 text-badge-12 font-medium"
      }
      data-ui="chip-badge"
      style={style}
    >
      {children}
    </span>
  );
}

function ChipGroup({
  items,
  selectedId,
  onSelect,
  roleMode = "list",
  shape = "pill",
  selectionAppearance = "line",
  className,
  ...props
}: ChipGroupProps) {
  const rootRole =
    roleMode === "tabs" ? "tablist" : roleMode === "group" ? "group" : "list";
  const itemRole =
    roleMode === "tabs" ? "tab" : roleMode === "list" ? "listitem" : undefined;

  return (
    <div
      className={cx("flex flex-wrap items-center gap-2", className)}
      data-ui="chip-group"
      role={rootRole}
      {...props}
    >
      {items.map((item) => {
        const active = item.id === selectedId;
        const tokens = toneMap[active ? "blue" : (item.tone ?? "neutral")];

        return (
          <button
            aria-pressed={roleMode !== "tabs" ? active : undefined}
            aria-selected={roleMode === "tabs" ? active : undefined}
            className="cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-[0.48]"
            disabled={item.disabled}
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            role={itemRole}
            type="button"
          >
            <ChipBadge
              active={active}
              selectionAppearance={selectionAppearance}
              shape={shape}
              tokens={tokens}
            >
              <span className="inline-flex items-center">{item.label}</span>
              {item.meta != null && <> {item.meta}</>}
            </ChipBadge>
          </button>
        );
      })}
    </div>
  );
}

export { ChipGroup };
export type { ChipGroupProps, ChipItem, ChipSelectionAppearance, ChipShape, ChipTone };

"use client";

import type { ReactNode } from "react";

import { cx } from "./utils";

export type RectangularBadgeSize = "S" | "M";

export type RectangularBadgeProps = {
  /** Ecoya CSS-var color token for the text, e.g. "gray-12", "system-lime-1". */
  color?: string;
  /** Ecoya CSS-var color token for the background, e.g. "system-lime-5", "system-blue-6". */
  backgroundColor?: string;
  size?: RectangularBadgeSize;
  className?: string;
  children?: ReactNode;
};

function resolveEcoyaVar(token: string): string {
  if (token.startsWith("var(") || token.startsWith("#") || token.startsWith("rgb")) {
    return token;
  }
  if (token.startsWith("--")) return `var(${token})`;
  return `var(--ecoya-${token})`;
}

export function RectangularBadge({
  backgroundColor = "system-lime-1",
  children,
  className,
  color = "gray-12",
  size = "M",
}: RectangularBadgeProps) {
  const isSmall = size === "S";

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-[2px] whitespace-nowrap",
        isSmall
          ? "px-1 py-0.5 text-label-12 font-medium"
          : "px-1.5 py-0.5 text-button-11 font-medium",
        className,
      )}
      data-ui="rectangular-badge"
      style={{
        backgroundColor: resolveEcoyaVar(backgroundColor),
        color: resolveEcoyaVar(color),
      }}
    >
      {children}
    </span>
  );
}

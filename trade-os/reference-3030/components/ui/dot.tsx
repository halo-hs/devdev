import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export type DotProps = HTMLAttributes<HTMLSpanElement> & {
  color?: string;
};

function resolveDotColor(color: string) {
  if (color.startsWith("--")) return `var(${color})`;
  if (color.startsWith("var(") || color.startsWith("#") || color.startsWith("rgb")) {
    return color;
  }

  return `var(--ecoya-${color})`;
}

export function Dot({
  className,
  color = "blue-4",
  style,
  ...props
}: DotProps) {
  return (
    <span
      className={cx("inline-block size-2 rounded-full", className)}
      data-ui="dot"
      style={{
        backgroundColor: resolveDotColor(color),
        ...style,
      }}
      {...props}
    />
  );
}

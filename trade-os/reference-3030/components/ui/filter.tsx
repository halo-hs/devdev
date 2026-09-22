"use client";

import type { ReactNode } from "react";

import { cx } from "./utils";

export type FilterFieldProps = {
  children: ReactNode;
  className?: string;
  label?: ReactNode;
};

export function FilterField({ children, className, label }: FilterFieldProps) {
  return (
    <div
      className={cx("flex w-[432px] items-center gap-2", className)}
      data-ui="filter-field"
    >
      <div className="flex h-full w-40 min-w-[60px] max-w-[300px] items-start py-2 pl-1">
        <span className="text-body-15 font-regular leading-[22px] text-ecoya-gray-4">
          {label}
        </span>
      </div>
      <div className="min-w-[200px] flex-1">{children}</div>
    </div>
  );
}

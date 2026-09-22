"use client";

import type { ReactNode } from "react";

import { Icon } from "./icon";
import { cx } from "./utils";

export type AccordionHeaderAlign = "center" | "flex-end" | "flex-start";
export type AccordionHeaderBorderMode = "always" | "closed-only";

export type AccordionProps = {
  bodyClassName?: string;
  bodyRadius?: string;
  children: ReactNode;
  className?: string;
  header: ReactNode;
  headerAlign?: AccordionHeaderAlign;
  headerBorderMode?: AccordionHeaderBorderMode;
  headerClassName?: string;
  isOpen: boolean;
  onToggle: () => void;
};

const headerAlignClasses: Record<AccordionHeaderAlign, string> = {
  center: "items-center",
  "flex-end": "items-end",
  "flex-start": "items-start",
};

export function Accordion({
  bodyClassName,
  bodyRadius,
  children,
  className,
  header,
  headerAlign = "center",
  headerBorderMode = "always",
  headerClassName,
  isOpen,
  onToggle,
}: AccordionProps) {
  return (
    <div className={className} data-ui="accordion">
      <button
        aria-expanded={isOpen}
        className={cx(
          "flex min-h-10 w-full gap-2 border-0 px-0 py-[10px] text-body-14 font-medium text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ecoya-blue-4",
          headerAlignClasses[headerAlign],
          isOpen
            ? "bg-ecoya-gray-12 hover:bg-ecoya-gray-12"
            : "bg-transparent hover:bg-ecoya-blue-10",
          (headerBorderMode === "always" || !isOpen) &&
            "border-b border-ecoya-gray-11",
          headerClassName,
        )}
        data-ui="accordion-header"
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0 flex-1">{header}</span>
        <span
          className={cx(
            "inline-flex size-4 shrink-0 items-center justify-center text-[color:var(--ecoya-gray-6)] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          data-ui="accordion-chevron"
        >
          <Icon className="size-4" size={16} name="icon-chevron-down" />
        </span>
      </button>
      {isOpen ? (
        <div
          className={cx("bg-ecoya-gray-12 pb-[10px] text-body-14 font-regular", bodyClassName)}
          data-ui="accordion-body"
          style={bodyRadius ? { borderRadius: bodyRadius } : undefined}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

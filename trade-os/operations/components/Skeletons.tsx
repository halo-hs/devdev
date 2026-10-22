import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type SkeletonPresetProps = ComponentProps<"div"> & {
  label?: string;
};

function StatusRoot({ label, className, children, ...props }: SkeletonPresetProps) {
  return (
    <div
      aria-busy={label ? "true" : undefined}
      className={className}
      role={label ? "status" : undefined}
      {...props}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {children}
    </div>
  );
}

function SkeletonList({
  rows = 6,
  label,
  className,
  ...props
}: SkeletonPresetProps & { rows?: number }) {
  return (
    <StatusRoot
      className={cn(
        "rounded-lg border border-border-subtle bg-surface-card p-4 shadow-section",
        className,
      )}
      data-ui="skeleton-list"
      label={label}
      {...props}
    >
      <div className="flex flex-col divide-y divide-border-subtle">
        {Array.from({ length: rows }, (_, index) => (
          <div className="flex h-[44px] items-center gap-3" key={index}>
            <Skeleton aria-hidden="true" className="rounded-full size-6 shrink-0" />
            <Skeleton aria-hidden="true" className={`h-[14px] rounded-[8px] ${index % 2 === 0 ? "w-2/5" : "w-1/3"}`} />
            <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] ml-auto w-16" />
          </div>
        ))}
      </div>
    </StatusRoot>
  );
}

function SkeletonTable({
  rows = 8,
  label,
  className,
  ...props
}: SkeletonPresetProps & { rows?: number }) {
  return (
    <StatusRoot
      className={cn(
        "rounded-lg border border-border-subtle bg-surface-card p-2 shadow-section",
        className,
      )}
      data-ui="skeleton-table"
      label={label}
      {...props}
    >
      <div className="flex h-10 items-center gap-6 rounded-[8px] bg-surface-muted px-3">
        <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] w-1/6" />
        <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] w-1/4" />
        <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] w-1/6" />
        <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] ml-auto w-14" />
      </div>
      <div className="flex flex-col divide-y divide-border-subtle px-3">
        {Array.from({ length: rows }, (_, index) => (
          <div className="flex h-[43px] items-center gap-6" key={index}>
            <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] w-1/6" />
            <Skeleton aria-hidden="true" className={`h-[14px] rounded-[8px] ${index % 3 === 0 ? "w-1/3" : "w-1/4"}`} />
            <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] w-1/6" />
            <Skeleton aria-hidden="true" className="h-[14px] rounded-[8px] ml-auto w-14" />
          </div>
        ))}
      </div>
    </StatusRoot>
  );
}

function SkeletonCards({
  cards = 3,
  label,
  className,
  style,
  ...props
}: SkeletonPresetProps & { cards?: number }) {
  return (
    <StatusRoot
      className={cn("grid gap-3", className)}
      data-ui="skeleton-cards"
      label={label}
      style={{ gridTemplateColumns: `repeat(${cards}, minmax(0, 1fr))`, ...style }}
      {...props}
    >
      {Array.from({ length: cards }, (_, index) => (
        <div
          className="flex h-[92px] flex-col justify-center gap-2.5 rounded-lg border border-border-subtle bg-surface-card px-4 shadow-section"
          key={index}
        >
          <Skeleton aria-hidden="true" className="h-[12px] rounded-[8px] w-20" />
          <Skeleton aria-hidden="true" className="rounded-[8px] h-[22px] w-24" />
        </div>
      ))}
    </StatusRoot>
  );
}

export { SkeletonCards, SkeletonList, SkeletonTable };
export type { SkeletonPresetProps };

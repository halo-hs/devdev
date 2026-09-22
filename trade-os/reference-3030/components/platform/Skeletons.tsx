import type { ComponentProps } from "react";

import { Skeleton } from "@trade-os/reference-3030/components/ui/skeleton";
import { cx } from "@trade-os/reference-3030/components/ui/utils";

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
      className={cx(
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
            <Skeleton className="size-6 shrink-0" variant="circle" />
            <Skeleton className={index % 2 === 0 ? "w-2/5" : "w-1/3"} variant="line" />
            <Skeleton className="ml-auto w-16" variant="line" />
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
      className={cx(
        "rounded-lg border border-border-subtle bg-surface-card p-2 shadow-section",
        className,
      )}
      data-ui="skeleton-table"
      label={label}
      {...props}
    >
      <div className="flex h-10 items-center gap-6 rounded-[8px] bg-surface-muted px-3">
        <Skeleton className="w-1/6" variant="line" />
        <Skeleton className="w-1/4" variant="line" />
        <Skeleton className="w-1/6" variant="line" />
        <Skeleton className="ml-auto w-14" variant="line" />
      </div>
      <div className="flex flex-col divide-y divide-border-subtle px-3">
        {Array.from({ length: rows }, (_, index) => (
          <div className="flex h-[43px] items-center gap-6" key={index}>
            <Skeleton className="w-1/6" variant="line" />
            <Skeleton className={index % 3 === 0 ? "w-1/3" : "w-1/4"} variant="line" />
            <Skeleton className="w-1/6" variant="line" />
            <Skeleton className="ml-auto w-14" variant="line" />
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
      className={cx("grid gap-3", className)}
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
          <Skeleton className="h-[12px] w-20" variant="line" />
          <Skeleton className="h-[22px] w-24" variant="block" />
        </div>
      ))}
    </StatusRoot>
  );
}

export { SkeletonCards, SkeletonList, SkeletonTable };
export type { SkeletonPresetProps };

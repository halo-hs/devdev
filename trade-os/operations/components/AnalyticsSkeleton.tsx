import { Skeleton } from "@trade-os/operations/components/ui/skeleton";
import { cx } from "@trade-os/operations/components/ui/utils";

import { SkeletonList, SkeletonTable } from "./Skeletons";

type AnalyticsSkeletonKind = "monitor" | "reports" | "sales-performance";

type AnalyticsSkeletonProps = {
  kind: AnalyticsSkeletonKind;
  label?: string;
  header?: boolean;
  metricsOnly?: boolean;
};

function ChartSkeleton() {
  return (
    <div className="min-w-0 rounded-lg border border-border-subtle bg-surface-card p-4" data-ui="skeleton-chart">
      <Skeleton className="mb-5 w-36" variant="line" />
      <div className="flex h-56 items-end gap-3 border-b border-l border-border-subtle px-4">
        {[45, 65, 50, 80, 60, 90].map((height, index) => (
          <Skeleton className="min-w-0 flex-1" key={index} style={{ height: `${height}%` }} variant="block" />
        ))}
      </div>
    </div>
  );
}

// Match each connected screen's responsive KPI and body grid. No fixture data
// is mounted while loading, and the same composition serves route fallbacks.
function AnalyticsSkeleton({ kind, label, header = false, metricsOnly = false }: AnalyticsSkeletonProps) {
  const monitor = kind === "monitor";
  const reports = kind === "reports";
  const count = monitor ? 2 : reports ? 6 : 4;
  return (
    <div aria-busy="true" className="flex min-w-0 flex-col gap-4" data-ui="analytics-skeleton" data-kind={kind} role="status">
      {label ? <span className="sr-only">{label}</span> : null}
      {header ? (
        <div className="flex min-h-[112px] flex-col justify-center gap-3 rounded-hero-radius border border-border-subtle px-7 py-4" data-ui="skeleton-page-header">
          <Skeleton className="h-6 w-36" variant="block" />
          <Skeleton className="w-2/3" variant="line" />
        </div>
      ) : null}
      {!metricsOnly ? (
        <div className="flex flex-wrap gap-2" data-ui="skeleton-filters">
          {[32, 40, 28].map((width) => <Skeleton className="h-8 max-w-full" key={width} style={{ width: `${width * 4}px` }} variant="block" />)}
        </div>
      ) : null}
      <div className={cx("grid gap-3", monitor ? "grid-cols-2 max-[900px]:grid-cols-1" : reports ? "grid-cols-6 max-lg:grid-cols-2 max-sm:grid-cols-1" : "grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1")} data-ui="skeleton-metrics">
        {Array.from({ length: count }, (_, index) => (
          <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border-subtle bg-surface-card p-4" key={index}>
            <Skeleton className="w-3/4" variant="line" />
            <Skeleton className="h-6 w-1/2" variant="block" />
            <Skeleton className="w-2/3" variant="line" />
          </div>
        ))}
      </div>
      {!metricsOnly ? monitor ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonList rows={2} />
            <SkeletonList rows={2} />
            <SkeletonList className="lg:col-span-2" rows={2} />
          </div>
          <Skeleton className="h-14 w-full" variant="block" />
          <div className="grid grid-cols-2 gap-4 max-[1180px]:grid-cols-1" data-ui="skeleton-monitor-sections">
            {Array.from({ length: 4 }, (_, index) => <SkeletonList key={index} rows={3} />)}
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)] gap-4 max-lg:grid-cols-1">
            <ChartSkeleton />
            <SkeletonList rows={5} />
          </div>
          <SkeletonTable rows={4} />
        </>
      ) : null}
    </div>
  );
}

export { AnalyticsSkeleton };
export type { AnalyticsSkeletonKind, AnalyticsSkeletonProps };

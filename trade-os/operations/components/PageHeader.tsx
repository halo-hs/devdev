import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

function PageHeader({ title, description, meta, actions, className, ...props }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "grid min-h-[76px] flex-none grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--color-gray-10)] bg-[var(--color-gray-12)] px-7 py-4",
        className,
      )}
      data-component="PageHeader"
      {...props}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h1 className="m-0 text-[length:var(--text-body-2)] leading-[var(--leading-body-2)] font-bold text-[var(--color-gray-2)]">{title}</h1>
          {meta ? (
            <div className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-semibold uppercase tracking-[0.04em] text-[var(--color-gray-6)]">
              {meta}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="mb-0 mt-1 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-normal text-[var(--color-gray-5)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="inline-flex items-center justify-end gap-2">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
export type { PageHeaderProps };

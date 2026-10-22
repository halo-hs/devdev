import type { ReactNode } from "react";

import { InfoBox } from "@trade-os/components/InfoBox";
import { SkeletonCards } from "@trade-os/components/Skeletons";
import { Button } from "@/components/ui/Button";

import type { Loadable } from "@trade-os/lib/loadable";

type LoadableSectionCopy = {
  loading: string;
  empty: string;
  restricted: string;
  error: string;
  retry: string;
  correlationId: string;
};

type LoadableSectionProps<T> = {
  state: Loadable<T>;
  copy: LoadableSectionCopy;
  children: (data: T) => ReactNode;
  onRetry?: () => void;
};

function assertNever(_state: never): never {
  throw new Error("Unexpected Loadable state");
}

function LoadableSection<T>({
  state,
  copy,
  children,
  onRetry,
}: LoadableSectionProps<T>) {
  switch (state.status) {
    case "loading":
      return (
        <section data-component="LoadableSection" data-state="loading">
          <SkeletonCards cards={1} label={copy.loading} />
        </section>
      );
    case "ready":
      return (
        <section data-component="LoadableSection" data-state="ready">
          {children(state.data)}
        </section>
      );
    case "empty":
      return (
        <section data-component="LoadableSection" data-state="empty">
          <InfoBox title={copy.empty} />
        </section>
      );
    case "restricted":
      return (
        <section data-component="LoadableSection" data-state="restricted">
          <InfoBox description={state.reason} title={copy.restricted} tone="caution" />
        </section>
      );
    case "error":
      return (
        <section data-component="LoadableSection" data-state="error" role="alert">
          <InfoBox
            action={
              state.retryable && onRetry ? (
                <Button variant="ghost" size="xs" className="text-[var(--button-destructive-background)]" onClick={onRetry} type="button">
                  {copy.retry}
                </Button>
              ) : undefined
            }
            description={
              state.correlationId
                ? copy.correlationId.replace("{id}", state.correlationId)
                : undefined
            }
            title={copy.error}
            tone="risk"
          />
        </section>
      );
    default:
      return assertNever(state);
  }
}

export { LoadableSection };
export type { LoadableSectionCopy, LoadableSectionProps };

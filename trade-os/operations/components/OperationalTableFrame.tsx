import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cx } from "@trade-os/operations/components/ui/utils";

type OperationalTableFrameProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-label" | "role" | "tabIndex"
> & {
  "data-ui"?: string;
  keyboardScrollable?: boolean;
  label: string;
};

/**
 * Screen-level containment for dense operational tables.
 *
 * Callers opt in to the keyboard region contract only for tables that are
 * intentionally wider than their viewport. This avoids adding redundant
 * landmarks and tab stops to every ordinary table.
 */
const OperationalTableFrame = forwardRef<HTMLDivElement, OperationalTableFrameProps>(
  function OperationalTableFrame(
    {
      children,
      className,
      "data-ui": dataUi,
      keyboardScrollable = false,
      label,
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        aria-label={keyboardScrollable ? label : undefined}
        className={cx(
          "relative min-w-0 max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-accent",
          className,
        )}
        data-operational-table-frame="true"
        data-ui={dataUi ?? "operational-table-frame"}
        ref={ref}
        role={keyboardScrollable ? "region" : undefined}
        tabIndex={keyboardScrollable ? 0 : undefined}
      >
        {children}
      </div>
    );
  },
);

export { OperationalTableFrame };
export type { OperationalTableFrameProps };

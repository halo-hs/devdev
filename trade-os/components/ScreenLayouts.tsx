import type { ComponentProps, CSSProperties, ReactNode } from "react";


import { cn } from "@/lib/utils";


type ScreenLayoutProps = ComponentProps<"section"> & {
  titleBar: ReactNode;
  children: ReactNode;
};


type BodyProps = ComponentProps<"div"> & {
  maxWidth?: number | "none";
};


// erp-v2 deviation: the canonical class was `min-h-full`, which lets the section
// grow to content height so the inner `flex-1 min-h-0 overflow-y-auto` body never
// bounds to the shell and never scrolls in place (content overflows the viewport).
// `h-full min-h-0` gives the section a definite bounded height — matching the
// already-correct WorkbenchLayout below — so the inner body scrolls as designed.
const layoutRootClass =
  "flex h-full min-h-0 flex-col bg-[var(--color-gray-12)] max-sm:h-auto max-sm:min-h-0";
const scrollableBodyClass =
  "min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:auto] max-sm:flex-none max-sm:overflow-visible";

function ConstrainedBody({ maxWidth = 1440, className, children, ...props }: BodyProps) {
  const isNone = maxWidth === "none";
  const style: CSSProperties = {
    maxWidth: isNone ? "none" : `${maxWidth}px`,
    minWidth: isNone ? "0" : "min(100%, 1180px)",
  };

  return (
    <div
      className={cn("mx-auto grid w-full gap-4 px-7 pb-14 pt-6", className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}


function DashboardLayout({ titleBar, children, className, ...props }: ScreenLayoutProps) {
  return (
    <section className={cn(layoutRootClass, className)} data-layout="dashboard" {...props}>
      {titleBar}
      <div className={scrollableBodyClass}>
        <ConstrainedBody maxWidth="none" className="ops-content-width px-5 pt-4" data-ui="dashboard-body">{children}</ConstrainedBody>
      </div>
    </section>
  );
}





export { DashboardLayout };

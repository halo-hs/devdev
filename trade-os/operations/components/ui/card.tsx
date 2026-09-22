import type { CSSProperties, ReactNode } from "react";

import { cx } from "./utils";

export type BasicCardProps = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  containerStyle?: CSSProperties;
  title: ReactNode;
  titleClassName?: string;
};

export function BasicCard({
  children,
  className,
  containerStyle,
  contentClassName,
  title,
  titleClassName,
}: BasicCardProps) {
  return (
    <section
      className={cx(
        "w-full rounded-[16px] bg-ecoya-gray-12 pb-4 shadow-[var(--ecoya-shadow-card)]",
        className,
      )}
      data-ui="basic-card"
      style={containerStyle}
    >
      <h2
        className={cx(
          "m-2 flex h-12 items-center rounded-md bg-ecoya-gray-11 px-4 text-header-20 font-bold text-ecoya-gray-1",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {children ? (
        <div className={cx("px-6", contentClassName)} data-ui="basic-card-content">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function BasicCardTitleContainer({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("flex items-center px-4", className)}
      data-ui="basic-card-title-container"
    >
      {children}
    </div>
  );
}

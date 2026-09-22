"use client";

import type { CSSProperties, ReactNode } from "react";

import { ecoyaIllustration } from "@trade-os/operations/lib/assets";

import { Icon } from "./icon";
import { cx } from "./utils";

type TooltipProps = {
  children?: ReactNode;
  className?: string;
  /** Visual tone of the tooltip bubble — indigo (default) or gray. */
  tone?: TooltipTone;
};

type EtcBadgeColor =
  | "blue"
  | "gray-cancel"
  | "gray-complete"
  | "grape"
  | "green"
  | "lime"
  | "orange"
  | "pink"
  | "red"
  | "yellow";

type EtcBadgeSize = "S" | "L";
type EtcBadgeVariant = "fill" | "stroke";

type EtcBadgeProps = {
  children?: ReactNode;
  className?: string;
  color?: EtcBadgeColor;
  size?: EtcBadgeSize;
  variant?: EtcBadgeVariant;
};

type EtcChipColor = "blue" | "gray" | "green" | "red" | "tab";
type EtcChipSize = "S" | "L";

type EtcChipProps = {
  children?: ReactNode;
  className?: string;
  color?: EtcChipColor;
  disabled?: boolean;
  /** Renders the chip in an error/invalid visual state. */
  invalid?: boolean;
  /** Callback fired when the remove button is clicked. */
  onRemove?: () => void;
  /** Accessible label for the remove button. Defaults to '삭제'. */
  removeLabel?: string;
  size?: EtcChipSize;
};

type EtcScrollProps = {
  className?: string;
  height?: "default" | "dropdown";
};

type EtcDividerProps = {
  className?: string;
  direction?: "horizontal" | "vertical";
};

type EtcNoDataProps = {
  className?: string;
  label?: ReactNode;
};

type EtcDimProps = {
  className?: string;
  /** Callback fired when the dim layer is clicked (e.g., to close an overlay). */
  onClick?: () => void;
  /** When true, renders as a fixed full-screen dim layer (z-side-nav). Default is a 200×200 static swatch. */
  overlay?: boolean;
};

type TooltipTone = "gray" | "indigo";

export type LoaderProps = {
  className?: string;
  size?: number;
  style?: CSSProperties;
  tickColor?: string;
  trackColor?: string;
};

type CenteredLoaderProps = {
  className?: string;
  size?: number;
};

type PageLoaderProps = {
  className?: string;
  message?: ReactNode;
  size?: number;
};

export type NotificationBadgeProps = {
  className?: string;
  count?: number;
  variant?: "dot" | "number";
};

export type ProgressBarProps = {
  className?: string;
  icon?: ReactNode;
  showText?: boolean;
  value: number;
  width?: number | string;
};

const badgeFillClasses: Record<EtcBadgeColor, string> = {
  blue: "bg-ecoya-system-blue-6 text-[color:var(--ecoya-system-blue-2)]",
  "gray-cancel": "bg-ecoya-gray-10 text-[color:var(--ecoya-gray-7)]",
  "gray-complete": "bg-ecoya-gray-10 text-[color:var(--ecoya-gray-4)]",
  grape: "bg-ecoya-system-grape-6 text-[color:var(--ecoya-system-grape-2)]",
  green: "bg-ecoya-system-green-6 text-[color:var(--ecoya-system-green-1)]",
  lime: "bg-ecoya-system-lime-5 text-[color:var(--ecoya-system-lime-1)]",
  orange: "bg-ecoya-system-orange-6 text-[color:var(--ecoya-system-orange-2)]",
  pink: "bg-ecoya-system-pink-6 text-[color:var(--ecoya-system-pink-2)]",
  red: "bg-ecoya-system-red-8 text-[color:var(--ecoya-system-red-2)]",
  yellow: "bg-ecoya-system-yellow-6 text-[color:var(--ecoya-system-yellow-1)]",
};

const badgeStrokeClasses: Partial<Record<EtcBadgeColor, string>> = {
  grape:
    "border-ecoya-system-grape-3 text-[color:var(--ecoya-system-grape-3)]",
  green:
    "border-ecoya-system-green-1 text-[color:var(--ecoya-system-green-1)]",
  red: "border-ecoya-system-red-2 text-[color:var(--ecoya-system-red-2)]",
};

const chipToneClasses: Record<Exclude<EtcChipColor, "tab">, string> = {
  blue: "bg-ecoya-blue-10 text-[color:var(--ecoya-blue-4)]",
  gray: "bg-ecoya-gray-11 text-[color:var(--ecoya-gray-4)]",
  green:
    "bg-ecoya-system-green-6 text-[color:var(--ecoya-system-green-1)]",
  red: "bg-ecoya-system-red-8 text-[color:var(--ecoya-system-red-2)]",
};

const tooltipToneClasses: Record<TooltipTone, string> = {
  gray: "bg-ecoya-gray-2",
  indigo: "bg-ecoya-indigo",
};

export function Tooltip({
  children,
  className,
  tone = "indigo",
}: TooltipProps) {
  return (
    <div
      className={cx(
        "inline-flex w-max items-center justify-center rounded-[8px] px-3 py-1 text-body-13 font-regular text-ecoya-gray-12 whitespace-nowrap",
        tooltipToneClasses[tone],
        className,
      )}
      data-ui="tooltip"
    >
      {children}
    </div>
  );
}

export function EtcNoData({ className, label = "No data" }: EtcNoDataProps) {
  return (
    <div
      className={cx(
        "flex w-full flex-col items-center justify-center px-10 py-4",
        className,
      )}
      data-ui="etc-no-data"
    >
      <span
        aria-hidden="true"
        className="size-14 shrink-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${ecoyaIllustration("Bag_Gray")}")` }}
      />
      <span className="text-body-16 font-medium text-ecoya-gray-8">
        {label}
      </span>
    </div>
  );
}

export function EtcDim({ className, onClick, overlay = false }: EtcDimProps) {
  return (
    // a11y-exception(gap, SC-2.1.1): UNRESOLVED, not a justified pattern.
    // Unlike the ui/dialog.tsx and ui/alert.tsx backdrops, EtcDim has no
    // Escape handler and no sibling close control: when `overlay` is set,
    // clicking the dim is the ONLY way to dismiss it (see the sole caller,
    // design-system/dialog-demos.tsx EtcDimOverlayDemo), so a keyboard user
    // who opens it is stuck behind a full-screen layer — SC 2.1.2 as well.
    // Blast radius is the /design-system preview page only; EtcDim has no
    // production ERP/Snap caller. Recorded in docs/a11y/README.md rather
    // than silently suppressed. Fixing it means giving EtcDim a real
    // dismissal contract, which is a component change and not this gate's
    // scope.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={cx(
        "bg-(--ecoya-dim)",
        overlay
          ? "fixed inset-0 z-(--ecoya-z-side-nav)"
          : "h-[200px] w-[200px]",
        className,
      )}
      data-ui="etc-dim"
      onClick={onClick}
    />
  );
}

export function EtcScroll({ className, height = "default" }: EtcScrollProps) {
  const heightClass = height === "dropdown" ? "h-[235px]" : "h-[200px]";

  return (
    <div
      className={cx("flex w-4 flex-col items-center p-1", heightClass, className)}
      data-ui="etc-scroll"
    >
      <div className="relative h-full w-2 rounded-xl bg-ecoya-gray-10">
        <div className="absolute left-0 top-0 h-[51px] w-2 rounded-[5px] border border-ecoya-gray-8 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input)]" />
      </div>
    </div>
  );
}

export function EtcLoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cx("relative h-[19px] w-[57px]", className)}
      data-ui="etc-loading-spinner"
    >
      <span className="absolute left-0 top-1.5 size-[7px] rounded-full bg-ecoya-blue-8" />
      <span className="absolute left-[20px] top-1 size-[11px] rounded-full bg-ecoya-blue-5" />
      <span className="absolute left-[41px] top-0 size-[19px] rounded-full bg-ecoya-blue-4" />
    </div>
  );
}

export function EtcLoadingEllips({ className }: { className?: string }) {
  return (
    <div
      className={cx("relative size-6", className)}
      data-ui="etc-loading-ellips"
    >
      <span className="absolute left-1/2 top-0 size-1 -translate-x-1/2 rounded-full bg-ecoya-blue-4" />
      <span className="absolute right-0 top-1/2 size-1 -translate-y-1/2 rounded-full bg-ecoya-blue-6" />
      <span className="absolute bottom-0 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ecoya-blue-8" />
      <span className="absolute left-0 top-1/2 size-1 -translate-y-1/2 rounded-full bg-ecoya-blue-6" />
      <span className="absolute left-[4px] top-[4px] size-[5px] rounded-full bg-ecoya-blue-5" />
      <span className="absolute right-[4px] top-[4px] size-[5px] rounded-full bg-ecoya-blue-5" />
    </div>
  );
}

export function Loader({
  className,
  size = 20,
  style,
  tickColor = "var(--ecoya-blue-4)",
  trackColor = "rgba(22, 109, 215, 0.2)",
}: LoaderProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block shrink-0 animate-spin rounded-full", className)}
      data-ui="loader"
      style={{
        border: `3px solid ${trackColor}`,
        borderBottomColor: tickColor,
        height: size,
        width: size,
        ...style,
      }}
    />
  );
}

export function CenteredLoader({
  className,
  size = 32,
}: CenteredLoaderProps) {
  return (
    <div
      className={cx("flex h-full items-center justify-center", className)}
      data-ui="centered-loader"
    >
      <Loader size={size} />
    </div>
  );
}

export function PageLoader({
  className,
  message = "Loading",
  size = 60,
}: PageLoaderProps) {
  return (
    <div
      className={cx("flex flex-col items-center gap-10", className)}
      data-ui="page-loader"
    >
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ height: size, width: size }}
      >
        <svg fill="none" height={size} viewBox="0 0 60 60" width={size}>
          <path
            d="M60 30C60 46.5685 46.5685 60 30 60C13.4315 60 0 46.5685 0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30ZM7.5997 30C7.5997 42.3713 17.6287 52.4003 30 52.4003C42.3713 52.4003 52.4003 42.3713 52.4003 30C52.4003 17.6287 42.3713 7.5997 30 7.5997C17.6287 7.5997 7.5997 17.6287 7.5997 30Z"
            fill="var(--ecoya-blue-4)"
            fillOpacity="0.2"
          />
          <g className="animate-spin origin-center">
            <path
              d="M29.4742 5.3738C25.6887 9.15928 20.9592 11.8628 15.7765 13.204C10.5937 14.5451 5.1465 14.4749 8.91916e-08 13.0008L2.0927 5.69489C5.93548 6.79561 10.0028 6.848 13.8726 5.8466C17.7425 4.84521 21.2739 2.82653 24.1004 1.12697e-06L29.4742 5.3738Z"
              fill="var(--ecoya-system-blue-4)"
              transform="translate(21.738, 45.84)"
            />
          </g>
        </svg>
      </span>
      <p className="m-0 whitespace-pre-line text-center text-body-16 font-medium text-ecoya-gray-3">
        {message}
      </p>
    </div>
  );
}

export function EtcDivider({
  className,
  direction = "horizontal",
}: EtcDividerProps) {
  return (
    <div
      className={cx(
        "shrink-0 bg-ecoya-gray-9",
        direction === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      data-ui="etc-divider"
    />
  );
}

export function EtcBadge({
  children,
  className,
  color = "yellow",
  size = "S",
  variant = "fill",
}: EtcBadgeProps) {
  const isLarge = size === "L";
  const isStroke = variant === "stroke";
  const toneClass = isStroke
    ? (badgeStrokeClasses[color] ?? badgeStrokeClasses.grape)
    : badgeFillClasses[color];

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-[24px] whitespace-nowrap",
        isStroke && "border bg-ecoya-gray-12",
        isLarge
          ? cx(
              "h-7 px-[14px] py-1 text-badge-16 font-medium",
              isStroke && "px-[13px]",
            )
          : isStroke
            ? "h-5 px-[9px] text-badge-12 font-medium"
            : "h-5 px-2.5 py-0.5 text-badge-12 font-medium",
        toneClass,
        className,
      )}
      data-ui="etc-badge"
    >
      {children}
    </span>
  );
}

export function NotificationBadge({
  className,
  count = 0,
  variant = "dot",
}: NotificationBadgeProps) {
  if (variant === "dot") {
    return (
      <span
        aria-hidden="true"
        className={cx("block size-2.5 shrink-0 rounded-full bg-ecoya-system-red-2", className)}
        data-ui="notification-badge"
      />
    );
  }

  return (
    <span
      className={cx(
        "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full border border-ecoya-gray-12 bg-ecoya-system-red-2 px-1 py-0.5",
        className,
      )}
      data-ui="notification-badge"
      style={{ color: "var(--ecoya-gray-12)" }}
    >
      <span className="text-button-11 font-medium">
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

export function ProgressBar({
  className,
  icon,
  showText = true,
  value,
  width,
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const barWidth = typeof width === "number" ? `${width}px` : (width ?? "100%");

  return (
    <div
      className={cx("flex items-center gap-2", className)}
      data-ui="progress-bar"
    >
      {icon ? (
        <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-full">
          {icon}
        </span>
      ) : null}
      <span
        className="relative h-1.5 overflow-hidden rounded-[15px] bg-ecoya-gray-9"
        style={{ width: barWidth }}
      >
        <span
          className="absolute left-0 top-0 h-full rounded-[15px] bg-ecoya-blue-4 transition-[width] duration-300 ease-[ease]"
          style={{ width: `${clampedValue}%` }}
        />
      </span>
      {showText ? (
        <span
          className="whitespace-nowrap text-body-14 font-medium"
          style={{ color: "var(--ecoya-blue-4)" }}
        >
          {Math.round(clampedValue)}%
        </span>
      ) : null}
    </div>
  );
}

export function EtcChip({
  children,
  className,
  color = "blue",
  disabled = false,
  invalid = false,
  onRemove,
  removeLabel = "Remove",
  size = "S",
}: EtcChipProps) {
  const isLarge = size === "L" || color === "tab";
  const toneClass =
    color === "tab"
      ? disabled
        ? "border border-ecoya-gray-10 bg-ecoya-gray-10 text-[color:var(--ecoya-gray-6)] shadow-[var(--shadow-tag-disabled)] cursor-not-allowed"
        : "bg-ecoya-blue-10 text-[color:var(--ecoya-blue-4)] shadow-[var(--shadow-tag-valid)] cursor-pointer"
      : cx(
          chipToneClasses[color],
          disabled
            ? "shadow-[var(--shadow-tag-disabled)] cursor-not-allowed"
            : invalid
              ? "shadow-[var(--shadow-tag-invalid)] cursor-pointer"
              : "shadow-[var(--shadow-tag-valid)] cursor-pointer",
        );

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-[64px] whitespace-nowrap",
        isLarge
          ? "h-[42px] gap-1 py-2 pl-4 pr-3.5 text-button-15 font-medium"
          : "h-[26px] gap-1 py-0.5 pl-2 pr-1.5 text-button-15 font-medium",
        toneClass,
        className,
      )}
      data-ui="etc-chip"
    >
      <span>{children}</span>
      {onRemove ? (
        <button
          aria-label={removeLabel}
          className="inline-flex shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          type="button"
        >
          <Icon
            className={isLarge ? "size-[22px]" : "size-4"}
            name="icon-close"
          />
        </button>
      ) : null}
    </span>
  );
}

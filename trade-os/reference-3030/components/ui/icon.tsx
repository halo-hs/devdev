"use client";

import type { ComponentType, MouseEvent, PointerEvent, SVGProps } from "react";
import type { CSSProperties } from "react";

import { ecoyaIcon } from "@trade-os/reference-3030/lib/assets";

import { cx } from "./utils";

type SvgIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type IconBaseProps = {
  className?: string;
  color?: string;
  onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLSpanElement>) => void;
  size?: number;
};

export type IconProps = IconBaseProps &
  (
    | {
        icon: SvgIconComponent;
        name?: never;
      }
    | {
        icon?: never;
        name: string;
      }
  );

function baseStyle({ color, size }: Pick<IconBaseProps, "color" | "size">): CSSProperties | undefined {
  if (!color && !size) return undefined;

  return {
    color,
    height: size,
    width: size,
  };
}

function maskStyle(name: string, base?: CSSProperties): CSSProperties {
  const url = ecoyaIcon(name);

  return {
    ...base,
    WebkitMask: `url("${url}") center / contain no-repeat`,
    mask: `url("${url}") center / contain no-repeat`,
  };
}

export function Icon({
  className,
  color,
  icon: SvgIcon,
  name,
  onClick,
  onPointerDown,
  size,
}: IconProps) {
  const wrapperClassName = cx(
    "inline-flex shrink-0 items-center justify-center align-middle",
    onClick && "cursor-pointer",
    className,
  );
  const style = baseStyle({ color, size });

  if (SvgIcon) {
    return (
      <span
        aria-hidden="true"
        className={wrapperClassName}
        data-ui="icon"
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
      >
        <SvgIcon
          className="block"
          fill={color || "currentColor"}
          height={size ?? 16}
          width={size ?? 16}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cx("bg-current", wrapperClassName)}
      data-icon={name}
      data-ui="icon"
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={maskStyle(name, style)}
    />
  );
}

export function CancelCircleIcon({
  className,
  xFill = "white",
}: {
  className?: string;
  xFill?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cx("inline-flex shrink-0 align-middle text-ecoya-gray-7", className)}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" fill="currentColor" r="10" />
      <path
        clipRule="evenodd"
        d="M8.4381 8.43859C8.74879 8.12789 9.25241 8.12789 9.5631 8.43859L12.0006 10.8761L14.4381 8.43859C14.7488 8.12789 15.2534 8.12789 15.5641 8.43859C15.8747 8.74928 15.8748 9.25388 15.5641 9.56456L13.1256 12.0011L15.5631 14.4386C15.8738 14.7493 15.8738 15.2529 15.5631 15.5636C15.2524 15.8743 14.7488 15.8743 14.4381 15.5636L12.0006 13.1261L9.5631 15.5646C9.25242 15.8752 8.7488 15.8752 8.4381 15.5646C8.1274 15.2539 8.1274 14.7503 8.4381 14.4396L10.8756 12.0011L8.4381 9.56359C8.12741 9.25289 8.1274 8.74928 8.4381 8.43859Z"
        fill={xFill}
        fillRule="evenodd"
      />
    </svg>
  );
}

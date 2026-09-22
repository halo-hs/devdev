"use client";

import { cloneElement, isValidElement } from "react";
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
} from "react";

import { cx } from "./utils";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";
type ButtonIntent = "brand" | "danger";
type ButtonSize = "lg" | "md" | "sm";
type ButtonVisualState = "default" | "hover" | "pressed" | "disabled";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  intent?: ButtonIntent;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  visualState?: ButtonVisualState;
};

export type IconButtonProps = Omit<ButtonProps, "iconOnly">;

export type CircleIconButtonSize = 40 | 32 | 24;

export type CircleIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: CircleIconButtonSize;
};

export type ImageMoreButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  count: number;
};

const buttonStyles: Record<
  `${ButtonVariant}:${ButtonIntent}`,
  Record<ButtonVisualState, string>
> = {
  "primary:brand": {
    default:
      "bg-ecoya-indigo text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-blue)]",
    hover:
      "bg-ecoya-indigo text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-blue-hover)]",
    pressed:
      "bg-ecoya-indigo text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-blue-pressed)]",
    disabled:
      "bg-ecoya-gray-7 text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-blue-disabled)]",
  },
  "primary:danger": {
    default:
      "bg-ecoya-system-red-2 text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-red)]",
    hover:
      "bg-ecoya-system-red-2 text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-red-hover)]",
    pressed:
      "bg-ecoya-system-red-2 text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-red-pressed)]",
    disabled:
      "bg-ecoya-system-red-6 text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-red-disabled)]",
  },
  "secondary:brand": {
    default:
      "bg-ecoya-blue-10 text-ecoya-indigo shadow-[var(--ecoya-shadow-button-blue)]",
    hover:
      "bg-ecoya-blue-10 text-ecoya-indigo shadow-[var(--ecoya-shadow-button-blue-hover)]",
    pressed:
      "bg-ecoya-blue-10 text-ecoya-indigo shadow-[var(--ecoya-shadow-button-blue-pressed)]",
    disabled:
      "bg-ecoya-gray-11 text-ecoya-gray-8 shadow-[var(--ecoya-shadow-button-blue-disabled)]",
  },
  "secondary:danger": {
    default:
      "bg-ecoya-system-red-8 text-ecoya-system-red-2 shadow-[var(--ecoya-shadow-button-red)]",
    hover:
      "bg-ecoya-system-red-8 text-ecoya-system-red-2 shadow-[var(--ecoya-shadow-button-red-hover)]",
    pressed:
      "bg-ecoya-system-red-8 text-ecoya-system-red-1 shadow-[var(--ecoya-shadow-button-red-pressed)]",
    disabled:
      "bg-ecoya-system-red-8 text-ecoya-system-red-6 shadow-[var(--ecoya-shadow-button-red-disabled)]",
  },
  "tertiary:brand": {
    default:
      "bg-ecoya-gray-12 text-ecoya-gray-2 shadow-[var(--ecoya-shadow-button-black)]",
    hover:
      "bg-ecoya-gray-12 text-ecoya-gray-2 shadow-[var(--ecoya-shadow-button-black-hover)]",
    pressed:
      "bg-ecoya-gray-12 text-ecoya-gray-1 shadow-[var(--ecoya-shadow-button-black-pressed)]",
    disabled:
      "bg-ecoya-gray-12 text-ecoya-gray-8 shadow-[var(--ecoya-shadow-button-black-disabled)]",
  },
  "tertiary:danger": {
    default:
      "bg-ecoya-gray-12 text-ecoya-system-red-2 shadow-[var(--ecoya-shadow-button-black)]",
    hover:
      "bg-ecoya-gray-12 text-ecoya-system-red-2 shadow-[var(--ecoya-shadow-button-black-hover)]",
    pressed:
      "bg-ecoya-gray-12 text-ecoya-system-red-1 shadow-[var(--ecoya-shadow-button-red-pressed)]",
    disabled:
      "bg-ecoya-gray-12 text-ecoya-system-red-6 shadow-[var(--ecoya-shadow-button-red-disabled)]",
  },
  "ghost:brand": {
    default: "bg-transparent text-ecoya-blue-4 shadow-none",
    hover: "bg-transparent text-ecoya-blue-5 shadow-none",
    pressed: "bg-transparent text-ecoya-blue-6 shadow-none",
    disabled: "bg-transparent text-ecoya-gray-8 shadow-none",
  },
  "ghost:danger": {
    default: "bg-transparent text-ecoya-system-red-2 shadow-none",
    hover: "bg-transparent text-ecoya-system-red-1 shadow-none",
    pressed: "bg-transparent text-ecoya-system-red-1 shadow-none",
    disabled: "bg-transparent text-ecoya-gray-8 shadow-none",
  },
};

const interactiveStyles: Record<`${ButtonVariant}:${ButtonIntent}`, string> = {
  "primary:brand":
    "enabled:hover:shadow-[var(--ecoya-shadow-button-blue-hover)] enabled:active:shadow-[var(--ecoya-shadow-button-blue-pressed)] focus-visible:shadow-[var(--ecoya-shadow-button-blue-pressed)]",
  "primary:danger":
    "enabled:hover:shadow-[var(--ecoya-shadow-button-red-hover)] enabled:active:shadow-[var(--ecoya-shadow-button-red-pressed)] focus-visible:shadow-[var(--ecoya-shadow-button-red-pressed)]",
  "secondary:brand":
    "enabled:hover:shadow-[var(--ecoya-shadow-button-blue-hover)] enabled:active:shadow-[var(--ecoya-shadow-button-blue-pressed)] focus-visible:shadow-[var(--ecoya-shadow-button-blue-pressed)]",
  "secondary:danger":
    "enabled:hover:shadow-[var(--ecoya-shadow-button-red-hover)] enabled:active:shadow-[var(--ecoya-shadow-button-red-pressed)] focus-visible:shadow-[var(--ecoya-shadow-button-red-pressed)]",
  "tertiary:brand":
    "enabled:hover:shadow-[var(--ecoya-shadow-button-black-hover)] enabled:active:shadow-[var(--ecoya-shadow-button-black-pressed)] focus-visible:shadow-[var(--ecoya-shadow-button-black-pressed)]",
  "tertiary:danger":
    "enabled:hover:shadow-[var(--ecoya-shadow-button-black-hover)] enabled:active:shadow-[var(--ecoya-shadow-button-red-pressed)] focus-visible:shadow-[var(--ecoya-shadow-button-red-pressed)]",
  "ghost:brand":
    "enabled:hover:text-ecoya-blue-5 enabled:active:text-ecoya-blue-6",
  "ghost:danger":
    "enabled:hover:text-ecoya-system-red-1 enabled:active:text-ecoya-system-red-1",
};

/* FIGMA-RADIUS-01 (2026-09-07) — 라운드 값은 유틸 별칭이 정본을 들고 있다.
 *
 * Figma SNAP 2.0 node 48:5 의 Button 은 높이별로 24px→r/sm(6) · 32px→r/md(8) ·
 * 40px→r/md(8) 이다(추출본 전 노드 codegen 56건 집계, 충돌 0). 아래 구조 매핑
 * (h-6→rounded-sm · h-8/h-10→rounded-md)은 처음부터 그 정본과 같았고, 틀린 것은
 * 별칭이 가리키던 **값**뿐이었다(rounded-md 가 --ecoya-radius-md=10px 로 풀려
 * +2px). 그래서 여기서는 리터럴로 치환하지 않는다 — globals.css 의
 * FIGMA-RADIUS-01 이 `--radius-sm/md` 를 6/8px 로 옮겨 이 세 줄이 그대로 정본
 * 픽셀을 렌더한다. 리터럴 치환은 이 컴포넌트만 고치고 같은 별칭을 쓰는 나머지
 * 표면(총 1068곳/263파일)을 그대로 두므로 클래스를 닫지 못한다. */
const sizeBase: Record<ButtonSize, string> = {
  lg: "h-10 rounded-md text-button-15",
  md: "h-8 rounded-md text-button-15",
  sm: "h-6 rounded-sm text-button-13",
};

function sizeSpacing({
  iconOnly,
  intent,
  loading,
  leadingIcon,
  size,
  trailingIcon,
  variant,
}: {
  iconOnly: boolean;
  intent: ButtonIntent;
  loading: boolean;
  leadingIcon: boolean;
  size: ButtonSize;
  trailingIcon: boolean;
  variant: ButtonVariant;
}) {
  if (loading) {
    if (size === "lg") return "w-[52px] px-4 py-2.5";
    if (size === "md") return "w-[42px] px-3 py-1.5";
    return variant === "primary" && intent === "brand" ? "w-[30px]" : "w-8";
  }

  if (iconOnly) {
    if (size === "lg") return "size-10 p-0";
    if (size === "md") return "size-8 p-0";
    return "size-6 p-0";
  }

  if (size === "lg") return leadingIcon || trailingIcon ? "gap-1 px-3" : "px-4 py-2.5";
  if (size === "md") {
    if (leadingIcon && trailingIcon) return "gap-1 px-2 py-1.5";
    if (leadingIcon) return "gap-1 py-1.5 pl-2 pr-3";
    if (trailingIcon) return "gap-1 py-1.5 pl-3 pr-2";
    return "px-3 py-1.5";
  }

  if (leadingIcon && trailingIcon) return "gap-0.5 px-1";
  if (leadingIcon) return "gap-0.5 pl-1 pr-2";
  if (trailingIcon) return "gap-0.5 pl-2 pr-1";
  return "px-2";
}

function iconClass(size: ButtonSize, iconOnly: boolean) {
  if (iconOnly) return size === "sm" ? "size-4" : "size-5";
  return "size-4";
}

function loadingClass(size: ButtonSize, variant: ButtonVariant, intent: ButtonIntent) {
  if (size === "lg") return "size-5";
  if (size === "md") return "size-[18px]";
  return variant === "primary" && intent === "brand"
    ? "size-[14px]"
    : "size-4";
}

function loadingPalette(variant: ButtonVariant, state: ButtonVisualState) {
  if (state === "disabled") {
    if (variant === "primary") {
      return {
        track: "var(--ecoya-gray-12)",
        trackOpacity: 0.5,
        segment: "var(--ecoya-gray-7)",
      };
    }

    return {
      track: "var(--ecoya-gray-9)",
      segment: "var(--ecoya-gray-7)",
    };
  }

  if (variant === "primary") {
    return {
      track: "var(--ecoya-gray-12)",
      trackOpacity: 0.5,
      segment: "var(--ecoya-blue-5)",
    };
  }

  if (variant === "secondary") {
    return {
      track: "var(--ecoya-blue-4)",
      trackOpacity: 0.2,
      segment: "var(--ecoya-system-blue-4)",
    };
  }

  return {
    track: "var(--ecoya-blue-4)",
    trackOpacity: 0.2,
    segment: "var(--ecoya-blue-5)",
  };
}

function ButtonLoadingIcon({
  intent,
  size,
  state,
  variant,
}: {
  intent: ButtonIntent;
  size: ButtonSize;
  state: ButtonVisualState;
  variant: ButtonVariant;
}) {
  const palette = loadingPalette(variant, state);

  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative block shrink-0 animate-spin overflow-hidden",
        loadingClass(size, variant, intent),
      )}
    >
      <svg
        className="absolute inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 20 20"
      >
        <path
          d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM2.53323 10C2.53323 14.1238 5.87622 17.4668 10 17.4668C14.1238 17.4668 17.4668 14.1238 17.4668 10C17.4668 5.87622 14.1238 2.53323 10 2.53323C5.87622 2.53323 2.53323 5.87622 2.53323 10Z"
          fill={palette.track}
          fillOpacity={palette.trackOpacity ?? 1}
        />
      </svg>
      <span className="absolute bottom-0 left-[36.23%] right-[14.64%] top-[76.4%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 9.82473 4.7202"
        >
          <path
            d="M9.82473 1.79127C8.56291 3.05309 6.98642 3.95428 5.25883 4.40132C3.53124 4.84837 1.7155 4.82498 -1.29215e-07 4.33359L0.697568 1.89829C1.97849 2.2652 3.33426 2.28266 4.62421 1.94887C5.91416 1.61507 7.09129 0.942175 8.03346 1.50874e-07L9.82473 1.79127Z"
            fill={palette.segment}
          />
        </svg>
      </span>
    </span>
  );
}

function circleIconSizeClass(size: CircleIconButtonSize) {
  if (size === 40) return "size-10 [&_svg]:size-6 [span[data-ui='icon']]:size-6";
  if (size === 32) return "size-8 [&_svg]:size-5 [span[data-ui='icon']]:size-5";
  return "size-6 [&_svg]:size-4 [span[data-ui='icon']]:size-4";
}

export function Button({
  asChild = false,
  children,
  className,
  disabled,
  iconOnly: iconOnlyProp,
  intent = "brand",
  leadingIcon,
  loading = false,
  size = "md",
  trailingIcon,
  type = "button",
  variant = "primary",
  visualState,
  ...props
}: ButtonProps) {
  const iconOnly =
    iconOnlyProp ?? (!children && Boolean(leadingIcon || trailingIcon));
  const isDisabled = disabled || visualState === "disabled";
  // WAI-ARIA APG disabled-control pattern: `aria-disabled` marks a control
  // inactive while keeping it in the tab order, so assistive technology can
  // land on it and read the `aria-describedby` reason — something the native
  // `disabled` attribute makes impossible. Such a button must still *look*
  // inactive and must not offer hover/press affordances, so it resolves to the
  // disabled visual state without ever receiving the native attribute.
  const ariaDisabled =
    props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const isInactive = isDisabled || ariaDisabled;
  const styleKey = `${variant}:${intent}` as const;
  const resolvedState = isInactive ? "disabled" : (visualState ?? "default");
  const showInteractiveStyles = !visualState && !isInactive && !loading;
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);
  const buttonClassName = cx(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap border-0 font-medium outline-none transition-all duration-150",
    "disabled:pointer-events-none",
    // 정본 actions.md:108: button primary focus = blue-5 (컨트롤 blue-4와 의도적 구분)
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-5",
    variant !== "ghost" &&
      !isInactive &&
      "enabled:hover:-translate-y-0.5 enabled:active:translate-y-0",
    (isDisabled || loading) && "pointer-events-none",
    // An `aria-disabled` button still receives the click — the handler is what
    // refuses — so it keeps pointer events and only signals refusal visually.
    ariaDisabled && !isDisabled && !loading && "cursor-not-allowed",
    sizeBase[size],
    sizeSpacing({
      iconOnly,
      intent,
      leadingIcon: hasLeadingIcon,
      loading,
      size,
      trailingIcon: hasTrailingIcon,
      variant,
    }),
    buttonStyles[styleKey][resolvedState],
    showInteractiveStyles && interactiveStyles[styleKey],
    className,
  );
  const content = loading ? (
    <ButtonLoadingIcon
      intent={intent}
      size={size}
      state={resolvedState}
      variant={variant}
    />
  ) : (
    <>
      {leadingIcon ? (
        <span
          aria-hidden="true"
          className={cx("shrink-0 text-current", iconClass(size, iconOnly))}
        >
          {leadingIcon}
        </span>
      ) : null}
      {children ? <span className="shrink-0">{children}</span> : null}
      {trailingIcon ? (
        <span
          aria-hidden="true"
          className={cx("shrink-0 text-current", iconClass(size, iconOnly))}
        >
          {trailingIcon}
        </span>
      ) : null}
    </>
  );

  if (asChild && isValidElement(children)) {
    type ButtonChildProps = {
      className?: string;
      children?: ReactNode;
      onClick?: (event: MouseEvent<HTMLElement>) => void;
      tabIndex?: number;
      "aria-disabled"?: boolean;
      [key: string]: unknown;
    };
    const child = children as ReactElement<ButtonChildProps>;
    const inactiveChildProps = isDisabled || loading
      ? {
          "aria-disabled": true,
          onClick: (event: MouseEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
          },
          tabIndex: -1,
        }
      : null;

    const childCloneProps: Partial<ButtonChildProps> = {
      ...(props as unknown as ButtonChildProps),
      ...inactiveChildProps,
      "data-reference-button": variant,
      className: cx(buttonClassName, child.props.className),
      children: loading ? (
        <ButtonLoadingIcon
          intent={intent}
          size={size}
          state={resolvedState}
          variant={variant}
        />
      ) : (
        <>
          {leadingIcon ? (
            <span
              aria-hidden="true"
              className={cx("shrink-0 text-current", iconClass(size, iconOnly))}
            >
              {leadingIcon}
            </span>
          ) : null}
          {child.props.children ? <span className="shrink-0">{child.props.children}</span> : null}
          {trailingIcon ? (
            <span
              aria-hidden="true"
              className={cx("shrink-0 text-current", iconClass(size, iconOnly))}
            >
              {trailingIcon}
            </span>
          ) : null}
        </>
      ),
    };

    return cloneElement(child, childCloneProps);
  }

  return (
    <button
      className={buttonClassName}
      data-reference-button={variant}
      disabled={isDisabled || loading}
      type={type}
      {...props}
    >
      {content}
    </button>
  );
}

export function IconButton({
  intent = "brand",
  variant = "tertiary",
  ...props
}: IconButtonProps) {
  return <Button {...props} iconOnly intent={intent} variant={variant} />;
}

export function CircleIconButton({
  children,
  className,
  disabled,
  size = 40,
  type = "button",
  ...props
}: CircleIconButtonProps) {
  return (
    <button
      aria-disabled={disabled}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-[rgba(0,0,0,0.2)] text-ecoya-gray-12 outline-none transition-all duration-150",
        "enabled:hover:bg-[rgba(0,0,0,0.3)] enabled:active:bg-[rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-5 disabled:cursor-not-allowed disabled:opacity-50",
        circleIconSizeClass(size),
        className,
      )}
      data-ui="circle-icon-button"
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function ImageMoreButton({
  className,
  count,
  disabled,
  type = "button",
  ...props
}: ImageMoreButtonProps) {
  return (
    <button
      aria-disabled={disabled}
      className={cx(
        "inline-flex size-[98px] cursor-pointer flex-col items-center justify-center rounded-[8px] bg-ecoya-blue-10 shadow-[inset_0_0_0_1px_rgba(23,98,195,0.2)] outline-none transition-all duration-150",
        "enabled:hover:bg-ecoya-blue-9 enabled:active:bg-ecoya-blue-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-5 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      data-ui="image-more-button"
      disabled={disabled}
      type={type}
      {...props}
    >
      <span className="text-[18px] font-bold leading-[27px] text-ecoya-blue-4">+{count}</span>
      <span className="text-button-13 font-medium text-ecoya-blue-4">Show more</span>
    </button>
  );
}

export function ButtonPlusIcon() {
  return (
    <svg aria-hidden="true" className="size-full" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.83176 0C6.08489 0 6.29413 0.188009 6.32729 0.432052L6.33186 0.499898L6.33267 5.33333H11.1681C11.4442 5.33333 11.6681 5.55719 11.6681 5.83333C11.6681 6.08646 11.48 6.29566 11.2359 6.32877L11.1681 6.33333H6.33267L6.33403 11.1661C6.33409 11.4422 6.11027 11.6662 5.83413 11.6662C5.581 11.6662 5.37177 11.4782 5.33861 11.2341L5.33403 11.1663L5.33267 6.33333H0.5C0.223858 6.33333 0 6.10948 0 5.83333C0 5.5802 0.188103 5.37101 0.432153 5.3379L0.5 5.33333H5.33267L5.33186 0.500102C5.33181 0.223959 5.55562 0 5.83176 0Z"
        fill="currentColor"
        transform="translate(2 2)"
      />
    </svg>
  );
}

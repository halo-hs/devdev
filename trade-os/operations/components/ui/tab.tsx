"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { Icon } from "./icon";
import { cx } from "./utils";

export type TabVariant = "line" | "fill" | "chip";

export type TabItemProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  closeLabel?: string;
  disabled?: boolean;
  onClose?: () => void;
  selected?: boolean;
  showClose?: boolean;
  variant?: TabVariant;
};

export type TabGroupProps = HTMLAttributes<HTMLDivElement> & {
  variant?: TabVariant;
};

function tabColor(variant: TabVariant, selected: boolean) {
  if (variant === "line") return selected ? "var(--ecoya-gray-2)" : "var(--ecoya-gray-6)";
  if (variant === "fill") return selected ? "var(--ecoya-gray-12)" : "var(--ecoya-gray-6)";
  return selected ? "var(--ecoya-blue-4)" : "var(--ecoya-gray-6)";
}

export const TabItem = forwardRef<HTMLDivElement, TabItemProps>(
  function TabItem({
    children,
    className,
    closeLabel = "Close",
    disabled = false,
    onClose,
    selected = false,
    showClose = false,
    variant = "line",
    ...props
  }, ref) {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      props.onKeyDown?.(event);
      if (event.defaultPrevented || disabled) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.currentTarget.click();
    };

    const handleClose = (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onClose?.();
    };
    const tabLabel =
      typeof props["aria-label"] === "string"
        ? props["aria-label"]
        : typeof children === "string"
          ? children
          : undefined;

    return (
      <div
        {...props}
        aria-disabled={disabled || undefined}
        aria-label={tabLabel}
        aria-selected={selected}
        className={cx(
          "inline-flex shrink-0 cursor-pointer items-center justify-center transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4",
          variant === "line" && [
            "h-11 border-0 border-b-2 bg-transparent px-3 text-body-16 font-medium leading-6",
            selected ? "border-ecoya-gray-2" : "border-transparent",
          ],
          variant === "fill" && [
            "h-11 px-6 text-body-19 font-medium",
            selected
              ? "border-0 bg-ecoya-indigo"
              : "border border-ecoya-gray-9 bg-ecoya-gray-11",
          ],
          variant === "chip" && [
            "h-[42px] gap-2 rounded-[64px] border-0 px-4 text-header-19 font-medium",
            selected ? "bg-ecoya-blue-10" : "bg-ecoya-gray-10",
          ],
          !disabled && "hover:opacity-80",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        data-ui="tab-item"
        onKeyDown={handleKeyDown}
        ref={ref}
        role="tab"
        style={{ color: tabColor(variant, selected), ...props.style }}
        tabIndex={disabled || !selected ? -1 : 0}
      >
        <span className="whitespace-nowrap">{children}</span>
        {variant === "chip" && showClose ? (
          <button
            aria-label={closeLabel}
            className="inline-flex size-4 items-center justify-center text-current hover:opacity-70"
            disabled={disabled}
            onClick={handleClose}
            type="button"
          >
            <Icon className="size-4" name="icon-close" />
          </button>
        ) : null}
      </div>
    );
  },
);

export const TabGroup = forwardRef<HTMLDivElement, TabGroupProps>(
  function TabGroup({
    children,
    className,
    onKeyDown,
    variant = "line",
    ...props
  }, ref) {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const currentTab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
      if (!currentTab || !event.currentTarget.contains(currentTab)) return;

      const tabs = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'),
      );
      const currentIndex = tabs.indexOf(currentTab);
      if (currentIndex < 0) return;

      let nextIndex: number | undefined;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;

      event.preventDefault();
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    };

    return (
      // a11y-exception(justified, SC-2.1.1): the ARIA Authoring Practices tabs
      // pattern puts focus on the individual tabs, never on the tablist
      // container, and manages it with a roving tabindex — which Tab does at
      // :96-98 (role="tab", tabIndex 0 for the selected tab and -1 for the
      // rest). The container only listens for Arrow/Home/End as they bubble
      // up from the focused tab. Making the tablist itself focusable would
      // add a dead stop to the tab order ahead of the real controls.
      // eslint-disable-next-line jsx-a11y/interactive-supports-focus
      <div
        className={cx(
          "flex items-center",
          variant === "line" && "border-b border-ecoya-gray-9",
          variant === "chip" && "gap-2",
          className,
        )}
        data-ui="tab-group"
        onKeyDown={handleKeyDown}
        ref={ref}
        role="tablist"
        {...props}
      >
        {children}
      </div>
    );
  },
);

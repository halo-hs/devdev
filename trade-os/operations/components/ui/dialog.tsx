"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "@trade-os/operations/compat/portal";

import { Button, IconButton } from "./button";
import { Icon } from "./icon";
import { cx } from "./utils";

const BODY_SCROLL_LOCK_COUNT_ATTRIBUTE = "data-ecoya-dialog-scroll-lock-count";
const BODY_SCROLL_LOCK_ORIGINAL_OVERFLOW_ATTRIBUTE =
  "data-ecoya-dialog-scroll-lock-original-overflow";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getTabbableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.style.display !== "none" &&
      element.style.visibility !== "hidden",
  );
}

/**
 * Mark every direct child of <body> other than the portal host as aria-hidden,
 * matching the products quantum hideOthers modality. Returns a cleanup that
 * restores the prior aria-hidden state for each touched sibling.
 */
function hideOthers(host: HTMLElement): () => void {
  const restorers: Array<() => void> = [];

  for (const sibling of Array.from(document.body.children)) {
    // The host adds a style-isolation wrapper around portals. Preserve the
    // dialog's ancestor as well as the dialog itself in the accessibility tree.
    if (sibling === host || sibling.contains(host) || !(sibling instanceof HTMLElement)) continue;
    if (sibling.getAttribute("aria-live") || sibling.hasAttribute("aria-hidden")) {
      continue;
    }

    sibling.setAttribute("aria-hidden", "true");
    restorers.push(() => sibling.removeAttribute("aria-hidden"));
  }

  return () => {
    for (const restore of restorers) restore();
  };
}

export type DialogFooterContainerProps = {
  children?: ReactNode;
  className?: string;
};

export type DialogProps = {
  beforeFooter?: ReactNode;
  /** Cancel button copy in the default footer. Ignored when `footer` is
      supplied. Required so a locale is never silently skipped — pass a
      translated string even when the default footer never renders. */
  cancelText: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Accessible name for the header close control. Required — the close
      button renders by default (`isCloseButton` defaults to `true`), so an
      untranslated fallback would otherwise reach real users. */
  closeLabel: string;
  closeOnOverlayClick?: boolean;
  destroyDialogWhenEscapePress?: boolean;
  footer?: ReactNode;
  height?: number;
  hideCancelButton?: boolean;
  isCloseButton?: boolean;
  isContractModal?: boolean;
  isHideDialog?: boolean;
  isNotPadding?: boolean;
  maxHeight?: number;
  minHeight?: number;
  modalMaxHeight?: number;
  modalMinHeight?: number;
  /** Confirm button copy in the default footer. Ignored when `footer` is
      supplied. Required for the same reason as `cancelText`. */
  okText: ReactNode;
  onCancel?: () => void;
  onEscapeKeyDown?: () => void;
  onOk?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Extra classes merged onto the full-viewport scrim, e.g. a stronger tint
      for a dialog that must fully obscure the page it's gating. */
  overlayClassName?: string;
  responsiveMargin?: number;
  title: ReactNode;
  titleRightAccessory?: ReactNode;
  width?: number;
};

function resolveResponsiveHeight(height?: number, responsiveMargin?: number) {
  if (!height) return undefined;
  if (!responsiveMargin) return `${height}px`;

  return `min(${height}px, calc(100vh - ${responsiveMargin * 2}px))`;
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const currentCount = Number(body.getAttribute(BODY_SCROLL_LOCK_COUNT_ATTRIBUTE) ?? 0);

    if (currentCount === 0) {
      body.setAttribute(BODY_SCROLL_LOCK_ORIGINAL_OVERFLOW_ATTRIBUTE, body.style.overflow);
    }

    body.setAttribute(BODY_SCROLL_LOCK_COUNT_ATTRIBUTE, String(currentCount + 1));
    body.style.overflow = "hidden";

    return () => {
      const nextCount = Math.max(
        0,
        Number(body.getAttribute(BODY_SCROLL_LOCK_COUNT_ATTRIBUTE) ?? 1) - 1,
      );

      if (nextCount === 0) {
        body.style.overflow =
          body.getAttribute(BODY_SCROLL_LOCK_ORIGINAL_OVERFLOW_ATTRIBUTE) ?? "";
        body.removeAttribute(BODY_SCROLL_LOCK_COUNT_ATTRIBUTE);
        body.removeAttribute(BODY_SCROLL_LOCK_ORIGINAL_OVERFLOW_ATTRIBUTE);
        return;
      }

      body.setAttribute(BODY_SCROLL_LOCK_COUNT_ATTRIBUTE, String(nextCount));
    };
  }, [locked]);
}

export function DialogFooterContainer({
  children,
  className,
}: DialogFooterContainerProps) {
  return (
    <div
      className={cx(
        "flex w-full gap-2 [&>button]:min-w-0 [&>button]:flex-[1_0_0]",
        "[&>button]:!h-auto [&>button]:min-h-10 [&>button]:!whitespace-normal [&>button]:!py-2 [&>button>span]:min-w-0 [&>button>span]:!shrink [&>button>span]:!whitespace-normal [&>button>span]:break-words [&>button>span]:text-center",
        className,
      )}
      data-ui="dialog-footer-container"
    >
      {children}
    </div>
  );
}

export function Dialog({
  beforeFooter,
  cancelText,
  children,
  className,
  closeLabel,
  closeOnOverlayClick = false,
  destroyDialogWhenEscapePress = true,
  footer,
  height,
  hideCancelButton = false,
  isCloseButton = true,
  isContractModal = false,
  isHideDialog = false,
  isNotPadding = false,
  maxHeight,
  minHeight,
  modalMaxHeight,
  modalMinHeight,
  okText,
  onCancel,
  onEscapeKeyDown,
  onOk,
  onOpenChange,
  open,
  overlayClassName,
  responsiveMargin,
  title,
  titleRightAccessory,
  width = 496,
}: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    close();
  }, [close, onCancel]);

  useBodyScrollLock(open);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onEscapeKeyDown?.();
      if (destroyDialogWhenEscapePress) {
        event.preventDefault();
        handleCancel();
      }
      return;
    }

    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const tabbables = getTabbableElements(dialog);
    if (tabbables.length === 0) {
      // Keep focus on the dialog shell when nothing inside is tabbable.
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = tabbables[0];
    const last = tabbables[tabbables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === dialog || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  });

  useEffect(() => {
    if (!open) return;

    // 닫힐 때 트리거로 포커스 복원 (modality 계약 — code-review 게이트 반영)
    const previousActive =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const dialog = dialogRef.current;
    const tabbables = dialog ? getTabbableElements(dialog) : [];
    (tabbables[0] ?? dialog)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      onKeyDown(event);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || isHideDialog) return;

    const host = overlayRef.current;
    if (!host) return;

    return hideOthers(host);
  }, [open, isHideDialog]);

  if (!open || typeof document === "undefined") return null;

  const contentStyle: CSSProperties = {
    maxHeight: resolveResponsiveHeight(modalMaxHeight, responsiveMargin) ?? "none",
    minHeight: resolveResponsiveHeight(modalMinHeight, responsiveMargin) ?? "unset",
    width,
  };

  if (modalMaxHeight) {
    contentStyle.height = resolveResponsiveHeight(modalMaxHeight, responsiveMargin);
  }

  const descriptionStyle: CSSProperties = {
    height: height ? `${height}px` : "auto",
    maxHeight: maxHeight
      ? `${maxHeight}px`
      : isNotPadding
        ? "none"
        : "calc(100vh - 200px)",
    minHeight: minHeight ? `${minHeight}px` : isNotPadding ? 0 : "auto",
    scrollbarWidth: "none",
  };

  return createPortal(
    // a11y-exception(justified, SC-2.1.1): the overlay's onMouseDown is a
    // redundant pointer shortcut for dismissing the dialog, not the only way
    // to do it. The keyboard path is Escape (handleKeyDown above, :211) plus
    // the always-rendered close button (:391), and focus is trapped inside
    // the dialog while it is open, so this backdrop is never in the tab
    // order. Giving it a role/tabIndex would put a full-screen control in
    // the tab sequence and make the dialog worse to operate by keyboard.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={cx(
        "fixed inset-0 z-(--ecoya-z-dialog) bg-(--ecoya-dim)",
        "animate-in fade-in-0 duration-150 ease-out",
        isHideDialog && "hidden",
        overlayClassName,
      )}
      data-ui="dialog-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          handleCancel();
        }
      }}
      ref={overlayRef}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cx(
          "fixed left-1/2 top-1/2 z-(--ecoya-z-dialog) flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] shadow-[var(--ecoya-shadow-modal)] outline-none",
          "animate-in fade-in-0 zoom-in-95 duration-150 ease-out",
          isContractModal ? "bg-transparent" : "bg-ecoya-gray-12",
          isHideDialog && "hidden",
          className,
        )}
        data-ui="dialog"
        ref={dialogRef}
        role="dialog"
        style={contentStyle}
        tabIndex={-1}
      >
        <div
          className={cx(
            // z-10: 다이얼로그 내부 상대값 — 부모가 z-(--ecoya-z-dialog) stacking context이므로
            // 외부 레이어와 무관. sticky 타이틀이 스크롤 본문 위에 유지되도록 낮은 상대값으로 충분.
            "z-10 flex items-center justify-between border-b border-ecoya-gray-10 px-4 py-4 pl-6",
            isContractModal && "rounded-t-[16px] bg-ecoya-gray-12",
          )}
          data-ui="dialog-title-container"
        >
          <h2
            className="m-0 text-header-20 font-bold text-ecoya-gray-1"
            id={titleId}
          >
            {title}
          </h2>
          {titleRightAccessory ??
            (isCloseButton ? (
              <IconButton
                aria-label={closeLabel}
                leadingIcon={<Icon className="size-5" name="icon-close" />}
                onClick={close}
                size="md"
              />
            ) : null)}
        </div>

        <div
          className={cx(
            height ? "flex-none" : "flex-1",
            isNotPadding ? "flex flex-col overflow-hidden p-0" : "overflow-auto p-6",
          )}
          data-ui="dialog-description"
          style={descriptionStyle}
        >
          {children}
        </div>

        {beforeFooter}

        {(footer || onOk) ? (
          <div className="bg-ecoya-gray-12 px-6 py-5" data-ui="dialog-footer">
            {footer ?? (
              <DialogFooterContainer>
                {!hideCancelButton ? (
                  <Button
                    onClick={handleCancel}
                    size="lg"
                    type="button"
                    variant="tertiary"
                  >
                    {cancelText}
                  </Button>
                ) : null}
                <Button onClick={onOk} size="lg" type="button">{okText}</Button>
              </DialogFooterContainer>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

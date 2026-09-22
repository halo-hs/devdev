"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "@trade-os/reference-3030/compat/portal";

import { Icon } from "./icon";
import { cx } from "./utils";

type AlertBasicStyle = "default" | "negative";
type AlertBasicType = "one" | "two";
export type AlertButtonTone = "primary" | "secondary" | "danger";
type ToastPopupTone = "blue" | "green" | "red" | "gray" | "yellow";

export type AlertBasicProps = {
  body?: ReactNode;
  className?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryLabel?: ReactNode;
  secondaryLabel?: ReactNode;
  style?: AlertBasicStyle;
  title?: ReactNode;
  type?: AlertBasicType;
};

export type ToastPopupProps = {
  className?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  duration?: number;
  message?: ReactNode;
  onDismiss?: () => void;
  open?: boolean;
  // 화면 내 토스트 위치. SNAP 레퍼런스 표준은 상단 중앙(topCenter, top:20px)이며 inbox 등은 "top"
  // 을 쓴다. 기본값 "bottom"은 기존 사용처(예: Confirm)를 그대로 유지하기 위한 하위호환이다.
  position?: "top" | "bottom";
  role?: "alert" | "status";
  tone?: ToastPopupTone;
  // 표현 형태. 기본 "bar"는 기존 사용처(inbox 등) DOM 100% 하위호환(전면 tone 채움 바). "card"는
  // 정본 confirm-toast.html:328-333 완료 토스트 = 380px 화이트 카드(원형 아이콘 칩 + 본문 슬롯 + × 닫기).
  variant?: "bar" | "card";
};

export type AlertDialogProps = AlertBasicProps & {
  ariaLabel?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  defaultOpen?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

type AlertButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  tone: AlertButtonTone;
};

const buttonToneClasses: Record<AlertButtonTone, string> = {
  danger:
    "bg-ecoya-system-red-8 text-ecoya-system-red-2 shadow-[var(--ecoya-shadow-button-red)]",
  primary:
    "bg-ecoya-indigo text-ecoya-gray-12 shadow-[var(--ecoya-shadow-button-blue)]",
  secondary:
    "bg-ecoya-gray-12 text-ecoya-gray-2 shadow-[var(--ecoya-shadow-button-black)]",
};

const toastToneClasses: Record<ToastPopupTone, string> = {
  blue: "bg-ecoya-system-blue-6 text-ecoya-system-blue-2",
  // 정본 confirm-toast.html:329 success 토스트 = bg-green-6 text-green-1 + icon-checkmark.
  green: "bg-ecoya-system-green-6 text-ecoya-system-green-1",
  gray: "border border-ecoya-gray-9 bg-ecoya-gray-11 text-ecoya-gray-3",
  red: "bg-ecoya-system-red-8 text-ecoya-system-red-2",
  // 부분 실패(WARNING) 토스트 = status-warning 토큰쌍(globals.css: warning-bg=yellow-6 · warning=yellow-2)을
  // 따라 가독성 있는 light bg + dark text 로 둔다(blue/red 와 동일 결).
  yellow: "bg-ecoya-system-yellow-6 text-ecoya-system-yellow-1",
};

function toastIconName(tone: ToastPopupTone): string {
  if (tone === "green") return "icon-checkmark";
  if (tone === "red" || tone === "yellow") return "icon-error-circle-fill";
  return "icon-info";
}

export function AlertButton({
  children,
  className,
  tone,
  type = "button",
  ...props
}: AlertButtonProps) {
  return (
    <button
      className={cx(
        "flex h-10 flex-1 items-center justify-center overflow-hidden rounded-[8px] px-4 py-2.5 text-button-15 font-medium",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-5",
        buttonToneClasses[tone],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertBasic({
  body,
  className,
  onPrimaryClick,
  onSecondaryClick,
  primaryLabel,
  secondaryLabel,
  style = "default",
  title,
  type = "one",
}: AlertBasicProps) {
  const hasTwoButtons = type === "two";
  const primaryTone = style === "negative" ? "danger" : "primary";

  return (
    <div
      className={cx(
        "flex w-[305px] flex-col items-end gap-6 rounded-[12px] bg-ecoya-gray-12 p-5 shadow-[var(--ecoya-shadow-card)]",
        className,
      )}
      data-alert-style={style}
      data-alert-type={type}
      data-ui="alert-basic"
    >
      <div className="flex w-[265px] flex-col items-start gap-1 tracking-[0]">
        <div className="flex w-full flex-col justify-center text-header-20 font-bold text-ecoya-gray-2">
          {title}
        </div>
        <div className="flex w-full flex-col justify-center text-body-15 font-regular text-ecoya-gray-5">
          {body}
        </div>
      </div>
      <div
        className={cx(
          "flex w-full items-start justify-end",
          hasTwoButtons ? "gap-2" : "gap-1.5",
        )}
      >
        {hasTwoButtons && (
          <AlertButton onClick={onSecondaryClick} tone="secondary">{secondaryLabel}</AlertButton>
        )}
        <AlertButton onClick={onPrimaryClick} tone={primaryTone}>{primaryLabel}</AlertButton>
      </div>
    </div>
  );
}

export function AlertDialog({
  ariaLabel,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  defaultOpen = false,
  onPrimaryClick,
  onCancel,
  onConfirm,
  onOpenChange,
  onSecondaryClick,
  open,
  type = "one",
  ...props
}: AlertDialogProps) {
  const generatedTitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const titleId = props.title ? generatedTitleId : undefined;

  const setOpenState = useCallback((nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [onOpenChange, open]);

  const confirm = useCallback(() => {
    onConfirm?.();
    onPrimaryClick?.();
    setOpenState(false);
  }, [onConfirm, onPrimaryClick, setOpenState]);

  const cancel = useCallback(() => {
    onCancel?.();
    onSecondaryClick?.();
    setOpenState(false);
  }, [onCancel, onSecondaryClick, setOpenState]);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && closeOnEscape) {
      event.preventDefault();
      cancel();
      return;
    }

    if (event.key === "Tab" && dialogRef.current) {
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1']), [contenteditable]:not([contenteditable='false']), details > summary",
        ),
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      onKeyDown(event);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // a11y-exception(justified, SC-2.1.1): same contract as ui/dialog.tsx —
    // backdrop dismissal is a redundant pointer shortcut. Escape closes the
    // alert (handleKeyDown above, :208, gated on closeOnEscape) and the
    // confirm/cancel buttons are always reachable, so no functionality is
    // pointer-only. The backdrop stays out of the tab order deliberately.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-(--ecoya-z-alert-dialog) flex items-center justify-center bg-(--ecoya-dim) p-4"
      data-ui="alert-dialog-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          cancel();
        }
      }}
    >
      <div
        aria-label={ariaLabel ?? (typeof props.title === "string" ? props.title : undefined)}
        aria-labelledby={!ariaLabel && typeof props.title !== "string" ? titleId : undefined}
        aria-modal="true"
        className="outline-none"
        data-ui="alert-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <AlertBasic
          {...props}
          title={titleId && typeof props.title !== "string" ? <span id={titleId}>{props.title}</span> : props.title}
          onPrimaryClick={confirm}
          onSecondaryClick={type === "two" ? cancel : undefined}
          type={type}
        />
      </div>
    </div>
  );
}

// useSyncExternalStore 인자 — 모듈 상수로 고정해 매 렌더 재구독을 막는다.
const subscribeNoop = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

export function ToastPopup({
  className,
  closeLabel = "Dismiss notification",
  defaultOpen = true,
  duration,
  message,
  onDismiss,
  open,
  position = "bottom",
  role = "status",
  tone = "blue",
  variant = "bar",
}: ToastPopupProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;

  // createPortal 은 클라 전용이라, defaultOpen=true 토스트는 서버(null)와 클라 첫
  // 렌더(포털)가 어긋난다. useSyncExternalStore 로 하이드레이션 첫 렌더를 서버
  // 스냅샷(false)에 맞춘 뒤 마운트 후 true 로 전환해 hydration mismatch 를 막는다.
  const mounted = useSyncExternalStore(subscribeNoop, getMounted, getServerMounted);

  // onDismiss 를 ref(useLatest)로 들어 dismiss 가 onDismiss 참조에 의존하지 않게 한다 — 호출부가
  // 인라인/불안정 콜백을 넘겨도 매 렌더마다 auto-dismiss 타이머가 리셋되지 않는다(타이머 effect 가
  // dismiss 에 의존하므로). useEffectEvent 로 감싸 useCallback 에서 호출하는 형태는
  // react-hooks/rules-of-hooks(Effect/Effect Event 밖 호출 금지) 위반이라 ref 패턴을 쓴다.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);
  const dismiss = useCallback(() => {
    if (open === undefined) {
      setUncontrolledOpen(false);
    }
    onDismissRef.current?.();
  }, [open]);

  useEffect(() => {
    if (!isOpen || duration === undefined) return;

    const timeoutId = window.setTimeout(dismiss, duration);
    return () => window.clearTimeout(timeoutId);
  }, [dismiss, duration, isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  // tone 별 success 여부 — green 만 정본 success(체크마크/녹색 칩), 그 외는 info/error(danger 등).
  const isSuccessTone = tone === "green";

  const toast =
    variant === "card" ? (
      // 정본 confirm-toast.html:328-333 완료 토스트 = 380px 화이트 카드.
      // 카드 = bg-white(gray-12) rounded-[10px] border(gray-10=erp-border) shadow-modal +
      // p-3.5 flex items-start gap-3 + 원형 아이콘 칩 + 본문 슬롯(message) + × 닫기.
      // fixed 위치·auto-dismiss·role·onDismiss·open 은 bar 와 동일하게 보존.
      <div
        aria-live={role === "alert" ? "assertive" : "polite"}
        className={cx(
          "fixed left-1/2 z-(--ecoya-z-alert) flex w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-3 rounded-[10px] border border-ecoya-gray-10 bg-ecoya-gray-12 p-3.5 shadow-[var(--ecoya-shadow-modal)]",
          position === "top" ? "top-5" : "bottom-4",
          className,
        )}
        data-toast-tone={tone}
        data-toast-variant="card"
        data-ui="toast-popup"
        role={role}
      >
        <span
          className={cx(
            // 원형 아이콘 칩: success=green-6/green-1+icon-checkmark, 그 외(danger 등)=red 칩+icon-info.
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            isSuccessTone
              ? "bg-ecoya-system-green-6 text-ecoya-system-green-1"
              : "bg-ecoya-system-red-8 text-ecoya-system-red-2",
          )}
        >
          <Icon className="size-4" name={isSuccessTone ? "icon-checkmark" : "icon-info"} />
        </span>
        {/* 본문 슬롯: 호출부가 2줄 구조(제목 font-bold + 서브라인 opacity/gray)를 그대로 넘긴다. */}
        {message ? <span className="min-w-0 flex-1">{message}</span> : null}
        <button
          aria-label={closeLabel}
          className="flex shrink-0 items-center justify-center rounded text-base text-ecoya-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
          onClick={dismiss}
          type="button"
        >
          <Icon className="size-6" name="icon-close" />
        </button>
      </div>
    ) : (
      <div
        aria-live={role === "alert" ? "assertive" : "polite"}
        className={cx(
          // max-w-[728px]: feedback.md Toast Anatomy "Width: 728px" (정본 규정값)
          "fixed left-1/2 z-(--ecoya-z-alert) flex w-auto min-w-[264px] max-w-[728px] -translate-x-1/2 items-center gap-2 overflow-hidden rounded-[12px] p-4 text-body-16 font-medium shadow-[var(--ecoya-shadow-input)]",
          // SNAP topCenter = top:20px(=top-5). 기본 bottom-4 는 기존 사용처 하위호환.
          position === "top" ? "top-5" : "bottom-4",
          toastToneClasses[tone],
          className,
        )}
        data-toast-tone={tone}
        data-ui="toast-popup"
        role={role}
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden p-0.5">
          {/* #63 merge: success=icon-checkmark · warning/error=icon-error-circle-fill · 그 외=icon-info (toastIconName). */}
          <Icon className="size-5" name={toastIconName(tone)} />
        </span>
        {/* break-all: feedback.md "Alert text | b7m, word-break all" */}
        {message ? <span className="min-w-0 flex-1 break-all">{message}</span> : null}
        <button
          aria-label={closeLabel}
          className="flex size-6 shrink-0 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
          onClick={dismiss}
          type="button"
        >
          <Icon className="size-6" name="icon-close" />
        </button>
      </div>
    );

  return createPortal(toast, document.body);
}

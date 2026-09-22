import type { ComponentProps, ReactNode } from "react";

import { Button } from "@trade-os/operations/components/ui/button";
import { Icon } from "@trade-os/operations/components/ui/icon";
import { cx } from "@trade-os/operations/components/ui/utils";

type ToastAdapterTone = "info" | "success" | "warning" | "danger" | "neutral";

// 표현 형태. 기본 "fill"은 기존 채움형(inbox 미러 호환, DOM 불변). "card-success"는 정본
// confirm-toast.html:328-333 의 380px 화이트 카드(완료 토스트). (success-payment 결제블록·카운트다운은
// TOAST-03 BE 차단으로 이번 제외 — card 변형은 success/danger 만 가산.)
type ToastAdapterVariant = "fill" | "card-success" | "card-danger";

type ToastAdapterProps = Omit<ComponentProps<"div">, "title"> & {
  tone?: ToastAdapterTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: ToastAdapterVariant;
};

// 정본 toastVisual 맵(bg/border/fg) → Tailwind 토큰 클래스로 포팅
// info/success bg=systemBlue6 fg=systemBlue2 / warning bg=systemYellow6 fg=systemYellow1
// danger bg=systemRed8 fg=systemRed2 / neutral bg=gray11 fg=gray3 border=gray9
const toneRoot: Record<ToastAdapterTone, string> = {
  info: "border-transparent bg-ecoya-system-blue-6 text-ecoya-system-blue-2",
  success: "border-transparent bg-ecoya-system-blue-6 text-ecoya-system-blue-2",
  warning: "border-transparent bg-ecoya-system-yellow-6 text-ecoya-system-yellow-1",
  danger: "border-transparent bg-ecoya-system-red-8 text-ecoya-system-red-2",
  neutral: "border-ecoya-gray-9 bg-ecoya-gray-11 text-ecoya-gray-3",
};

function ToastAdapter({ tone = "neutral", title, description, action, className, variant = "fill", ...props }: ToastAdapterProps) {
  if (variant !== "fill") {
    return (
      <ToastAdapterCard
        action={action}
        className={className}
        description={description}
        title={title}
        variant={variant}
        {...props}
      />
    );
  }

  return (
    <div
      className={cx(
        // ToastRoot: width min(728px,100%) / grid 24px·1fr·24px / items-start / gap-2 / p-4 / border 1px / rounded-lg(12px) / shadow-input
        "grid w-[min(728px,100%)] grid-cols-[24px_minmax(0,1fr)_24px] items-start gap-2 rounded-lg border p-4 shadow-input",
        toneRoot[tone],
        className,
      )}
      role="status"
      {...props}
    >
      {/* IconSlot: 24x24 inline-flex center */}
      <span className="inline-flex h-6 w-6 items-center justify-center">
        <ToastIcon tone={tone} />
      </span>
      {/* ToastText: min-w-0 flex-col gap-1 */}
      <div className="flex min-w-0 flex-col gap-1">
        {/* ToastTitle: typo.b7m(16/24/500) color currentColor */}
        <div className="text-body-16 font-medium text-current">{title}</div>
        {description && (
          // ToastDescription: typo.b9r(14/20.44/400) color currentColor
          <div className="text-body-14 font-regular text-current">{description}</div>
        )}
      </div>
      {action ?? (
        // CloseButton: Button ghost+black (G9 amended — gray-2/hover gray-3/active gray-4)
        // 24x24, padding 0, transparent bg, no shadow. neutral 톤은 정본이 gray5 강제.
        <Button
          aria-label="닫기"
          className={cx(
            "size-6 bg-transparent p-0 shadow-none",
            tone === "neutral"
              ? "text-ecoya-gray-5 enabled:hover:text-ecoya-gray-5 enabled:active:text-ecoya-gray-5"
              : "text-ecoya-gray-2 enabled:hover:text-ecoya-gray-3 enabled:active:text-ecoya-gray-4",
          )}
          iconOnly
          intent="brand"
          type="button"
          variant="ghost"
        >
          <Icon name={tone === "danger" ? "icon-alert-close-red" : "icon-alert-close-blue"} size={24} />
        </Button>
      )}
    </div>
  );
}

// 정본 confirm-toast.html:328-333 완료 토스트 = 380px 화이트 카드. 미러 부품 신판 형태(TOAST-05).
// bg-white(gray-12) rounded-[10px] border(gray-10=erp-border) shadow-modal + p-3.5 flex items-start gap-3
// + 원형 아이콘 칩(success=green-6/green-1+checkmark, danger=red 칩+info) + 본문(제목 font-bold + 서브라인) + × 닫기.
function ToastAdapterCard({
  action,
  className,
  description,
  title,
  variant,
  ...props
}: Omit<ToastAdapterProps, "tone" | "variant"> & { variant: Exclude<ToastAdapterVariant, "fill"> }) {
  const isSuccess = variant === "card-success";

  return (
    <div
      className={cx(
        "flex w-[380px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-[10px] border border-ecoya-gray-10 bg-ecoya-gray-12 p-3.5 shadow-[var(--ecoya-shadow-modal)]",
        className,
      )}
      role="status"
      {...props}
    >
      <span
        className={cx(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isSuccess
            ? "bg-ecoya-system-green-6 text-ecoya-system-green-1"
            : "bg-ecoya-system-red-8 text-ecoya-system-red-2",
        )}
      >
        <Icon name={isSuccess ? "icon-checkmark" : "icon-info"} size={16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* erp-v2-adapt: begin — QA-1209 keeps Korean error guidance from splitting inside words. */}
        <div className="break-keep text-body-13 font-bold text-foreground [overflow-wrap:anywhere]">{title}</div>
        {/* erp-v2-adapt: end */}
        {description && <div className="text-body-13 text-ecoya-gray-5">{description}</div>}
      </div>
      {action ?? (
        <Button
          aria-label="닫기"
          className="size-6 bg-transparent p-0 text-ecoya-gray-6 shadow-none enabled:hover:text-ecoya-gray-6 enabled:active:text-ecoya-gray-6"
          iconOnly
          intent="brand"
          type="button"
          variant="ghost"
        >
          <Icon name="icon-close" size={20} />
        </Button>
      )}
    </div>
  );
}

function ToastIcon({ tone }: { tone: ToastAdapterTone }) {
  if (tone === "danger" || tone === "warning") {
    return <Icon name="icon-error-circle-fill" size={20} />;
  }

  if (tone === "neutral") {
    return <Icon name="icon-info-fill" size={20} />;
  }

  return <Icon name="icon-checkmark-circle-fill" size={20} />;
}

export { ToastAdapter };
export type { ToastAdapterProps, ToastAdapterTone, ToastAdapterVariant };

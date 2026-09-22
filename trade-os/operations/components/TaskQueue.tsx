import Link from "@trade-os/operations/compat/link";
import type { ReactNode } from "react";

import { Button } from "@trade-os/operations/components/ui/button";
import { EtcDivider } from "@trade-os/operations/components/ui/etc";

import { DdayBadge, StatusBadge, type DdayTone, type StatusTone } from "@trade-os/operations/components/StatusBadge";
import { SectionPanel, type SectionPanelProps } from "@trade-os/operations/components/SectionPanel";

type TaskQueueItem = {
  id: string;
  title: ReactNode;
  serviceLabel?: ReactNode;
  serviceTone?: StatusTone;
  // Optional second chip before the title (e.g. doc_type [BL]/[PO] on Blocked rows).
  typeLabel?: ReactNode;
  typeTone?: StatusTone;
  meta?: ReactNode;
  dueLabel?: ReactNode;
  dueTone?: DdayTone;
  actionLabel?: ReactNode;
  onAction?: () => void;
  actionDisabled?: boolean;
  href?: string;
};

type TaskQueueProps = Omit<SectionPanelProps, "children"> & {
  items: TaskQueueItem[];
  empty?: ReactNode;
};

function TaskQueue({
  items,
  empty = "표시할 작업이 없습니다.",
  scrollArea = false,
  scrollHeight = 360,
  ...props
}: TaskQueueProps) {
  return (
    <SectionPanel scrollArea={scrollArea} scrollHeight={scrollHeight} {...props}>
      {items.length === 0 ? (
        // Empty: min-h-120 / flex center / typo.b9r(14/400); gray4 not gray5 — gray5 on
        // white is 4.04:1, fails WCAG AA 4.5:1 for this real copy.
        <div
          className="flex min-h-30 items-center justify-center text-body-14 font-regular text-ecoya-gray-4"
          data-ui="task-queue-empty"
        >
          {empty}
        </div>
      ) : (
        // QueueList: flex flex-col
        <div className="flex flex-col" data-ui="task-queue-list">
          {items.map((item, index) => (
            <div key={item.id}>
              {/* 정본 Divider → EtcDivider (gray9 1px horizontal) */}
              {index > 0 && <EtcDivider />}
              {/* QueueItem: grid minmax(0,1fr)·auto / items-center / gap-12 / min-h-56 / py-10 */}
              <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                {/* Main: min-w-0 flex-col gap-4 */}
                <div className="flex min-w-0 flex-col gap-1">
                  {/* TitleRow: min-w-0 flex items-center gap-6 + typo.b9m(14/500) gray2 */}
                  <div className="flex min-w-0 items-center gap-1.5 text-body-14 font-medium text-ecoya-gray-2">
                    {item.serviceLabel && (
                      <StatusBadge tone={item.serviceTone ?? "neutral"}>{item.serviceLabel}</StatusBadge>
                    )}
                    {item.typeLabel && (
                      <StatusBadge tone={item.typeTone ?? "neutral"}>{item.typeLabel}</StatusBadge>
                    )}
                    {/* TitleText: min-w-0 truncate */}
                    {item.href ? (
                      <Link href={item.href} className="min-w-0 truncate hover:text-ecoya-blue-5">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate">{item.title}</span>
                    )}
                  </div>
                  {/* Meta: typo.b10r(13/400); gray4 not gray5 (contrast) */}
                  {item.meta && (
                    <div className="text-body-13 font-regular text-ecoya-gray-4">{item.meta}</div>
                  )}
                </div>
                {/* Right: flex items-center gap-8 */}
                <div className="flex items-center gap-2">
                  {item.dueLabel && <DdayBadge ddayTone={item.dueTone}>{item.dueLabel}</DdayBadge>}
                  {item.actionLabel && (
                    // 정본 Button buttonSize=24(→sm) black+tertiary → variant=tertiary intent=brand
                    <Button
                      type="button"
                      size="sm"
                      intent="brand"
                      variant="tertiary"
                      disabled={item.actionDisabled}
                      onClick={item.onAction}
                    >
                      {item.actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}

export { TaskQueue };
export type { TaskQueueItem, TaskQueueProps };

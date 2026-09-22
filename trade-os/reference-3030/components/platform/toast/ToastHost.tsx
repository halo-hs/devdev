"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "@trade-os/reference-3030/compat/portal";

import { ToastAdapter } from "@trade-os/reference-3030/components/platform/ToastAdapter";
import { Button } from "@trade-os/reference-3030/components/ui/button";
import { Icon } from "@trade-os/reference-3030/components/ui/icon";

import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastRecord,
  type ToastTone,
} from "./toastStore";

const toneVariant: Record<ToastTone, "card-success" | "card-danger" | undefined> = {
  success: "card-success",
  error: "card-danger",
  info: undefined,
  warning: undefined,
};

const toneFill: Record<ToastTone, "info" | "warning"> = {
  success: "info",
  error: "info",
  info: "info",
  warning: "warning",
};

function ToastHostItem({ closeLabel, record }: { closeLabel: string; record: ToastRecord }) {
  const { id, duration } = record;

  useEffect(() => {
    if (duration === null) return;
    const timeoutId = window.setTimeout(() => dismissToast(id), duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, id]);

  const variant = toneVariant[record.tone];
  const isCard = variant !== undefined;

  const trailing = (
    <span className="flex shrink-0 items-center gap-1.5">
      {record.action ? (
        <button
          className="whitespace-nowrap text-body-13 font-semibold text-ecoya-blue-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
          data-ui="toast-action"
          onClick={() => {
            record.action?.onClick();
            dismissToast(id);
          }}
          type="button"
        >
          {record.action.label}
        </button>
      ) : null}
      <Button
        aria-label={closeLabel}
        className={
          isCard
            ? "size-6 bg-transparent p-0 text-ecoya-gray-6 shadow-none enabled:hover:text-ecoya-gray-6 enabled:active:text-ecoya-gray-6"
            : "size-6 bg-transparent p-0 text-ecoya-gray-2 shadow-none enabled:hover:text-ecoya-gray-3 enabled:active:text-ecoya-gray-4"
        }
        iconOnly
        intent="brand"
        onClick={() => dismissToast(id)}
        type="button"
        variant="ghost"
      >
        <Icon name={isCard ? "icon-close" : record.tone === "error" ? "icon-alert-close-red" : "icon-alert-close-blue"} size={isCard ? 20 : 24} />
      </Button>
    </span>
  );

  return (
    <ToastAdapter
      action={trailing}
      data-toast-tone={record.tone}
      description={record.description}
      role={record.tone === "error" ? "alert" : "status"}
      title={record.message}
      tone={toneFill[record.tone]}
      variant={variant ?? "fill"}
    />
  );
}

const subscribeNoop = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

// erp-v2-adapt: begin — Products #214 keeps upload feedback visible at the top center.
const toastHostPositionClass =
  "top-[calc(1rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2";
// erp-v2-adapt: end

export function ToastHost({ closeLabel = "Dismiss notification" }: { closeLabel?: string }) {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  const mounted = useSyncExternalStore(subscribeNoop, getMounted, getServerMounted);

  if (!mounted || toasts.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed ${toastHostPositionClass} z-(--ecoya-z-alert) flex w-[380px] max-w-[calc(100vw-2rem)] flex-col items-stretch gap-2`}
      data-ui="toast-host"
    >
      {toasts.map((record) => (
        <ToastHostItem closeLabel={closeLabel} key={record.id} record={record} />
      ))}
    </div>,
    document.body,
  );
}

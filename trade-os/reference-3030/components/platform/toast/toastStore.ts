import type { ReactNode } from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastAction = {
  label: ReactNode;
  onClick: () => void;
};

export type ToastInput = {
  message: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  duration?: number | null;
  action?: ToastAction;
  onDismiss?: () => void;
};

export type ToastRecord = {
  id: number;
  tone: ToastTone;
  duration: number | null;
  message: ReactNode;
  description?: ReactNode;
  action?: ToastAction;
  onDismiss?: () => void;
};

export const TOAST_AUTO_DISMISS_MS = 5000;

let nextId = 1;
let records: readonly ToastRecord[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): readonly ToastRecord[] {
  return records;
}

const EMPTY: readonly ToastRecord[] = [];
export function getServerToasts(): readonly ToastRecord[] {
  return EMPTY;
}

export function toastDurationFor(input: Pick<ToastInput, "tone" | "duration">): number | null {
  if (input.duration !== undefined) return input.duration;
  return (input.tone ?? "info") === "error" ? null : TOAST_AUTO_DISMISS_MS;
}

export function showToast(input: ToastInput): number {
  const tone = input.tone ?? "info";
  const duration = toastDurationFor(input);
  const id = nextId++;
  records = [
    ...records,
    {
      id,
      tone,
      duration,
      message: input.message,
      description: input.description,
      action: input.action,
      onDismiss: input.onDismiss,
    },
  ];
  emit();
  return id;
}

export function dismissToast(id: number): void {
  const record = records.find((r) => r.id === id);
  if (!record) return;
  records = records.filter((r) => r.id !== id);
  emit();
  record.onDismiss?.();
}

export function removeToast(id: number): void {
  if (!records.some((r) => r.id === id)) return;
  records = records.filter((r) => r.id !== id);
  emit();
}

export function clearToasts(): void {
  if (records.length === 0) return;
  records = EMPTY;
  emit();
}

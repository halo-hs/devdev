"use client";

import { useEffect, useRef, useState } from "react";

import { dismissToast, removeToast, showToast, toastDurationFor, type ToastInput } from "./toastStore";

import type { ReactNode } from "react";

type ToastMessageOptions = Omit<ToastInput, "message" | "tone">;

export type ToastApi = {
  show: (input: ToastInput) => number;
  dismiss: (id: number) => void;
  success: (message: ReactNode, options?: ToastMessageOptions) => number;
  error: (message: ReactNode, options?: ToastMessageOptions) => number;
  info: (message: ReactNode, options?: ToastMessageOptions) => number;
  warning: (message: ReactNode, options?: ToastMessageOptions) => number;
};

const api: ToastApi = {
  show: showToast,
  dismiss: dismissToast,
  success: (message, options) => showToast({ ...options, message, tone: "success" }),
  error: (message, options) => showToast({ ...options, message, tone: "error" }),
  info: (message, options) => showToast({ ...options, message, tone: "info" }),
  warning: (message, options) => showToast({ ...options, message, tone: "warning" }),
};

export function useToast(): ToastApi {
  return api;
}

export function useScreenToast(): ToastApi {
  const stickyIdsRef = useRef<Set<number>>(new Set());
  const [screenApi] = useState<ToastApi>(() => {
    const track = (input: ToastInput): number => {
      const id = showToast(input);
      if (toastDurationFor(input) === null) stickyIdsRef.current.add(id);
      return id;
    };
    return {
      show: track,
      dismiss: dismissToast,
      success: (message, options) => track({ ...options, message, tone: "success" }),
      error: (message, options) => track({ ...options, message, tone: "error" }),
      info: (message, options) => track({ ...options, message, tone: "info" }),
      warning: (message, options) => track({ ...options, message, tone: "warning" }),
    };
  });
  useEffect(() => {
    const ids = stickyIdsRef.current;
    return () => {
      for (const id of ids) removeToast(id);
      ids.clear();
    };
  }, []);
  return screenApi;
}

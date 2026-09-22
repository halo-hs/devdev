"use client";

import { useLocale } from "@trade-os/reference-3030/compat/intl";

import { localeTag } from "./messages";

import type { AppLocaleTag } from "./messages";

/**
 * BCP-47 formatting tag bound to the ambient next-intl locale (P1-F).
 * Provider-less renders are a TEST-only situation, handled by the next-intl
 * mock in src/test/setup.ts — production code calls the hook plainly.
 */
export function useLocaleTag(): AppLocaleTag {
  return localeTag(useLocale());
}

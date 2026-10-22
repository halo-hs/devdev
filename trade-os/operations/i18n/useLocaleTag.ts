import { localeTag } from "./messages";

import type { AppLocaleTag } from "./messages";

// Trade OS formats numbers and dates for Korean only.
export function useLocaleTag(): AppLocaleTag {
  return localeTag("ko");
}

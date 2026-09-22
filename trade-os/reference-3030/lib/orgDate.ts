// Business-date helpers for the org-timezone axis (P1-A, docs/
// global-rollout-readiness.md §1). The judgment axis for due/overdue is the
// ORG's timezone, resolved server-side (app_current_org_tz) — screens should
// prefer a server-provided as-of date (e.g. settlement's data_as_of) over any
// client clock. These helpers cover the residual cases where a date must be
// derived client-side.

// Intl.DateTimeFormat construction is ~100µs (locale/tz data load); cache per
// zone so per-row/per-render callers stay allocation-free.
const formatterByZone = new Map<string, Intl.DateTimeFormat>();

/** Today's calendar date as YYYY-MM-DD in the given IANA timezone. */
export function todayISOIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD; Intl handles DST (fixed offsets like the old
  // +9h KST shortcut cannot represent Sydney/Auckland/São Paulo correctly).
  let fmt = formatterByZone.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatterByZone.set(timeZone, fmt);
  }
  return fmt.format(now);
}

/**
 * Today's calendar date as YYYY-MM-DD in the browser's timezone — the
 * fallback when no server as-of date is available. NOT `toISOString().slice`,
 * which is the UTC date and silently backdates forms for any operator east of
 * Greenwich in their local morning.
 */
export function localTodayISO(now: Date = new Date()): string {
  return todayISOIn(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
}

/** The browser's IANA timezone — used to suggest an org default at signup. */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isKoTag(locale: string): boolean {
  return locale.toLowerCase().startsWith("ko");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const displayFormatters = new Map<string, Intl.DateTimeFormat>();
function displayFormatter(locale: string, options: Intl.DateTimeFormatOptions, cacheKey: string): Intl.DateTimeFormat {
  const key = `${locale}|${cacheKey}`;
  let fmt = displayFormatters.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(locale, options);
    } catch {
      fmt = new Intl.DateTimeFormat("en-US", options);
    }
    displayFormatters.set(key, fmt);
  }
  return fmt;
}

export function formatDate(value: string | Date | null | undefined, locale: string): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") {
    const dateOnly = DATE_ONLY_RE.exec(value.slice(0, 10));
    if (dateOnly && (value.length === 10 || value[10] === "T" || value[10] === " ")) {
      if (isKoTag(locale)) return `${dateOnly[1]}.${dateOnly[2]}.${dateOnly[3]}`;
      const utc = new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])));
      return displayFormatter(locale, { dateStyle: "medium", timeZone: "UTC" }, "date-utc").format(utc);
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (isKoTag(locale)) {
    return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
  }
  return displayFormatter(locale, { dateStyle: "medium" }, "date").format(date);
}

export function formatDateTime(value: string | Date | null | undefined, locale: string): string {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (isKoTag(locale)) {
    return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }
  return displayFormatter(locale, { dateStyle: "medium", timeStyle: "short" }, "datetime").format(date);
}

export function formatMonth(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return value;
  if (isKoTag(locale)) return `${m[1]}.${m[2]}`;
  const utc = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return displayFormatter(locale, { month: "short", year: "numeric", timeZone: "UTC" }, "month").format(utc);
}

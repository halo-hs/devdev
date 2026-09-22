import { operationsDemo } from "../../demo/mode";
import { noteRateLimitRetryAfter } from "./rateLimitGate";

export const DEFAULT_PLATFORM_API_BASE_URL =
  "";

/** Browser calls same-origin BFF; SSR/server calls backend /api/v1 directly. */
export function platformApiBaseUrl(): string {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

/** Map a backend-relative path to the BFF or direct API prefix. */
export function platformApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return typeof window !== "undefined" ? `/api/platform${normalized}` : `/api/v1${normalized}`;
}

export type ApiErrorCode =
  | "AUTH_MISSING_TOKEN"
  | "AUTH_INVALID_TOKEN"
  | "AUTH_UNKNOWN_FIREBASE_UID"
  | "AUTH_USER_HAS_NO_ORG"
  | string;

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    // Optional structured context some endpoints attach to an error (e.g. the
    // 타입A duplicate-upload 409 names the existing file/deal). Shape is per-code;
    // callers narrow it themselves.
    detail?: unknown;
  };
  code?: string;
  message?: string;
  retry_after?: unknown;
};

// Identical concurrent reads are coalesced onto one request (browser only) so a
// screen that mounts several panels needing the same resource spends one
// gateway token instead of one per panel. See `coalesceKey` for the exact
// conditions; the entry clears as soon as the request settles, so this is
// request coalescing, not a response cache.
const inflightReads =
  typeof window !== "undefined" ? new Map<string, Promise<unknown>>() : null;

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly detail?: unknown;
  readonly retryAfterMs?: number;

  constructor({
    status,
    code,
    message,
    detail,
    retryAfterMs,
  }: {
    status: number;
    code: ApiErrorCode;
    message: string;
    detail?: unknown;
    retryAfterMs?: number;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.retryAfterMs = retryAfterMs;
  }
}

const MAX_SAFE_RETRY_AFTER_MS = Number.MAX_SAFE_INTEGER;

function boundedMilliseconds(seconds: number): number | undefined {
  if (seconds === Number.POSITIVE_INFINITY) return MAX_SAFE_RETRY_AFTER_MS;
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(Math.ceil(seconds * 1_000), MAX_SAFE_RETRY_AFTER_MS);
}

function retryAfterHeaderMs(value: string | null): number | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (/^\d+$/.test(normalized)) {
    return boundedMilliseconds(Number(normalized));
  }
  // Date.parse also accepts unrelated shorthand such as "1.5". Require the
  // HTTP-date wire form before delegating calendar validation to it.
  if (!/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(normalized)) {
    return undefined;
  }
  const dateMs = Date.parse(normalized);
  if (!Number.isFinite(dateMs)) return undefined;
  return Math.min(Math.max(0, dateMs - Date.now()), MAX_SAFE_RETRY_AFTER_MS);
}

function flatRateLimitRetryAfterMs(body: ApiErrorEnvelope | null): number | undefined {
  if (body?.code !== "RATE_LIMITED") return undefined;
  const seconds = body.retry_after;
  return typeof seconds === "number" ? boundedMilliseconds(seconds) : undefined;
}

type ApiRequestOptions = {
  getIdToken: () => Promise<string>;
  baseUrl?: string;
  init?: RequestInit;
  // erp-v2-adapt: begin - /me needs an opt-in hang ceiling without touching retry.ts.
  timeoutMs?: number;
  // erp-v2-adapt: end
  // #711: opt-in peek at the raw Response (e.g. its `Date` header) before the
  // body is consumed. Additive only -- every existing caller that doesn't
  // pass it is unaffected, and the return type (parsed JSON body) is
  // unchanged for all of them.
  onResponse?: (response: Response) => void;
};

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

// RequestInit fields this module reproduces verbatim in the coalescing key.
// Any other field (body, signal, credentials, redirect, ...) makes two calls
// materially different requests, so they are never shared.
const COALESCABLE_INIT_KEYS = new Set(["method", "headers", "cache"]);

/**
 * Key under which two concurrent calls are the same read, or `null` when the
 * call must not be shared.
 *
 * Only safe, idempotent reads qualify: browser context, GET, no request body,
 * no caller-owned abort signal, no `onResponse` peek (its observer expects the
 * raw Response of ITS OWN request), and no `timeoutMs` (one caller's deadline
 * must not cancel another's read). The token is part of the key so a session
 * switch never hands the new user a request issued under the old identity.
 */
function coalesceKey(
  url: string,
  token: string,
  headers: Headers,
  { init, onResponse, timeoutMs }: ApiRequestOptions,
): string | null {
  if (!inflightReads) return null;
  if (onResponse || timeoutMs !== undefined) return null;
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") return null;
  if (init) {
    for (const key of Object.keys(init)) {
      if (!COALESCABLE_INIT_KEYS.has(key)) return null;
    }
  }
  // Headers beyond Authorization change what the server returns (Accept,
  // locale, ...), so they belong in the key. Authorization is represented by
  // the token itself.
  const headerKey = [...headers.entries()]
    .filter(([name]) => name.toLowerCase() !== "authorization")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  return [token, url, init?.cache ?? "", headerKey].join("\u0000");
}

async function readError(response: Response): Promise<ApiError> {
  let body: ApiErrorEnvelope | null = null;

  try {
    const text = await response.text();
    body = text ? (JSON.parse(text) as ApiErrorEnvelope) : null;
  } catch {
    body = null;
  }

  const retryAfterMs =
    response.status === 429
      ? retryAfterHeaderMs(response.headers.get("Retry-After")) ??
        flatRateLimitRetryAfterMs(body)
      : undefined;
  // Teach every other caller in this tab about the backoff the server just
  // issued. Reads already in flight, and reads a sibling effect is about to
  // start, would otherwise each have to earn their own 429 (#1204).
  if (response.status === 429) noteRateLimitRetryAfter(retryAfterMs);

  return new ApiError({
    status: response.status,
    // Platform's pre-handler rate-limit middleware deliberately returns the
    // flat `{ code, message, retry_after }` envelope. Preserve that code so a
    // write caller can distinguish its safe-to-retry RATE_LIMITED response
    // from a domain/quota 429 emitted after handler work has begun.
    code: body?.error?.code ?? body?.code ?? `HTTP_${response.status}`,
    message: body?.error?.message ?? body?.message ?? response.statusText,
    detail: body?.error?.detail,
    retryAfterMs,
  });
}

export async function apiRequest<T>(
  path: string,
  { getIdToken, baseUrl = DEFAULT_PLATFORM_API_BASE_URL, init, onResponse }: ApiRequestOptions,
): Promise<T> {
  if (operationsDemo) return (await import("../../demo/api")).demoRequest<T>(path, init);
  if (path.startsWith("/api/platform")) path = `/__reference3030${path}`;
  const token = (await getIdToken()).trim();
  if (!token) {
    throw new ApiError({
      status: 401,
      code: "AUTH_MISSING_TOKEN",
      message: "Firebase ID token is required",
    });
  }
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  // erp-v2-adapt: begin - synthesize a retryable 504 for opt-in hung identity reads.
  // eslint-disable-next-line prefer-rest-params -- keep the erp-v2 function signature byte-identical after adapt stripping.
  const requestOptions = arguments[1] as ApiRequestOptions;
  const timeoutMs = requestOptions.timeoutMs;
  const timeoutActive = typeof timeoutMs === "number" && timeoutMs >= 0;
  if (timeoutActive) {
    const callerSignal = init?.signal ?? undefined;
    const controller = new AbortController();
    let timedOut = false;
    let forwardCallerAbort: (() => void) | undefined;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    if (callerSignal) {
      if (callerSignal.aborted) {
        controller.abort(callerSignal.reason);
      } else {
        forwardCallerAbort = () => controller.abort(callerSignal.reason);
        callerSignal.addEventListener("abort", forwardCallerAbort, { once: true });
      }
    }

    try {
      const response = await fetch(joinUrl(baseUrl, path), {
        ...init,
        headers,
        signal: controller.signal,
      });
      onResponse?.(response);

      if (!response.ok) {
        throw await readError(response);
      }

      const text = await response.text();
      return (text ? JSON.parse(text) : null) as T;
    } catch (error) {
      if (timedOut) {
        throw new ApiError({
          status: 504,
          code: "REQUEST_TIMEOUT",
          message: `Request to ${path} timed out after ${timeoutMs}ms`,
        });
      }
      throw error;
    } finally {
      clearTimeout(timer);
      if (forwardCallerAbort && callerSignal) {
        callerSignal.removeEventListener("abort", forwardCallerAbort);
      }
    }
  }
  // erp-v2-adapt: end
  const url = joinUrl(baseUrl, path);

  const send = async (): Promise<T> => {
    const response = await fetch(url, { ...init, headers });
    onResponse?.(response);

    if (!response.ok) {
      throw await readError(response);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  };

  const key = coalesceKey(url, token, headers, requestOptions);
  if (!key) return send();

  const shared = inflightReads?.get(key);
  // A shared read resolves with the same parsed body for every caller. The
  // callers that reuse it never issue a second request, so a mount that starts
  // the same GET from two effects costs one gateway token instead of two.
  if (shared) return shared as Promise<T>;

  const pending = send().finally(() => {
    // Clear on settle: this coalesces concurrent callers only. A later read
    // still reaches the server, so nothing here can serve stale data.
    if (inflightReads?.get(key) === pending) inflightReads.delete(key);
  });
  inflightReads?.set(key, pending);
  return pending;
}

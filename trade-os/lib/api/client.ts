import { demoRequest } from "../demo/api";


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





export async function apiRequest<T>(path: string, { init }: ApiRequestOptions): Promise<T> {
  return demoRequest<T>(path, init);
}

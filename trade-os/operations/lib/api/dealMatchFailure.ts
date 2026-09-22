import { ApiError } from "./client";

export type DealMatchFailureKind = "dealNotFound" | "forbidden" | "transient";

export function classifyDealMatchFailure(error: unknown): DealMatchFailureKind {
  if (!(error instanceof ApiError)) return "transient";

  // HTTP status is authoritative: a malformed cross-org 404 can never be
  // reclassified as forbidden by its body, and a 5xx is always retryable.
  if (error.status === 404) return "dealNotFound";
  if (error.status === 403) return "forbidden";
  return "transient";
}

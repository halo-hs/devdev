// Shared browser-side rate-limit backpressure.
//
// The Platform gateway limits per client IP (60 rpm, burst 10) and per org
// (600 rpm, burst 50) and answers an exhausted bucket with 429 + `Retry-After`
// (internal/handler/middleware/ratelimit.go). A single ERP screen legitimately
// starts many independent reads, so before this gate the first 429 taught only
// the one caller that failed: every other read already in flight — and every
// read the next effect started — kept firing into an empty bucket and turned a
// one-token shortfall into a storm of 429s.
//
// This module is the one place that remembers "the server just told us to wait".
// `withRetry` consults it before EVERY attempt, including the first, so a read
// that has not failed yet still waits out a backoff another read already
// earned. That is backpressure, not a blanket sleep: the hold exists only while
// a server-issued `Retry-After` window is open, and `MAX_RATE_LIMIT_HOLD_MS`
// caps how long any single advisory may stall interactive work.
//
// Browser only. On the server one Node process serves every tenant, so a
// module-level hold would let one org's 429 delay another org's SSR.

/** Longest a single server advisory may hold new attempts. */
export const MAX_RATE_LIMIT_HOLD_MS = 5_000;

let holdUntilMs = 0;

function gateEnabled(): boolean {
  return typeof window !== "undefined";
}

/**
 * Record a server-issued `Retry-After` from a 429. Extends the shared hold
 * when this advisory reaches further than the one already in force; a shorter
 * advisory never shortens an existing window.
 */
export function noteRateLimitRetryAfter(
  retryAfterMs: number | undefined,
  now: number = Date.now(),
): void {
  if (!gateEnabled()) return;
  // An absent or unusable advisory still means "you were rate limited". Hold
  // for the smallest window the gateway can mean (its `Retry-After` floor is
  // one second) instead of letting concurrent reads continue unthrottled.
  const requested =
    retryAfterMs !== undefined &&
    Number.isFinite(retryAfterMs) &&
    retryAfterMs >= 0
      ? retryAfterMs
      : 1_000;
  const bounded = Math.min(requested, MAX_RATE_LIMIT_HOLD_MS);
  holdUntilMs = Math.max(holdUntilMs, now + bounded);
}

/**
 * Milliseconds remaining on the shared hold; 0 when nothing is held.
 *
 * `withRetry` consults this before every attempt, so the no-hold path — which
 * is every attempt on a healthy connection — must not even read the clock.
 * An elapsed window is cleared here so it stops costing a clock read too.
 */
export function rateLimitHoldMs(now?: number): number {
  if (!gateEnabled() || holdUntilMs === 0) return 0;
  const remaining = holdUntilMs - (now ?? Date.now());
  if (remaining <= 0) {
    holdUntilMs = 0;
    return 0;
  }
  return remaining;
}

/** Drop the hold. Tests use this; product code never needs it. */
export function resetRateLimitGate(): void {
  holdUntilMs = 0;
}

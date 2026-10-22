import { ApiError } from "./client";
import { rateLimitHoldMs } from "./rateLimitGate";

// Transient HTTP statuses worth retrying: 429 (rate limited) and 5xx
// gateway/unavailable responses. A bare fetch() network failure surfaces as a
// TypeError (not an ApiError) and is likewise transient.
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
// Keep interactive reads bounded. Waiting longer than this is worse than
// returning the rate-limit error and leaving recovery to the existing UI.
const MAX_SERVER_RETRY_AFTER_MS = 5_000;

// One browser route can legitimately start several independent reads. When
// the gateway answers all of them with the same Retry-After, letting every
// caller wake on that boundary creates a second thundering herd. Serialize
// only 429 recovery sleeps so one request consumes each newly available token;
// normal requests and non-rate-limit retries remain fully concurrent.
let rateLimitRetryTail: Promise<void> = Promise.resolve();

function waitForRateLimitRetry(
  delayMs: number,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  const scheduled = rateLimitRetryTail.then(() => sleep(delayMs));
  rateLimitRetryTail = scheduled.catch(() => undefined);
  return scheduled;
}

// A transient failure is one a short retry can plausibly clear (rate limiting,
// a flaky gateway, a dropped connection) — as opposed to an auth/client error
// (401/403/404) where retrying the identical request is pointless and would
// only mask the real problem. This is the line that keeps a 429 from being
// treated as "signed out".
export function isTransientError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // #222 gives projection damage a typed 502 so clients can distinguish it
    // from a gateway/dependency outage. Retrying the same malformed projection
    // cannot heal it; only the 503 dependency branch is retryable.
    if (error.code === "LANDING_PROJECTION_INVALID") return false;
    return RETRYABLE_STATUSES.has(error.status);
  }
  if (error instanceof TypeError) {
    // fetch() network failures throw a TypeError, but so do ordinary programming
    // bugs (null deref, "x is not a function"). Only retry the former — match the
    // network-failure messages ("Failed to fetch" / "Load failed" / "NetworkError
    // … fetch …" / "fetch failed") so real bugs surface fast instead of looping.
    return /fetch|load failed|network/i.test(error.message);
  }
  return false;
}

export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// Run an async operation, retrying only transient failures with exponential
// backoff (baseDelayMs, then 2x, 4x, ...). Non-transient errors throw
// immediately so auth/permission handling is unaffected. `sleep` is injectable
// so tests run without real delays. Resolves with the operation result, or
// throws the last error once the retry budget is exhausted.
export async function withRetry<T>(
  operation: () => Promise<T>,
  {
    retries = 3,
    baseDelayMs = 400,
    sleep = defaultSleep,
    shouldRetry = isTransientError,
  }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  // Clamp so a negative budget still runs the operation once instead of falling
  // through the loop and throwing an uninitialized lastError.
  const maxRetries = Math.max(0, retries);
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    // Shared backpressure: when the gateway has already told THIS browser to
    // back off, wait out that window before spending a token — even on the very
    // first attempt, and even though this particular read has not failed yet.
    // Without it, the reads a screen starts in parallel each have to learn the
    // same 429 for themselves, which is precisely how one exhausted bucket
    // became a burst of rate-limited requests (#1204).
    const holdMs = rateLimitHoldMs();
    if (holdMs > 0) await sleep(holdMs);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      // Exponential backoff with bounded jitter so concurrent callers (the auth
      // gate plus each panel retrying the same rate-limited window) de-correlate
      // and don't re-collide against the limiter in lockstep.
      const backoff = baseDelayMs * 2 ** attempt;
      const jitteredBackoff = backoff * (0.5 + Math.random() * 0.5);
      const retryAfterCandidate =
        error instanceof ApiError && error.status === 429
          ? error.retryAfterMs
          : undefined;
      if (
        retryAfterCandidate !== undefined &&
        (retryAfterCandidate === Number.POSITIVE_INFINITY ||
          retryAfterCandidate > MAX_SERVER_RETRY_AFTER_MS)
      ) {
        throw error;
      }
      const retryAfterMs =
        retryAfterCandidate !== undefined &&
        Number.isFinite(retryAfterCandidate) &&
        retryAfterCandidate >= 0
          ? retryAfterCandidate
          : undefined;
      // Retry-After is a floor, not a replacement for de-correlation. Preserve
      // a small post-floor jitter so parallel bootstrap callers do not all wake
      // on the same token boundary.
      const serverFloorJitter =
        retryAfterMs !== undefined
          ? Math.random() * Math.min(250, Math.max(0, baseDelayMs / 2))
          : 0;
      const delayMs =
        Math.max(jitteredBackoff, retryAfterMs ?? 0) + serverFloorJitter;
      if (error instanceof ApiError && error.status === 429) {
        await waitForRateLimitRetry(delayMs, sleep);
      } else {
        await sleep(delayMs);
      }
    }
  }
  // The loop above always returns or throws; this satisfies the type checker.
  throw lastError;
}

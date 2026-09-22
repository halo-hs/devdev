/**
 * RT-1226-01 follow-up — state that is only valid for the signed-in user has to
 * be dropped wherever a session ends, not only where someone remembered to wire
 * it.
 *
 * Sign-out in this app is a client navigation, not a reload, so module-scope
 * stores survive it and the next user of the same tab inherits them. The store
 * that makes this matter is `moneyCommandKeys`: a pending money
 * Idempotency-Key left by user A can make a byte-identical command from user B
 * answer as a replay of A's attempt. Wiring that store into each sign-out
 * surface does not hold — the app ends sessions from eleven places, and the two
 * that were wired first ran ahead of the nine that were not.
 *
 * So a store registers its own cleanup here and every sign-out path goes
 * through `signOutAndClearSession`. The dependency deliberately points store →
 * lib and never back: this module knows nothing about products, so an auth
 * screen does not pull the settlement key store (and its API module) into its
 * bundle, and a store whose module was never loaded in this tab has no state to
 * clear in the first place.
 */

const cleanups = new Set<() => void>();

/**
 * Run `cleanup` whenever a session ends. Returns an unregister function; a
 * module-scope store registers once at load and never unregisters, but a test
 * or a scoped store can take it back.
 */
export function registerSessionEndCleanup(cleanup: () => void): () => void {
  cleanups.add(cleanup);
  return () => {
    cleanups.delete(cleanup);
  };
}

/**
 * Drop every registered piece of session-scoped state. Called only once the
 * session is actually revoked — see `signOutAndClearSession`.
 */
export function runSessionEndCleanups(): void {
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch {
      // The session is already gone: one store failing to clear must not strand
      // the rest, which would leave exactly the cross-user state this exists to
      // remove.
    }
  }
}

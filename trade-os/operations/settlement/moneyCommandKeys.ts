"use client";

import { createMoneyCommandIdempotencyKey } from "@trade-os/operations/lib/api/scheduleCash";
import { registerSessionEndCleanup } from "@trade-os/operations/lib/session/sessionEndCleanup";

/**
 * RT-1226-01 — a money command's Idempotency-Key must outlive the React
 * instance that minted it.
 *
 * A record or correction request that ends in a timeout or network error is
 * ambiguous: the backend may already have committed the cash fact. Replay
 * protection (FindMoneyCommand) only recognises the retry when it carries the
 * key of the first attempt, so a key kept in a component ref is lost exactly
 * when it matters most — the operator opens the correction view, cancels it, or
 * closes and reopens the panel before retrying, and the fresh mount mints a new
 * key for the same command, applying the same amount twice. The binding
 * therefore lives here, at module scope, and is dropped only once the server
 * has answered 2xx for that command, or when the operator composes a
 * materially different command whose fingerprint no longer matches.
 *
 * Bounded by construction: one slot per (command subject, command family), so
 * attempts cannot accumulate, and MAX_SLOTS caps how many subjects one tab can
 * keep pending. Over the cap the least recently used slot goes first, so the
 * binding the operator is actively retrying is the last one dropped. Slots stay
 * tenant-safe even though the fingerprints here do not name org or user — a
 * slot is addressed by a per-tenant subject id and the command is fingerprinted
 * with that same id, so a binding left by another org or user can never be
 * addressed or matched.
 *
 * Tab-scoped on purpose: this is same-tab retry continuity, not an audit
 * record. A reload legitimately starts over, and the backend stays the
 * authority on whether the earlier attempt landed. Sign-out is not a reload, so
 * the store clears itself when a session ends, from whichever surface ended it
 * (see clearMoneyCommandKeys).
 */

export type MoneyCommandFamily = "record" | "correction";

/**
 * How many (subject, family) slots one tab may keep pending. Exported so tests
 * can compute the pressure they need instead of restating the number.
 */
export const MAX_SLOTS = 32;

const bindings = new Map<string, { fingerprint: string; key: string }>();

/**
 * The slot a command competes for. `subjectId` is the entity the command acts
 * on, which is what the fingerprint already names: the payment schedule for
 * `record`, the payment application event for `correction`. Addressing a
 * correction by its event keeps two corrections of different events on one
 * schedule in independent slots instead of evicting each other's pending key.
 */
export function moneyCommandSlot(
  subjectId: string,
  family: MoneyCommandFamily,
): string {
  return `${family}:${subjectId}`;
}

/**
 * The key to send for `fingerprint`: the slot's existing key while the command
 * is unchanged, a new one otherwise. Throws when a canonical key cannot be
 * created, so callers fail closed instead of sending an unkeyed command.
 */
export function resolveMoneyCommandKey(slot: string, fingerprint: string): string {
  const current = bindings.get(slot);
  if (current?.fingerprint === fingerprint) {
    // A Map iterates in insertion order and `set` on an existing key does not
    // refresh it, so a hit has to re-insert to count as "recently used".
    // Without this the slot the operator keeps retrying stays the oldest entry
    // and is the first evicted — exactly the binding that must survive.
    bindings.delete(slot);
    bindings.set(slot, current);
    return current.key;
  }
  // Mint before touching the store: a throw here must leave the previous
  // binding intact rather than drop it.
  const key = createMoneyCommandIdempotencyKey();
  bindings.delete(slot);
  bindings.set(slot, { fingerprint, key });
  while (bindings.size > MAX_SLOTS) {
    const oldest = bindings.keys().next();
    if (oldest.done) break;
    bindings.delete(oldest.value);
  }
  return key;
}

/** Drop the binding once the server has accepted that exact command. */
export function releaseMoneyCommandKey(slot: string, fingerprint: string): void {
  if (bindings.get(slot)?.fingerprint === fingerprint) bindings.delete(slot);
}

/**
 * Forget every pending binding in this tab. Called on sign-out — a client
 * navigation, not a reload, so without this the next user of the same tab
 * inherits the previous user's bindings — and for test hygiene.
 */
export function clearMoneyCommandKeys(): void {
  bindings.clear();
}

// Registered rather than wired into each sign-out surface: the app ends
// sessions from eleven places (two shells, the auth screens, the invite
// account switch), and a store that has to be remembered at each of them is a
// store that will be missed at some of them. Registering at module load is
// also self-consistent — bindings can only exist once this module is loaded.
// Under dev HMR a re-evaluated module registers again; the stale entry only
// clears an already-empty Map, so the duplicate is harmless.
registerSessionEndCleanup(clearMoneyCommandKeys);

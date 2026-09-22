import { createContext, useContext, type ReactNode } from "react";

import type { EntitlementsResponse } from "@trade-os/operations/lib/api/entitlements";
import {
  type MappedPlatformSession,
  type PlatformIdentityResponse,
} from "@trade-os/operations/lib/api/me";

type PlatformBootstrapSession = {
  identity: PlatformIdentityResponse;
  entitlements: EntitlementsResponse | null;
  getIdToken: () => Promise<string>;
  /**
   * 서버 landing 재판정(/me 재조회) 트리거. 판정은 서버 소유이므로 FE 는 상태를
   * 고쳐 쓰지 않고 다시 묻기만 한다 — 서버가 이미 다르게 판정한다는 사실을 아는
   * 표면(예: 재체험 409 ORGANIZATION_TRIAL_ALREADY_USED)이 한 번 부른다.
   * PlatformAuthGate 가 소유하며, 게이트 밖 provider 조합에서는 없다.
   * 결과는 `true` = 재판정이 끝났다 / `false` = 회복 가능한 실패로 직전 판정을
   * 유지했다. reject 하지 않으므로 값을 무시하는 호출도 안전하다.
   */
  refreshIdentity?: () => Promise<boolean>;
};

export type PlatformSession = Omit<PlatformBootstrapSession, "identity"> & {
  identity: MappedPlatformSession;
};

const PlatformSessionContext = createContext<PlatformBootstrapSession | null>(null);

export function PlatformSessionProvider({
  identity,
  entitlements,
  getIdToken,
  refreshIdentity,
  children,
}: {
  identity: PlatformIdentityResponse;
  entitlements: EntitlementsResponse | null;
  getIdToken: () => Promise<string>;
  refreshIdentity?: () => Promise<boolean>;
  children: ReactNode;
}) {
  return (
    <PlatformSessionContext.Provider
      value={{ identity, entitlements, getIdToken, refreshIdentity }}
    >
      {children}
    </PlatformSessionContext.Provider>
  );
}

export function usePlatformSession(): PlatformSession {
  const session = useContext(PlatformSessionContext);
  if (!session) {
    throw new Error("usePlatformSession requires PlatformAuthGate");
  }
  if (session.identity.state !== "mapped") {
    throw new Error("usePlatformSession requires a selected Organization");
  }
  return { ...session, identity: session.identity };
}

// erp-v2-adapt: begin — Batch-1 kept this repo's persistent /erp layout, whose
// children read identity from context instead of receiving PlatformAuthGate's
// render-prop identity. Keep the hook as the sole sanctioned composition-layer
// deviation; it fails closed by reusing usePlatformSession().
export function useIdentity(): MappedPlatformSession {
  return usePlatformSession().identity;
}
// erp-v2-adapt: end

/** Null-safe bootstrap read for shared shells that may mount outside the gate. */
export function usePlatformBootstrapOptional(): PlatformIdentityResponse | null {
  return useContext(PlatformSessionContext)?.identity ?? null;
}

/** Canonical account/bootstrap identity for Organization and product landing screens. */
export function usePlatformBootstrap(): PlatformIdentityResponse {
  const session = useContext(PlatformSessionContext);
  if (!session) {
    throw new Error("usePlatformBootstrap requires PlatformAuthGate");
  }
  return session.identity;
}
export function useEntitlements(): EntitlementsResponse | null {
  return usePlatformSession().entitlements;
}

export function useEntitlementsOptional(): EntitlementsResponse | null {
  return useContext(PlatformSessionContext)?.entitlements ?? null;
}

/** Firebase ID token for API calls — only valid inside PlatformAuthGate. */
export function usePlatformAuth(): { getIdToken: () => Promise<string> } {
  const session = useContext(PlatformSessionContext);
  if (!session?.getIdToken) {
    throw new Error("usePlatformAuth requires PlatformAuthGate");
  }
  return { getIdToken: session.getIdToken };
}

/**
 * 서버 landing 재판정 트리거 — PlatformAuthGate 안에서만 존재하고, 그 밖의
 * provider 조합에서는 null 이다. 호출부는 null 을 정상 경로로 다룬다.
 */
export function usePlatformIdentityRefreshOptional(): (() => Promise<boolean>) | null {
  return useContext(PlatformSessionContext)?.refreshIdentity ?? null;
}

/** Safe variant for shared shells — returns null before auth resolves. */
export function usePlatformAuthOptional(): { getIdToken: () => Promise<string> } | null {
  const session = useContext(PlatformSessionContext);
  if (!session?.getIdToken) return null;
  return { getIdToken: session.getIdToken };
}

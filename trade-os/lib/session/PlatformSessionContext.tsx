import type { ReactNode } from "react"
import type { EntitlementsResponse } from "@trade-os/lib/api/entitlements"
import type { PlatformIdentityResponse } from "@trade-os/lib/api/me"
import { PlatformSessionContext } from "./platformSession"

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

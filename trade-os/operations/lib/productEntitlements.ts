/**
 * Product entitlement gate — API-first (Wave 7) with env fallback (Wave 6).
 * SSOT: _ssot/ECOYA_PLATFORM_ENTITLEMENT_AND_EXPOSURE.md Part A.
 */

import { ApiError } from "@trade-os/operations/lib/api/client";
import type { EntitlementsResponse } from "@trade-os/operations/lib/api/entitlements";
import { isNonDevDeploymentEnvironment } from "@trade-os/operations/lib/firebase/deploymentEnvironments";

type CapabilityEntitlements = Pick<EntitlementsResponse, "features"> | null | undefined;

function hasCapability(
  entitlements: CapabilityEntitlements,
  capability: "erp.write" | "erp.money.record" | "erp.money",
): boolean {
  // Commercial capability controls fail closed until the projection explicitly
  // grants them. This avoids exposing finalize controls while entitlements are
  // unavailable or while an older projection is missing a newly introduced key.
  return entitlements?.features[capability] === true;
}

export function canOperationalWrite(entitlements: CapabilityEntitlements): boolean {
  return hasCapability(entitlements, "erp.write");
}

export function canRecordMoney(entitlements: CapabilityEntitlements): boolean {
  return hasCapability(entitlements, "erp.money.record");
}

export function canFinalizeMoney(entitlements: CapabilityEntitlements): boolean {
  return hasCapability(entitlements, "erp.money");
}

export function isCapabilityDeniedError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === "ENTITLEMENT_ROLE_FORBIDDEN"
  );
}

export function isIntelligenceProductEnabled(entitlements?: EntitlementsResponse | null): boolean {
  if (entitlements) {
    return (
      entitlements.products.intelligence.enabled === true &&
      entitlements.features["intel.deep_link"] === true
    );
  }
  const flag = (undefined as string | undefined)?.trim().toLowerCase();
  if (flag !== "1" && flag !== "true" && flag !== "yes") return false;
  return Boolean(getIntelligenceProductUrl());
}

export function isSnapProductEnabled(entitlements?: EntitlementsResponse | null): boolean {
  if (entitlements) {
    return entitlements.products.snap.enabled === true;
  }
  return false;
}

export function getIntelligenceProductUrl(entitlements?: EntitlementsResponse | null): string | undefined {
  const apiUrl = entitlements?.workspace?.intel_base_url?.trim();
  if (apiUrl) return apiUrl;
  const url = (undefined as string | undefined)?.trim();
  return url || undefined;
}

/** Embed target for in-app /intel shell (lab prototype or hosted Intel SPA). */
export function getIntelligenceEmbedUrl(entitlements?: EntitlementsResponse | null): string | undefined {
  const apiEmbed = entitlements?.workspace?.intel_embed_url?.trim();
  if (apiEmbed) return apiEmbed;
  const embed = (undefined as string | undefined)?.trim();
  if (embed) return embed;
  const lab = (undefined as string | undefined)?.trim();
  return lab || undefined;
}

/** Deep-link targets in ecoya-intelligence-lab (`panel` query param). */
export type IntelligenceLabPanel =
  | "thesis"
  | "issue"
  | "domino"
  | "scenario"
  | "graph"
  | "actions"
  | "benchmarks";

export type IntelligenceEmbedContext = {
  bundleCode?: string;
  organizationId?: string;
  panel?: IntelligenceLabPanel;
};

export function getIntelligenceLabUrl(entitlements?: EntitlementsResponse | null): string | undefined {
  // Prefer the resolved embed target (API intel_embed_url -> env EMBED -> env LAB)
  // before the local-dev placeholder, so an entitlement-provided Intelligence URL
  // is used instead of localhost:5173 when NEXT_PUBLIC_INTELLIGENCE_LAB_URL is unset.
  return getIntelligenceEmbedUrl(entitlements) ?? (!isNonDevDeploymentEnvironment(undefined) ? "http://localhost:5173" : undefined);
}

/** Append org / bundle / panel query params for Intelligence Lab / hosted embed bridges. */
export function buildIntelligenceEmbedUrl(baseUrl: string, context?: IntelligenceEmbedContext): string {
  if (!context?.organizationId && !context?.bundleCode && !context?.panel) {
    return baseUrl;
  }
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(baseUrl, origin);
    if (context.organizationId) {
      url.searchParams.set("org_id", context.organizationId);
      url.searchParams.set("embedded", "1");
    }
    if (context.bundleCode) {
      url.searchParams.set("bundle", context.bundleCode);
    }
    if (context.panel) {
      url.searchParams.set("panel", context.panel);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/** Lab prototype URL with optional ERP org context and panel deep-link. */
export function buildIntelligenceLabUrl(
  context?: IntelligenceEmbedContext,
  entitlements?: EntitlementsResponse | null,
): string | undefined {
  const baseUrl = getIntelligenceLabUrl(entitlements);
  return baseUrl ? buildIntelligenceEmbedUrl(baseUrl, context) : undefined;
}

/** Public Intelligence web app origin for thesis briefing deep links (Phase A embed). */
export function getIntelligencePublicWebBaseUrl(entitlements?: EntitlementsResponse | null): string | undefined {
  const embed = getIntelligenceEmbedUrl(entitlements)?.trim();
  if (embed) {
    try {
      return new URL(embed).origin;
    } catch {
      /* fall through */
    }
  }
  const configured = (undefined as string | undefined)?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const lab = (undefined as string | undefined)?.trim();
  if (lab) {
    try {
      return new URL(lab).origin;
    } catch {
      return lab.replace(/\/$/, "");
    }
  }
  return !isNonDevDeploymentEnvironment(undefined) ? "http://localhost:5173" : undefined;
}

/** Shareable thesis briefing URL — opens Intelligence app, not ERP. */
export function buildIntelligenceThesisUrl(
  thesisId: string,
  options?: { map?: boolean; entitlements?: EntitlementsResponse | null },
): string | undefined {
  const base = getIntelligencePublicWebBaseUrl(options?.entitlements);
  if (!base) return undefined;
  const id = encodeURIComponent(thesisId.trim());
  const url = `${base}/theses/${id}`;
  return options?.map ? `${url}?map=1` : url;
}

export function isIntelligenceFeedEnabled(entitlements?: EntitlementsResponse | null): boolean {
  if (!entitlements?.products.intelligence.enabled) {
    return false;
  }
  return Boolean(getIntelligenceLabUrl(entitlements)) && (
    entitlements.features["intel.embed_lite"] === true ||
    entitlements.features["intel.deep_link"] === true
  );
}

export function isInAppIntelPath(url: string): boolean {
  if (url.startsWith("/")) return true;
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function normalizeInAppIntelPath(url: string): string {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

export function navigateToIntelligence(
  url: string,
  options?: { push?: (href: string) => void; onIntelClick?: () => void },
): void {
  if (options?.onIntelClick) {
    options.onIntelClick();
    return;
  }
  if (isInAppIntelPath(url)) {
    const href = normalizeInAppIntelPath(url);
    if (options?.push) {
      options.push(href);
    } else if (typeof window !== "undefined") {
      window.location.assign(href);
    }
    return;
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

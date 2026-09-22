import { apiRequest } from "./client";

export type EntitlementProduct = {
  enabled: boolean;
  plan_code?: string;
  display_name?: string;
};

export type EntitlementsResponse = {
  contract_version: string;
  organization_id: string;
  generated_at: string;
  /** Capability tier (start/pro/scale — bm-expansion D3); absent on older projections. */
  tier?: "start" | "pro" | "scale" | (string & {});
  subscription?: {
    status?: string;
    bundle_code?: string;
    next_payment_date?: string;
  };
  products: {
    erp: EntitlementProduct;
    snap: EntitlementProduct;
    intelligence: EntitlementProduct;
  };
  features: Record<string, boolean>;
  workspace: {
    default_product: string;
    erp_base_url?: string;
    snap_base_url?: string;
    intel_base_url?: string;
    intel_embed_url?: string;
  };
};

// erp-v2-adapt: begin — QA-1352 consumes BE #495's unremapped commercial-gate contract.
export type EntitlementGateReason = "plan" | "subscription" | "billing" | "role";

type EntitlementGateError = {
  readonly code: string;
  readonly status: number;
};

export function classifyEntitlementGate(error: EntitlementGateError): EntitlementGateReason | null {
  if (error.status === 402) {
    switch (error.code) {
      case "PLAN_FEATURE_REQUIRED":
        return "plan";
      case "ENTITLEMENT_FEATURE_UNAVAILABLE":
        return "subscription";
      case "BILLING_PAST_DUE":
      case "BILLING_INACTIVE":
        return "billing";
      default:
        return null;
    }
  }

  if (error.status !== 403) return null;

  switch (error.code) {
    case "ENTITLEMENT_ROLE_FORBIDDEN":
      return "role";
    case "PLAN_FEATURE_REQUIRED":
    case "ENTITLEMENT_FEATURE_UNAVAILABLE":
    case "BILLING_PAST_DUE":
    case "BILLING_INACTIVE":
      return null;
    default:
      return "role";
  }
}
// erp-v2-adapt: end

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

export function getEntitlements(getIdToken: () => Promise<string>): Promise<EntitlementsResponse> {
  const isBrowser = typeof window !== "undefined";

  return apiRequest<EntitlementsResponse>(apiPath("/me/entitlements"), {
    baseUrl: isBrowser ? "" : undefined,
    getIdToken,
  });
}

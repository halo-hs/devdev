import { apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";

// Exception Center (§7.8): org-wide list of every active (non-dismissed) risk
// across non-archived deals, worst-first. Composes the existing deal risk engine
// (no new data); see backend GET /api/v1/trade/exceptions.

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

export type TradeException = {
  deal_id: string;
  deal_ref: string;
  risk_type: string;
  severity: "critical" | "warning" | string;
  detail?: string;
};

export type ExceptionsResponse = {
  items: TradeException[];
  deal_count: number;
};

export async function getExceptions(getIdToken: () => Promise<string>): Promise<ExceptionsResponse> {
  return apiRequest<ExceptionsResponse>(apiPath("/trade/exceptions"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

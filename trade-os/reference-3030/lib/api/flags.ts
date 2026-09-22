import { apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";

// 이슈 플래그(F4/F8): 실무자가 거래에 이슈를 올리면 사장님이 확인한다. BE POST /erp/flags
// (deal_id|document_id 중 하나 필수). T0에서 숨겼던 deal-hub 플래그 액션을 실배선한다.
export type DealFlag = {
  id: string;
  deal_id?: string | null;
  document_id?: string | null;
  reporter_user_id?: string | null;
  note: string;
  category?: string | null;
  owner_checked: boolean;
  created_at: string;
};

export type CreateFlagInput = {
  deal_id?: string;
  document_id?: string;
  note: string;
  category?: string;
};

export type FlagListResponse = {
  items: DealFlag[];
  pagination: { limit: number; offset: number; total: number };
};

export type ListFlagsParams = {
  owner_checked?: boolean;
  limit?: number;
  offset?: number;
};

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

export async function createFlag(
  input: CreateFlagInput,
  getIdToken: () => Promise<string>,
): Promise<DealFlag> {
  return apiRequest<DealFlag>(apiPath("/erp/flags"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(input), method: "POST" },
  });
}

export async function listFlags(
  params: ListFlagsParams,
  getIdToken: () => Promise<string>,
): Promise<FlagListResponse> {
  const qs = new URLSearchParams();
  if (params.owner_checked !== undefined) qs.set("owner_checked", String(params.owner_checked));
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiRequest<FlagListResponse>(apiPath(`/erp/flags${query ? `?${query}` : ""}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function ackFlag(flagId: string, getIdToken: () => Promise<string>): Promise<DealFlag> {
  return apiRequest<DealFlag>(apiPath(`/erp/flags/${encodeURIComponent(flagId)}/ack`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { method: "POST" },
  });
}

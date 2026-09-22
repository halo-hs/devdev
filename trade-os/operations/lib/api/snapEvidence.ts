import { apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";

// SNAP v2 → ERP evidence bridge client (backend migration 0106 / PR #187).
// Field-captured loading evidence arrives buyer-unassigned, keyed by
// container number; the operator allocates each container to a buyer on the
// Allocation Board. Original media stays in SNAP — rows carry references
// (thumbnail URLs, hash prefixes) only.

export type SnapJobStatus =
  | "received"
  | "pending_review"
  | "partially_matched"
  | "matched"
  | "allocated"
  | "report_ready"
  | "sent"
  | "locked"
  // A handoff whose evidence package could not be processed is persisted as
  // `failed` (backend internal/snap/erpbridge/model.go
  // `LoadingJobStatusFailed`) and surfaces with `error_code`/`error_message`.
  | "failed";

export type SnapEvidenceStatus = "unallocated" | "review" | "allocated";

export type SnapLoadingJob = {
  id: string;
  handoff_id: string;
  contract_version: string;
  package_hash?: string | null;
  site?: string | null;
  operator_name?: string | null;
  work_type?: string | null;
  captured_at?: string | null;
  received_at: string;
  status: SnapJobStatus;
  container_count: number;
  media_count: number;
  allocated_count: number;
  // FS-16:41 은 SNAP 작업 행에 「사용자 언어로 쓴 실패 사유와 재조회」를 요구한다.
  // OD-026 B4 §1·§6: 원시 오류 코드·메시지는 화면에 그리지 않지만 계약 필드로는 계속
  // 수신한다(표시 경로만 없앤다). 사용자 문구 변환은 snapJobFailureReason 이 소유한다.
  error_code?: string | null;
  error_message?: string | null;
};

export type SnapContainerEvidence = {
  id: string;
  loading_job_id: string;
  capture_key: string;
  container_no?: string | null;
  container_no_valid: boolean;
  container_confidence?: number | null;
  seal_no?: string | null;
  seal_confidence?: number | null;
  media_count: number;
  thumbnail_url?: string | null;
  status: SnapEvidenceStatus;
  allocation_id?: string | null;
  allocation_label?: string | null;
};

export type SnapAllocationBasis =
  | "auto_exact_container_no"
  | "manual_selection"
  | "manual_override";

export type SnapBuyerAllocation = {
  id: string;
  container_evidence_id: string;
  counterparty_id?: string | null;
  deal_id?: string | null;
  purchase_order_id?: string | null;
  shipment_id?: string | null;
  buyer_label: string;
  status: "active" | "released";
  note?: string | null;
  allocated_at: string;
  allocated_by?: string | null;
  container_no?: string | null;
  allocation_basis: SnapAllocationBasis | null;
  release_reason: string | null;
};

// One suggested allocation target: a shipment whose container number matches
// the evidence row, with its deal and (when the deal's counterparty name
// resolves through the counterparty master or a learned alias) the structured
// counterparty id. Suggestion-only — the operator confirms on the board.
export type SnapAllocationCandidate = {
  shipment_id: string;
  deal_id?: string | null;
  deal_display_id?: string | null;
  deal_status?: string | null;
  counterparty_id?: string | null;
  counterparty_name?: string | null;
  bl_number?: string | null;
  vessel?: string | null;
  etd?: string | null;
  eta?: string | null;
  match: { tier: number; field: string; matched_value: string };
};

export type SnapJobDetail = {
  job: SnapLoadingJob;
  containers: SnapContainerEvidence[];
};

// FS-16 §3 영향 확인 (#633): what a release would expose outside the org,
// read before the release executes. Mirrors erpbridge.LiveShare /
// erpbridge.CompletedDelivery / erpbridge.ReleaseImpact
// (backend#1122, internal/snap/erpbridge/release_impact.go) — every nullable
// backend field stays nullable here rather than being coerced to a fallback,
// so the UI can render an explicit "none" state instead of guessing.
export type SnapReleaseLiveShare = {
  share_link_id: string;
  document_id: string;
  doc_type: string;
  doc_number: string | null;
  expires_at: string;
  open_count: number;
};

export type SnapReleaseCompletedDelivery = {
  delivery_request_id: string;
  document_id: string | null;
  status: string;
  sent_at: string;
};

export type SnapReleaseImpact = {
  // Null when the allocation isn't on a deal at all — nothing external can
  // reference it, so both lists below are empty by construction.
  deal_id: string | null;
  // Open share links. Non-empty here is exactly what makes `blocked` true.
  live_shares: SnapReleaseLiveShare[];
  // Already-sent deliveries. Reported for context; never blocks a release.
  completed_deliveries: SnapReleaseCompletedDelivery[];
};

export type SnapReleaseImpactEnvelope = {
  impact: SnapReleaseImpact;
  // Derived server-side from live_shares.length > 0 — the client mirrors it
  // instead of recomputing so the two can never disagree.
  blocked: boolean;
};

export type SnapAllocateInput = {
  container_evidence_id: string;
  counterparty_id?: string;
  deal_id?: string;
  purchase_order_id?: string;
  shipment_id?: string;
  buyer_label: string;
  note?: string;
};

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

export async function listSnapJobs(
  getIdToken: () => Promise<string>,
): Promise<{ jobs: SnapLoadingJob[] }> {
  return apiRequest<{ jobs: SnapLoadingJob[] }>(apiPath("/trade/snap-evidence/jobs"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function getSnapJob(
  jobId: string,
  getIdToken: () => Promise<string>,
): Promise<SnapJobDetail> {
  return apiRequest<SnapJobDetail>(
    apiPath(`/trade/snap-evidence/jobs/${encodeURIComponent(jobId)}`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function listSnapContainers(
  getIdToken: () => Promise<string>,
  status?: SnapEvidenceStatus,
): Promise<{ containers: SnapContainerEvidence[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<{ containers: SnapContainerEvidence[] }>(
    apiPath(`/trade/snap-evidence/containers${query}`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

// Mirrors the server-side page cap on GET /trade/snap-evidence/allocations:
// internal/handler/snapevidence/handler.go `allocationsLimit = 200`, applied by
// internal/snap/erpbridge/repository.go ListActiveAllocations (org-wide,
// ORDER BY allocated_at DESC; `limit <= 0 || limit > 500` is clamped to 200,
// while values 1–500 pass through unchanged).
// The endpoint declares no query parameters, so a per-deal filter is impossible
// today; a full page means any per-deal count derived from it is unproven.
// DELETE THIS once the backend ships a deal_id filter.
export const SNAP_ALLOCATIONS_PAGE_LIMIT = 200;

export async function listSnapAllocations(
  getIdToken: () => Promise<string>,
): Promise<{ allocations: SnapBuyerAllocation[] }> {
  return apiRequest<{ allocations: SnapBuyerAllocation[] }>(
    apiPath("/trade/snap-evidence/allocations"),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function listSnapAllocationCandidates(
  evidenceId: string,
  getIdToken: () => Promise<string>,
): Promise<{ candidates: SnapAllocationCandidate[] }> {
  return apiRequest<{ candidates: SnapAllocationCandidate[] }>(
    apiPath(`/trade/snap-evidence/containers/${encodeURIComponent(evidenceId)}/allocation-candidates`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function allocateSnapContainer(
  input: SnapAllocateInput,
  getIdToken: () => Promise<string>,
): Promise<{ allocation: SnapBuyerAllocation }> {
  return apiRequest<{ allocation: SnapBuyerAllocation }>(
    apiPath("/trade/snap-evidence/allocations"),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(input), method: "POST" },
    },
  );
}

export async function getSnapReleaseImpact(
  allocationId: string,
  getIdToken: () => Promise<string>,
): Promise<SnapReleaseImpactEnvelope> {
  return apiRequest<SnapReleaseImpactEnvelope>(
    apiPath(`/trade/snap-evidence/allocations/${encodeURIComponent(allocationId)}/release-impact`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function releaseSnapAllocation(
  allocationId: string,
  reason: string,
  getIdToken: () => Promise<string>,
): Promise<{ allocation: SnapBuyerAllocation }> {
  return apiRequest<{ allocation: SnapBuyerAllocation }>(
    apiPath(`/trade/snap-evidence/allocations/${encodeURIComponent(allocationId)}/release`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify({ reason: reason.trim() }),
        method: "POST",
      },
    },
  );
}

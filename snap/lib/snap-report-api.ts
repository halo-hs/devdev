import { adaptSnapPage } from "@snap/lib/snap-adapters"

export type DeliveryChannel = "link" | "email"

export type PreSendChecklist = {
  all_required_media_attached: boolean
  ocr_values_confirmed: boolean
  ai_summary_reviewed: boolean
  ai_trust_reviewed: boolean
  manager_report_approved: boolean
  customer_visible_text_reviewed: boolean
  customer_content_ready: boolean
  presentation_ready: boolean
  sensitive_info_checked: boolean
  recipient_confirmed: boolean
  delivery_channel_confirmed: boolean
  erp_linkage_confirmed: boolean
  media_watermarked: boolean
}

export type PreSendCheck = {
  report_id: string
  version_type: string
  presentation_score: number
  presentation_minimum: number
  checklist: PreSendChecklist
  blocking: string[]
  human_review_triggers: string[]
  requires_manager_review: boolean
  ready_to_send: boolean
}

export type ShareLinkLifecycle = {
  id: string
  token: string
  token_prefix?: string
  label: string
  link_type: string
  status: "active" | "expired" | "revoked" | "exhausted"
  revoked: boolean
  expires_at: string
  open_count: number
  view_count: number
  max_views: number
  upload_count: number
  max_uploads: number
  acknowledged: boolean
  created_at: string
  last_opened_at?: string
  last_resend_at?: string
  locale: string
  locale_mismatch?: boolean
  task_id?: string
  report_id: string
  frontend_path: string
}

export type DeliveryRequest = {
  channel: DeliveryChannel
  recipient_value?: string
}

export type RouteDeliveryResult = {
  status: string
  channel: string
  channel_recommended_by_ai?: string
  delivered: boolean
  delivery_log_id?: string
  error_message?: string
}

export type PublicCustomerView = {
  link_type?: string
  locale?: string
  expires_at?: string
  label?: string
  max_views?: number
  view_count?: number
  download_available?: boolean
  download_limit_reached?: boolean
  evidence_available_until?: string
  cross_border?: boolean
  allow_download?: boolean
  draft?: boolean
  view_mode?: string
  organization?: { id?: string; name?: string }
  capabilities?: string[]
  branding?: {
    name?: string
    color?: string
    footer?: string
    has_logo?: boolean
    powered_by_url?: string
  }
  content?: {
    sections?: Record<string, unknown>
    section_order?: string[]
    [key: string]: unknown
  }
  customer_package?: {
    report?: { title?: string; report_display_id?: string }
    summary?: { executive_summary?: string }
    delivery?: {
      view_mode?: string
      pdf_allowed?: boolean
      customer_message?: string
    }
    customer_message?: string
    [key: string]: unknown
  }
  acknowledged?: boolean
  [key: string]: unknown
}

export type PublicWorkerChecklistItem = {
  key: string
  label: string
  media_type?: "photo" | "video" | "audio" | "document" | string
  required?: boolean
  satisfied?: boolean
  status?: string
  framing_guide?: string
  acceptance_rule?: string
  sequence_stage?: string
  sample_image_ref?: string
  [key: string]: unknown
}

export type PublicActionLinkView = {
  link_type?: "worker_exec" | "external_upload" | string
  locale?: string
  expires_at?: string
  label?: string
  capabilities?: string[]
  organization?: string | { id?: string; name?: string }
  cross_border?: boolean
  task?: {
    task_type?: string
    status?: string
    location_name?: string
    [key: string]: unknown
  }
  human_instruction?: {
    title?: string
    purpose?: string
    quality_guidance?: string
    checklist?: PublicWorkerChecklistItem[]
    [key: string]: unknown
  }
  checklist?: PublicWorkerChecklistItem[]
  completeness?: {
    counts?: {
      required?: number
      required_satisfied?: number
      complete?: boolean
      [key: string]: unknown
    }
    missing?: unknown[]
    [key: string]: unknown
  }
  recapture_requests?: Array<{
    media_id?: string
    reason?: string
    media_type?: string
    tags?: string[]
    [key: string]: unknown
  }>
  upload_count?: number
  uploads_remaining?: number
  max_uploads?: number
  allowed_media_types?: string[]
  review_notice?: boolean
  [key: string]: unknown
}

export type PublicDisputeStatus = {
  dispute?: {
    reason_code?: string
    summary?: string
    status?: string
  } | null
  resolved?: {
    reason_code?: string
    status?: string
    resolution_note?: string
    resolved_at?: string
  } | null
  can_file?: boolean
}

export type PublicUploadPlan = {
  media_id: string
  upload_url: string
  method?: string
  headers?: Record<string, string>
  expires_at?: string
}

export class SnapApiError extends Error {
  readonly status: number
  readonly code: string
  readonly reason?: string

  constructor(status: number, code: string, reason?: string) {
    super(reason || code)
    this.name = "SnapApiError"
    this.status = status
    this.code = code
    this.reason = reason
  }
}

export type SnapAccessTokenProvider = (
  forceRefresh?: boolean
) => Promise<string | null> | string | null
export type SnapJsonRecord = Record<string, unknown>
export type SnapRequestOptions = {
  public?: boolean
  password?: string
  responseType?: "json" | "blob"
  idempotencyKey?: string
}

export type EvidenceIntegrityView = {
  verified?: boolean
  hash_prefix?: string
  watermarked?: boolean
  evidence_level?: string
  captured_at?: string
  site_name?: string
  issuer_name?: string
}

let accessTokenProvider: SnapAccessTokenProvider | null = null

export function setSnapAccessTokenProvider(
  provider: SnapAccessTokenProvider | null
) {
  accessTokenProvider = provider
}

const configuredApiBase = (
  (import.meta.env.VITE_SNAP_API_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE as string | undefined)
)
  ?.trim()
  .replace(/\/$/, "")

const apiBase = configuredApiBase?.replace(/\/api\/v1(?:\/snap)?$/, "")

export const snapApiConfigured = Boolean(apiBase)

function currentLanguage() {
  if (typeof window === "undefined") return "ko"
  return window.localStorage.getItem("snap_lang") || "ko"
}

function devHeaders(): Record<string, string> {
  let orgId = "00000000-0000-0000-0000-000000000001"
  let userId = "00000000-0000-0000-0000-000000000002"
  let role = "admin"

  try {
    const raw = window.localStorage.getItem("snap_web_session")
    if (raw) {
      const session = JSON.parse(raw) as {
        orgId?: string
        userId?: string
        role?: string
      }
      orgId = session.orgId || orgId
      userId = session.userId || userId
      role = session.role || role
    }
  } catch {
    // An invalid local development session falls back to the SNAP seed actor.
  }

  return { "X-Org-Id": orgId, "X-User-Id": userId, "X-Role": role }
}

async function authHeaders(
  isPublic: boolean,
  forceRefresh = false
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "X-Lang": currentLanguage() }
  if (isPublic) return headers

  const token = await accessTokenProvider?.(forceRefresh)
  if (token) return { ...headers, Authorization: `Bearer ${token}` }

  if (
    import.meta.env.DEV ||
    import.meta.env.VITE_SNAP_ALLOW_DEV_HEADERS === "1"
  ) {
    return { ...headers, ...devHeaders() }
  }

  throw new SnapApiError(
    0,
    "auth_not_configured",
    "SNAP 인증 연결이 필요합니다."
  )
}

async function parseApiError(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as SnapJsonRecord | null
  const nestedError =
    payload?.error &&
    typeof payload.error === "object" &&
    !Array.isArray(payload.error)
      ? (payload.error as SnapJsonRecord)
      : null
  const code = String(
    nestedError?.code ||
      (typeof payload?.error === "string" ? payload.error : undefined) ||
      payload?.code ||
      `http_${response.status}`
  )
  const reason =
    typeof nestedError?.message === "string"
      ? nestedError.message
      : typeof payload?.reason === "string"
      ? payload.reason
      : typeof payload?.message === "string"
        ? payload.message
        : undefined
  return new SnapApiError(response.status, code, reason)
}

function apiPath(path: string) {
  const normalized = path.startsWith("/api/v1/")
    ? path.slice("/api/v1".length)
    : path.startsWith("/")
      ? path
      : `/${path}`
  const snapPath =
    normalized === "/snap" || normalized.startsWith("/snap/")
      ? normalized
      : `/snap${normalized}`
  return `/api/v1${snapPath}`
}

export function createSnapIdempotencyKey(scope = "mutation") {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `snap-web:${scope.replace(/[^a-zA-Z0-9:_-]/g, "_")}:${suffix}`
}

export async function snapRequest<T>(
  path: string,
  init: RequestInit = {},
  options: SnapRequestOptions = {}
): Promise<T> {
  if (!apiBase) {
    throw new SnapApiError(
      0,
      "api_not_configured",
      "VITE_SNAP_API_BASE_URL 또는 VITE_API_BASE가 설정되지 않았습니다."
    )
  }

  const language = currentLanguage()
  const normalizedPath = apiPath(path)
  const separator = normalizedPath.includes("?") ? "&" : "?"
  const hasBody = init.body !== undefined
  const hasJsonBody = hasBody && typeof init.body === "string"
  const method = (init.method || "GET").toUpperCase()
  const idempotencyKey =
    options.idempotencyKey ||
    (method === "POST" ? createSnapIdempotencyKey(normalizedPath) : undefined)
  const url = `${apiBase}${normalizedPath}${separator}lang=${encodeURIComponent(language)}`

  const execute = async (forceRefresh = false) =>
    fetch(url, {
      ...init,
      credentials: options.public ? "omit" : "same-origin",
      headers: {
        ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        ...(await authHeaders(Boolean(options.public), forceRefresh)),
        ...(options.password ? { "X-Share-Password": options.password } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...init.headers,
      },
    })

  let response = await execute()
  if (
    response.status === 401 &&
    !options.public &&
    Boolean(accessTokenProvider)
  ) {
    response = await execute(true)
  }

  if (!response.ok) throw await parseApiError(response)
  if (response.status === 204) return undefined as T
  if (options.responseType === "blob") return response.blob() as Promise<T>
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

function isTransientFailure(reason: unknown) {
  if (!(reason instanceof SnapApiError)) return true
  return reason.status === 429 || reason.status >= 500
}

async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation()
    } catch (reason) {
      if (attempt >= 2 || !isTransientFailure(reason)) throw reason
      await new Promise((resolve) =>
        window.setTimeout(resolve, 800 * 2 ** attempt)
      )
    }
  }
}

export async function uploadSnapPresignedFile(
  uploadUrl: string,
  file: File,
  options: {
    method?: string
    headers?: Record<string, string>
  } = {}
) {
  if (!apiBase) {
    throw new SnapApiError(
      0,
      "api_not_configured",
      "VITE_SNAP_API_BASE_URL 또는 VITE_API_BASE가 설정되지 않았습니다."
    )
  }

  const resolvedUrl = uploadUrl.startsWith("http")
    ? uploadUrl
    : `${apiBase}${uploadUrl}`

  await withTransientRetry(async () => {
    const response = await fetch(resolvedUrl, {
      method: options.method || "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        ...options.headers,
      },
      body: file,
    })
    if (!response.ok) {
      throw new SnapApiError(response.status, `upload_put_${response.status}`)
    }
  })
}

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

function mediaTypeFromFile(file: File) {
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "photo"
}

async function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeLink(
  raw: SnapJsonRecord,
  fallback: Partial<ShareLinkLifecycle> = {}
): ShareLinkLifecycle {
  const token = stringValue(raw.token, fallback.token || "")
  const linkType = stringValue(
    raw.link_type,
    fallback.link_type || "customer_view"
  )
  const frontendPath = stringValue(
    raw.frontend_path,
    fallback.frontend_path || (token ? `/view/${token}` : "")
  )

  return {
    id: stringValue(raw.id, stringValue(raw.link_id, fallback.id || "")),
    token,
    token_prefix: stringValue(raw.token_prefix) || fallback.token_prefix,
    label: stringValue(
      raw.label,
      stringValue(raw.recipient_label, fallback.label || "고객 리포트")
    ),
    link_type: linkType,
    status: stringValue(
      raw.status,
      fallback.status || "active"
    ) as ShareLinkLifecycle["status"],
    revoked:
      typeof raw.revoked === "boolean"
        ? raw.revoked
        : Boolean(fallback.revoked),
    expires_at: stringValue(raw.expires_at, fallback.expires_at || ""),
    open_count: numberValue(raw.open_count, fallback.open_count),
    view_count: numberValue(raw.view_count, fallback.view_count),
    max_views: numberValue(raw.max_views, fallback.max_views),
    upload_count: numberValue(raw.upload_count, fallback.upload_count),
    max_uploads: numberValue(raw.max_uploads, fallback.max_uploads),
    acknowledged:
      typeof raw.acknowledged === "boolean"
        ? raw.acknowledged
        : Boolean(fallback.acknowledged),
    created_at: stringValue(
      raw.created_at,
      fallback.created_at || new Date().toISOString()
    ),
    last_opened_at: stringValue(raw.last_opened_at) || fallback.last_opened_at,
    last_resend_at: stringValue(raw.last_resend_at) || fallback.last_resend_at,
    locale: stringValue(raw.locale, fallback.locale || currentLanguage()),
    locale_mismatch:
      typeof raw.locale_mismatch === "boolean"
        ? raw.locale_mismatch
        : fallback.locale_mismatch,
    task_id: stringValue(raw.task_id) || fallback.task_id,
    report_id: stringValue(raw.report_id, fallback.report_id || ""),
    frontend_path: frontendPath,
  }
}

export const snapReportApi = {
  preSendCheck(reportId: string, payload: DeliveryRequest) {
    return snapRequest<PreSendCheck>(`/reports/${reportId}/pre-send-check`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  approve(reportId: string, acknowledgeAiReview = true) {
    return snapRequest(`/reports/${reportId}/approve`, {
      method: "POST",
      body: JSON.stringify({ acknowledge_ai_review: acknowledgeAiReview }),
    })
  },

  reject(reportId: string, reason: string) {
    return snapRequest(`/reports/${reportId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  correct(reportId: string, payload: Record<string, unknown>) {
    return snapRequest(`/reports/${reportId}/correct`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  route(reportId: string, payload: DeliveryRequest) {
    const apiPayload = {
      ...payload,
      channel: payload.channel === "link" ? "share_link" : payload.channel,
    }
    return snapRequest<RouteDeliveryResult>(`/reports/${reportId}/route`, {
      method: "POST",
      body: JSON.stringify(apiPayload),
    })
  },

  async createCustomerViewLink(
    reportId: string,
    payload: {
      locale?: string
      label?: string
      allow_download?: boolean
      password?: string
      expires_in_hours?: number
      max_views?: number
    }
  ) {
    const locale = payload.locale || currentLanguage()
    const expiresAt = new Date(
      Date.now() + (payload.expires_in_hours ?? 30 * 24) * 60 * 60 * 1000
    ).toISOString()
    const created = await snapRequest<SnapJsonRecord>(
      `/reports/${reportId}/share-links`,
      {
        method: "POST",
        body: JSON.stringify({
          recipient_label: payload.label,
          locale,
          expires_at: expiresAt,
          recipient_scope: "link",
          capabilities: ["view_approved_report", "acknowledge_report"],
        }),
      }
    )
    const token = stringValue(created.token)
    const rawLink =
      created.share_link &&
      typeof created.share_link === "object" &&
      !Array.isArray(created.share_link)
        ? (created.share_link as SnapJsonRecord)
        : created
    return normalizeLink(
      {
        ...rawLink,
        token,
        frontend_path: token ? `/view/${token}` : "",
      },
      {
      report_id: reportId,
      locale,
      label: payload.label,
      }
    )
  },

  async listReportLinks(reportId: string) {
    const response = await snapRequest<unknown>(
      `/reports/${reportId}/share-links`
    )
    return adaptSnapPage<SnapJsonRecord>(response).items.map((item) =>
      normalizeLink(item, { report_id: reportId })
    )
  },

  revokeReportLink(reportId: string, linkId: string, reason: string) {
    return snapRequest(`/reports/${reportId}/share-links/${linkId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    })
  },

  revokeLink(token: string) {
    return snapRequest(`/links/${token}/revoke`, { method: "POST" })
  },

  getPublicLink<
    T extends PublicCustomerView | PublicActionLinkView = PublicCustomerView,
  >(token: string, password?: string) {
    return snapRequest<T>(
      `/public/links/${token}`,
      {},
      { public: true, password }
    )
  },

  acknowledge(token: string, password?: string) {
    return snapRequest(
      `/public/links/${token}/acknowledge`,
      { method: "POST", body: JSON.stringify({}) },
      { public: true, password }
    )
  },

  requestNewLink(token: string, password?: string) {
    return snapRequest(
      `/public/links/${token}/request-new`,
      { method: "POST", body: JSON.stringify({}) },
      { public: true, password }
    )
  },

  recordConsent(
    token: string,
    payload: {
      version: string
      surface: "customer_view" | "worker_exec" | "external_upload"
    },
    password?: string
  ) {
    return snapRequest(
      `/public/links/${token}/consent`,
      { method: "POST", body: JSON.stringify(payload) },
      { public: true, password }
    )
  },

  getDispute(token: string, password?: string) {
    return snapRequest<PublicDisputeStatus>(
      `/public/links/${token}/dispute`,
      {},
      {
        public: true,
        password,
      }
    )
  },

  fileDispute(
    token: string,
    payload: { reason_code: string; summary: string },
    password?: string
  ) {
    return snapRequest<PublicDisputeStatus>(
      `/public/links/${token}/dispute`,
      { method: "POST", body: JSON.stringify(payload) },
      { public: true, password }
    )
  },

  async downloadPublicAsset(
    token: string,
    asset: "pdf",
    filename: string,
    password?: string
  ) {
    const blob = await snapRequest<Blob>(
      `/public/links/${token}/${asset}`,
      {},
      {
        public: true,
        password,
        responseType: "blob",
      }
    )
    await downloadBlob(blob, filename)
  },

  getPublicPdf(token: string, password?: string) {
    return snapRequest<Blob>(
      `/public/links/${token}/pdf`,
      {},
      { public: true, password, responseType: "blob" }
    )
  },

  getPublicMedia(token: string, mediaId: string, password?: string) {
    return snapRequest<Blob>(
      `/public/links/${token}/media/${mediaId}`,
      {},
      {
        public: true,
        password,
        responseType: "blob",
      }
    )
  },

  getPublicLogo(token: string, password?: string) {
    return snapRequest<Blob>(
      `/public/links/${token}/logo`,
      {},
      {
        public: true,
        password,
        responseType: "blob",
      }
    )
  },

  uploadPublicFileLegacy(token: string, file: File, password?: string) {
    const form = new FormData()
    form.append("file", file)
    return snapRequest<SnapJsonRecord>(
      `/public/links/${token}/upload`,
      { method: "POST", body: form },
      { public: true, password }
    )
  },

  acknowledgeMediaQuality(
    token: string,
    mediaId: string,
    payload: { signal: string; reason: string },
    password?: string
  ) {
    return snapRequest(
      `/public/links/${token}/media/${mediaId}/quality-ack`,
      { method: "POST", body: JSON.stringify(payload) },
      { public: true, password }
    )
  },

  async uploadPublicFile(
    token: string,
    file: File,
    options: {
      captureKey?: string
      mediaSource?: string
      password?: string
    } = {}
  ) {
    const fileHash = await sha256Hex(file)
    // A presign creates the media identity. PUT and finalize are retried with
    // the same media identity so one file cannot create duplicate records.
    const plan = await snapRequest<PublicUploadPlan>(
      `/public/links/${token}/presign`,
      {
        method: "POST",
        body: JSON.stringify({
          capture_key: options.captureKey || `external_${Date.now()}`,
          media_type: mediaTypeFromFile(file),
          mime_type: file.type || "application/octet-stream",
          file_hash: fileHash,
          size_bytes: file.size,
          filename: file.name,
          media_source: options.mediaSource || "external_upload",
        }),
      },
      { public: true, password: options.password }
    )
    const finalizeIdempotencyKey = createSnapIdempotencyKey(
      `public-finalize:${plan.media_id}`
    )
    await uploadSnapPresignedFile(plan.upload_url, file, {
      method: plan.method,
      headers: plan.headers,
    })
    await withTransientRetry(async () => {
      try {
        await snapRequest(
          `/public/links/${token}/finalize`,
          {
            method: "POST",
            body: JSON.stringify({
              media_id: plan.media_id,
              file_hash: fileHash,
              size_bytes: file.size,
              mime_type: file.type || "application/octet-stream",
            }),
          },
          {
            public: true,
            password: options.password,
            idempotencyKey: finalizeIdempotencyKey,
          }
        )
      } catch (reason) {
        if (
          reason instanceof SnapApiError &&
          reason.code === "media_not_pending_upload"
        )
          return
        throw reason
      }
    })
    return plan
  },

  submitPublicLink(
    token: string,
    payload: { submit_partial?: boolean; partial_reason?: string } = {},
    password?: string
  ) {
    return snapRequest(
      `/public/links/${token}/submit`,
      { method: "POST", body: JSON.stringify(payload) },
      { public: true, password }
    )
  },

  verifyIntegrity(hash: string) {
    return snapRequest<EvidenceIntegrityView>(
      `/public/integrity/${encodeURIComponent(hash)}`,
      {},
      {
        public: true,
      }
    )
  },
}

export function snapApiErrorMessage(reason: unknown) {
  if (!(reason instanceof SnapApiError)) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요."
  }
  if (reason.status === 410) {
    return "링크가 만료되었거나 취소되었습니다. 사무실에 새 링크를 요청해 주세요."
  }
  if (reason.status === 402 || reason.code === "storage_quota_exceeded") {
    return "조직 저장 공간이 부족합니다. 사무실 담당자에게 문의해 주세요."
  }
  if (reason.code === "upload_limit_reached") {
    return "이 링크의 업로드 한도에 도달했습니다. 사무실에 새 링크를 요청해 주세요."
  }
  if (reason.status === 413) return "파일이 허용된 최대 크기를 초과했습니다."
  if (reason.status === 429)
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
  if (reason.status === 401) return "링크 비밀번호를 확인해 주세요."
  return (
    reason.reason ||
    "처리하지 못했습니다. 입력값은 유지되며 다시 시도할 수 있습니다."
  )
}

export function demoPreSendCheck(
  reportId: string,
  delivery: DeliveryRequest
): PreSendCheck {
  const recipientConfirmed =
    delivery.channel === "link" || Boolean(delivery.recipient_value?.trim())
  const checklist: PreSendChecklist = {
    all_required_media_attached: true,
    ocr_values_confirmed: true,
    ai_summary_reviewed: true,
    ai_trust_reviewed: true,
    manager_report_approved: true,
    customer_visible_text_reviewed: true,
    customer_content_ready: true,
    presentation_ready: true,
    sensitive_info_checked: true,
    recipient_confirmed: recipientConfirmed,
    delivery_channel_confirmed: true,
    erp_linkage_confirmed: true,
    media_watermarked: true,
  }

  return {
    report_id: reportId,
    version_type: "customer",
    presentation_score: 96,
    presentation_minimum: 80,
    checklist,
    blocking: recipientConfirmed ? [] : ["이메일 수신자를 확인해 주세요."],
    human_review_triggers: ["고객 공개 문구 검토"],
    requires_manager_review: true,
    ready_to_send: recipientConfirmed,
  }
}

export function demoShareLink(reportId: string): ShareLinkLifecycle {
  return {
    id: "link-demo-01",
    token: "snap-demo-customer-view",
    label: "한빛무역 고객 리포트",
    link_type: "customer_view",
    status: "active",
    revoked: false,
    expires_at: "2026-08-07T09:00:00+09:00",
    open_count: 0,
    view_count: 0,
    max_views: 10,
    upload_count: 0,
    max_uploads: 0,
    acknowledged: false,
    created_at: new Date().toISOString(),
    locale: "ko",
    report_id: reportId,
    frontend_path: "/view/snap-demo-customer-view",
  }
}

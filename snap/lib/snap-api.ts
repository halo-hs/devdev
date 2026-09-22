import {
  snapRequest,
  uploadSnapPresignedFile,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { adaptSnapPage } from "@snap/lib/snap-adapters"

export type SnapPage<T = SnapJsonRecord> = {
  items: T[]
  total?: number
  next_cursor?: string
}

type QueryValue = string | number | boolean | null | undefined

function query(path: string, values: Record<string, QueryValue> = {}) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value))
  })
  const suffix = params.toString()
  return suffix ? `${path}?${suffix}` : path
}

function json(method: string, body?: unknown): RequestInit {
  return {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }
}

async function snapPage<T = SnapJsonRecord>(
  path: string,
  init: RequestInit = {}
): Promise<SnapPage<T>> {
  return adaptSnapPage<T>(await snapRequest<unknown>(path, init))
}

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error || new Error("file_read_failed"))
    reader.readAsDataURL(file)
  })
}

export const snapApi = {
  auth: {
    register: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/auth/register", json("POST", payload)),
    invitePreview: (token: string) =>
      snapRequest<SnapJsonRecord>(
        `/auth/invites/${token}`,
        {},
        { public: true }
      ),
    acceptInvite: (token: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/auth/invites/${token}/accept`,
        json("POST", payload)
      ),
    createInvite: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/auth/invites", json("POST", payload)),
  },

  session: {
    me: () => snapRequest<SnapJsonRecord>("/auth/me"),
    members: () => snapPage("/org/members"),
    plan: () => snapRequest<SnapJsonRecord>("/org/plan"),
    constants: () => snapRequest<SnapJsonRecord>("/constants"),
  },

  organization: {
    members: () => snapPage("/org/members"),
    updateMember: (memberId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/org/members/${memberId}`,
        json("PATCH", payload)
      ),
    deactivateMember: (memberId: string) =>
      snapRequest(`/org/members/${memberId}/deactivate`, json("POST")),
    reactivateMember: (memberId: string) =>
      snapRequest(`/org/members/${memberId}/reactivate`, json("POST")),
    approveMemberJoin: (memberId: string) =>
      snapRequest(`/org/members/${memberId}/approve-join`, json("POST")),
    invites: () => snapPage("/org/invites"),
    revokeInvite: (inviteId: string) =>
      snapRequest(`/org/invites/${inviteId}/revoke`, json("POST")),
    settings: () => snapRequest<SnapJsonRecord>("/org/settings"),
    updateSettings: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/org/settings", json("PATCH", payload)),
    localization: () => snapRequest<SnapJsonRecord>("/org/localization"),
    branding: () => snapRequest<SnapJsonRecord>("/org/branding"),
    updateBranding: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/org/branding", json("PUT", payload)),
    uploadLogo: async (file: File) => {
      const data = await fileAsDataUrl(file)
      return snapRequest<SnapJsonRecord>(
        "/org/branding/logo",
        json("POST", {
          data,
          mime: file.type || "image/png",
        })
      )
    },
    logo: () =>
      snapRequest<Blob>("/org/branding/logo", {}, { responseType: "blob" }),
    exportData: () =>
      snapRequest<Blob>("/org/export", {}, { responseType: "blob" }),
    retentionPolicy: () => snapRequest<SnapJsonRecord>("/org/retention-policy"),
    updateRetentionPolicy: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        "/org/retention-policy",
        json("PUT", payload)
      ),
    auditLogs: (cursor?: string) =>
      snapPage(query("/org/audit-logs", { cursor })),
  },

  catalog: {
    i18n: (locale?: string) =>
      snapRequest<SnapJsonRecord>(locale ? `/i18n/${locale}` : "/i18n"),
    markets: () => snapPage("/markets"),
    suggestMarket: (filters: Record<string, QueryValue> = {}) =>
      snapRequest<SnapJsonRecord>(query("/markets/suggest", filters)),
    billingPlans: () => snapPage("/billing/plans"),
    taskTypeSchemas: () => snapPage("/task-type-schemas"),
    reportTemplates: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/report-templates", filters)),
    resolveReportTemplate: (filters: Record<string, QueryValue>) =>
      snapRequest<SnapJsonRecord>(query("/report-templates/resolve", filters)),
    reportProfiles: () => snapPage("/report-profiles"),
    createReportTemplate: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/report-templates", json("POST", payload)),
  },

  billing: {
    plans: (market?: string) =>
      snapRequest<SnapJsonRecord>(
        query("/billing/plans", { market }),
        {},
        { public: true }
      ),
    invoices: (cursor?: string) =>
      snapRequest<SnapJsonRecord>(query("/billing/invoices", { cursor })),
    invoice: (invoiceId: string) =>
      snapRequest<SnapJsonRecord>(`/billing/invoices/${invoiceId}`),
    invoiceDownload: (invoiceId: string) =>
      snapRequest<SnapJsonRecord>(`/billing/invoices/${invoiceId}/download`),
    issuePortalGrant: () =>
      snapRequest<SnapJsonRecord>("/billing/portal-grants", json("POST")),
    consumePortalGrant: (grantToken: string) =>
      snapRequest<SnapJsonRecord>(
        "/billing/portal-grants/consume",
        json("POST", { grant_token: grantToken })
      ),
    requestUpgrade: (targetPlan: string) =>
      snapRequest<SnapJsonRecord>(
        "/billing/upgrade-requests",
        json("POST", { target_plan: targetPlan })
      ),
    creditBalance: () => snapRequest<SnapJsonRecord>("/credits/balance"),
  },

  ai: {
    parseIntent: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/ai/intent/parse", json("POST", payload)),
    analyzeMedia: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/ai/media/analyze", json("POST", payload)),
    summarizeReport: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/ai/report/summary", json("POST", payload)),
    reviewRisk: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/ai/risk-review", json("POST", payload)),
    planPipeline: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/ai/pipeline/plan", json("POST", payload)),
    usage: () => snapRequest<SnapJsonRecord>("/platform/ai/usage"),
    routing: () => snapRequest<SnapJsonRecord>("/platform/ai/routing"),
    budget: () => snapRequest<SnapJsonRecord>("/platform/ai/budgets"),
    unitEconomics: () =>
      snapRequest<SnapJsonRecord>("/platform/ai/unit-economics"),
  },

  tasks: {
    list: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/tasks", filters)),
    get: (taskId: string) => snapRequest<SnapJsonRecord>(`/tasks/${taskId}`),
    repeatSources: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/tasks/repeat-sources", filters)),
    pinRepeatSource: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/tasks/repeat-pins", json("POST", payload)),
    unpinRepeatSource: (sourceTaskId: string) =>
      snapRequest(`/tasks/repeat-pins/${sourceTaskId}`, json("DELETE")),
    create: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/tasks", json("POST", payload)),
    createDraft: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/tasks/draft", json("POST", payload)),
    createFieldDraft: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        "/tasks/field-start/draft",
        json("POST", payload)
      ),
    updateDraft: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/draft`,
        json("PATCH", payload)
      ),
    clarify: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/clarify`,
        json("POST", payload)
      ),
    confirmScope: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/scope-confirm`,
        json("POST", payload)
      ),
    confirm: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/confirm`,
        json("POST", payload)
      ),
    assign: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/assign`,
        json("POST", payload)
      ),
    instruction: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/instruction`),
    checklist: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/checklist`),
    activity: (taskId: string) =>
      snapPage(`/tasks/${taskId}/activity`),
    captureSummary: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/capture-summary`),
    fieldSignatures: (taskId: string) =>
      snapPage(`/tasks/${taskId}/field-signatures`),
    submit: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/submit`,
        json("POST", payload)
      ),
    officeReview: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/office-review`),
    decideOfficeReview: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/office-review/decision`,
        json("POST", payload)
      ),
    updateOutcomeMode: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/outcome-mode`,
        json("PATCH", payload)
      ),
    acceptWorkerWork: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/accept-worker-work`,
        json("POST", payload)
      ),
    confirmUnverifiedMedia: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media/confirm-unverified`,
        json("POST", payload)
      ),
    sendPhotoPack: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/photo-pack/send`,
        json("POST", payload)
      ),
    sendExpress: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/express/send`,
        json("POST", payload)
      ),
    sendDataPack: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/data-pack/send`,
        json("POST", payload)
      ),
    watermarkAllMedia: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media/watermark-all`,
        json("POST", payload)
      ),
    folderSuggestion: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/folder-suggestion`),
  },

  media: {
    add: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media`,
        json("POST", payload)
      ),
    uploadLocal: (
      uploadUrl: string,
      file: File,
      headers?: Record<string, string>
    ) => uploadSnapPresignedFile(uploadUrl, file, { headers }),
    list: (taskId: string) => snapPage(`/tasks/${taskId}/media`),
    presign: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media/presign`,
        json("POST", payload)
      ),
    finalize: (taskId: string, mediaId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media/${mediaId}/finalize`,
        json("POST", payload)
      ),
    qualityAck: (taskId: string, mediaId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media/${mediaId}/quality-ack`,
        json("POST", payload)
      ),
    confirm: (mediaId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/media/${mediaId}/confirm`,
        json("POST", payload)
      ),
    reject: (mediaId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/media/${mediaId}/reject`,
        json("POST", payload)
      ),
    resolveConflict: (mediaId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/media/${mediaId}/resolve-conflict`,
        json("POST", payload)
      ),
    approveTaskEvidence: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/media/approve-evidence`,
        json("POST", payload)
      ),
    original: (mediaId: string) =>
      snapRequest<Blob>(
        `/storage/blobs/${mediaId}/original`,
        {},
        { responseType: "blob" }
      ),
    watermarked: (mediaId: string) =>
      snapRequest<Blob>(
        `/storage/blobs/${mediaId}/watermarked`,
        {},
        { responseType: "blob" }
      ),
    watermarkPlan: (mediaId: string) =>
      snapRequest<SnapJsonRecord>(`/media/${mediaId}/watermark-plan`),
    applyWatermark: (mediaId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/media/${mediaId}/watermark`,
        json("POST", payload)
      ),
    analyzeVideo: (mediaId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/media/${mediaId}/analyze-video`,
        json("POST", payload)
      ),
    analyze: (mediaId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/media/${mediaId}/analyze`,
        json("POST", payload)
      ),
    analysis: (mediaId: string) =>
      snapRequest<SnapJsonRecord>(`/media/${mediaId}/analysis`),
    confirmRouting: (suggestionId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/routing-suggestions/${suggestionId}/confirm`,
        json("POST", payload)
      ),
    dismissRouting: (suggestionId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/routing-suggestions/${suggestionId}/dismiss`,
        json("POST", payload)
      ),
  },

  reports: {
    list: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/reports", filters)),
    workspace: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/report-workspace`),
    rubric: (taskId: string) =>
      snapRequest<SnapJsonRecord>(`/tasks/${taskId}/persona-rubric`),
    create: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/reports`,
        json("POST", payload)
      ),
    byTask: (taskId: string) =>
      snapPage(`/tasks/${taskId}/reports`),
    get: (reportId: string) =>
      snapRequest<SnapJsonRecord>(`/reports/${reportId}`),
    pdf: (reportId: string) =>
      snapRequest<Blob>(
        `/reports/${reportId}/pdf`,
        {},
        { responseType: "blob" }
      ),
    customerPackage: (reportId: string) =>
      snapRequest<SnapJsonRecord>(`/reports/${reportId}/customer-package`),
    approvalWorkbench: (reportId: string) =>
      snapRequest<SnapJsonRecord>(`/reports/${reportId}/approval-workbench`),
    aiTrust: (reportId: string) =>
      snapRequest<SnapJsonRecord>(`/reports/${reportId}/ai-trust`),
    signatures: (reportId: string) =>
      snapPage(`/reports/${reportId}/signatures`),
    sign: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/sign`,
        json("POST", payload)
      ),
    approve: (reportId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/approve`,
        json("POST", payload)
      ),
    reject: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/reject`,
        json("POST", payload)
      ),
    correct: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/correct`,
        json("POST", payload)
      ),
    disputes: (reportId: string) =>
      snapPage(`/reports/${reportId}/disputes`),
    createDispute: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/disputes`,
        json("POST", payload)
      ),
    correctiveActions: (reportId: string) =>
      snapPage(`/reports/${reportId}/corrective-actions`),
    createCorrectiveAction: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/corrective-actions`,
        json("POST", payload)
      ),
    confirmFindings: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/confirm-findings`,
        json("POST", payload)
      ),
    route: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/route`,
        json("POST", payload)
      ),
    approveAndSend: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/approve-and-send`,
        json("POST", payload)
      ),
  },

  customers: {
    list: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/customers", filters)),
    get: (customerId: string) =>
      snapRequest<SnapJsonRecord>(`/customers/${customerId}`),
    create: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/customers", json("POST", payload)),
    update: (customerId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/customers/${customerId}`,
        json("PATCH", payload)
      ),
    archive: (customerId: string) =>
      snapRequest<SnapJsonRecord>(
        `/customers/${customerId}/archive`,
        json("POST")
      ),
  },

  notifications: {
    list: (cursor?: string) =>
      snapPage(query("/notifications", { cursor })),
    read: (notificationId: string) =>
      snapRequest(`/notifications/${notificationId}/read`, json("POST")),
    readAll: () => snapRequest("/notifications/read-all", json("POST")),
  },

  devices: {
    list: () => snapPage("/devices"),
    register: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/devices", json("POST", payload)),
    revoke: (payload: SnapJsonRecord) =>
      snapRequest("/devices/revoke", json("POST", payload)),
  },

  privacy: {
    runRetentionSweep: (payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>("/retention/sweep", json("POST", payload)),
    deletionRequests: () => snapPage("/deletion-requests"),
    createDeletionRequest: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/deletion-requests", json("POST", payload)),
    processDeletionRequest: (requestId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/deletion-requests/${requestId}/process`,
        json("POST", payload)
      ),
  },

  operations: {
    overview: () => snapRequest<SnapJsonRecord>("/dashboard"),
    platformOverview: () =>
      snapRequest<SnapJsonRecord>("/platform/overview"),
    deliveryFailures: () => snapPage("/delivery/failures"),
    retryDelivery: (deliveryId: string) =>
      snapRequest(`/delivery/${deliveryId}/retry`, json("POST")),
    disputes: () => snapPage("/ops/disputes"),
    correctiveActions: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/ops/corrective-actions", filters)),
    shareLinks: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/ops/share-links", filters)),
    updateDispute: (disputeId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/ops/disputes/${disputeId}`,
        json("PATCH", payload)
      ),
    updateCorrectiveAction: (actionId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/corrective-actions/${actionId}`,
        json("PATCH", payload)
      ),
    integrations: () => snapPage("/platform/integrations"),
    tenants: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/platform/tenants", filters)),
    tenantSupportView: (tenantId: string) =>
      snapRequest<SnapJsonRecord>(
        `/platform/tenants/${tenantId}/support-view`
      ),
    suspendTenant: (tenantId: string, payload: SnapJsonRecord = {}) =>
      snapRequest(
        `/platform/tenants/${tenantId}/suspend`,
        json("POST", payload)
      ),
    reactivateTenant: (tenantId: string, payload: SnapJsonRecord = {}) =>
      snapRequest(
        `/platform/tenants/${tenantId}/reactivate`,
        json("POST", payload)
      ),
    adjustTenantCredits: (tenantId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/platform/tenants/${tenantId}/credit-adjust`,
        json("POST", payload)
      ),
    pendingSignups: () => snapPage("/platform/signups"),
    approvePendingSignup: (signupId: string, payload: SnapJsonRecord) =>
      snapRequest(
        `/platform/signups/${signupId}/approve`,
        json("POST", payload)
      ),
    rejectPendingSignup: (signupId: string, payload: SnapJsonRecord) =>
      snapRequest(
        `/platform/signups/${signupId}/reject`,
        json("POST", payload)
      ),
  },

  links: {
    byTask: (taskId: string) => snapPage(`/tasks/${taskId}/links`),
    createWorker: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/links`,
        json("POST", payload)
      ),
    createExternalUpload: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/external-upload-links`,
        json("POST", payload)
      ),
    revoke: (token: string) =>
      snapRequest(`/links/${token}/revoke`, json("POST")),
    report: (reportId: string) =>
      snapPage(`/reports/${reportId}/share-links`),
    createReport: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/share-links`,
        json("POST", payload)
      ),
    createCustomerView: (reportId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/reports/${reportId}/share-links`,
        json("POST", payload)
      ),
  },

  folders: {
    list: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/folders", filters)),
    get: (folderId: string) =>
      snapRequest<SnapJsonRecord>(`/folders/${folderId}`),
    items: (folderId: string) =>
      snapPage(`/folders/${folderId}/items`),
    create: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/folders", json("POST", payload)),
    update: (folderId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/folders/${folderId}`,
        json("PATCH", payload)
      ),
    archive: (folderId: string) =>
      snapRequest(`/folders/${folderId}/archive`, json("POST")),
    addItem: (folderId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/folders/${folderId}/items`,
        json("POST", payload)
      ),
    removeItem: (folderId: string, itemId: string) =>
      snapRequest(`/folders/${folderId}/items/${itemId}`, json("DELETE")),
    searchLibrary: (payload: SnapJsonRecord) =>
      snapPage("/library/search", json("POST", payload)),
  },

  erp: {
    detect: (taskId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/erp/detect`,
        json("POST", payload)
      ),
    linkages: (taskId: string) =>
      snapPage(`/tasks/${taskId}/erp/linkages`),
    createHandoff: (taskId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/tasks/${taskId}/erp-handoffs`,
        json("POST", payload)
      ),
    handoffs: (taskId: string) =>
      snapPage(`/tasks/${taskId}/erp-handoffs`),
    linkFolder: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>("/erp/folder-link", json("POST", payload)),
    confirmLinkage: (linkageId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/erp/linkages/${linkageId}/confirm`,
        json("POST", payload)
      ),
    correctLinkage: (linkageId: string, payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        `/erp/linkages/${linkageId}/correct`,
        json("POST", payload)
      ),
    rejectLinkage: (linkageId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/erp/linkages/${linkageId}/reject`,
        json("POST", payload)
      ),
    organizationHandoffs: (filters: Record<string, QueryValue> = {}) =>
      snapPage(query("/erp-handoffs", filters)),
    confirmHandoff: (handoffId: string, payload: SnapJsonRecord = {}) =>
      snapRequest<SnapJsonRecord>(
        `/erp-handoffs/${handoffId}/confirm`,
        json("POST", payload)
      ),
    exportHandoff: (handoffId: string) =>
      snapRequest<Blob>(
        `/erp-handoffs/${handoffId}/export`,
        {},
        { responseType: "blob" }
      ),
    postAllocations: (payload: SnapJsonRecord) =>
      snapRequest<SnapJsonRecord>(
        "/integrations/erp/allocations",
        json("POST", payload)
      ),
  },
}

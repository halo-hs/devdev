import { saveDocumentReview, confirmDocumentReview, recordBankCash, type ReviewedField, type BankCashInput } from "./erp-document-workflow"

/**
 * Mutation boundary mirrored from the original ERP API clients.
 * Replace this local adapter with the authenticated HTTP client without changing screen state.
 */
export type MutationResult =
  { ok: true; id: string; updatedAt: string } | { ok: false; error: string }

export type RecordPaymentInput = {
  scheduleId: string
  amount: string
  paidAt: string
  fee: string
  note?: string
}

export type CloseReportInput = {
  period: string
  currency: string
  note?: string
}

export type EntityMutationInput = {
  id: string
}

export type DealCreateInput = {
  id: string
  title: string
  counterparty: string
  direction: "sales" | "purchase"
  amount: string
  currency: string
}

export type CreatedDealRecord = DealCreateInput

export type CounterpartyCreateInput = {
  name: string
}

export type AliasMutationInput = {
  alias: string
  counterpartyId: string
}

export type MergeCounterpartyInput = {
  sourceId: string
  targetId: string
}

export type OrgProfileInput = {
  legalName: string
  displayName: string
  currency: string
  address: string
  city: string
  countryCode: string
  phone: string
  email: string
  businessNumber: string
  registrationNumber: string
  registrationCertificateUri: string | null
  bankName: string
  accountNumber: string
  swift: string
  signatory: string
  signatureUri: string | null
  logoUri: string | null
  accent: string
  font: string
  timezone: string
  aiLanguage: string
}

export type RetentionPolicyInput = {
  legalHold: boolean
  policies: Array<{
    id: string
    extensionYears: number
  }>
}

export type InviteMutationInput = {
  email: string
  role: "Admin" | "Member"
}

export type MemberRoleMutationInput = {
  memberId: string
  role: "Admin" | "Member"
}

export type ToggleMutationInput = {
  id: string
  enabled: boolean
}

export type ApprovalPolicyMutationInput = {
  id: string
  revision: number
  scopeKind: "org" | "document_type"
  scopeRef: string
  mode: "disabled" | "optional" | "required" | "conditional"
  amountEnabled: boolean
  amountCurrency: string
  amountThreshold: string
  counterpartyRiskEnabled: boolean
  counterpartyRiskMinGrade: "A" | "B" | "C" | "D"
  discrepancyEnabled: boolean
  newCounterpartyEnabled: boolean
}

export type DealAssigneeInput = { dealId: string; assigneeId: string | null }
export type DealRenameInput = { dealId: string; nextDealId: string }
export type DealIdentityInput = {
  dealId: string
  nextDealId: string
  title: string
}
export type DealRiskInput = {
  dealId: string
  riskKey: string
  reason: string
  note?: string
}
export type DealDocumentInput = { dealId: string; documentId: string }
export type DealDocumentCreateInput = {
  dealId: string
  documentCode: string
  method: "file" | "manual"
  fileName?: string
  documentNumber?: string
  issuedAt?: string
}
export type DealFieldsInput = {
  dealId: string
  fields: Record<string, string>
  items: Array<Record<string, unknown>>
}
export type DealFieldPatchInput = {
  dealId: string
  target: string
  value: string
  baseVersion: number
  actor: string
  force?: boolean
}
export type DealFieldPatchResult =
  | {
      ok: true
      id: string
      updatedAt: string
      version: number
    }
  | {
      ok: false
      code: "conflict"
      error: string
      currentValue: string
      currentVersion: number
      updatedBy: string
      updatedAt: string
    }
export type DealOrderActionInput = {
  dealId: string
  action: string
  reason?: string
  price?: string
}
export type DealCostInput = {
  dealId: string
  costId?: string
  type: string
  amount: string
  currency: string
  basis: string
  note?: string
}
export type DealPartyInput = {
  dealId: string
  partyId?: string
  role: string
  name: string
  source?: string
}
export type DealShareInput = { dealId: string; memberId: string }
export type DealNoteInput = { dealId: string; body: string }
export type DealNoteUpdateInput = DealNoteInput & { noteId: string }
export type DealFlagInput = { dealId: string; type: string; note: string }
export type DealContactInput = {
  dealId: string
  contactId?: string
  role?: string
  name?: string
  company?: string
}
export type SnapAllocationInput = { dealId: string; candidateId: string }
export type DeliveryEventInput = {
  documentId: string
  shareLinkId?: string
  recipient: string
  subject?: string
  textBody?: string
  idempotencyKey: string
}
export type FlagAcknowledgeInput = {
  id: string
  disposition: "confirmed" | "dismissed"
  assigneeId?: string | null
  note?: string
}
export type ActionItemTransitionInput = {
  id: string
  verb: "acknowledge" | "resolve"
  assigneeId?: string | null
  note?: string
}

export type ImportResult =
  | {
      ok: true
      total: number
      created: number
      skipped: number
      errors: Array<{ line: number; label: string; reason: string }>
    }
  | { ok: false; error: string }

const latency = 450
const renamedDealIds = new Map<string, string>()
const updatedDealTitles = new Map<string, string>()
const CREATED_DEALS_STORAGE_KEY = "ecoya-prototype-created-deals"

function readCreatedDeals(): CreatedDealRecord[] {
  if (typeof window === "undefined") return []
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(CREATED_DEALS_STORAGE_KEY) ?? "[]"
    )
    if (!Array.isArray(stored)) return []
    return stored.filter(
      (deal): deal is CreatedDealRecord =>
        typeof deal?.id === "string" &&
        typeof deal?.title === "string" &&
        typeof deal?.counterparty === "string" &&
        (deal?.direction === "sales" || deal?.direction === "purchase") &&
        typeof deal?.amount === "string" &&
        typeof deal?.currency === "string"
    )
  } catch {
    return []
  }
}

function writeCreatedDeals(deals: CreatedDealRecord[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      CREATED_DEALS_STORAGE_KEY,
      JSON.stringify(deals)
    )
  } catch {
    // 브라우저 저장소를 사용할 수 없어도 현재 생성 요청은 계속 처리합니다.
  }
}

function nextCreatedDealId() {
  const now = new Date()
  const datePart = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("")
  const prefix = `DL-${datePart}-`
  const latestSequence = readCreatedDeals().reduce((latest, deal) => {
    if (!deal.id.startsWith(prefix)) return latest
    const sequence = Number(deal.id.slice(prefix.length))
    return Number.isFinite(sequence) ? Math.max(latest, sequence) : latest
  }, 0)
  return `${prefix}${String(latestSequence + 1).padStart(2, "0")}`
}
const dealFieldVersions = new Map<
  string,
  { value: string; version: number; updatedBy: string; updatedAt: string }
>()

async function localMutation(id: string): Promise<MutationResult> {
  await new Promise((resolve) => setTimeout(resolve, latency))
  return { ok: true, id, updatedAt: new Date().toISOString() }
}

async function patchDealField(
  input: DealFieldPatchInput
): Promise<DealFieldPatchResult> {
  await new Promise((resolve) => setTimeout(resolve, latency))
  const recordKey = `${input.dealId}:${input.target}`
  const current = dealFieldVersions.get(recordKey)

  if (current && current.version !== input.baseVersion && !input.force) {
    return {
      ok: false,
      code: "conflict",
      error: "다른 사용자가 먼저 이 필드를 수정했습니다.",
      currentValue: current.value,
      currentVersion: current.version,
      updatedBy: current.updatedBy,
      updatedAt: current.updatedAt,
    }
  }

  const updatedAt = new Date().toISOString()
  const version = (current?.version ?? input.baseVersion) + 1
  dealFieldVersions.set(recordKey, {
    value: input.value,
    version,
    updatedBy: input.actor,
    updatedAt,
  })
  return {
    ok: true,
    id: recordKey,
    updatedAt,
    version,
  }
}

export const prototypeBackend = {
  tradeDocuments: {
    saveFields: async ({ id, fields }: { id: string; fields: Record<string, ReviewedField> }): Promise<MutationResult> => {
      await new Promise((resolve) => setTimeout(resolve, latency))
      try {
        saveDocumentReview(id, fields)
        return { ok: true, id, updatedAt: new Date().toISOString() }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "필드를 저장하지 못했습니다." }
      }
    },
    confirmTransition: async (input: Parameters<typeof confirmDocumentReview>[0]): Promise<MutationResult> => {
      await new Promise((resolve) => setTimeout(resolve, latency))
      try {
        confirmDocumentReview(input)
        return { ok: true, id: input.id, updatedAt: new Date().toISOString() }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "문서를 확정하지 못했습니다." }
      }
    },
    recordBankCash: async (input: BankCashInput): Promise<MutationResult> => {
      await new Promise((resolve) => setTimeout(resolve, latency))
      try {
        recordBankCash(input)
        return { ok: true, id: input.sourceDocumentId, updatedAt: new Date().toISOString() }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "현금을 기록하지 못했습니다." }
      }
    },
    delete: ({ id }: EntityMutationInput) => localMutation(id),
    retry: ({ id }: EntityMutationInput) => localMutation(id),
    commit: ({ id }: EntityMutationInput) => localMutation(id),
    assignToDeal: ({ id }: EntityMutationInput) => localMutation(id),
    unassignFromDeal: ({ id }: EntityMutationInput) => localMutation(id),
  },
  generatedDocuments: {
    saveDraft: ({ id }: EntityMutationInput) => localMutation(id),
    create: ({ id }: EntityMutationInput) => localMutation(id),
    duplicate: ({ id }: EntityMutationInput) => localMutation(id),
    archiveWithShareLinks: ({ id }: EntityMutationInput) => localMutation(id),
    confirm: ({ id }: EntityMutationInput) => localMutation(id),
    submit: ({ id }: EntityMutationInput) => localMutation(id),
    approve: ({ id }: EntityMutationInput) => localMutation(id),
    reject: ({ id }: EntityMutationInput) => localMutation(id),
    revokeShareLink: ({ id }: EntityMutationInput) => localMutation(id),
  },
  counterparties: {
    create: ({ name }: CounterpartyCreateInput) =>
      localMutation(`counterparty:${name}`),
  },
  deals: {
    getNextId: () => nextCreatedDealId(),
    getCreated: (dealId: string) =>
      readCreatedDeals().find((deal) => deal.id === dealId) ?? null,
    create: async (input: DealCreateInput) => {
      const result = await localMutation(input.id)
      if (result.ok) {
        const current = readCreatedDeals().filter(
          (deal) => deal.id !== result.id
        )
        writeCreatedDeals([...current, { ...input, id: result.id }])
      }
      return result
    },
    getDisplayId: (dealId: string) => renamedDealIds.get(dealId) ?? dealId,
    getTitle: (dealId: string, fallbackTitle: string) =>
      updatedDealTitles.get(dealId) ?? fallbackTitle,
    rename: async (input: DealRenameInput) => {
      const result = await localMutation(input.nextDealId)
      if (result.ok) renamedDealIds.set(input.dealId, input.nextDealId)
      return result
    },
    updateIdentity: async (input: DealIdentityInput) => {
      const result = await localMutation(input.nextDealId)
      if (result.ok) {
        renamedDealIds.set(input.dealId, input.nextDealId)
        updatedDealTitles.set(input.dealId, input.title)
      }
      return result
    },
    restore: (dealId: string) => localMutation(dealId),
    archive: (dealId: string) => localMutation(dealId),
    setAssignee: (input: DealAssigneeInput) => {
      void input
      return localMutation(input.dealId)
    },
    dismissRisk: (input: DealRiskInput) => {
      void input
      return localMutation(input.dealId)
    },
    updateFields: (input: DealFieldsInput) => {
      void input
      return localMutation(input.dealId)
    },
    getFieldVersion: (dealId: string, target: string) =>
      dealFieldVersions.get(`${dealId}:${target}`)?.version ?? 0,
    updateField: (input: DealFieldPatchInput) => patchDealField(input),
    unlinkDocument: (input: DealDocumentInput) => {
      void input
      return localMutation(input.documentId)
    },
    createDocument: (input: DealDocumentCreateInput) => {
      void input
      return localMutation(`${input.dealId}:${input.documentCode}`)
    },
    orderAction: (input: DealOrderActionInput) => {
      void input
      return localMutation(input.dealId)
    },
    createCost: (input: DealCostInput) => {
      void input
      return localMutation(input.dealId)
    },
    updateCost: (input: DealCostInput) => {
      void input
      return localMutation(input.costId ?? input.dealId)
    },
    deleteCost: ({ id }: EntityMutationInput) => localMutation(id),
    createParty: (input: DealPartyInput) => {
      void input
      return localMutation(input.dealId)
    },
    updateParty: (input: DealPartyInput) => {
      void input
      return localMutation(input.partyId ?? input.dealId)
    },
    deleteParty: ({ id }: EntityMutationInput) => localMutation(id),
    createShare: (input: DealShareInput) => {
      void input
      return localMutation(input.memberId)
    },
    deleteShare: ({ id }: EntityMutationInput) => localMutation(id),
    createNote: (input: DealNoteInput) => {
      void input
      return localMutation(input.dealId)
    },
    updateNote: (input: DealNoteUpdateInput) => {
      void input
      return localMutation(input.noteId)
    },
    deleteNote: ({ id }: EntityMutationInput) => localMutation(id),
    createFlag: (input: DealFlagInput) => {
      void input
      return localMutation(input.dealId)
    },
    createContact: (input: DealContactInput) => {
      void input
      return localMutation(input.dealId)
    },
    deleteContact: ({ id }: EntityMutationInput) => localMutation(id),
  },
  shipments: {
    refreshTracking: ({ id }: EntityMutationInput) => localMutation(id),
    allocateSnap: (input: SnapAllocationInput) => {
      void input
      return localMutation(input.dealId)
    },
  },
  deliveryEvents: {
    create: (input: DeliveryEventInput) => {
      void input
      return localMutation(input.idempotencyKey)
    },
  },
  flags: {
    acknowledge: (input: FlagAcknowledgeInput) => {
      void input
      return localMutation(input.id)
    },
  },
  actionItems: {
    transition: (input: ActionItemTransitionInput) => {
      void input
      return localMutation(input.id)
    },
  },
  settlement: {
    recordPayment: (input: RecordPaymentInput) =>
      localMutation(input.scheduleId),
    listPayments: (scheduleId: string) => localMutation(scheduleId),
    deletePayment: (scheduleId: string, paymentId: string) =>
      localMutation(`${scheduleId}:${paymentId}`),
    uncompleteSchedule: (scheduleId: string) => localMutation(scheduleId),
    recordOverpayment: (scheduleId: string) =>
      localMutation(`overpayment:${scheduleId}`),
    recordAdjustment: (scheduleId: string) =>
      localMutation(`adjustment:${scheduleId}`),
    recordRefund: (scheduleId: string) => localMutation(`refund:${scheduleId}`),
    openDispute: (scheduleId: string) => localMutation(`dispute:${scheduleId}`),
    proposeWriteoff: (scheduleId: string) =>
      localMutation(`writeoff:${scheduleId}`),
  },
  reports: {
    closePeriod: (input: CloseReportInput) => localMutation(input.period),
  },
  onboarding: {
    approveSuggestion: (suggestionId: string) => localMutation(suggestionId),
    dismissSuggestion: (suggestionId: string) => localMutation(suggestionId),
  },
  settings: {
    saveProfile: (input: OrgProfileInput) => {
      void input
      return localMutation("org-profile")
    },
    saveRetentionPolicy: (input: RetentionPolicyInput) => {
      void input
      return localMutation("retention-policy")
    },
    approveAlias: ({ alias, counterpartyId }: AliasMutationInput) =>
      localMutation(`${counterpartyId}:${alias}`),
    dismissAlias: (aliasId: string) => localMutation(aliasId),
    createAlias: ({ alias, counterpartyId }: AliasMutationInput) =>
      localMutation(`${counterpartyId}:${alias}`),
    deleteAlias: (alias: string) => localMutation(alias),
    mergeCounterparty: ({ sourceId, targetId }: MergeCounterpartyInput) =>
      localMutation(`${sourceId}:${targetId}`),
    createInvite: ({ email }: InviteMutationInput) => localMutation(email),
    cancelInvite: (inviteId: string) => localMutation(inviteId),
    resendInvite: (inviteId: string) => localMutation(inviteId),
    changeMemberRole: ({ memberId }: MemberRoleMutationInput) =>
      localMutation(memberId),
    removeMember: (memberId: string) => localMutation(memberId),
    eraseUserData: (memberId: string) => localMutation(memberId),
    updateAlertRule: ({ id }: ToggleMutationInput) => localMutation(id),
    updateAlertSubscription: ({ id }: ToggleMutationInput) => localMutation(id),
    saveApprovalPolicy: (input: ApprovalPolicyMutationInput) => {
      void input
      return localMutation(input.id)
    },
    deleteApprovalPolicy: (policyId: string) => localMutation(policyId),
    requestSnapPlanUpgrade: (targetPlan: string) =>
      localMutation(`snap-plan:${targetPlan}`),
    openSnapBillingPortal: () => localMutation("snap-billing-portal"),
    downloadSnapInvoice: (invoiceId: string) =>
      localMutation(`snap-invoice:${invoiceId}`),
    importContacts: async (csv: string): Promise<ImportResult> => {
      const mutation = await localMutation("contact-import")
      if (!mutation.ok) return mutation
      const lines = csv.trim().split(/\r?\n/).slice(1)
      return {
        ok: true,
        total: lines.length,
        created: Math.max(1, lines.length - 1),
        skipped: Math.min(1, lines.length),
        errors:
          lines.length > 3
            ? [{ line: 4, label: "거래처", reason: "필수 값이 비어 있습니다." }]
            : [],
      }
    },
    importDeals: async (csv: string): Promise<ImportResult> => {
      const mutation = await localMutation("deal-import")
      if (!mutation.ok) return mutation
      const lines = csv.trim().split(/\r?\n/).slice(1)
      return {
        ok: true,
        total: lines.length,
        created: Math.max(1, lines.length - 1),
        skipped: Math.min(1, lines.length),
        errors:
          lines.length > 3
            ? [{ line: 4, label: "거래", reason: "필수 값이 비어 있습니다." }]
            : [],
      }
    },
  },
}

/** CS-22–25 UI boundary. These methods are not an HTTP/API contract. */
export type WithdrawalMembership = {
  id: string
  name: string
  role: "OWNER" | "ADMIN" | "MEMBER"
}
export type WithdrawalIdentity = { id: string; email: string; name: string }
export type WithdrawalMethod = "password" | "google" | "unknown"
export type WithdrawalResult = {
  requestId: string
  status:
    | "accepted"
    | "processing"
    | "completed"
    | "unknown"
    | "failed"
    | "not-received"
}
export type WithdrawalSubmission =
  | { kind: "result"; result: WithdrawalResult }
  | { kind: "memberships"; memberships: WithdrawalMembership[] }
  | { kind: "membership-error" }
  | { kind: "reauth-required" }
export type WithdrawalAuthentication =
  | { status: "verified"; accountId: string }
  | { status: "invalid-password" | "cancelled" | "identity-mismatch" | "error" }
export interface WithdrawalGateway {
  identity: WithdrawalIdentity
  memberships(): Promise<WithdrawalMembership[]>
  method(): Promise<WithdrawalMethod>
  reauthenticate(
    method: "password" | "google",
    password?: string
  ): Promise<WithdrawalAuthentication>
  submit(requestId: string): Promise<WithdrawalSubmission>
  result(requestId: string): Promise<WithdrawalResult>
  createOrganization(name: string): Promise<void>
  reset(): void
}

export const withdrawalScenarios = [
  "member",
  "password",
  "google",
  "membership-error",
  "method-unknown",
  "password-error",
  "google-cancelled",
  "google-mismatch",
  "auth-error",
  "accepted",
  "completed",
  "failed",
  "result-unknown",
  "not-received",
  "membership-added",
  "membership-recheck-error",
  "reauth-expired",
] as const
export type WithdrawalScenario = (typeof withdrawalScenarios)[number]
export function withdrawalScenario(search: string): WithdrawalScenario {
  const value = new URLSearchParams(search).get("withdrawalPreview")
  return withdrawalScenarios.find((scenario) => scenario === value) ?? "member"
}

/** Explicit in-memory prototype responses. No credentials, sessions or accounts are changed. */
export function createWithdrawalPreview(
  scenario: WithdrawalScenario = "member",
  role: WithdrawalMembership["role"] = "OWNER"
): WithdrawalGateway {
  const identity = {
    id: "preview-account",
    email: "minyoung@ecoya.app",
    name: "조민영",
  }
  let memberships: WithdrawalMembership[] =
    scenario === "member" ? [{ id: "ecoya", name: "ECOYA Demo Co.", role }] : []
  let authenticatedAt = 0
  let membershipCalls = 0
  let membershipRequest: Promise<WithdrawalMembership[]> | undefined
  let methodCalls = 0
  let authCalls = 0
  let submitCalls = 0
  let resultCalls = 0
  const results = new Map<string, WithdrawalResult>()
  const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 350))
  return {
    identity,
    memberships() {
      // Share an in-flight read, including React StrictMode's effect replay.
      membershipRequest ??= (async () => {
        await delay()
        if (scenario === "membership-error" && ++membershipCalls === 1)
          throw new Error("membership-unavailable")
        return [...memberships]
      })().finally(() => {
        membershipRequest = undefined
      })
      return membershipRequest
    },
    async method() {
      await delay()
      if (scenario === "method-unknown" && ++methodCalls === 1) return "unknown"
      return scenario.startsWith("google") ? "google" : "password"
    },
    async reauthenticate(method, password) {
      await delay()
      authenticatedAt = 0
      authCalls++
      if (
        method === "password" &&
        (!password || (scenario === "password-error" && authCalls === 1))
      )
        return { status: "invalid-password" }
      if (scenario === "google-cancelled" && authCalls === 1)
        return { status: "cancelled" }
      if (scenario === "google-mismatch" && authCalls === 1)
        return { status: "identity-mismatch" }
      if (scenario === "auth-error" && authCalls === 1)
        return { status: "error" }
      authenticatedAt = Date.now()
      return { status: "verified", accountId: identity.id }
    },
    async submit(requestId) {
      await delay()
      const previous = results.get(requestId)
      if (previous && previous.status !== "not-received")
        return { kind: "result", result: previous }
      submitCalls++
      if (scenario === "membership-added" && submitCalls === 1) {
        memberships = [
          { id: "new-org", name: "새로 참여한 조직", role: "MEMBER" },
        ]
      }
      if (memberships.length)
        return { kind: "memberships", memberships: [...memberships] }
      if (scenario === "membership-recheck-error" && submitCalls === 1)
        return { kind: "membership-error" }
      if (
        !authenticatedAt ||
        Date.now() - authenticatedAt > 5 * 60 * 1000 ||
        (scenario === "reauth-expired" && submitCalls === 1)
      ) {
        authenticatedAt = 0
        return { kind: "reauth-required" }
      }
      const status =
        scenario === "completed"
          ? "completed"
          : scenario === "accepted"
            ? "accepted"
            : scenario === "failed"
              ? "failed"
              : (scenario === "result-unknown" ||
                    scenario === "not-received") &&
                  submitCalls === 1
                ? "unknown"
                : "processing"
      const result: WithdrawalResult = { requestId, status }
      results.set(requestId, result)
      return { kind: "result", result }
    },
    async result(requestId) {
      await delay()
      const previous = results.get(requestId)
      if (!previous) return { requestId, status: "unknown" }
      if (previous.status === "unknown" && ++resultCalls > 1) {
        const result: WithdrawalResult = {
          requestId,
          status: scenario === "not-received" ? "not-received" : "processing",
        }
        results.set(requestId, result)
        return result
      }
      return previous
    },
    async createOrganization(name) {
      await delay()
      if (!name.trim()) throw new Error("name-required")
      memberships = [
        ...memberships,
        { id: "created-org", name: name.trim(), role: "OWNER" },
      ]
      authenticatedAt = 0
    },
    reset() {
      authenticatedAt = 0
    },
  }
}

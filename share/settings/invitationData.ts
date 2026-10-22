export type PendingInvitation = {
  id: string
  email: string
  role: "admin" | "member"
  status: "pending" | "cancelled"
  expiresAt: string
  url: string
}
export function invitationExamples(): PendingInvitation[] {
  return [
    {
      id: "invite-finance",
      email: "finance@company.example",
      role: "member",
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      url: `${window.location.origin}/invite?token=preview-finance`,
    },
  ]
}

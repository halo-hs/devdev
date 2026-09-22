export type WorkspaceProduct = "erp" | "snap"
export type WorkspaceKey = "ecoya"

type WorkspaceAccess = {
  label: string
  billingPlan: string
}

export type WorkspaceOption = {
  id: WorkspaceKey
  name: string
  organizationName: string
  description: string
  billingPlan: string
  products: Partial<Record<WorkspaceProduct, WorkspaceAccess>>
}

export const workspaceOptions: WorkspaceOption[] = [
  {
    id: "ecoya",
    name: "ECOYA Demo Co.",
    organizationName: "ECOYA Demo Co.",
    description: "문서·거래·현장 업무",
    billingPlan: "Pro",
    products: {
      erp: { label: "Trade OS", billingPlan: "Pro" },
      snap: { label: "SNAP", billingPlan: "Free" },
    },
  },
]

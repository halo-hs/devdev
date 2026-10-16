import { FileText, ScanLine } from "lucide-react"

export type TrialProduct = "erp" | "snap"

export const trialProducts = {
  erp: { name: "Trade OS", description: "문서부터 거래·정산까지, 무역 업무를 한곳에서 관리하세요.", icon: FileText },
  snap: { name: "SNAP", description: "현장 기록부터 증빙·리포트까지, 현장 업무를 간편하게 관리하세요.", icon: ScanLine },
} as const

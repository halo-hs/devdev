import { Bell, Building2, CircleUserRound, CreditCard, Database, FileSpreadsheet, Globe2, Landmark, Mail, Palette, SlidersHorizontal, Sparkles, Upload, ExternalLink, Check } from "lucide-react"
import type { NavigationIcon } from "@/components/platform/NavigationIcon"
import type { ProductEntitlement, SettingsRole } from "./SettingsRoutePage"
import type { ImportPermissions } from "./importPermissions"

export type SectionId =
  | "account"
  | "trade-usage"
  | "organizations"
  | "organization"
  | "members"
  | "products"
  | "billing"
  | "trade-defaults"
  | "trade-email"
  | "trade-counterparty-import"
  | "trade-deal-import"
  | "trade-aliases"
  | "trade-alerts"
  | "approvals"
  | "snap-operations"
  | "snap-branding"
  | "snap-localization"
  | "snap-data"
  | "snap-usage"

type NavItem = {
  id: SectionId
  label: string
  icon: typeof CircleUserRound
  /** Same Figma glyph as the main sidebar / profile menu, when one exists. */
  navIcon?: Parameters<typeof NavigationIcon>[0]["name"]
  product?: ProductEntitlement
  roles?: readonly SettingsRole[]
  permission?: keyof ImportPermissions
  keywords?: readonly string[]
}

// Common SSOT 02-COMMON-IA: headings are non-interactive, menus one level deep.
export const navigation: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "일반",
    items: [
      { id: "account", label: "내 계정", icon: CircleUserRound },
      { id: "organizations", label: "소속 Organization", icon: Building2 },
    ],
  },
  {
    label: "조직",
    items: [
      {
        id: "organization",
        label: "조직 정보",
        icon: Building2,
        keywords: ["회사", "사업자"],
      },
      {
        id: "members",
        label: "사용자 관리",
        icon: CircleUserRound,
        roles: ["owner", "admin"],
      },
      { id: "products", label: "제품 및 구독", icon: CreditCard },
      { id: "billing", label: "빌링", icon: ExternalLink, navIcon: "billing", roles: ["owner"] },
    ],
  },
  {
    label: "Trade OS",
    items: [
      {
        id: "trade-defaults",
        label: "업무 기본 설정",
        icon: SlidersHorizontal,
        product: "erp",
      },
      {
        id: "trade-email",
        label: "이메일로 문서 받기",
        icon: Mail,
        product: "erp",
      },
      {
        id: "trade-counterparty-import",
        label: "거래처 일괄 등록",
        permission: "canImportCounterparties",
        icon: FileSpreadsheet,
        product: "erp",
      },
      {
        id: "trade-deal-import",
        label: "거래 일괄 등록",
        permission: "canImportDeals",
        icon: Upload,
        navIcon: "upload",
        product: "erp",
      },
      {
        id: "trade-aliases",
        label: "거래처 별칭 학습",
        icon: Landmark,
        product: "erp",
      },
      { id: "trade-alerts", label: "알림 설정", icon: Bell, navIcon: "notification", product: "erp" },
      { id: "trade-usage", label: "AI 사용량", icon: Sparkles, navIcon: "usage", product: "erp", keywords: ["토큰", "사용량"] },
      { id: "approvals", label: "결재 정책", icon: Check, product: "erp", roles: ["owner"] },
    ],
  },
  {
    label: "SNAP",
    items: [
      {
        id: "snap-operations",
        label: "현장 운영",
        icon: SlidersHorizontal,
        product: "snap",
      },
      { id: "snap-branding", label: "브랜딩", icon: Palette, product: "snap" },
      {
        id: "snap-localization",
        label: "지역화",
        icon: Globe2,
        navIcon: "language",
        product: "snap",
      },
      {
        id: "snap-data",
        label: "데이터 및 보존",
        icon: Database,
        product: "snap",
      },
      {
        id: "snap-usage",
        label: "사용량 및 기술 한도",
        icon: Sparkles,
        navIcon: "usage",
        product: "snap",
      },
    ],
  },
]

/** Header location trail: label of a settings section id, if it exists. */
export function settingsSectionLabel(id: string | null): string | undefined {
  for (const group of navigation) {
    const item = group.items.find((entry) => entry.id === id)
    if (item) return item.label
  }
  return undefined
}

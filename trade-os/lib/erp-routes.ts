import type { ErpMenuTarget } from "@trade-os/erp-menu-prototypes"

export type ErpRouteScreen = ErpMenuTarget | "result"

export type ErpRouteMatch = {
  screen: ErpRouteScreen
  params: {
    dealId?: string
    documentName?: string
    documentNumber?: string
    uploadStep?: "review" | "connect"
  }
}

const ERP_SCREEN_PATHS: Partial<Record<ErpRouteScreen, string>> = {
  onboarding: "/erp/onboarding",
  home: "/erp/home",
  inbox: "/erp/documents/upload",
  create: "/erp/documents/create",
  ask: "/erp/ai",
  deals: "/erp/deals",
  shipments: "/erp/shipments",
  settlement: "/erp/settlement",
  monitoring: "/erp/monitoring",
  reports: "/erp/reports",
  sales: "/erp/sales",
  notifications: "/erp/notifications",
  counterparty: "/erp/counterparties",
  snap: "/erp/evidence",
  settings: "/erp/settings",
  billing: "/erp/settings/billing",
  tokens: "/erp/settings/tokens",
}

// Accept current Platform links while preserving the prototype's existing UI routes.
const PLATFORM_ROUTE_ALIASES: Record<string, ErpRouteScreen> = {
  "/erp/documents": "create",
  "/erp/inbox": "inbox",
  "/erp/monitor": "monitoring",
  "/erp/sales-performance": "sales",
  "/erp/snap-evidence": "snap",
}

const PLATFORM_SETTINGS_SECTIONS: Record<string, string> = {
  "/erp/settings/billing": "billing",
  "/erp/settings/tokens": "trade-usage",
  "/erp/settings/token-usage": "trade-usage",
  "/erp/settings/organization": "organization",
  "/erp/settings/alerts": "trade-alerts",
  "/erp/settings/email-forward": "trade-email",
  "/erp/settings/contact-import": "trade-counterparty-import",
  "/erp/settings/deal-import": "trade-deal-import",
  "/erp/settings/counterparty-aliases": "trade-aliases",
}

function normalizePathname(pathname: string) {
  if (pathname === "/") return pathname
  return pathname.replace(/\/+$/, "") || "/"
}

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function matchErpRoute(pathname: string): ErpRouteMatch | null {
  const normalized = normalizePathname(pathname)

  const platformScreen = PLATFORM_ROUTE_ALIASES[normalized]
  if (platformScreen) return { screen: platformScreen, params: {} }

  if (normalized === "/erp/copilot") {
    return { screen: "ask", params: {} }
  }

  if (
    normalized === "/" ||
    normalized === "/v2-home" ||
    normalized === "/erp"
  ) {
    return { screen: "home", params: {} }
  }

  const uploadDetail = normalized.match(
    /^\/erp\/documents\/upload\/([^/]+)(?:\/(review|connect))?$/
  )
  if (uploadDetail) {
    return {
      screen: "inbox",
      params: {
        documentName: decodePathSegment(uploadDetail[1]),
        uploadStep: uploadDetail[2] as "review" | "connect" | undefined,
      },
    }
  }

  const createDetail = normalized.match(/^\/erp\/documents\/create\/([^/]+)$/)
  if (createDetail) {
    return {
      screen: "result",
      params: { documentNumber: decodePathSegment(createDetail[1]) },
    }
  }

  const dealDetail = normalized.match(/^\/erp\/deals\/([^/]+)$/)
  if (dealDetail) {
    return {
      screen: "deal",
      params: { dealId: decodePathSegment(dealDetail[1]) },
    }
  }

  for (const [screen, path] of Object.entries(ERP_SCREEN_PATHS)) {
    if (path === normalized) {
      return { screen: screen as ErpRouteScreen, params: {} }
    }
  }

  return null
}

/** Keep incoming handoff links on the canonical AI screen. */
export function canonicalErpLocation(location: {
  pathname: string
  search: string
  hash: string
}) {
  const path = normalizePathname(location.pathname)
  const settingsSection = PLATFORM_SETTINGS_SECTIONS[path]
  if (settingsSection) {
    const search = new URLSearchParams(location.search)
    search.set("section", settingsSection)
    return `/erp/settings?${search}`
  }
  if (
    path === "/erp/copilot" ||
    (path === "/erp/home" && location.hash === "#ask")
  ) {
    return `/erp/ai${location.search}`
  }
  return null
}

export function pathForErpScreen(
  screen: ErpRouteScreen,
  params: ErpRouteMatch["params"] = {}
) {
  if (screen === "deal" && params.dealId) {
    return `/erp/deals/${encodeURIComponent(params.dealId)}`
  }
  if (screen === "inbox" && params.documentName) {
    const uploadStep = params.uploadStep ?? "review"
    return `/erp/documents/upload/${encodeURIComponent(params.documentName)}/${uploadStep}`
  }
  if (screen === "result" && params.documentNumber) {
    return `/erp/documents/create/${encodeURIComponent(params.documentNumber)}`
  }
  if (screen === "result") return "/erp/documents/create"
  if (screen === "deal") return "/erp/deals"
  return ERP_SCREEN_PATHS[screen] ?? "/erp/home"
}

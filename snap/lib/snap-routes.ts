import type { SnapScreenKey } from "@snap/snap-prototypes"

export type SnapRole =
  | "owner"
  | "manager"
  | "operator"
  | "worker"
  | "customer"
  | "platform_operator"
  | "anonymous"

export type SnapRouteShell =
  | "public"
  | "external"
  | "workspace"
  | "platform"

export type SnapRouteDefinition = {
  id: string
  path: string
  screen: SnapScreenKey
  label: string
  menuLabel?: string
  breadcrumb: readonly string[]
  roles: readonly SnapRole[]
  shell: SnapRouteShell
  firstScreen?: boolean
}

export type SnapRouteMatch = {
  definition: SnapRouteDefinition
  params: Record<string, string>
  search: URLSearchParams
}

export type SnapSessionAccess = {
  role: SnapRole | null
  platformOps: boolean
  authenticated: boolean
}

export type NormalizedSnapLocation = {
  pathname: string
  search: string
  changed: boolean
}

const workspaceRoles: readonly SnapRole[] = ["owner", "manager", "operator"]
const adminRoles: readonly SnapRole[] = ["owner", "manager"]
const publicRoles: readonly SnapRole[] = ["anonymous"]

export const SNAP_ROUTE_DEFINITIONS: readonly SnapRouteDefinition[] = [
  {
    id: "landing",
    path: "/snap",
    screen: "SC-01",
    label: "ECOYA SNAP",
    breadcrumb: ["ECOYA SNAP"],
    roles: publicRoles,
    shell: "public",
    firstScreen: true,
  },
  {
    id: "pricing",
    path: "/pricing",
    screen: "SC-02",
    label: "요금제",
    breadcrumb: ["ECOYA SNAP", "요금제"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "terms",
    path: "/legal/terms",
    screen: "SC-03",
    label: "이용약관",
    breadcrumb: ["ECOYA SNAP", "이용약관"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "privacy",
    path: "/legal/privacy",
    screen: "SC-04",
    label: "개인정보처리방침",
    breadcrumb: ["ECOYA SNAP", "개인정보처리방침"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "location-terms",
    path: "/legal/location",
    screen: "SC-45",
    label: "위치기반 서비스 이용약관",
    breadcrumb: ["ECOYA SNAP", "위치기반 서비스 이용약관"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "signup",
    path: "/signup",
    screen: "SC-05",
    label: "가입",
    breadcrumb: ["ECOYA SNAP", "가입"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "login",
    path: "/login",
    screen: "SC-06",
    label: "로그인",
    breadcrumb: ["ECOYA SNAP", "로그인"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "pending",
    path: "/pending",
    screen: "SC-07",
    label: "조직 승인 대기",
    breadcrumb: ["ECOYA SNAP", "조직 승인 대기"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "join-pending",
    path: "/join-pending",
    screen: "SC-08",
    label: "합류 승인 대기",
    breadcrumb: ["ECOYA SNAP", "합류 승인 대기"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "signup-rejected",
    path: "/signup-rejected",
    screen: "SC-09",
    label: "가입 거절",
    breadcrumb: ["ECOYA SNAP", "가입 거절"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "onboarding",
    path: "/onboarding",
    screen: "SC-10",
    label: "처음 시작하기",
    breadcrumb: ["ECOYA SNAP", "처음 시작하기"],
    roles: adminRoles,
    shell: "workspace",
  },
  {
    id: "invite",
    path: "/invite/:token",
    screen: "SC-11",
    label: "초대 수락",
    breadcrumb: ["ECOYA SNAP", "초대 수락"],
    roles: publicRoles,
    shell: "public",
  },
  {
    id: "work-link",
    path: "/work/:token",
    screen: "SC-12",
    label: "작업자 실행",
    breadcrumb: ["ECOYA SNAP", "작업자 실행"],
    roles: ["worker", "anonymous"],
    shell: "external",
  },
  {
    id: "upload-link",
    path: "/upload/:token",
    screen: "SC-13",
    label: "외부 업로드",
    breadcrumb: ["ECOYA SNAP", "외부 업로드"],
    roles: ["worker", "anonymous"],
    shell: "external",
  },
  {
    id: "customer-view",
    path: "/view/:token",
    screen: "SC-14",
    label: "고객 보고서",
    breadcrumb: ["ECOYA SNAP", "고객 보고서"],
    roles: ["customer", "anonymous"],
    shell: "external",
  },
  {
    id: "verify-evidence",
    path: "/verify/:hash",
    screen: "SC-15",
    label: "증거 검증",
    breadcrumb: ["ECOYA SNAP", "증거 검증"],
    roles: publicRoles,
    shell: "external",
  },
  {
    id: "report-preview",
    path: "/dev/report-preview",
    screen: "SC-16",
    label: "보고서 미리보기",
    breadcrumb: ["ECOYA SNAP", "보고서 미리보기"],
    roles: adminRoles,
    shell: "external",
  },
  {
    id: "dashboard",
    path: "/dashboard",
    screen: "SC-17",
    label: "대시보드",
    menuLabel: "대시보드",
    breadcrumb: ["ECOYA SNAP", "대시보드"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "tasks",
    path: "/tasks",
    screen: "SC-18",
    label: "업무",
    menuLabel: "업무",
    breadcrumb: ["ECOYA SNAP", "업무"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "task-new",
    path: "/tasks/new",
    screen: "SC-19",
    label: "업무 만들기",
    breadcrumb: ["ECOYA SNAP", "업무", "업무 만들기"],
    roles: workspaceRoles,
    shell: "workspace",
  },
  {
    id: "task-report",
    path: "/tasks/:id/report",
    screen: "SC-21",
    label: "고객 보고서 작성",
    breadcrumb: ["ECOYA SNAP", "업무", "고객 보고서 작성"],
    roles: workspaceRoles,
    shell: "workspace",
  },
  {
    id: "task-detail",
    path: "/tasks/:id",
    screen: "SC-20",
    label: "업무 상세",
    breadcrumb: ["ECOYA SNAP", "업무", "업무 상세"],
    roles: workspaceRoles,
    shell: "workspace",
  },
  {
    id: "reports",
    path: "/reports",
    screen: "SC-22",
    label: "보고서",
    menuLabel: "보고서",
    breadcrumb: ["ECOYA SNAP", "보고서"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "evidence",
    path: "/evidence",
    screen: "SC-23",
    label: "증빙 보관함",
    menuLabel: "증빙 보관함",
    breadcrumb: ["ECOYA SNAP", "증빙 보관함"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "customers",
    path: "/customers",
    screen: "SC-24",
    label: "고객",
    menuLabel: "고객",
    breadcrumb: ["ECOYA SNAP", "고객"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "calendar",
    path: "/calendar",
    screen: "SC-25",
    label: "캘린더",
    menuLabel: "캘린더",
    breadcrumb: ["ECOYA SNAP", "캘린더"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "workflow",
    path: "/workflow",
    screen: "SC-26",
    label: "워크플로우",
    menuLabel: "워크플로우",
    breadcrumb: ["ECOYA SNAP", "워크플로우"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "erp-handoffs",
    path: "/erp-handoffs",
    screen: "SC-27",
    label: "내보내기·연동",
    menuLabel: "내보내기·연동",
    breadcrumb: ["ECOYA SNAP", "내보내기·연동"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "workers",
    path: "/workers",
    screen: "SC-28",
    label: "작업자 · 작업 매니저",
    menuLabel: "작업자 · 작업 매니저",
    breadcrumb: ["ECOYA SNAP", "작업자 · 작업 매니저"],
    roles: adminRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "corrective-actions",
    path: "/safety/corrective-actions",
    screen: "SC-29",
    label: "시정조치",
    menuLabel: "시정조치",
    breadcrumb: ["ECOYA SNAP", "시정조치"],
    roles: workspaceRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "snap-settings",
    path: "/settings",
    screen: "SC-30",
    label: "설정",
    menuLabel: "설정",
    breadcrumb: ["설정"],
    roles: adminRoles,
    shell: "workspace",
    firstScreen: true,
  },
  {
    id: "platform-overview",
    path: "/platform",
    screen: "SC-31",
    label: "플랫폼 운영 현황",
    breadcrumb: ["플랫폼 운영", "운영 현황"],
    roles: ["platform_operator"],
    shell: "platform",
    firstScreen: true,
  },
  {
    id: "platform-signups",
    path: "/platform/signups",
    screen: "SC-32",
    label: "가입 요청",
    breadcrumb: ["플랫폼 운영", "가입 요청"],
    roles: ["platform_operator"],
    shell: "platform",
  },
  {
    id: "platform-tenants",
    path: "/platform/tenants",
    screen: "SC-33",
    label: "조직",
    breadcrumb: ["플랫폼 운영", "조직"],
    roles: ["platform_operator"],
    shell: "platform",
  },
  {
    id: "platform-tenant-support",
    path: "/platform/tenants/:orgId/support",
    screen: "SC-34",
    label: "조직 지원",
    breadcrumb: ["플랫폼 운영", "조직", "조직 지원"],
    roles: ["platform_operator"],
    shell: "platform",
  },
  {
    id: "platform-integrations",
    path: "/platform/integrations",
    screen: "SC-35",
    label: "연동 상태",
    breadcrumb: ["플랫폼 운영", "연동 상태"],
    roles: ["platform_operator"],
    shell: "platform",
  },
  {
    id: "platform-ai",
    path: "/platform/ai",
    screen: "SC-36",
    label: "AI 사용량",
    breadcrumb: ["플랫폼 운영", "AI 사용량"],
    roles: ["platform_operator"],
    shell: "platform",
  },
  {
    id: "mobile-role-gate",
    path: "/mobile",
    screen: "SC-37",
    label: "모바일 역할 확인",
    breadcrumb: ["ECOYA SNAP", "모바일"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
    firstScreen: true,
  },
  {
    id: "mobile-capture",
    path: "/mobile/capture",
    screen: "SC-38",
    label: "캡처 우선",
    breadcrumb: ["ECOYA SNAP", "모바일", "캡처"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
  },
  {
    id: "mobile-worker-tasks",
    path: "/mobile/worker/tasks",
    screen: "SC-39",
    label: "작업자 작업",
    breadcrumb: ["ECOYA SNAP", "모바일", "내 작업"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
  },
  {
    id: "mobile-worker-field-start",
    path: "/mobile/worker/tasks/:id/start",
    screen: "SC-41",
    label: "작업자 현장 시작",
    breadcrumb: ["ECOYA SNAP", "모바일", "현장 시작"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
  },
  {
    id: "mobile-worker-task",
    path: "/mobile/worker/tasks/:id",
    screen: "SC-40",
    label: "작업자 상세",
    breadcrumb: ["ECOYA SNAP", "모바일", "업무 상세"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
  },
  {
    id: "mobile-manager-home",
    path: "/mobile/manager",
    screen: "SC-42",
    label: "매니저 홈",
    breadcrumb: ["ECOYA SNAP", "모바일", "매니저"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
    firstScreen: true,
  },
  {
    id: "mobile-manager-tasks",
    path: "/mobile/manager/tasks",
    screen: "SC-43",
    label: "매니저 작업",
    breadcrumb: ["ECOYA SNAP", "모바일", "매니저 작업"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
  },
  {
    id: "mobile-manager-action",
    path: "/mobile/manager/tasks/:id/review",
    screen: "SC-44",
    label: "매니저 액션",
    breadcrumb: ["ECOYA SNAP", "모바일", "매니저 액션"],
    roles: ["owner", "manager", "worker"],
    shell: "external",
  },
] as const

const routeByScreen = new Map<SnapScreenKey, SnapRouteDefinition>()

for (const definition of SNAP_ROUTE_DEFINITIONS) {
  if (!routeByScreen.has(definition.screen)) {
    routeByScreen.set(definition.screen, definition)
  }
}

function splitPath(path: string) {
  return path.split("/").filter(Boolean)
}

function matchPath(pattern: string, pathname: string) {
  const patternParts = splitPath(pattern)
  const pathParts = splitPath(pathname)
  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
      continue
    }
    if (patternPart !== pathPart) return null
  }
  return params
}

/**
 * Preserve URLs issued by the original SNAP frontend while keeping one
 * canonical route table in this prototype. The canonical URL is written back
 * by App so refresh, history and copied links all converge on the same route.
 */
export function normalizeSnapLocation(
  pathname: string,
  search = ""
): NormalizedSnapLocation {
  const query = new URLSearchParams(search)
  let canonicalPath = pathname

  if (pathname === "/signin") {
    canonicalPath = "/login"
  } else if (pathname === "/legal") {
    const legalTab = query.get("tab")
    canonicalPath =
      legalTab === "privacy"
        ? "/legal/privacy"
        : legalTab === "location" || legalTab === "location-terms"
          ? "/legal/location"
          : "/legal/terms"
    query.delete("tab")
    query.delete("lang")
  } else if (pathname === "/links") {
    canonicalPath = "/reports"
    if (!query.has("tab")) query.set("tab", "delivery")
  } else if (pathname === "/review") {
    canonicalPath = "/reports"
    if (!query.has("tab")) query.set("tab", "field")
  } else if (pathname === "/operations") {
    canonicalPath = "/platform"
  } else if (pathname === "/operations/signups") {
    canonicalPath = "/platform/signups"
  } else if (pathname === "/operations/integrations") {
    canonicalPath = "/platform/integrations"
  } else if (pathname === "/operations/tenants") {
    canonicalPath = "/platform/tenants"
  } else if (pathname === "/operations/ai") {
    canonicalPath = "/platform/ai"
  } else {
    const supportMatch = pathname.match(
      /^\/operations\/tenants\/([^/]+)\/support$/
    )
    if (supportMatch) {
      canonicalPath = `/platform/tenants/${supportMatch[1]}/support`
    }
  }

  const canonicalSearch = query.toString()
    ? `?${query.toString()}`
    : ""
  return {
    pathname: canonicalPath,
    search: canonicalSearch,
    changed: canonicalPath !== pathname || canonicalSearch !== search,
  }
}

export function matchSnapRoute(
  pathname: string,
  search = ""
): SnapRouteMatch | null {
  for (const definition of SNAP_ROUTE_DEFINITIONS) {
    const params = matchPath(definition.path, pathname)
    if (params) {
      return {
        definition,
        params,
        search: new URLSearchParams(search),
      }
    }
  }
  return null
}

const defaultRouteParams: Record<string, string> = {
  id: "TASK-DEMO-001",
  token: "demo-token",
  hash: "demo-evidence-hash",
  orgId: "ORG-DEMO-001",
}

export function pathForSnapScreen(
  screen: SnapScreenKey,
  params: Record<string, string> = {}
) {
  const definition = routeByScreen.get(screen)
  if (!definition) return "/dashboard"

  return definition.path.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) =>
    encodeURIComponent(params[key] ?? defaultRouteParams[key] ?? "demo")
  )
}

export function getSnapRouteByScreen(screen: SnapScreenKey) {
  return routeByScreen.get(screen) ?? null
}

export function isSnapRoute(pathname: string) {
  return matchSnapRoute(pathname) !== null
}

export function normalizeSnapRole(value: unknown): SnapRole | null {
  const role = String(value ?? "")
    .trim()
    .toLowerCase()

  switch (role) {
    case "owner":
      return "owner"
    case "admin":
    case "manager":
      return "manager"
    case "operator":
      return "operator"
    case "worker":
      return "worker"
    case "customer":
    case "customer_viewer":
      return "customer"
    case "platform_operator":
      return "platform_operator"
    case "anonymous":
      return "anonymous"
    default:
      return null
  }
}

export function canAccessSnapRoute(
  definition: SnapRouteDefinition,
  session: SnapSessionAccess
) {
  if (definition.roles.includes("anonymous")) return true
  if (definition.roles.includes("platform_operator")) {
    return session.authenticated && session.platformOps
  }
  return Boolean(
    session.authenticated &&
      session.role &&
      definition.roles.includes(session.role)
  )
}

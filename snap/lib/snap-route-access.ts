import { useEffect, useMemo, useState } from "react"

import { snapApi } from "@snap/lib/snap-api"
import {
  SnapApiError,
  snapApiConfigured,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import {
  canAccessSnapRoute,
  normalizeSnapRole,
  type SnapRole,
  type SnapRouteDefinition,
  type SnapSessionAccess,
} from "@snap/lib/snap-routes"

type ResolvedSnapSession = SnapSessionAccess & {
  userStatus: string
  organizationStatus: string
  onboardingCompleted?: boolean
  landingPath: string
}

type SnapRouteAccessStatus =
  | "allowed"
  | "loading"
  | "redirecting"
  | "unauthenticated"
  | "forbidden"
  | "error"

export type SnapRouteAccessResult = {
  status: SnapRouteAccessStatus
  role: SnapRole | null
  platformOps: boolean
  onboardingCompleted?: boolean
  redirectPath?: string
  message?: string
}

type SessionResolution = {
  revision: number
  session: ResolvedSnapSession | null
  error: unknown
}

let cachedSession: ResolvedSnapSession | null = null
let pendingSession: Promise<ResolvedSnapSession> | null = null

function safePath(value: unknown, fallback: string) {
  const path = typeof value === "string" ? value.trim() : ""
  return path.startsWith("/") ? path : fallback
}

function sessionFromPayload(payload: SnapJsonRecord): ResolvedSnapSession {
  return {
    role: normalizeSnapRole(payload.role),
    platformOps: payload.platform_ops === true,
    authenticated: true,
    userStatus: String(payload.user_status ?? "active").toLowerCase(),
    organizationStatus: String(
      payload.organization_status ?? "active"
    ).toLowerCase(),
    onboardingCompleted:
      typeof payload.onboarding_completed === "boolean"
        ? payload.onboarding_completed
        : undefined,
    landingPath: safePath(payload.landing_path, "/dashboard"),
  }
}

function readPrototypeSession(): ResolvedSnapSession {
  let role: SnapRole | null = null
  let authenticated = false

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("snap_web_session")
      if (stored) {
        const parsed = JSON.parse(stored) as {
          role?: unknown
          authenticated?: unknown
        }
        role = normalizeSnapRole(parsed.role) ?? "manager"
        authenticated = parsed.authenticated !== false
      }
    } catch {
      // Invalid local sessions are treated as signed out.
    }
  }

  return {
    role,
    platformOps: false,
    authenticated,
    userStatus: "active",
    organizationStatus: "active",
    onboardingCompleted: true,
    landingPath:
      role === "worker" || role === "customer" ? "/tasks" : "/dashboard",
  }
}

async function resolveSession() {
  if (cachedSession) return cachedSession
  if (pendingSession) return pendingSession

  const prototypeSession = readPrototypeSession()
  pendingSession = (prototypeSession.authenticated
    ? Promise.resolve(prototypeSession)
    : snapApiConfigured
      ? snapApi.session.me().then(sessionFromPayload)
      : Promise.resolve(prototypeSession)
  ).then((session) => {
    cachedSession = session
    return session
  })

  try {
    return await pendingSession
  } finally {
    pendingSession = null
  }
}

export function resetSnapSessionAccessCache() {
  cachedSession = null
  pendingSession = null
}

function evaluateAccess(
  definition: SnapRouteDefinition | null,
  session: ResolvedSnapSession | null,
  error: unknown
): SnapRouteAccessResult {
  if (!definition) {
    return {
      status: "allowed",
      role: session?.role ?? null,
      platformOps: session?.platformOps ?? false,
      onboardingCompleted: session?.onboardingCompleted,
    }
  }

  if (definition.roles.includes("anonymous")) {
    return { status: "allowed", role: "anonymous", platformOps: false }
  }

  if (error) {
    if (
      error instanceof SnapApiError &&
      (error.status === 401 || error.code === "auth_not_configured")
    ) {
      return {
        status: "unauthenticated",
        role: null,
        platformOps: false,
        message: error.reason,
      }
    }
    if (error instanceof SnapApiError && error.status === 403) {
      return {
        status: "forbidden",
        role: null,
        platformOps: false,
        message: error.reason,
      }
    }
    return {
      status: "error",
      role: null,
      platformOps: false,
      message:
        error instanceof Error ? error.message : "세션을 확인하지 못했습니다.",
    }
  }

  if (!session) {
    return { status: "loading", role: null, platformOps: false }
  }

  if (
    session.userStatus === "rejected" ||
    session.organizationStatus === "rejected"
  ) {
    return {
      status: "redirecting",
      role: session.role,
      platformOps: session.platformOps,
      onboardingCompleted: session.onboardingCompleted,
      redirectPath: "/signup-rejected",
    }
  }

  if (
    session.userStatus === "pending" ||
    session.organizationStatus === "pending"
  ) {
    return {
      status: "redirecting",
      role: session.role,
      platformOps: session.platformOps,
      onboardingCompleted: session.onboardingCompleted,
      redirectPath: safePath(session.landingPath, "/pending"),
    }
  }

  const skipsOnboarding =
    session.role === "worker" || session.role === "customer"
  if (
    session.onboardingCompleted === false &&
    !skipsOnboarding &&
    definition.id !== "onboarding"
  ) {
    return {
      status: "redirecting",
      role: session.role,
      platformOps: session.platformOps,
      onboardingCompleted: session.onboardingCompleted,
      redirectPath: "/onboarding",
    }
  }

  if (!canAccessSnapRoute(definition, session)) {
    return {
      status: session.authenticated ? "forbidden" : "unauthenticated",
      role: session.role,
      platformOps: session.platformOps,
      onboardingCompleted: session.onboardingCompleted,
    }
  }

  return {
    status: "allowed",
    role: session.role,
    platformOps: session.platformOps,
    onboardingCompleted: session.onboardingCompleted,
  }
}

export function useSnapRouteAccess(
  definition: SnapRouteDefinition | null,
  revision = 0
) {
  const needsSession = Boolean(
    definition && !definition.roles.includes("anonymous")
  )
  const [resolution, setResolution] = useState<SessionResolution>(() => ({
    revision,
    session: needsSession ? cachedSession : null,
    error: null,
  }))

  useEffect(() => {
    let active = true
    if (!needsSession) return () => undefined

    resolveSession()
      .then((session) => {
        if (active) setResolution({ revision, session, error: null })
      })
      .catch((error: unknown) => {
        if (active) setResolution({ revision, session: null, error })
      })

    return () => {
      active = false
    }
  }, [needsSession, revision])

  const currentResolution =
    resolution.revision === revision
      ? resolution
      : { revision, session: cachedSession, error: null }

  return useMemo(
    () =>
      evaluateAccess(
        definition,
        currentResolution.session,
        currentResolution.error
      ),
    [currentResolution.error, currentResolution.session, definition]
  )
}

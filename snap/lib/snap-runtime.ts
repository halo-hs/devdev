import {
  setSnapAccessTokenProvider,
  snapApiConfigured,
  type SnapAccessTokenProvider,
} from "@snap/lib/snap-report-api"

const tokenKeys = ["snap_access_token", "access_token", "id_token"]

function readStorageToken(storage: Storage) {
  for (const key of tokenKeys) {
    const value = storage.getItem(key)?.trim()
    if (value) return value
  }

  const raw = storage.getItem("snap_web_session")
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as Record<string, unknown>
    for (const key of ["accessToken", "access_token", "idToken", "id_token"]) {
      const value = typeof session[key] === "string" ? session[key].trim() : ""
      if (value) return value
    }
  } catch {
    return null
  }

  return null
}

async function storageTokenProvider() {
  if (typeof window === "undefined") return null
  return (
    readStorageToken(window.localStorage) ||
    readStorageToken(window.sessionStorage)
  )
}

/**
 * Register the app's real identity provider (for example Firebase's
 * getIdToken(forceRefresh)) without coupling this prototype to an auth SDK.
 */
export function registerSnapAuthProvider(
  provider: SnapAccessTokenProvider | null
) {
  setSnapAccessTokenProvider(provider)
}

/**
 * Safe default for the prototype. Production apps should replace this with
 * registerSnapAuthProvider() during auth bootstrap.
 */
export function configureSnapRuntime() {
  registerSnapAuthProvider(storageTokenProvider)
}

export function getSnapRuntimeStatus() {
  return {
    apiConfigured: snapApiConfigured,
    authMode: import.meta.env.DEV ? "development-fallback" : "provider",
  } as const
}

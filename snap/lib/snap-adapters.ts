import type { SnapJsonRecord } from "@snap/lib/snap-report-api"

export type SnapNormalizedPage<T = SnapJsonRecord> = {
  items: T[]
  total?: number
  next_cursor?: string
}

function record(value: unknown): SnapJsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SnapJsonRecord)
    : {}
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

/**
 * Keep API DTO changes at the boundary. The UI consumes one page shape even
 * when an endpoint returns a bare array or uses data/results for its items.
 */
export function adaptSnapPage<T = SnapJsonRecord>(
  payload: unknown
): SnapNormalizedPage<T> {
  if (Array.isArray(payload)) return { items: payload as T[] }

  const body = record(payload)
  const rawItems =
    body.items ??
    body.data ??
    body.results ??
    body.tasks ??
    body.reports ??
    body.share_links ??
    body.deliveries ??
    body.failures ??
    body.customers ??
    body.members ??
    body.invites ??
    body.folders ??
    body.notifications ??
    body.corrective_actions ??
    body.integrations ??
    body.tenants ??
    body.signups ??
    body.plans
  const items = Array.isArray(rawItems) ? (rawItems as T[]) : []
  const pagination = record(body.pagination)

  return {
    items,
    total:
      numberValue(body.total) ??
      numberValue(body.count) ??
      numberValue(pagination.total),
    next_cursor:
      stringValue(body.next_cursor) ??
      stringValue(body.nextCursor) ??
      stringValue(body.cursor) ??
      stringValue(pagination.next_cursor) ??
      stringValue(pagination.nextCursor),
  }
}

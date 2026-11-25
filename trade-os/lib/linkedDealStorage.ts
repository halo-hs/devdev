export function linkedDealPrefix(workspaceId: string) {
  return `trade-os:linked-deals:v1:${encodeURIComponent(workspaceId)}:`
}

export function areDealsLinked(workspaceId: string, origin: string, other: string) {
  if (!origin || !other || origin === other) return false
  const prefix = linkedDealPrefix(workspaceId)
  try {
    return [[origin, other], [other, origin]].some(pair =>
      localStorage.getItem(prefix + JSON.stringify(pair)) === "1"
    )
  } catch {
    return false
  }
}

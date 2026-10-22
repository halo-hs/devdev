export type ImportPermissions = {
  canImportCounterparties: boolean
  canImportDeals: boolean
}

// Role defaults belong only to this design preview. Live integration must pass
// the server permission projection (including explicit false / missing grants).
export function resolveImportPermissions(
  role: string,
  permissions?: Partial<ImportPermissions>
): ImportPermissions {
  if (permissions)
    return {
      canImportCounterparties: permissions.canImportCounterparties === true,
      canImportDeals: permissions.canImportDeals === true,
    }
  return {
    canImportCounterparties: role === "owner" || role === "admin",
    canImportDeals: role === "owner" || role === "admin",
  }
}

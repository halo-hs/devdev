/** Public contract mirrors ecoya-platform-user-frontend's publicPackage.ts. */
export type PublicPackage = {
  doc_number?: string
  doc_type?: string
  label?: string
  amount?: string
  currency?: string
  incoterms?: string
  payment_terms?: string
  etd?: string
  eta?: string
  shipment_timing?: string
  pol?: string
  pod?: string
  vessel?: string
  expires_at?: string
  max_opens?: number
  open_count?: number
  attachments?: { filename: string; label?: string }[]
}
export type ShareState =
  "active" | "loading" | "expired" | "open_cap" | "not_found" | "error"
export type ShareResult = {
  state: ShareState
  package?: PublicPackage
  retryAfter?: number
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export async function readShareResponse(
  response: Response
): Promise<ShareResult> {
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const code =
      record(body) && record(body.error) ? body.error.code : undefined
    if (
      response.status === 410 &&
      ["DOCGEN_LINK_GONE", "LINK_EXPIRED"].includes(String(code))
    )
      return { state: "expired" }
    if (
      response.status === 429 &&
      ["DOCGEN_LINK_GONE", "LINK_OPEN_LIMIT"].includes(String(code))
    )
      return { state: "open_cap" }
    if (
      (response.status === 404 &&
        ["DOCGEN_LINK_GONE", "LINK_UNAVAILABLE"].includes(String(code))) ||
      (response.status === 400 && code === "DOCGEN_INVALID_TOKEN")
    )
      return { state: "not_found" }
    const header = response.headers.get("Retry-After")
    const seconds = header === null ? 5 : Number(header)
    return {
      state: "error",
      retryAfter:
        response.status === 503
          ? Math.min(
              300,
              Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : 5
            )
          : 0,
    }
  }
  if (!record(body)) return { state: "error" }
  const pkg: PublicPackage = {}
  for (const key of [
    "doc_number",
    "doc_type",
    "label",
    "amount",
    "currency",
    "incoterms",
    "payment_terms",
    "etd",
    "eta",
    "shipment_timing",
    "pol",
    "pod",
    "vessel",
    "expires_at",
  ] as const) {
    if (typeof body[key] === "string") pkg[key] = body[key].trim() || undefined
  }
  if (!pkg.doc_number && !pkg.doc_type && !pkg.label) return { state: "error" }
  for (const key of ["max_opens", "open_count"] as const) {
    if (
      typeof body[key] === "number" &&
      Number.isFinite(body[key]) &&
      body[key] >= 0
    )
      pkg[key] = body[key]
  }
  pkg.attachments = Array.isArray(body.attachments)
    ? body.attachments.flatMap((item: unknown) =>
        record(item) &&
        typeof item.filename === "string" &&
        item.filename.trim()
          ? [
              {
                filename: item.filename.trim(),
                ...(typeof item.label === "string"
                  ? { label: item.label }
                  : {}),
              },
            ]
          : []
      )
    : []
  return { state: "active", package: pkg }
}

export const previewPackage: PublicPackage = {
  doc_number: "CI-2026-0916",
  doc_type: "상업송장",
  label: "상업송장",
  amount: "38,400.00",
  currency: "USD",
  incoterms: "CIF Hamburg",
  payment_terms: "T/T 30% in advance, 70% before shipment",
  etd: "2026-09-20",
  eta: "2026-10-15",
  pol: "Busan, Korea",
  pod: "Hamburg, Germany",
  vessel: "HMM AMBITION / 026W",
  expires_at: "2026-09-30T23:59:59+09:00",
  max_opens: 10,
  open_count: 3,
  attachments: [
    { filename: "Packing-List-2026-0916.pdf", label: "포장명세서" },
    { filename: "Certificate-of-Origin.pdf", label: "원산지증명서" },
  ],
}

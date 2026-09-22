// UI mock values requested on 2026-09-16. Not a billing policy or SSOT update.
// Production dates come from the administrator-managed trial schedule.
export const trialPreview = {
  days: 14,
  tokensPerUnit: 1_000,
  creditsPerUnit: 2_000,
  startsAt: "2026.09.16",
  endsAt: "2026.09.30",
} as const

export function previewCreditsForTokens(tokens: number) {
  return (
    (Math.max(0, tokens) * trialPreview.creditsPerUnit) /
    trialPreview.tokensPerUnit
  )
}

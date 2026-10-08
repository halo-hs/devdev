// FE #1937 / #1944: the risk severity badge label, shared by deal detail and the monitor 예외 센터
// (moved out of the deal-detail format module so the monitor does not import across features).
// BE riskSeverity emits "critical" | "warning"; labels = erpDeals.exceptionCenter.severity. Own keys
// only; an unknown or empty value shows the neutral fallback, never the raw value.
export function riskSeverityLabel(
  severity: string | null | undefined,
  labels: Readonly<Record<string, string>>,
  fallback: string,
): string {
  const normalized = severity?.trim().toLowerCase();
  return normalized && Object.hasOwn(labels, normalized) ? labels[normalized] : fallback;
}

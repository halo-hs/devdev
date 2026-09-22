import type { SettlementDrillTarget } from "@trade-os/reference-3030/features/erp/settlement/settlementDecisionCardData";

export function counterpartyRowKey(name: string | null | undefined, currency: string): string {
  // The null group (unlinked bucket) must NOT share a key with a row whose
  // label is the empty string — '' is broken data with its own overview row,
  // and a shared key would let its (failing) drill poison the real unlinked
  // row's cached deals. "\0unassigned\0" cannot collide with a label: real
  // labels never contain NUL.
  const label = name === null || name === undefined ? "\0unassigned\0" : name;
  return `${label}\0${currency}`;
}

export function scrollToSettlementSection(sectionId: string) {
  requestAnimationFrame(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function settlementSectionId(target: SettlementDrillTarget): string {
  switch (target.section) {
    case "counterparty":
    case "overdue":
      return "settlement-counterparty";
    case "ledger":
      return "settlement-ledger";
    case "forecast":
      return "settlement-forecast";
    case "profitability":
      return "settlement-profitability";
  }
}

/** Parse ?drill= from Home/Monitor links into a settlement drill target. */
export function parseSettlementDrillSearchParams(
  params: Pick<URLSearchParams, "get">,
): SettlementDrillTarget | null {
  const drill = params.get("drill")?.trim().toLowerCase();
  if (!drill) return null;

  switch (drill) {
    case "overdue":
      return { section: "overdue" };
    case "payable":
      return { section: "ledger", tab: "payable" };
    case "receivable":
      return { section: "ledger", tab: "receivable" };
    case "forecast":
      return { section: "forecast" };
    case "profitability":
      return { section: "profitability" };
    case "party": {
      const counterpartyName = params.get("name")?.trim() ?? "";
      const currency = params.get("currency")?.trim().toUpperCase() ?? "USD";
      if (!counterpartyName) return null;
      return { section: "counterparty", counterpartyName, currency };
    }
    default:
      return null;
  }
}

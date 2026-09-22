"use client";

import { SectionPanel } from "@trade-os/operations/components/SectionPanel";
import { DecisionCard } from "@trade-os/operations/shared/DecisionCard";
import {
  buildSettlementDecisionCards,
  type SettlementDecisionCardsCopy,
  type SettlementProfitabilityDecision,
  type SettlementDrillTarget,
} from "@trade-os/operations/settlement/settlementDecisionCardData";
import { useLocaleTag } from "@trade-os/operations/i18n/useLocaleTag";

import type { SettlementOverview } from "@trade-os/operations/lib/api/settlement";

type SettlementDecisionCardsProps = {
  copy: SettlementDecisionCardsCopy;
  overview: SettlementOverview;
  onDrill?: (target: SettlementDrillTarget) => void;
  profitability?: SettlementProfitabilityDecision | null;
};

export function SettlementDecisionCards({ copy, overview, onDrill, profitability }: SettlementDecisionCardsProps) {
  const moneyLocale = useLocaleTag();
  const cards = buildSettlementDecisionCards(overview, copy, moneyLocale, profitability);

  return (
    <SectionPanel
      id="settlement-decisions"
      data-component="SettlementDecisionCards"
      title={copy.title}
      description={copy.subtitle}
    >
      {cards.length === 0 ? (
        <p className="text-body-14 text-text-muted">{copy.empty}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ drill, ...card }) => (
            <DecisionCard
              key={card.id}
              {...card}
              cta={copy.cta}
              onActivate={onDrill ? () => onDrill(drill) : undefined}
            />
          ))}
        </div>
      )}
    </SectionPanel>
  );
}

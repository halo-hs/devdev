// 거래 리스크 코드 → 화면 이름 규칙(FE #1927). 거래 상세(#1912)에서 옮긴 공용 함수로, 화면마다 자기
// 메시지(문구 맵·모름 문구·번호 문구)를 넘긴다. snake_case 원문 코드는 어떤 경우에도 보이지 않는다.

export type RiskServerName = {
  type: string;
  label?: string | null;
};

export type RiskLabelerOptions = {
  /** 이 화면이 이름을 붙일 리스크 코드 전부(열린 위험·리스크 상세·닫힌 위험). 번호는 이 목록으로 정한다. */
  codes: Iterable<string>;
  /** 알려진 코드 → i18n 문구. own key만 읽는다("constructor" 같은 코드가 Object 기본 속성을 읽지 않는다). */
  knownLabels: Readonly<Record<string, string>>;
  /** 서버가 준 이름(리스크 상세 피드의 `label` 등). 알려진 문구가 없는 코드에만 쓰고, 코드마다 처음 받은 비어 있지 않은 이름을 쓴다. */
  serverNames?: Iterable<RiskServerName>;
  /** 이름이 없는 코드가 하나뿐일 때의 문구(예: "기타 확인 항목"). */
  unknownLabel: string;
  /** 이름이 없는 코드가 둘 이상일 때의 문구, `{n}` 자리에 번호(예: "기타 확인 항목 {n}"). */
  unknownLabelNumbered: string;
  /**
   * `codes`에 없는 코드(예: 변경 이력에만 남은 코드)의 문구(예: "지난 확인 항목"). 번호는 붙이지 않는다.
   * "기타 확인 항목 N" 형제와 구분되게 다른 이름을 쓴다. 그런 코드가 없는 화면은 생략해도 되고, 그때는 `unknownLabel`.
   */
  unlistedLabel?: string;
};

/**
 * 리스크 코드를 화면 이름으로 바꾸는 함수를 만든다 — 거래 상세와 거래 목록(#1928)이 각자 메시지로 부르는 공용 규칙.
 *
 * 순서(FE #1927 b8 결정): 알려진 문구(i18n) → 서버 이름(문구가 없는 코드만) → "기타 확인 항목 N".
 * 서버가 영어 이름("Payment delay")을 보내도 알려진 코드는 한국어 문구("결제 지연")로 보인다.
 * 번호: 알려진 문구가 없는 코드를 코드 문자열 순으로 매긴다. 서버 이름이 있는 코드도 번호 하나를
 * 차지하므로(그 번호는 비어 있다), 이름이 늦게 오거나 역할에 따라 오지 않아도 번호가 바뀌지 않는다.
 * 번호 집합(`codes`)에 들어가지 않는 코드(예: 변경 이력에만 남은 코드)는 번호 없이 별도 이름 `unlistedLabel`("지난 확인 항목")을 쓴다.
 */
export function createRiskLabeler({
  codes,
  knownLabels,
  serverNames = [],
  unknownLabel,
  unknownLabelNumbered,
  unlistedLabel,
}: RiskLabelerOptions): (code: string) => string {
  const knownLabel = (code: string): string | undefined => (
    Object.hasOwn(knownLabels, code) ? knownLabels[code] : undefined
  );
  const serverLabels = new Map<string, string>();
  for (const item of serverNames) {
    const label = item.label?.trim();
    if (label && !serverLabels.has(item.type)) serverLabels.set(item.type, label);
  }
  const unknownCodes = new Set<string>();
  for (const code of codes) {
    if (!knownLabel(code)) unknownCodes.add(code);
  }
  const unknownOrdinals = new Map<string, number>();
  for (const code of [...unknownCodes].sort()) unknownOrdinals.set(code, unknownOrdinals.size + 1);
  return (code: string) => {
    const known = knownLabel(code);
    if (known) return known;
    const server = serverLabels.get(code);
    if (server) return server;
    const ordinal = unknownOrdinals.get(code);
    if (ordinal === undefined) return unlistedLabel ?? unknownLabel;
    return unknownOrdinals.size > 1 ? unknownLabelNumbered.replace("{n}", String(ordinal)) : unknownLabel;
  };
}

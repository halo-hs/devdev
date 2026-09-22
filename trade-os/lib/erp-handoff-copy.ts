// Content source: /Users/hans/orca/handoff/g53-20260910/src/messages/ko/erp-*.json
export const erpHandoffCopy = {
  shipments: {
    review: {
      title: "선적 반영 대기 문서 검토",
      intro:
        "확정된 B/L 정보를 검토한 뒤 선적 운영에 반영합니다. 날짜 확인은 원문 변경이나 주문 승인이 아닙니다.",
      reload: "검토 다시 불러오기",
      more: "문서 더 보기",
      loading: "검토 항목 불러오는 중…",
      loadError:
        "검토 항목을 불러오지 못했습니다. 경고는 아직 해결되지 않았습니다. 다시 불러와 주세요.",
      noPending:
        "이번 조회에서 반영 대기 중인 유효 B/L을 찾지 못했습니다. 전체 선적 정보가 완전하다는 의미는 아닙니다. 선적 목록을 다시 조회해 주세요.",
      readOnly:
        "조회만 가능합니다. 복구에는 현재 역할과 구독의 운영 쓰기 권한이 필요합니다.",
      reasons: {
        current: "이미 반영됨",
        invalid_dates: "원문 날짜가 유효한 달력 날짜가 아닙니다.",
        tracking_identity_conflict:
          "추적 정보 또는 확인 날짜가 남아 있는 상태에서 B/L·컨테이너가 바뀌었습니다.",
        snap_binding_conflict:
          "SNAP 증거가 연결된 상태에서 거래 또는 선적 식별정보가 바뀌었습니다.",
        awaiting_projection: "확정 정보가 아직 선적에 반영되지 않았습니다.",
        source_inactive: "원본이 더 이상 유효한 확정 B/L이 아닙니다.",
      },
      originalLink: "원문·확정 정보 보기",
      originalUnavailable:
        "이 이전 문서는 원문 검토 페이지에 연결되지 않습니다.",
      dealLink: "연결 거래 보기",
      originalDates: "원문에 기록된 날짜",
      operationalDates: "유지할 날짜 (확인값 → 운송사 → 문서)",
      dateHint:
        "검증한 운영 날짜를 입력하세요. 빈칸은 기존 근거를 유지합니다. 원문은 변경되지 않습니다.",
      reason: "처리 사유 및 확인 근거",
      confirmDates: "운영 날짜 확인·반영",
      retryProjection: "검토한 정보 다시 반영",
      protected:
        "원문·거래·증거 연결을 별도로 검토해야 합니다. 이 작업으로 추적 이력이나 SNAP 배정을 옮길 수 없습니다.",
      stale:
        "검토 중 원본 또는 선적 정보가 변경되었습니다. 입력 내용은 여기에 보존됩니다. 검토를 다시 불러와 변경된 정보를 확인한 후 제출하세요.",
      validation:
        "유효한 운영 날짜와 사유를 입력하세요. 유지되는 날짜를 포함하여 도착일이 출발일보다 빠를 수 없습니다.",
      saveError:
        "처리 결과를 확인하지 못했습니다. 이미 저장되었을 수 있으니 검토를 다시 불러와 현재 상태를 확인한 후 재시도하세요.",
      saved: "선적 정보를 반영했습니다. 선적 목록을 다시 불러옵니다.",
    },
    documentReadiness: "문서 준비",
  },
  settlement: {
    currentMoney: {
      review: {
        title: "정산 전 확인할 일",
        provisional:
          "등록된 데이터 기준의 잠정 잔액입니다. 계산 가능 상태도 최종 정산 승인을 의미하지 않습니다.",
        missing:
          "아직 받지 않은 청구서·운임·수수료·추가 비용과 미연결 문서를 확인하세요. 미입력은 0원으로 확정하지 않습니다.",
        legacy:
          "서버가 선택한 원장 모드를 사용합니다. 새 원장에서는 입출금과 적용을 구분합니다. 기존 미이관 지급은 대사 후 반영하며 같은 현금을 다시 입력하지 마세요.",
        ledger: "예정액·입출금 이력 확인",
        documents: "문서·거래 연결 보완",
        reports: "현재 청구 검토 보고서",
      },
      title: "현재 잔액과 검증 상태",
      scope:
        "조직 전체·모든 통화의 현재 시점입니다. 아래 원장의 기간·거래처 필터와 별도입니다.",
      load: "현재 잔액 조회",
      loading: "조회 중…",
      failed: "조회하지 못했습니다. 다시 시도해주세요.",
      empty:
        "현재 집계할 원장 기록이 없습니다. 모든 업무가 정산됐다는 뜻은 아닙니다.",
      unavailable: "확인 필요",
      receivable: "받을 돈",
      payable: "줄 돈",
      original: "원래 예정액",
      adjusted: "조정 후 예정액",
      applied: "검증된 적용액",
      outstanding: "현재 미결제",
      cash: "현금 사실",
      unapplied: "미배분 현금",
      blockers: "확인이 필요한 근거",
      boundary:
        "확인되지 않은 이전 데이터는 공식 잔액을 보류합니다. 계약 잔여 취소가 기존 청구·현금 취소를 의미하지 않습니다.",
    },
    canonicalCash: {
      legacy: {
        title: "기존 지급 대사 검토",
        scope:
          "이 예정의 모든 미대사 지급을 검토하며 금액·통화·일자·원천을 유지합니다. 기존 기록을 연결하는 작업이며 새 은행 이체를 기록하지 않습니다.",
        review: "표시된 모든 지급 확인",
        fee: "수수료",
        noSource: "원천 미연결",
        eligible: "정확한 연결 가능",
        blocked:
          "대사 전에 업무·원천 정정이 필요합니다. 조직 관리자와 원지급 근거를 검토하세요.",
        empty: "미대사 지급이 없습니다.",
        reason: "검토 사유와 근거",
        execute: "확인한 지급 전체 대사",
        retry: "같은 대사 재시도",
        refresh: "현재 지급 새로고침",
        disabled: "Canonical 지급 기록이 활성화되지 않았습니다.",
        pending:
          "이전 대사 결과의 확인이 필요합니다. 원래 지급·값·키를 유지해 같은 명령으로 재시도합니다.",
        failed:
          "대사 결과를 확인하지 못했습니다. 결과가 불명확하면 이 탭에서 같은 명령으로 재시도하세요.",
        recoveryError:
          "복구 정보를 안전하게 보존하지 못했습니다. 새 명령은 전송하지 않았습니다.",
      },
      refund: "실제 환불 기록",
      refundNotice:
        "이미 반환한 현금을 기록합니다. 은행 이체나 채무 취소를 실행하지 않습니다. 미배분 잔액까지만 환불로 기록할 수 있습니다.",
      replaceCash: "현금·적용 함께 정정",
      replaceCashNotice:
        "원현금을 무효화하고 이 예정 건의 적용을 해제한 뒤 정정한 현금·적용을 한 번에 기록합니다. 다른 예정 건의 적용이 있으면 별도 검토가 필요합니다. 실제 이체는 없습니다.",
      voidRecord: "현금 기록 무효 처리",
      voidNotice:
        "잘못 입력한 기록의 정정이며 실제 환불이 아닙니다. 모든 지급 적용을 먼저 해제하세요. 원본과 사유는 이력에 남으며 올바른 입출금은 새 기록으로 입력합니다.",
      voided: "현금 기록 무효 처리됨",
      recovered:
        "확인이 끝나지 않은 요청의 입력값과 키를 이 탭에서 복원했습니다. 다시 시도하여 결과를 확인하세요. 자동으로 전송하지 않았습니다.",
      recoveryUnavailable:
        "재시도 기록을 읽거나 안전하게 보관하지 못해 새 요청을 전송하지 않았습니다. 이 탭을 유지하고, 재시도로 해결되지 않으면 운영 지원에 문의하세요.",
      title: "실제 입출금과 지급 적용",
      scope:
        "실제 입출금액과 이 예정 건에 적용할 금액을 구분합니다. 초과분은 미배분으로 남으며, 적용 취소는 현금 취소나 환불이 아닙니다.",
      actual: "실제 입출금액",
      applied: "이 예정 건에 적용할 금액",
      cash: "현금",
      unapplied: "전체 예정 건 적용 후 미배분",
      fee: "현금 기록의 수수료 (예정 건별 아님)",
      date: "입출금일",
      reason: "정정 사유",
      replacement: "정정 후 적용금액",
      reverse: "적용 취소",
      replace: "적용금액 정정",
      history: "적용 이력",
      empty: "아직 원장 적용 기록이 없습니다.",
      loading: "입출금 근거를 불러오는 중…",
      failed:
        "결과를 확인하지 못했습니다. 같은 값으로 재시도하고, 현금을 새로 중복 등록하지 마세요.",
      reconcile:
        "기존 지급 기록의 대사가 먼저 필요합니다. 조직 관리자에게 검토를 요청하세요.",
      disabled:
        "새 원장 입력이 아직 활성화되지 않았습니다. 기존 근거는 조회할 수 있습니다.",
      invalid:
        "입출금액과 적용금액은 양수여야 하며 적용액은 입출금액·미결제액을 넘을 수 없습니다. 입출금일 및 정정 시 사유를 입력하세요.",
      save: "입출금·적용 함께 기록",
      saved:
        "기록했습니다. 등록된 데이터 기준의 잔액이며 최종 정산 승인은 아닙니다.",
      retry: "재시도",
      close: "닫기",
      truncated: "처음 500개 이력만 표시됩니다. 전체 이력이 아닙니다.",
      note: "메모",
      source: "근거 문서 ID (선택)",
      current: "현재 적용",
      superseded: "과거 이력",
      cancel: "정정 취소",
    },
    financialCompletion: {
      title: "거래 금융 업무 완료",
      scope:
        "전수 의무·최종 비용·거래 업무가 모두 반영됐는지 확인합니다. Trade 내부 업무 완료이며 회계·법적 확정을 뜻하지 않습니다.",
      unconfirmed: "전수 확인 전",
      blocked: "검토 필요",
      completed: "현재 검토한 사실 기준 완료",
      invalidated: "근거 변경 — 재검토·재확인 필요",
      inactive: "비활성 거래",
      known: "등록 예정 / 청구 건",
      notZero: "목록이 비어 있어도 다른 의무나 비용이 없다는 뜻은 아닙니다.",
      loading: "완전성 확인 중…",
      obligations: "누락·미연결 청구를 포함해 모든 의무를 검토했습니다.",
      costs:
        "운임·수수료·기타 최종 비용을 검토했으며 미등록 예상 비용이 없습니다.",
      workflow:
        "수동 관리 업무를 포함해 이행 및 남은 거래 업무를 검토했습니다.",
      evidence: "검토 기준과 근거",
      confirm: "현재 전수 확인 완료",
      retry: "같은 확인 재시도",
      refresh: "현재 근거 새로고침",
      history: "전수 확인 이력",
      historical: "과거 확인",
      truncated: "최근 50개 확인만 표시합니다.",
      pending:
        "이전 확인의 결과를 검증해야 합니다. 원래 값과 키로 재시도합니다.",
      failed: "결과를 확인하지 못했습니다. 현재 근거를 검토하고 재시도하세요.",
      recoveryError:
        "재시도 정보를 안전하게 보존하지 못했습니다. 새 확인을 전송하지 않았습니다.",
      blockerLabels: {
        incomplete_source_window: "근거가 검토 범위를 초과합니다.",
        claim_review_required: "청구 원천·예정 검토가 필요합니다.",
        commercial_direction_required: "거래 방향이 미확정입니다.",
        obligation_evidence_required: "의무 근거 또는 수동 참조가 필요합니다.",
        writeoff_review_required: "손실 처리 제안 검토가 남았습니다.",
        invoice_reconciliation_required:
          "인보이스 연결 의무의 대사가 필요합니다.",
        closed_obligation_review_required: "닫힌 의무의 검토가 필요합니다.",
        cash_reconciliation_required: "기존·불명확한 지급의 대사가 필요합니다.",
        obligation_state_unknown: "의무 상태를 검증할 수 없습니다.",
        outstanding_obligations: "미정산 의무가 남았습니다.",
        open_disputes: "미해결 분쟁이 남았습니다.",
        order_review_required: "계약·이행 근거 검토가 필요합니다.",
        order_not_closed: "관리 중인 주문 업무가 열려 있습니다.",
        document_relation_conflict: "문서 관계가 충돌합니다.",
        document_work_incomplete: "필요한 문서 업무가 남았습니다.",
      },
    },
  },
  reports: {
    evidence: {
      families: {
        "gp-series": "등록 기준 손익",
        "counterparty-top": "거래처 순위",
        "counterparty-gp": "거래처 손익",
        "counterparty-status": "거래처 현황",
        "gp-by-assignee": "담당자 손익",
      },
      title: "계산 기준·검증 및 조회본",
      coverage: "집계 입력 {total}건 중 문서 개정 확인 {verified}건",
      planned:
        "등록된 지급 예정과 비용으로 계산한 예상 GP입니다. 최종 회계 이익이 아닙니다.",
      applied:
        "지급일정과 지급 적용·정정의 호환 집계입니다. 미배분 현금은 포함하지 않습니다.",
      incomplete:
        "출처 확인은 모든 청구·비용의 입력 완료나 정산 승인을 의미하지 않습니다.",
      asOf: "계산 기준: {time}",
      export: "이 조회본 저장 (JSON)",
      exportNotice:
        "화면에 받은 서버 응답 전체를 저장합니다. 차트의 선택 통화만 내보내는 기능이나 월 마감·고객 발송이 아닙니다.",
      unavailable: "이 서버 응답에는 계산 근거가 없습니다.",
      details: "근거 식별값",
    },
    provenance: {
      title: "숫자 원천 검증",
      complete: "모든 source revision 확인됨",
      partial: "일부 source revision 확인 필요",
      unverified: "source revision을 확인할 수 없음",
      noData: "검증할 정산 일정 없음",
      unavailable: "원천 검증 정보 없음",
      coverage:
        "정산 일정 {total}건 중 {verified}건의 문서 revision을 확인했습니다.",
      receipt: "원천 영수증 {digest}",
      aggregateOnly:
        "집계 결과만 표시하며 문서·거래·일정 식별자는 노출하지 않습니다.",
    },
    claimCoverage: {
      title: "현재 청구서 일정 연결 현황",
      temporalBasis:
        "선택한 담당자 범위의 현재 자료입니다. 보고서 기간·차트 통화와는 별도입니다.",
      boundary:
        "일정 검토를 위한 원문 금액이며 잔액·이익·입출금·연체금액이 아닙니다. 확인되지 않은 값은 검토 건수로 표시하며 0원으로 처리하지 않습니다.",
      amountScope:
        "아래 금액은 일정 검토가 필요한 원천 중 금액을 확인한 자료만 포함합니다. 별도 재검토가 필요한 원천은 금액에 포함하지 않습니다.",
      unsupported: "현재 서버에서는 청구서 일정 연결 현황을 제공하지 않습니다.",
      incomplete:
        "조회 가능한 원천 수를 초과했습니다. 합계는 확인할 수 없으며 부분 합계를 표시하지 않습니다.",
      noData: "현재 조회 범위에 확정 상업송장(CI) 원천이 없습니다.",
      previous: "마지막으로 조회에 성공한 자료이며 새 조회 결과가 아닙니다.",
      failed: "현재 청구서 일정 연결 현황을 갱신하지 못했습니다.",
      scopeChanged:
        "서버에서 확인된 조회 범위가 선택한 담당자 범위와 다릅니다. 화면을 새로고침하여 현재 권한과 담당자 범위를 확인하세요.",
      loading: "현재 청구서 일정 연결 현황을 불러오는 중…",
      asOf: "원천 조회 기준 {time}",
      sourceCount: "청구서 원천",
      scheduled: "일정 연결됨",
      needsSchedule: "일정 검토 필요",
      reviewRequired: "원천·연결 재검토 필요",
      inactive: "비활성 거래의 원천",
      unlinkedSchedules: "원천 연결 없는 일정",
      unlinkedNotice:
        "원천 연결 없는 일정이 {count}건 있습니다. 확정 CI가 없어도 이 일정의 확인은 필요합니다.",
      currency: "통화",
      direction: "거래 방향",
      buy: "매입",
      sell: "매출",
      sourceAmount: "검토 대상 원문 금액",
      awaitingCount: "일정 검토 대상 원천",
      undatedCount: "지급기한 미정",
      noAmounts: "일정 검토용으로 확인된 원문 금액이 없습니다.",
      aggregateOnly:
        "집계 정보만 표시합니다. 문서·거래·일정·거래처의 상세 정보는 공개하지 않습니다.",
      receipt: "조회 근거 식별값",
    },
  },
  sales: {
    byAssignee: {
      title: "담당자별 GP",
      titleLimited: "담당자별 GP · Top {count}",
      sub: "최근 {count}개월 · {currency}",
      scope: "딜 담당자 기준",
      limitReached:
        "Top {count} 경계에 도달했습니다. 그 밖의 담당자는 표시되지 않을 수 있습니다.",
      unassigned: "미배정 딜",
      metaLine: "마진 {margin} · 딜 {count}건",
      empty: "아직 집계할 담당자가 없습니다.",
    },
  },
} as const

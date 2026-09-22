// Content from g53-20260910/src/messages/ko/erp-home.json.
// Layout and components follow this app’s design-system SSOT.
export const aiHandoffCopy = {
  title: "거래 업무에 질문하세요",
  subtitle: "저장된 거래·문서·선적과 현재 잔액을 근거와 함께 확인합니다.",
  placeholder: "거래 내역을 질문하거나 아래 조회 조건을 선택하세요.",
  workspace: {
    question: "어떤 업무를 확인할까요?",
    guide:
      "문서, 거래, 선적 일정이나 현재 금액을 질문하세요. 근거를 확인한 뒤 실제 업무로 이어갈 수 있습니다.",
    tools: "저장한 답변과 상세 조회",
    toolsHint:
      "정확한 기간, 특정 거래나 보존된 본문이 필요할 때 도구를 펼치세요.",
    details: "계산·답변 상세 근거",
    current: "현재 조회 결과 · 저장한 답변 아님",
    retry: "같은 질문 다시 조회",
  },
  business: {
    controls: "조건을 지정해 업무 조회",
    kind: "조회 대상",
    deals: "거래처별 등록 거래",
    arrivals: "ETA 기준 도착 예정",
    counterparty: "거래처 등록명",
    from: "시작일",
    to: "종료일 (포함)",
    submit: "업무정보 조회",
    results: "업무 조회 결과",
    arrivalScope:
      "확인한 ETA → 운송사 ETA → 저장 ETA 순서입니다. 실제 창고 입고일이 아니며, 운송사나 문서 동기화를 호출하지 않습니다. 도착 상태도 별도로 확인하세요.",
    empty:
      "조건에 맞는 저장 기록이 없습니다. 전체 업무가 없다는 의미는 아닙니다.",
    sourceCaution:
      "현재 연결된 문서의 상태를 표시합니다. 내용을 확인한 것과 계약·발행·지급 승인은 다릅니다. 문서 링크가 있다는 이유로 해당 거래가 승인된 것은 아닙니다.",
    expansion: {
      arrivalQuick: "모레 도착 예정",
      departureQuick: "다음 주 출항 예정",
      facts: "문서에서 확인한 정보",
      factsBasis:
        "현재 확정된 추출 필드입니다. 계약 수락·문서 발행 승인이나 최종 정산을 뜻하지 않습니다. 문서별 값이 다르면 원문과 적용 관계를 검토하세요.",
      search: "필드 이름·값·문서번호 검색 (선택)",
      coverage: "문서 연결 확인: {known}/{total}건 · 미확인 {unknown}건",
      factsLimit:
        "최대 50개 필드를 표시합니다. 전체 원문 검색이나 모든 업무 사실의 완결을 보장하지 않습니다.",
      page: "원문 페이지",
      source: "확정 정보 열기",
      departures: "출항 예정 선적",
      departureScope:
        "현재 등록된 ETD 기준입니다. 도착일(ETA)·창고 입고일과 다릅니다. 이번 주·다음 주는 현지 시간의 월요일부터 일요일입니다.",
      followups: "이 거래에서 이어서 확인",
      money: "현재 받을 돈·지급할 돈",
      workflow: "기존 거래에서 문서 작성·전달 검토",
      refresh: "같은 조건으로 다시 조회",
      save: "현재 조회 결과 저장",
      snapshotNotice:
        "내부 검토용 현재 응답 사본입니다. 자동 갱신·서버 영구 기록·승인 증명·고객 전달본이 아닙니다. 전달 전 공개 범위를 검토하세요.",
      changed: "이전 조회 후 근거 또는 결과가 바뀌었습니다.",
      unchanged: "같은 조건의 조회 결과는 이전과 같습니다.",
      asOf: "조회 시점",
      empty:
        "확정 필드가 조회되지 않았습니다. 자료 누락·연결 미확인 여부를 확인하세요.",
      queryHint:
        "거래 결과의 후속 버튼을 쓰거나 조건을 지정해 조회할 수 있습니다. 지원하지 않는 조건은 자동으로 생략하지 않습니다.",
    },
    bodyRetrieval: {
      title: "보관된 문서 본문",
      notice:
        "보관된 페이지와 현재 생성 문서를 검색합니다. 누락·전사 품질을 별도로 표시하며, 검색 근거는 업무 승인이 아닙니다.",
      load: "문서 보관 범위 확인",
      capture: "수동 전사 본문 보관",
      manualNotice:
        "붙여넣은 내용은 사용자의 전사이며 OCR 검증 결과가 아닙니다. 페이지 사이에 ---PAGE--- 한 줄을 넣으세요.",
      save: "전사 본문 저장",
      read: "보관된 전체 본문 읽기",
      semantic: "의미 검색",
      literal: "정확한 문구 검색",
      semanticOff:
        "의미 검색이 설정되지 않았습니다. 정확한 문구 검색을 사용할 수 있습니다.",
      missing: "현재 본문이 없는 수신 문서: {count}개",
      error:
        "요청을 처리하지 못했습니다. 현재 권한과 원문 개정을 확인한 후 재시도하세요.",
      composite: "복합 업무 질문",
      compositeNotice:
        "같은 거래의 2–6개 도구를 선택하세요. 같은 DB 시점으로 조회하며 금액은 금융 도구의 계산 결과입니다.",
      money: "현재 금액 현황",
      receivable: "받을 잔액",
      payable: "지급할 잔액",
      unavailable: "확인 불가",
      saved: "전사 본문이 보관되었습니다",
      question: "문서 내용과 남은 업무를 함께 확인",
      select: "문서 선택",
    },
    textRetrieval: {
      title: "저장 문서 본문·문구 찾기",
      basis:
        "현재 확정 필드와 현재 확정된 작성 문서 내용의 키워드 검색입니다. 의미 검색이나 모든 PDF·조항의 전수 검색이 아닙니다. 서로 다른 문서의 주장은 별도 근거로 보존합니다.",
      coverage:
        "작성 문서 {scanned}건 검색, 크기·건수 제한으로 {omitted}건 제외. 수신 문서의 연결 범위가 모든 페이지·조항의 추출을 보증하지는 않습니다.",
      empty:
        "보존된 내용에서 일치 문구를 찾지 못했습니다. 원문에 조항이 없다는 뜻은 아닙니다. 문서를 확인하거나 키워드를 바꿔주세요.",
      excerpt: "일부 발췌입니다. 전체 문맥은 원문에서 확인하세요.",
      receipt: "조회 감사 기록",
      receiptBoundary:
        "담당자·시각·응답 식별값을 기록합니다. 답변 본문 보관이나 과거 답변 재현은 아닙니다.",
    },
    savedAnswers: {
      title: "저장한 업무 답변",
      notice:
        "선택한 조건을 다시 조회하여 그 시점의 답변을 저장합니다. 저장 기록은 본인만 조회하며 원문 삭제나 권한 변경으로 열 수 없게 될 수 있습니다. 업무 승인이나 최종 정산이 아닙니다.",
      save: "다시 조회하고 저장",
      retry: "같은 저장 요청 재시도",
      load: "내 최근 50건 조회",
      close: "기록 닫기",
      loading: "저장 답변 조회 중…",
      error:
        "저장 답변을 열 수 없거나 요청 결과를 확인하지 못했습니다. 권한을 확인하거나 같은 저장 요청을 재시도하세요. 과거 답변을 현재 데이터로 몰래 다시 만들지 않습니다.",
      empty: "저장한 답변이 없습니다.",
      erased: "원문 제거 · 답변 본문 삭제됨",
      historical:
        "읽기 전용 과거 답변입니다. 원문 링크는 현재 권한으로 문서를 엽니다. 기준 시각:",
    },
    workStatus: {
      title: "현재 근거와 남은 업무",
      basis:
        "이 거래의 현재 문서·관계·청구 일정 근거입니다. 건수는 업무 항목이며 금액이 아닙니다. 최종 정산이나 거래 전체의 완료를 뜻하지 않습니다.",
      partial:
        "일부 근거를 모두 조회하지 못했습니다. 행동 전에 원본 업무 패널을 확인하세요.",
      asOf: "근거 조회 시점",
      digest: "근거 리비전",
      nextActions: "다음 할 일",
      unavailable:
        "업무 상태를 확인할 수 없습니다. 거래에서 원본 업무 패널을 확인하세요.",
      claimsCaution:
        "지급 일정 연결은 실제 입출금 완료가 아닙니다. 알려진 청구가 없다고 최종 잔액이 0인 것은 아닙니다.",
      relationCaution:
        "수량 전체 연결은 이행·승인·정산 완료를 뜻하지 않습니다. 미지정 문서에는 비교 범위 판단이 필요하며, 그 자체가 오류는 아닙니다.",
      states: {
        review_required: "근거 재검토 필요",
        action_needed: "현재 조치 필요",
        waiting: "후속 문서 대기",
        undetermined: "필요성·범위 미정",
        no_open_known_actions: "현재 알려진 근거에서 열린 업무 없음",
        inactive: "비활성 거래 — 근거 보존·업무 조치 중지",
      },
      documents: {
        title: "문서 필요 현황",
        total: "전체 필요 항목",
        available: "확보",
        waiting: "대기",
        requested: "요청 중",
        missing_now: "현재 미확보",
        overdue: "문서 확보 기한 경과",
        partial: "일부 확보",
        review_required: "재검토 필요",
        undetermined: "필요성 미정",
        not_applicable: "해당 없음",
      },
      relations: {
        title: "문서 비교 현황",
        total: "명시적 연결 관계",
        partial: "수량 일부 연결",
        full: "수량 전체 연결",
        not_comparable: "비교 대상 아님",
        review_required: "재검토 필요",
        released: "연결 해제",
        unscoped_documents: "비교 범위 미지정 문서",
        unscoped_lines: "비교 범위 미지정 품목",
      },
      claims: {
        title: "청구 일정 현황",
        total: "확인 가능한 청구 출처",
        scheduled: "일정 연결",
        needs_schedule: "날짜·일정 보완 필요",
        review_required: "재검토 필요",
        unlinked_schedules: "출처 미연결 일정",
      },
      actions: {
        reload_evidence: "근거 조회 상태 확인",
        review_documents: "문서 근거 재검토",
        obtain_documents: "지금 필요한 문서 확보",
        define_document_needs: "문서 필요성 정의",
        review_relations: "문서 관계 재검토",
        define_relation_scope: "문서 비교 범위 정의",
        review_claims: "청구 출처·일정 재검토",
        plan_claim_dates: "날짜 지정·기존 일정 연결",
        wait_for_documents: "향후 필요한 문서 확인",
      },
    },
    documentTiming: {
      shipmentSaveUnverified:
        "선적 연결 저장 결과를 확인할 수 없습니다. 입력은 보존했습니다. 이미 저장됐을 수 있으니 새로고침 후 계획을 확인하세요.",
      shipmentConnection: "선적 연결",
      shipmentSaved: "저장된 선적",
      shipmentPreserve: "저장된 연결 유지",
      shipmentClear: "선적 연결 명시적으로 해제",
      shipmentClearHint:
        "저장하면 이 계획의 선적 연결만 해제됩니다. 문서·선적·배분·입출금은 삭제하지 않습니다.",
      shipmentUnbound: "선적 미연결",
      shipmentUnsupported:
        "현재 서버는 선적 연결을 지원하지 않습니다. 기존 계획과 저장된 연결은 유지됩니다.",
      shipmentCurrent:
        "현재 선적 정보와 연결이 일치합니다. 배송 완료나 정산 확정을 뜻하지 않습니다.",
      shipmentChanged:
        "저장하거나 선택한 선적의 현재성을 확인할 수 없습니다. 검토 후 현재 선적을 선택하거나 연결을 명시적으로 해제하세요.",
      shipmentHint:
        "선택 사항: 이 거래의 기존 선적을 연결합니다. B/L 발급 전에는 미연결 상태로 계획 범위를 적을 수 있습니다. 연결을 바꾸면 근거를 다시 검토해야 합니다.",
      shipmentBlOnly:
        "이 선적에 연결된 수신 B/L만 해당 B/L 계획의 확보 근거가 됩니다.",
      shipmentNoSource:
        "이 선적에는 연결된 원본 B/L이 없습니다. 문서 계획은 가능하지만 B/L을 확보했다고 표시할 수 없습니다.",
      shipmentOtherDocs:
        "다른 문서 종류는 사용자가 범위를 명시적으로 배정하는 것이며 선적과 자동으로 일치했다는 뜻이 아닙니다.",
      shipmentContainer: "컨테이너",
      shipmentIdentifier: "선적 ID",
      title: "서류 필요 시점·확보 현황",
      basis:
        "계획은 선택한 업무·선적 범위를 관리하며 법적 필수 서류나 업무 승인을 판정하지 않습니다. 계획이 없는 서류는 자동 누락이 아닙니다. 기존 청구·입출금은 별도로 계산할 수 있으며 최종 수익·정산 확정을 뜻하지 않습니다.",
      asOf: "조회 기준",
      truncated:
        "조회 한도를 넘어 일부 자료만 표시합니다. 계획 수정은 제한되므로 조직 관리자에게 지원을 요청하세요.",
      empty: "아직 서류 계획이 없습니다. 필요한 서류가 없다는 뜻은 아닙니다.",
      neededAt: "필요 시각 (현재 기기 시간대)",
      noDate: "미정",
      documentDate: "문서에 기재된 날짜",
      recordedAt: "ECOYA 등록 시각",
      edit: "검토·수정",
      refresh: "새로고침",
      failed:
        "조회 또는 저장하지 못했습니다. 입력은 유지됩니다. 새로고침 후 검토하여 재시도하세요.",
      loading: "불러오는 중…",
      add: "서류 계획 추가",
      docCode: "문서 종류",
      scope: "적용 범위·선적 차수·업무",
      need: "필요 시점",
      requested: "요청 사실 기록 (관리용이며 실제 메시지는 발송하지 않음)",
      reason: "대기 조건·사유·다음 행동",
      coverage: "이 범위의 확보 정도",
      sources: "이 범위에 해당하는 기존 문서 선택",
      reviewedSource: "내용 검토됨",
      review:
        "적용 범위·필요 시점·선택 근거를 검토했습니다. 거래 승인이나 지급 적용은 아닙니다.",
      save: "검토한 계획 저장",
      cancel: "취소",
      invalid: "적용 범위·사유와 확보 정도에 맞는 문서를 입력하세요.",
      conflict:
        "계획 또는 근거가 변경되었습니다. 새로고침 후 해당 계획을 다시 열어 현재 버전을 검토하세요.",
      states: {
        waiting: "확보 예정·대기",
        requested: "요청 후 대기",
        missing_now: "현재 필요·미확보",
        overdue: "필요 시각 경과",
        partial: "부분 확보",
        available: "이 범위 확보됨",
        review_required: "재검토 필요",
        not_applicable: "해당 없음",
        undetermined: "필요성·시점 미판정",
      },
      needs: {
        planned: "나중에 필요·대기",
        needed_now: "지금 필요",
        not_applicable: "해당 없음",
        undetermined: "미판정",
      },
      coverages: {
        none: "선택 근거 없음",
        partial: "이 범위의 일부",
        complete: "이 범위 전체 (검토된 근거)",
      },
    },
  },
} as const

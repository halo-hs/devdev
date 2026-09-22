// Capture reachable multi-step document flows; never send an email or open a customer URL.
const route = "/erp/documents/create/CI-2026-0708"
const click = (name) => async (page) =>
  page
    .getByRole("button", { name, exact: typeof name === "string" })
    .first()
    .click()
const sequence =
  (...steps) =>
  async (page) => {
    for (const step of steps) await step(page)
  }
const reviewed = click("검토 완료")
const picker = sequence(reviewed, click("승인자 선택"))
const selected = sequence(picker, click(/^박서윤/), click("완료"))
const requested = sequence(selected, click("승인 요청"))
const approved = sequence(requested, click("승인"))
const rejectedForm = sequence(requested, click("반려"))
const rejectedReason = sequence(rejectedForm, async (page) =>
  page
    .getByRole("textbox", { name: "반려 사유", exact: true })
    .fill("수취인과 결제조건을 원문 기준으로 다시 확인해 주세요.")
)
const rejected = sequence(rejectedReason, click("반려 확정"))
const confirmed = sequence(approved, click("문서 확정"))
const linked = sequence(confirmed, click("공유 링크 만들기"))
const perspective = (name) =>
  sequence(
    async (page) =>
      page
        .locator("header")
        .getByRole("button", { name: "더보기", exact: true })
        .click(),
    async (page) =>
      page
        .getByRole("combobox", {
          name: "문서 승인 화면 상태 전환",
          exact: true,
        })
        .click(),
    async (page) => page.getByRole("option", { name, exact: true }).click()
  )

export function documentFlowPages() {
  const job = (
    id,
    title,
    workflow,
    sourceId,
    action,
    setup,
    flowLinks = {},
    extra = {}
  ) => ({
    id,
    title,
    route,
    group: "문서 만들기",
    parent: sourceId,
    sourceId,
    workflow,
    action,
    setup,
    flowLinks,
    ...extra,
  })
  const jobs = [
    job(
      "document-flow-draft",
      "초안 · PDF 검토 전",
      "승인·확정",
      "document-create",
      "최근 문서 → 상업송장 초안 열기",
      null,
      { "검토 완료": "document-flow-reviewed" }
    ),
    job(
      "document-flow-reviewed",
      "검토 완료 · 승인자 미선택",
      "승인·확정",
      "document-flow-draft",
      "검토 완료",
      reviewed,
      { "승인자 선택": "document-flow-approver-picker" }
    ),
    job(
      "document-flow-approver-picker",
      "승인자 선택",
      "승인·확정",
      "document-flow-reviewed",
      "승인자 선택",
      picker,
      {
        박서윤Owner: "document-flow-approvers-selected",
        완료: "document-flow-reviewed",
      }
    ),
    job(
      "document-flow-approvers-selected",
      "승인 요청 가능",
      "승인·확정",
      "document-flow-approver-picker",
      "박서윤 선택 → 완료",
      selected,
      {
        "승인 요청": "document-flow-pending",
        "1명 선택": "document-flow-approver-picker",
      }
    ),
    job(
      "document-flow-pending",
      "Owner · 승인 검토",
      "승인·확정",
      "document-flow-approvers-selected",
      "승인 요청",
      requested,
      { 승인: "document-flow-approved", 반려: "document-flow-reject-form" },
      { actor: "승인자 Owner" }
    ),
    job(
      "document-flow-requester-pending",
      "요청자 · 승인 대기",
      "승인·확정",
      "document-flow-pending",
      "상단 더보기 → 요청자 · 승인 대기",
      perspective("요청자 · 승인 대기"),
      {},
      { actor: "요청자", fixture: true }
    ),
    job(
      "document-flow-admin-pending",
      "Admin · 승인 검토",
      "승인·확정",
      "document-flow-pending",
      "상단 더보기 → 승인자 · Admin",
      perspective("승인자 · Admin"),
      {},
      { actor: "승인자 Admin", fixture: true }
    ),
    job(
      "document-flow-reject-form",
      "반려 사유 입력 · 확정 불가",
      "승인·확정",
      "document-flow-pending",
      "반려",
      rejectedForm,
      { 취소: "document-flow-pending" }
    ),
    job(
      "document-flow-reject-ready",
      "반려 사유 입력 완료",
      "승인·확정",
      "document-flow-reject-form",
      "반려 사유 입력",
      rejectedReason,
      { "반려 확정": "document-flow-rejected", 취소: "document-flow-pending" }
    ),
    job(
      "document-flow-rejected",
      "반려 처리 완료",
      "승인·확정",
      "document-flow-reject-ready",
      "반려 확정",
      rejected,
      {},
      { actor: "승인자 Owner" }
    ),
    job(
      "document-flow-requester-rejected",
      "요청자 · 반려 사유 확인",
      "승인·확정",
      "document-flow-rejected",
      "상단 더보기 → 요청자 · 반려 확인",
      perspective("요청자 · 반려 확인"),
      {},
      { actor: "요청자", fixture: true }
    ),
    job(
      "document-flow-approved",
      "승인 처리 완료 · 확정 가능",
      "승인·확정",
      "document-flow-pending",
      "승인",
      approved,
      { "문서 확정": "document-flow-confirmed" },
      { actor: "승인자 Owner" }
    ),
    job(
      "document-flow-requester-approved",
      "요청자 · 승인 완료 확인",
      "승인·확정",
      "document-flow-approved",
      "상단 더보기 → 요청자 · 승인 완료",
      perspective("요청자 · 승인 완료"),
      {},
      { actor: "요청자", fixture: true }
    ),
    job(
      "document-flow-confirmed",
      "확정 완료 · 공유 링크 설정",
      "매직링크·고객 전달",
      "document-flow-approved",
      "문서 확정",
      confirmed,
      {
        "공유 링크 만들기": "document-flow-link-created",
        "파일 추가": "document-flow-attachment-picker",
        "전달 내역": "document-flow-history-empty",
        "공유 창 닫기": "document-flow-summary",
      }
    ),
    job(
      "document-flow-summary",
      "확정 문서 · 공유 전",
      "매직링크·고객 전달",
      "document-flow-confirmed",
      "공유 창 닫기",
      sequence(confirmed, click("공유 창 닫기")),
      { 공유하기: "document-flow-confirmed", 관리: "document-flow-confirmed" }
    ),
    job(
      "document-flow-link-created",
      "매직링크 생성 · 이메일 전달 준비",
      "매직링크·고객 전달",
      "document-flow-confirmed",
      "공유 링크 만들기",
      linked,
      {
        복사: "document-flow-link-copied",
        철회: "document-flow-link-revoked",
        삭제: "document-flow-link-deleted",
        "전달 내역": "document-flow-history",
        "파일 추가": "document-flow-attachment-picker",
      },
      {
        gaps: [
          "수신 화면 미리보기: 현재 공유 상태를 별도 창에서 확인합니다.",
          "발송 요청 기록: 요청 저장 버튼이며 실제 이메일 발송·수신 완료 화면은 아닙니다.",
        ],
      }
    ),
    job(
      "document-flow-link-copied",
      "매직링크 복사 완료",
      "매직링크·고객 전달",
      "document-flow-link-created",
      "복사",
      sequence(linked, click("복사")),
      {},
      { quick: true }
    ),
    job(
      "document-flow-link-revoked",
      "매직링크 철회됨",
      "매직링크·고객 전달",
      "document-flow-link-created",
      "철회",
      sequence(linked, click("철회")),
      {
        삭제: "document-flow-link-deleted",
        "전달 내역": "document-flow-history-revoked",
      }
    ),
    job(
      "document-flow-link-deleted",
      "매직링크 삭제 · 재생성 가능",
      "매직링크·고객 전달",
      "document-flow-link-created",
      "삭제",
      sequence(linked, click("삭제")),
      { "공유 링크 만들기": "document-flow-link-created" }
    ),
    job(
      "document-flow-attachment-picker",
      "동봉 파일 · 추가 가능·첨부 불가",
      "매직링크·고객 전달",
      "document-flow-confirmed",
      "동봉 파일",
      sequence(confirmed, click("파일 추가")),
      {
        "PackingList_0707.pdf현재 거래와 일치추가 가능":
          "document-flow-attachment-added",
      }
    ),
    job(
      "document-flow-attachment-added",
      "동봉 파일 추가 완료",
      "매직링크·고객 전달",
      "document-flow-attachment-picker",
      "PackingList_0707.pdf 선택",
      sequence(confirmed, click("파일 추가"), async (p) => p.getByRole("checkbox", {name:"PackingList_0707.pdf",exact:true}).check())
    ),
    job(
      "document-flow-history-empty",
      "전달 내역 없음",
      "매직링크·고객 전달",
      "document-flow-confirmed",
      "전달 내역",
      sequence(confirmed, click("전달 내역")),
      { 전달: "document-flow-confirmed" }
    ),
    job(
      "document-flow-history",
      "전달 내역 · 활성 링크",
      "매직링크·고객 전달",
      "document-flow-link-created",
      "전달 내역",
      sequence(linked, click("전달 내역")),
      { 전달: "document-flow-link-created" }
    ),
    job(
      "document-flow-history-revoked",
      "전달 내역 · 철회된 링크",
      "매직링크·고객 전달",
      "document-flow-link-revoked",
      "전달 내역",
      sequence(linked, click("철회"), click("전달 내역")),
      { 전달: "document-flow-link-revoked" }
    ),
  ]
  const find = (id) => jobs.find((page) => page.id === id)
  const link = (id, links) => Object.assign(find(id).flowLinks, links)
  const add = (id, title, source, action, setup, links = {}, extra = {}) => {
    const parent = find(source)
    jobs.push(
      job(id, title, parent.workflow, source, action, setup, links, extra)
    )
  }
  const reason = async (p) =>
    p
      .getByRole("textbox", { name: "반려 사유", exact: true })
      .fill("수취인과 결제조건을 원문 기준으로 다시 확인해 주세요.")
  const admin = perspective("승인자 · Admin")
  const adminApproved = sequence(admin, click("승인"))
  const adminReject = sequence(admin, click("반려"))
  link("document-flow-admin-pending", {
    승인: "document-flow-admin-approved",
    반려: "document-flow-admin-reject-form",
  })
  add(
    "document-flow-admin-approved",
    "Admin · 승인 완료",
    "document-flow-admin-pending",
    "승인",
    adminApproved,
    { "문서 확정": "document-flow-admin-confirmed" },
    { actor: "승인자 Admin" }
  )
  add(
    "document-flow-admin-reject-form",
    "Admin · 반려 사유 입력",
    "document-flow-admin-pending",
    "반려",
    adminReject,
    { 취소: "document-flow-admin-pending" },
    { actor: "승인자 Admin" }
  )
  add(
    "document-flow-admin-reject-ready",
    "Admin · 반려 사유 입력 완료",
    "document-flow-admin-reject-form",
    "반려 사유 입력",
    sequence(adminReject, reason),
    {
      "반려 확정": "document-flow-admin-rejected",
      취소: "document-flow-admin-pending",
    },
    { actor: "승인자 Admin" }
  )
  add(
    "document-flow-admin-rejected",
    "Admin · 반려 완료",
    "document-flow-admin-reject-ready",
    "반려 확정",
    sequence(adminReject, reason, click("반려 확정")),
    {},
    { actor: "승인자 Admin" }
  )
  link("document-flow-requester-rejected", {
    "승인 재요청": "document-flow-requester-rerequested",
  })
  add(
    "document-flow-requester-rerequested",
    "요청자 · 재요청 완료·이력 유지",
    "document-flow-requester-rejected",
    "승인 재요청",
    sequence(perspective("요청자 · 반려 확인"), click("승인 재요청")),
    {},
    { actor: "요청자" }
  )
  for (const [role, setup] of [
    ["admin", adminApproved],
    ["requester", perspective("요청자 · 승인 완료")],
  ]) {
    const from = `document-flow-${role}-approved`
    const id = `document-flow-${role}-confirmed`
    link(from, { "문서 확정": id })
    add(
      id,
      `${role === "admin" ? "Admin" : "요청자"} · 확정·공유 설정`,
      from,
      "문서 확정",
      sequence(setup, click("문서 확정")),
      { ...find("document-flow-confirmed").flowLinks },
      { actor: role === "admin" ? "승인자 Admin" : "요청자" }
    )
  }

  // Keep attachment count and link lifecycle when moving between share views.
  const attached = sequence(
    confirmed,
    click("파일 추가"),
    async (p) => p.getByRole("checkbox", {name:"PackingList_0707.pdf",exact:true}).check()
  )
  for (const [prefix, start, root, title] of [
    ["document-flow", confirmed, "document-flow-confirmed", "매직링크"],
    [
      "document-flow-attachment",
      attached,
      "document-flow-attachment-added",
      "첨부 1개 · 매직링크",
    ],
  ]) {
    const active = sequence(start, click("공유 링크 만들기"))
    const revoked = sequence(active, click("철회"))
    const deleted = sequence(active, click("삭제"))
    const ids = {
      none: root,
      active: prefix + "-link-created",
      revoked: prefix + "-link-revoked",
      deleted: prefix + "-link-deleted",
    }
    const setups = { none: start, active, revoked, deleted }
    const historyIds = {
      none: prefix + "-history-empty",
      active: prefix + "-history",
      revoked: prefix + "-history-revoked",
      deleted: prefix + "-history-deleted",
    }
    const stateLabels = {
      none: "미생성",
      active: "활성",
      revoked: "철회됨",
      deleted: "삭제됨",
    }
    for (const state of ["none", "active", "revoked", "deleted"]) {
      const current = ids[state]
      const links = {
        "공유 창 닫기": prefix + "-summary-" + state,
        "전달 내역": historyIds[state],
        "파일 추가": prefix + "-picker-" + state,
      }
      if (state === "none" || state === "deleted")
        links["공유 링크 만들기"] = ids.active
      if (state === "active")
        Object.assign(links, {
          복사: prefix + "-link-copied",
          철회: ids.revoked,
          삭제: ids.deleted,
        })
      if (state === "revoked") links["삭제"] = ids.deleted
      if (find(current)) link(current, links)
      else
        add(
          current,
          `${title} · ${stateLabels[state]}`,
          root,
          state === "active"
            ? "공유 링크 만들기"
            : state === "revoked"
              ? "철회"
              : "삭제",
          setups[state],
          links
        )
      if (!find(historyIds[state]))
        add(
          historyIds[state],
          `${title} · 전달 내역 (${stateLabels[state]})`,
          current,
          "전달 내역",
          sequence(setups[state], click("전달 내역")),
          { 전달: current, "공유 창 닫기": prefix + "-summary-" + state }
        )
      else
        link(historyIds[state], {
          전달: current,
          "공유 창 닫기": prefix + "-summary-" + state,
        })
      add(
        prefix + "-summary-" + state,
        `${title} · 문서 요약 (${stateLabels[state]})`,
        current,
        "공유 창 닫기",
        sequence(setups[state], click("공유 창 닫기")),
        { 공유하기: current, 관리: current }
      )
      const pickerId = prefix + "-picker-" + state
      add(
        pickerId,
        `${title} · 동봉 파일 (${stateLabels[state]})`,
        current,
        "동봉 파일",
        sequence(setups[state], click("파일 추가")),
        {}
      )
      const pick = find(pickerId)
      pick.flowRules = [
        {
          includes: "PackingList_0707.pdf",
          target:
            prefix === "document-flow"
              ? state === "none"
                ? "document-flow-attachment-added"
                : "document-flow-attachment-link-" +
                  (state === "active" ? "created" : state)
              : current,
        },
      ]
    }
    const copied = prefix + "-link-copied"
    if (!find(copied))
      add(
        copied,
        `${title} · 복사 완료`,
        ids.active,
        "복사",
        sequence(active, click("복사")),
        { ...find(ids.active).flowLinks },
        { quick: true }
      )
    else link(copied, { ...find(ids.active).flowLinks })
  }
  return jobs
}

const sequence =
  (...steps) =>
  async (page) => {
    for (const step of steps) await step(page)
  }
const button =
  (name, index = 0) =>
  async (page) =>
    page
      .getByRole("button", { name, exact: typeof name === "string" })
      .nth(index)
      .click()
const check = (name) => async (page) =>
  page.getByRole("checkbox", { name, exact: true }).click()
const linkedResult = async (p) => {
  await p.waitForURL(/\/erp\/deals\//,{timeout:15000})
  await p
    .locator('[aria-label="화면을 불러오는 중"]')
    .waitFor({ state: "hidden", timeout: 10000 })
  await p
    .locator('main[aria-busy="true"]')
    .waitFor({ state: "hidden", timeout: 10000 })
}
const samplePdf = (name) => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"
  ),
})

export function extendInteractionFlows(pages) {
  const find = (id) => pages.find((page) => page.id === id)
  const connect = (id, links = {}, rules = []) => {
    const page = find(id)
    page.flowLinks = { ...page.flowLinks, ...links }
    page.flowRules = [...(page.flowRules || []), ...rules]
  }
  const add = (id, title, sourceId, action, setup, links = {}, rules = []) => {
    const source = find(sourceId)
    const page = {
      id,
      title,
      route: source.route,
      group: source.group,
      workflow:
        source.workflow ||
        {
          거래: "노트 편집·삭제",
          알림: "선택·읽음 처리",
          선적: "목록 페이지",
          정산: "목록 페이지",
          "문서 올리기": "파일 추가·거래 연결",
        }[source.group],
      parent: sourceId,
      sourceId,
      action,
      setup,
      flowLinks: links,
      flowRules: [...rules],
    }
    pages.push(page)
    return page
  }

  const deal = "deal-dl-260701-09"
  for (let i = 0; i < 2; i++) {
    const prefix = `deal-note-${i + 1}`
    const editing = button("노트 수정", i)
    const changed = sequence(editing, async (p) =>
      p
        .getByRole("textbox", { name: "노트 수정", exact: true })
        .fill(
          i
            ? "잔금 지급 전 계좌 변경 여부 확인 완료"
            : "7월 15일까지 B/L 원본 요청 — 담당자 확인 완료"
        )
    )
    const deleting = button("노트 삭제", i)
    const saveNote = sequence(button("저장"), async (p) =>
      p
        .getByRole("textbox", { name: "노트 수정", exact: true })
        .waitFor({ state: "hidden" })
    )
    const deleteNote = sequence(button("삭제"), async (p) =>
      p.waitForFunction(
        () =>
          document.querySelectorAll('button[aria-label="노트 삭제"]').length ===
          1
      )
    )
    connect(deal, {}, [
      { label: "노트 수정", occurrence: i + 1, target: prefix + "-edit" },
      {
        label: "노트 삭제",
        occurrence: i + 1,
        target: prefix + "-delete-confirm",
      },
    ])
    add(
      prefix + "-edit",
      `노트 ${i + 1} · 편집`,
      deal,
      `노트 ${i + 1} 수정`,
      editing,
      { 취소: deal, 저장: prefix + "-saved-original" }
    )
    add(
      prefix + "-changed",
      `노트 ${i + 1} · 수정값 입력`,
      prefix + "-edit",
      "노트 수정값 입력",
      changed,
      { 취소: deal, 저장: prefix + "-saved" }
    )
    add(
      prefix + "-saved-original",
      `노트 ${i + 1} · 기존 값 저장`,
      prefix + "-edit",
      "저장",
      sequence(editing, saveNote)
    )
    add(
      prefix + "-saved",
      `노트 ${i + 1} · 수정 저장 완료`,
      prefix + "-changed",
      "저장",
      sequence(changed, saveNote)
    )
    add(
      prefix + "-delete-confirm",
      `노트 ${i + 1} · 삭제 확인`,
      deal,
      `노트 ${i + 1} 삭제`,
      deleting,
      { 취소: deal, 삭제: prefix + "-deleted" }
    )
    add(
      prefix + "-deleted",
      `노트 ${i + 1} · 삭제 완료`,
      prefix + "-delete-confirm",
      "삭제",
      sequence(deleting, deleteNote)
    )
    for (const suffix of ["-saved-original", "-saved", "-deleted"])
      find(prefix + suffix).captureVersion = 2
  }

  const names = [
    "현재 목록 전체 선택",
    "B/L 수량 불일치를 확인해주세요 선택",
    "판매계약서 승인 요청이 도착했습니다 선택",
    "수입신고필증 업로드가 필요합니다 선택",
    "내일 지급 예정인 정산이 있습니다 선택",
    "거래 문서 검토가 완료되었습니다 선택",
    "선적 지연 위험이 해소되었습니다 선택",
  ]
  for (const [i, name] of names.entries()) {
    const id = `notifications-selected-${i}`
    connect("notifications", { [name]: id })
    add(
      id,
      i ? `알림 ${i} · 선택됨` : "알림 · 전체 선택",
      "notifications",
      name,
      check(name),
      { [name]: "notifications", "선택 항목 읽음 처리": id + "-read" }
    )
    add(
      id + "-read",
      i ? `알림 ${i} · 읽음 처리 완료` : "알림 · 전체 읽음 처리 완료",
      id,
      "선택 항목 읽음 처리",
      sequence(check(name), button("선택 항목 읽음 처리"))
    )
  }

  // Each independent paginator gets its own destinations (same label can occur twice).
  for (const [base, pageCount, paginator] of [
    ["shipments", 3, 0],
    ["settlement", 2, 0],
    ["settlement", 2, 1],
  ]) {
    const stateId = (n) =>
      n === 1 ? base : `${base}-list-${paginator + 1}-page-${n}`
    for (let n = 1; n <= pageCount; n++) {
      const rules = Array.from({ length: pageCount }, (_, j) => ({
        label: `${j + 1}페이지`,
        occurrence: paginator + 1,
        target: stateId(j + 1),
      }))
      rules.push(
        {
          label: "이전 페이지",
          occurrence: paginator + 1,
          target: stateId(Math.max(1, n - 1)),
        },
        {
          label: "다음 페이지",
          occurrence: paginator + 1,
          target: stateId(Math.min(pageCount, n + 1)),
        }
      )
      if (n === 1) connect(base, {}, rules)
      else
        add(
          stateId(n),
          `${base === "shipments" ? "선적" : "정산"} · 목록 ${paginator + 1} · ${n}페이지`,
          base,
          `${n}페이지`,
          button(`${n}페이지`, paginator),
          {},
          rules
        )
    }
  }

  for (const [base, kind] of [
    ["document-invoice-connect", "invoice"],
    ["document-connect", "bank"],
  ]) {
    find(base).captureVersion = 2
    const prefix = "upload-" + kind
    const menu = button("파일 추가 메뉴")
    const drop = sequence(menu, async (p) => p.keyboard.press("Escape"))
    const mail = sequence(menu, async (p) => {
      await p
        .getByRole("menuitem", { name: "이메일에서 찾기", exact: true })
        .click()
      await p
        .getByText("수신 메일에서 첨부 선택", { exact: true })
        .locator("..")
        .locator("..")
        .getByRole("button")
        .evaluate((el) => el.setAttribute("aria-label", "첨부 선택 닫기"))
    })
    const upload = (names) =>
      sequence(drop, async (p) => {
        await p
          .locator('input[type="file"]')
          .first()
          .setInputFiles(names.map(samplePdf))
        await p
          .getByText("파일 업로드 중", { exact: true })
          .waitFor({ state: "hidden", timeout: 10000 })
        await p.waitForTimeout(700)
      })
    const menuLinks = {
      "이메일에서 찾기": prefix + "-mail",
      "파일 선택": prefix + "-file-added",
      "폴더 선택": prefix + "-folder-added",
      "파일 추가 영역 닫기": base,
    }
    connect(base, {
      "파일 추가 메뉴": prefix + "-file-menu",
      "파일 추가": prefix + "-file-menu",
      "새 거래 등록": prefix + "-new-deal",
    })
    add(
      prefix + "-file-menu",
      "파일 추가 · 메뉴",
      base,
      "파일 추가",
      menu,
      menuLinks
    )
    add(
      prefix + "-file-drop",
      "파일 추가 · 끌어놓기 영역",
      prefix + "-file-menu",
      "메뉴 닫기",
      drop,
      menuLinks
    )
    add(
      prefix + "-file-added",
      "PDF 추가 · 샘플 파일 선택 후",
      prefix + "-file-menu",
      "파일 선택 → 추가확인.pdf 선택",
      upload(["추가확인.pdf"]),
      { "파일 추가 메뉴": prefix + "-file-menu" }
    )
    const uploading = add(
      prefix + "-file-uploading",
      "PDF 추가 · 업로드 중",
      prefix + "-file-menu",
      "PDF 선택 → 업로드 중",
      sequence(drop, async (p) => {
        await p
          .locator('input[type="file"]')
          .first()
          .setInputFiles([samplePdf("추가확인.pdf")])
        await p.getByText("파일 업로드 중", { exact: true }).waitFor()
      })
    )
    uploading.quick = true
    add(
      prefix + "-folder-added",
      "폴더 추가 · PDF 2개 선택 후",
      prefix + "-file-menu",
      "폴더 선택 → PDF 2개 선택",
      upload(["폴더문서_1.pdf", "폴더문서_2.pdf"])
    )
    add(
      prefix + "-duplicate-file",
      "파일 추가 · 중복 파일 안내",
      prefix + "-file-menu",
      "같은 이름의 PDF 선택",
      upload([
        kind === "invoice"
          ? "인보이스_2607_003.pdf"
          : "은행거래내역서_2026-08-27.pdf",
      ]),
      { 확인: base }
    )
    const mailNames = [
      "Invoice_HB-2607-003.pdf",
      "PackingList_0707.pdf",
      "Certificate_origin.pdf",
      "SalesContract_Revised.pdf",
      "BankDetails_Hanbit.pdf",
    ]
    const masks = [3, 0, 1, 2, 4, 8, 16, 31, 7, 11, 19]
    const mailId = (mask) =>
      mask === 3
        ? prefix + "-mail"
        : mask === 0
          ? prefix + "-mail-empty"
          : mask === 1
            ? prefix + "-mail-selected"
            : mask === 31
              ? prefix + "-mail-all"
              : [2, 4, 8, 16].includes(mask)
                ? prefix + "-mail-selected-" + (Math.log2(mask) + 1)
                : prefix + "-mail-default-plus-" + mask
    const selectMail = (mask) =>
      sequence(mail, async (p) => {
        for (let i = 0; i < mailNames.length; i++) {
          const control = p.getByRole("checkbox", {
            name: mailNames[i] + " 선택",
            exact: true,
          })
          const selected =
            (await control.getAttribute("aria-checked")) === "true"
          if (selected !== Boolean(mask & (1 << i))) await control.click()
        }
      })
    add(
      prefix + "-mail-closed",
      "이메일 첨부 · 선택 취소",
      prefix + "-file-menu",
      "첨부 선택 닫기",
      sequence(mail, button("첨부 선택 닫기")),
      { "파일 추가 메뉴": prefix + "-file-menu" }
    )
    // Add the root first so parent metadata is available for every selection state.
    for (const mask of masks) {
      const id = mailId(mask)
      const names = mailNames.filter((_, index) => mask & (1 << index))
      const imported =
        mask === 1
          ? prefix + "-mail-imported"
          : mask === 3
            ? prefix + "-mail-default-imported"
            : id + "-imported"
      const links = {
        "첨부 선택 닫기": prefix + "-mail-closed",
        "표시된 문서 전체 선택": mailId(mask === 31 ? 0 : 31),
      }
      if (mask) links["선택 문서 가져오기"] = imported
      for (let i = 0; i < mailNames.length; i++) {
        const next = mask ^ (1 << i)
        if (masks.includes(next)) links[mailNames[i] + " 선택"] = mailId(next)
      }
      const item = add(
        id,
        `이메일 첨부 · ${names.length}개 선택${mask === 3 ? " (기본)" : ""}`,
        mask === 3 ? prefix + "-file-menu" : prefix + "-mail",
        mask === 3
          ? "이메일에서 찾기"
          : names.length
            ? names.join(" · ") + " 선택"
            : "선택 해제",
        selectMail(mask),
        links
      )
      item.captureVersion = 4
      if (mask) {
        const result = add(
          imported,
          `이메일 첨부 · ${names.length}개 가져오기 완료`,
          id,
          "선택 문서 가져오기",
          sequence(
            selectMail(mask),
            button("선택 문서 가져오기"),
            async (p) => {
              await p
                .getByText("파일 업로드 중", { exact: true })
                .waitFor({ state: "hidden", timeout: 10000 })
              await p.waitForTimeout(700)
            }
          )
        )
        result.captureVersion = 4
      }
    }
    const newDeal = button("새 거래 등록")
    const ready = sequence(newDeal, async (p) =>
      p
        .getByRole("textbox", { name: "새 거래번호", exact: true })
        .fill("DL-260916-90")
    )
    add(
      prefix + "-new-deal",
      "새 거래 등록 · 추천 번호",
      base,
      "새 거래 등록",
      newDeal,
      { "등록 닫기": base, "새 거래 생성·연결": prefix + "-new-linked" }
    )
    add(
      prefix + "-new-number",
      "새 거래 등록 · 번호 입력",
      prefix + "-new-deal",
      "새 거래번호 입력",
      ready,
      { "등록 닫기": base, "새 거래 생성·연결": prefix + "-number-linked" }
    )
    add(
      prefix + "-new-empty",
      "새 거래 등록 · 번호 누락",
      prefix + "-new-deal",
      "거래번호 비우기",
      sequence(newDeal, async (p) =>
        p.getByRole("textbox", { name: "새 거래번호", exact: true }).fill("")
      ),
      { "등록 닫기": base }
    )
    for (const [suffix, setup] of [
      ["new", newDeal],
      ["number", ready],
    ]) {
      const created = add(
        prefix + "-" + suffix + "-linked",
        "새 거래 · 생성·연결 완료",
        prefix + (suffix === "new" ? "-new-deal" : "-new-number"),
        "새 거래 생성·연결",
        sequence(setup, async (p)=>{await p.getByRole("combobox",{name:"새 거래 방향"}).click();await p.getByRole("option",{name:"매입 · 보낼 돈",exact:true}).click()}, button("새 거래 생성·연결"), linkedResult)
      )
      created.captureVersion = 2
    }
    // Candidate buttons must select a candidate here, not jump straight to its Deal page.
    const dealIds = [
      "DL-260708-01",
      "DL-260708-08",
      "DL-260707-04",
      "DL-260704-02",
      "DL-260701-09",
      "DL-260629-03",
      "DL-260625-07",
    ]
    const rules = dealIds.map((id, i) => ({
      role: "radio",
      includes: id,
      target: prefix + "-candidate-" + (i + 1),
    }))
    connect(base, {}, rules)
    for (const [i, dealId] of dealIds.entries()) {
      const id = prefix + "-candidate-" + (i + 1)
      const select = async (p) =>
        p.getByRole("radio").filter({ hasText: dealId }).click()
      const bankReady = kind === "bank"
      const selected = add(
        id,
        `${dealId} · 연결 대상 선택`,
        base,
        `${dealId} 선택`,
        select,
        {
          "선택한 거래 연결": id + "-linked",
          "새 거래 등록": prefix + "-new-deal",
          "파일 추가 메뉴": prefix + "-file-menu",
        },
        rules
      )
      const complete = bankReady
        ? sequence(select, async (p) =>
            p.locator('input[name="bank-payment-schedule"]').first().check()
          )
        : select
      if (kind === "bank") {
        for (let schedule = 0; schedule < ([2,4].includes(i) ? 2 : 1); schedule++) {
          const target = id + "-schedule-" + (schedule + 1)
          selected.flowRules.push({
            includes: schedule ? "620,000 USD" : "380,000 USD",
            target,
          })
          const schedulePage = add(
            target,
            `${dealId} · ${[2,4].includes(i)&&schedule===0?"결제 일정 선택":"서류만 연결 선택"}`,
            id,
            "결제 일정 또는 서류만 연결 선택",
            sequence(select, async (p) =>
              p
                .locator('input[name="bank-payment-schedule"]')
                .nth(schedule)
                .check()
            ),
            { "선택한 거래 연결": target + "-linked" },
            rules
          )
          schedulePage.flowRules.push(
            { includes: "380,000 USD", target: id + "-schedule-1" },
            { includes: "620,000 USD", target: id + "-schedule-2" }
          )
          const scheduledResult = add(
            target + "-linked",
            `${dealId} · 일정 ${schedule + 1} 연결 후 거래 화면`,
            target,
            "선택한 거래 연결",
            sequence(
              select,
              async (p) =>
                p
                  .locator('input[name="bank-payment-schedule"]')
                  .nth(schedule)
                  .check(),
              button("선택한 거래 연결"),
              linkedResult
            )
          )
          scheduledResult.resultRoute = "/erp/deals/" + dealId
          if (i === 1)
            scheduledResult.gaps = [
              "연결 후 앱의 거래 상세 데이터가 없어 ‘거래를 찾을 수 없습니다’가 표시됩니다.",
            ]
        }
      }
      const result = add(
        id + "-linked",
        `${dealId} · 연결 후 거래 화면`,
        id,
        "선택한 거래 연결",
        sequence(complete, button("선택한 거래 연결"), linkedResult)
      )
      result.resultRoute = "/erp/deals/" + dealId
      if (i === 1)
        result.gaps = [
          "앱의 거래 후보에는 DL-260708-08이 있지만 거래 상세 데이터가 없어 연결 후 ‘거래를 찾을 수 없습니다’가 표시됩니다.",
        ]
    }
  }
  for (const job of pages.filter(p=>p.id.startsWith("upload-invoice-") && p.id.endsWith("-linked"))) {
    const original=job.setup
    job.setup=async p=>{
      await p.getByRole("button",{name:"항목 검토",exact:true}).click()
      const due=p.locator('[data-upload-field="payment_due_date"] input')
      await due.fill("2026-10-20");await due.blur()
      const unit=p.getByRole("textbox",{name:"수량 단위 입력",exact:true})
      await unit.fill("BOX");await unit.blur()
      await p.getByRole("button",{name:"거래 연결",exact:true}).click()
      await p.waitForTimeout(650)
      await original(p)
    }
    job.captureVersion=5
  }
  // These results depend on the upload workspace retaining its queue across URL updates.
  for (const page of pages.filter(
    (p) =>
      p.id.startsWith("upload-") &&
      /-(file-added|folder-added|imported)$/.test(p.id)
  ))
    page.captureVersion = Math.max(page.captureVersion || 0, 3)
}

// Only the index uses JavaScript. Captured ERP pages remain script-free.
async function startViewer() {
  const response = await fetch("assets/index-pages.json")
  if (!response.ok) throw new Error("Screen index could not be loaded")
  const pages = new Map((await response.json()).map((page) => [page.id, page]))
  const frame = document.querySelector('iframe[name="erp-preview"]')
  const base = new URL("..", location.href)
  const defaultId = frame.getAttribute("src").replace(/\.html$/, "")
  const loading = document.getElementById("preview-loading")
  let pendingId = null

  function pageId(url) {
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null
    const id = decodeURIComponent(url.pathname.slice(base.pathname.length)).replace(/\.html$/, "")
    return pages.has(id) ? id : null
  }

  function updateSelection(id) {
    const page = pages.get(id)
    document.getElementById("preview-title").textContent = page.title
    document.getElementById("preview-state").hidden = !page.skeleton
    document.getElementById("html-link").href = `${id}.html`
    const appLink = document.getElementById("app-link")
    appLink.hidden = !page.route
    if (page.route) appLink.href = new URL(page.route, "https://devdev-e6t.pages.dev").href
    else appLink.removeAttribute("href")
    const designContext = document.getElementById("design-context")
    designContext.replaceChildren()
    designContext.hidden = !page.designWork?.length && !page.brief
    if (page.brief) designContext.append(document.createTextNode(`${page.priority} · ${page.brief}`))
    for (const work of page.designWork || []) {
      if (work.id === id) continue
      const a = document.createElement("a")
      a.href = `${work.id}.html${work.anchor ? '#'+work.anchor : ''}`
      a.target = "erp-preview"
      a.textContent = `목록·상세와 함께 보기 · ${work.title}`
      designContext.append(a)
    }
    frame.title = page.title
    document.title = `${page.title} · HTML 화면 목록`
    const source = pages.get(page.sourceId || page.parent)
    const next = [...pages.values()].filter((candidate) => (candidate.sourceId || candidate.parent) === id)
    const context = document.getElementById("flow-context")
    context.hidden = !source && !next.length && !page.gaps?.length
    const path = document.getElementById("flow-path")
    const outcomes = document.getElementById("flow-next")
    path.replaceChildren()
    outcomes.replaceChildren()
    const makeLink = (target, label) => {
      const link = document.createElement("a")
      link.href = `${target.id}.html`
      link.target = "erp-preview"
      link.textContent = label
      return link
    }
    if (source) {
      path.append(makeLink(source, source.title), document.createTextNode(` → ${page.action || page.title.replace(`${source.title} · `, "")} → ${page.title}`))
    } else path.textContent = "이 화면에서 시작하는 버튼과 결과"
    if (page.actor) path.append(document.createTextNode(` · ${page.actor}`))
    if (page.fixture) path.append(document.createTextNode(" · 상단 상태 전환으로 보는 역할 예시"))
    for (const target of next) outcomes.append(makeLink(target, `${target.action || target.title.replace(`${page.title} · `, "")} → ${target.title}`))
    const gaps = document.getElementById("flow-gaps")
    gaps.hidden = !page.gaps?.length
    gaps.textContent = (page.gaps || []).join("\n")
    let selected = false
    for (const link of document.querySelectorAll("a[data-page]")) {
      if (link.dataset.page === id && new URL(link.href).hash === location.hash) {
        link.setAttribute("aria-current", "page")
        if (selected) continue
        selected = true
        let ancestor = link.parentElement
        while (ancestor) {
          if (ancestor.tagName === "DETAILS") ancestor.open = true
          ancestor = ancestor.parentElement
        }
        link.scrollIntoView({ block: "nearest" })
      } else link.removeAttribute("aria-current")
    }
  }

  function updateAddress(id, replace, anchor = "") {
    const url = new URL(location.href)
    url.searchParams.set("page", id)
    url.hash = anchor
    history[replace ? "replaceState" : "pushState"]({ page: id }, "", url)
  }

  function navigate(id, replace = false, anchor = "") {
    if (!pages.has(id)) id = defaultId
    if (new URL(location.href).searchParams.get("page") !== id || location.hash.slice(1) !== anchor) updateAddress(id, replace, anchor)
    updateSelection(id)
    const target = new URL(`${id}.html${anchor ? '#'+anchor : ''}`, base).href
    // Fragment jumps inside the same menu do not fire an iframe load event.
    try {
      if (pageId(new URL(frame.contentWindow.location.href)) === id && frame.contentDocument.body.dataset.embeddedPreview === "true") {
        pendingId = null
        loading.hidden = true
        frame.removeAttribute("aria-busy")
        frame.contentWindow.location.replace(target)
        return
      }
    } catch { /* The previous preview may be an external reference. */ }
    pendingId = id
    loading.hidden = false
    frame.setAttribute("aria-busy", "true")
    // Keep history in the outer page, including clicks within the preview.
    frame.contentWindow.location.replace(target)
  }

  function handleClick(event) {
    if (pendingId && event.currentTarget.nodeType === 9) {
      event.preventDefault()
      return
    }
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const link = event.target.closest("a[href]")
    if (!link) return
    const url = new URL(link.href)
    const id = pageId(url)
    if (id) {
      event.preventDefault()
      navigate(id, false, url.hash.slice(1))
    } else if (url.origin === base.origin && [base.pathname, `${base.pathname}index.html`, `${base.pathname}index`].includes(url.pathname)) {
      event.preventDefault()
      const requested = url.searchParams.get("page")
      if (requested && pages.has(requested)) navigate(requested, false, url.hash.slice(1))
      else document.querySelector('a[data-page][aria-current="page"]')?.focus()
    } else if (link.target === "_top" && ["https:", "http:"].includes(url.protocol)) {
      event.preventDefault()
      window.location.assign(url.href)
    }
  }

  frame.addEventListener("load", () => {
    let id
    try { id = pageId(new URL(frame.contentWindow.location.href)) } catch {
      pendingId = null
      loading.hidden = true
      frame.removeAttribute("aria-busy")
      return
    }
    if (pendingId && id !== pendingId) return
    pendingId = null
    loading.hidden = true
    frame.removeAttribute("aria-busy")
    if (id) {
      updateAddress(id, true, new URL(frame.contentWindow.location.href).hash.slice(1))
      updateSelection(id)
    }
    frame.contentDocument.body.dataset.embeddedPreview = "true"
    frame.contentDocument.addEventListener("click", handleClick)
  })
  document.querySelector(".screen-navigation").addEventListener("click", handleClick)
  document.getElementById("flow-context").addEventListener("click", handleClick)
  document.getElementById("design-context").addEventListener("click", handleClick)
  window.addEventListener("popstate", () => navigate(new URL(location.href).searchParams.get("page"), true, location.hash.slice(1)))
  navigate(new URL(location.href).searchParams.get("page") || defaultId, true, location.hash.slice(1))
}

startViewer().catch(() => {
  // Native named-frame links remain usable if the index enhancement cannot load.
  document.getElementById("preview-loading").hidden = true
  document.querySelector('iframe[name="erp-preview"]').removeAttribute("aria-busy")
})

import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  FileX2,
  LoaderCircle,
  LockKeyhole,
  Package,
  RefreshCw,
  ShieldCheck,
  Ship,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import {
  readShareResponse,
  previewPackage,
  type PublicPackage,
  type ShareResult,
  type ShareState,
} from "@trade-os/lib/public-share"

const states: [ShareState, string][] = [
  ["active", "정상 열람"],
  ["loading", "확인 중"],
  ["expired", "만료"],
  ["open_cap", "열람 한도"],
  ["not_found", "철회·잘못된 링크"],
  ["error", "일시 오류"],
]
const unavailableCopy = {
  expired: [
    "문서 링크가 만료되었습니다",
    "열람 가능한 기간이 지났습니다. 문서를 다시 확인하려면 발신자에게 새 링크를 요청해 주세요.",
  ],
  open_cap: [
    "열람 가능한 횟수를 모두 사용했습니다",
    "발신자가 설정한 열람 한도에 도달했습니다. 발신자에게 새 링크를 요청해 주세요.",
  ],
  not_found: [
    "이 문서 링크는 사용할 수 없습니다",
    "전달받은 링크 주소를 다시 확인해 주세요. 계속 열리지 않으면 발신자에게 새 링크를 요청해 주세요.",
  ],
  error: [
    "문서를 불러오지 못했습니다",
    "일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  ],
}

function Header() {
  return (
    <header className="border-b bg-card px-5 sm:px-8">
      <div className="mx-auto flex min-h-20 max-w-[1280px] items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/assets/logos/ecoya-symbol.svg"
              alt=""
              className="size-7"
            />
            <span className="text-base font-bold tracking-tight">
              ECOYA <span className="font-medium">Trade OS</span>
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">무역 문서 전달</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          보호된 문서 링크
        </span>
      </div>
    </header>
  )
}
function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-5 py-7 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 xl:px-0">
      <span className="font-semibold">전달을 더 간편하게, ECOYA Trade OS</span>
      <span>이 링크는 만료되거나 발신자가 회수할 수 있습니다.</span>
    </footer>
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 text-sm leading-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium break-words">
        {children || "미공유"}
      </dd>
    </div>
  )
}
function dateLabel(value?: string) {
  if (!value) return "미공유"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "미공유"
    : new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Seoul",
      }).format(date)
}

/** The design sample is deliberately isolated from real token responses. */
function SampleInvoice() {
  return (
    <article
      aria-label="상업송장 샘플"
      className="mx-auto min-h-[650px] w-full max-w-[740px] bg-white p-6 text-[#202c40] shadow-sm sm:min-h-[850px] sm:p-12"
    >
      <div className="flex items-start justify-between gap-4 border-b-2 border-[#1148a2] pb-6">
        <div>
          <p className="text-lg font-bold text-[#1148a2] sm:text-xl">
            ECOYA Demo Co.
          </p>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">
            123 Teheran-ro, Gangnam-gu
            <br />
            Seoul, Republic of Korea
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-base font-bold tracking-wide sm:text-xl">
            COMMERCIAL
            <br />
            INVOICE
          </h3>
          <p className="mt-2 text-[10px] text-slate-500">CI-2026-0916</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 py-7 text-xs leading-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold text-slate-500">
            SELLER / EXPORTER
          </p>
          <p className="font-semibold">ECOYA Demo Co.</p>
          <p>Seoul, Republic of Korea</p>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold text-slate-500">
            BUYER / CONSIGNEE
          </p>
          <p className="font-semibold">ACME GmbH</p>
          <p>Hamburg, Germany</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500">
            INVOICE DATE
          </p>
          <p>September 16, 2026</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500">
            TERMS OF DELIVERY
          </p>
          <p>CIF Hamburg · Incoterms® 2020</p>
        </div>
      </div>
      <table className="w-full table-fixed text-left text-[10px] sm:text-xs">
        <caption className="sr-only">상업송장 품목 및 금액</caption>
        <thead className="border-y border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th scope="col" className="w-[40%] py-3 pl-2 font-medium">
              Description
            </th>
            <th scope="col" className="py-3 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="py-3 text-right font-medium">
              Unit price
            </th>
            <th scope="col" className="py-3 pr-2 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Aluminium Coil", "12 MT", "2,400.00", "28,800.00"],
            ["Aluminium Sheet", "4 MT", "2,400.00", "9,600.00"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-slate-100">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={
                    i === 0
                      ? "py-5 pl-2 font-medium"
                      : "py-5 pr-2 text-right tabular-nums"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5 ml-auto flex max-w-64 items-center justify-between border-b-2 border-[#1148a2] pb-4">
        <span className="text-xs font-semibold">TOTAL (USD)</span>
        <span className="text-xl font-bold text-[#1148a2]">38,400.00</span>
      </div>
      <div className="mt-10 space-y-4 text-xs leading-5">
        <div>
          <p className="text-[10px] font-semibold text-slate-500">
            PAYMENT TERMS
          </p>
          <p>T/T 30% in advance, 70% before shipment</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500">SHIPMENT</p>
          <p>Busan, Korea → Hamburg, Germany</p>
          <p>HMM AMBITION / 026W</p>
        </div>
      </div>
      <div className="mt-14 flex justify-between gap-4 border-t border-slate-200 pt-4 text-[10px] text-slate-400">
        <span>Design sample · Not for commercial use</span>
        <span>1 / 1</span>
      </div>
    </article>
  )
}

async function downloadSample(bundle: boolean) {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF()
  pdf.setFontSize(10)
  pdf.text("DESIGN SAMPLE - NOT FOR COMMERCIAL USE", 20, 18)
  pdf.setTextColor(17, 72, 162)
  pdf.setFontSize(24)
  pdf.text("COMMERCIAL INVOICE", 20, 40)
  pdf.setTextColor(32, 44, 64)
  pdf.setFontSize(12)
  pdf.text(
    [
      "CI-2026-0916 | September 16, 2026",
      "",
      "Seller: ECOYA Demo Co., Seoul, Republic of Korea",
      "Buyer: ACME GmbH, Hamburg, Germany",
      "",
      "Aluminium Coil       12 MT x USD 2,400.00       28,800.00",
      "Aluminium Sheet       4 MT x USD 2,400.00         9,600.00",
      "",
      "TOTAL: USD 38,400.00",
      "",
      "CIF Hamburg - Incoterms 2020",
      "T/T 30% in advance, 70% before shipment",
      "Busan, Korea -> Hamburg, Germany",
      "HMM AMBITION / 026W",
      "ETD: 2026-09-20 / ETA: 2026-10-15",
    ],
    20,
    58
  )
  if (bundle)
    for (const attachment of previewPackage.attachments ?? []) {
      pdf.addPage()
      pdf.text(
        [
          "DESIGN SAMPLE - NOT FOR COMMERCIAL USE",
          "",
          attachment.filename,
          "",
          "Sample attachment for the shared document package.",
          "No commercial certificate is issued by this preview.",
        ],
        20,
        30
      )
    }
  pdf.save(
    bundle ? "CI-2026-0916-package-sample.pdf" : "CI-2026-0916-sample.pdf"
  )
}

function DocumentPackage({
  pkg,
  token,
  preview,
}: {
  pkg: PublicPackage
  token: string
  preview: boolean
}) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState("")
  const attachments = pkg.attachments ?? []
  const title = pkg.label || pkg.doc_type || "공유 문서"
  const number = pkg.doc_number || title
  const endpoint = `/api/platform/public/documents/${encodeURIComponent(token)}`
  const download = async (bundle: boolean) => {
    setDownloading(true)
    setDownloadError("")
    try {
      if (preview) await downloadSample(bundle)
      else window.location.assign(endpoint + (bundle ? "/bundle" : ""))
    } catch {
      setDownloadError("다운로드를 시작하지 못했습니다. 다시 시도해 주세요.")
    } finally {
      setDownloading(false)
    }
  }
  return (
    <>
      <section className="border-b bg-card px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-3.5" aria-hidden />
              </span>
              문서가 도착했습니다
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm break-all text-muted-foreground">
              {number} <span className="mx-1.5 text-border">/</span> 본문 PDF
              {attachments.length
                ? ` 및 동봉 파일 ${attachments.length}개`
                : ""}
            </p>
          </div>
          <div className="shrink-0">
            <Button
              className="h-11 w-full px-5 sm:w-auto"
              disabled={downloading}
              onClick={() => void download(true)}
            >
              <Download className="size-4" />
              {downloading
                ? "다운로드 준비 중"
                : `패키지 다운로드 (${attachments.length + 1}개)`}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {preview
                ? "샘플 PDF 패키지가 저장됩니다"
                : "본문과 동봉 파일을 함께 저장합니다"}
            </p>
            {downloadError && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {downloadError}
              </p>
            )}
          </div>
        </div>
      </section>
      <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr] xl:px-0">
        <section
          aria-label="문서 미리보기"
          className="order-2 min-w-0 overflow-hidden rounded-xl border bg-muted/60 lg:order-1 lg:row-span-2"
        >
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-muted-foreground" aria-hidden />
              문서 미리보기
            </h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={downloading}
              onClick={() => void download(false)}
            >
              <Download className="size-4" />
              본문 PDF
            </Button>
          </div>
          <div className="p-3 sm:p-6">
            {preview ? (
              <SampleInvoice />
            ) : (
              <iframe
                title="전달된 문서"
                src={endpoint}
                referrerPolicy="no-referrer"
                className="h-[750px] w-full bg-white"
              />
            )}
          </div>
          <p className="px-4 pb-4 text-center text-xs leading-5 text-muted-foreground">
            미리보기가 보이지 않으면 본문 PDF를 내려받아 확인하세요.
          </p>
        </section>
        <section
          aria-label="패키지 구성"
          className="order-1 overflow-hidden rounded-xl border bg-card lg:order-2"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-sm font-semibold">패키지 구성</h2>
            <span className="text-xs text-muted-foreground">
              총 {attachments.length + 1}개
            </span>
          </div>
          <ul className="divide-y px-5">
            <li className="flex items-start gap-3 py-4">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileText className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium break-all">{number}.pdf</p>
                <p className="mt-1 text-xs text-primary">본문 문서</p>
              </div>
            </li>
            {attachments.map((file, index) => (
              <li
                key={`${file.filename}-${index}`}
                className="flex items-start gap-3 py-4"
              >
                <span className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <FileText className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium break-all">
                    {file.filename}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {file.label || "동봉 파일"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 border-t bg-muted/40 px-5 py-3 text-xs leading-5 text-muted-foreground">
            <Package className="mt-0.5 size-4 shrink-0" aria-hidden />
            {attachments.length
              ? "동봉 파일은 패키지 다운로드에 포함됩니다."
              : "이 패키지에는 추가 동봉 파일이 없습니다."}
          </p>
        </section>
        <div className="order-3 min-w-0 space-y-5">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">상업 조건</h2>
            <dl className="space-y-3">
              <Field label="금액">
                {[pkg.currency, pkg.amount].filter(Boolean).join(" ")}
              </Field>
              <Field label="인코텀즈">{pkg.incoterms}</Field>
              <Field label="결제 조건">{pkg.payment_terms}</Field>
            </dl>
          </section>
          <details open className="rounded-xl border bg-card p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <span className="flex items-center gap-2">
                <Ship className="size-4 text-muted-foreground" aria-hidden />
                선적 정보
              </span>
              <ChevronDown
                className="size-4 text-muted-foreground"
                aria-hidden
              />
            </summary>
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-3 py-3 text-xs font-medium">
                <span>{pkg.pol || "출발항 미공유"}</span>
                <ArrowRight
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
                <span>{pkg.pod || "도착항 미공유"}</span>
              </div>
              <dl className="mt-4 space-y-3">
                <Field label="출발 예정">
                  {pkg.etd ? dateLabel(pkg.etd) : undefined}
                </Field>
                <Field label="도착 예정">
                  {pkg.eta ? dateLabel(pkg.eta) : undefined}
                </Field>
                <Field label="선박·항차">{pkg.vessel}</Field>
                {pkg.shipment_timing && (
                  <Field label="선적 일정">{pkg.shipment_timing}</Field>
                )}
              </dl>
            </div>
          </details>
          <section className="px-1 text-xs leading-5 text-muted-foreground">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <LockKeyhole className="size-4" aria-hidden />
              링크 이용 안내
            </h2>
            <p className="flex items-center gap-2">
              <CalendarDays className="size-3.5" aria-hidden />
              {pkg.expires_at
                ? `${dateLabel(pkg.expires_at)} 만료 (한국 시간)`
                : "만료일 미공유"}
            </p>
            <p className="mt-1 flex items-center gap-2">
              <Clock3 className="size-3.5" aria-hidden />
              {pkg.max_opens !== undefined
                ? `${pkg.open_count ?? 0} / ${pkg.max_opens}회 열람`
                : "열람 횟수 제한 없음"}
            </p>
            <p className="mt-3 border-t pt-3">
              발신자가 공유한 문서입니다. 내용을 확인하고 링크와 문서를 안전하게
              보관해 주세요.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}

function Unavailable({
  result,
  retry,
}: {
  result: ShareResult
  retry: () => void
}) {
  const [remaining, setRemaining] = useState(result.retryAfter ?? 0)
  useEffect(() => {
    if (!remaining) return
    const timer = window.setTimeout(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000
    )
    return () => window.clearTimeout(timer)
  }, [remaining])
  const loading = result.state === "loading"
  const state =
    result.state === "active" || result.state === "loading"
      ? "error"
      : result.state
  const Icon = loading
    ? LoaderCircle
    : state === "expired"
      ? Clock3
      : state === "error"
        ? RefreshCw
        : FileX2
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-24">
      <section
        className="w-full max-w-lg text-center"
        aria-live="polite"
        aria-busy={loading}
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-card text-primary">
          <Icon
            className={`size-7 ${loading ? "motion-safe:animate-spin" : ""}`}
            aria-hidden
          />
        </span>
        <h1 className="mt-6 text-2xl leading-9 font-semibold tracking-tight">
          {loading
            ? "문서 링크를 확인하고 있습니다"
            : unavailableCopy[state][0]}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          {loading
            ? "잠시만 기다려 주세요. 열람 가능한 문서를 확인하고 있습니다."
            : unavailableCopy[state][1]}
        </p>
        {state === "error" && !loading && (
          <Button className="mt-6" disabled={remaining > 0} onClick={retry}>
            <RefreshCw className="size-4" />
            {remaining ? `${remaining}초 후 다시 시도` : "다시 시도"}
          </Button>
        )}
        {!loading && state !== "error" && (
          <p className="mt-8 border-t pt-5 text-xs text-muted-foreground">
            문서 문의는 링크를 보내주신 발신자에게 연락해 주세요.
          </p>
        )}
      </section>
    </main>
  )
}

export function PublicSharePage({
  token,
  search,
}: {
  token: string
  search: string
}) {
  const preview = token === "preview"
  const requested = new URLSearchParams(search).get("state")
  const initialState = states.some(([state]) => state === requested)
    ? (requested as ShareState)
    : "active"
  const [previewState, setPreviewState] = useState<ShareState>(initialState)
  const [result, setResult] = useState<ShareResult>({ state: "loading" })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const previousTitle = document.title
    document.title = "공유 문서 | ECOYA Trade OS"
    return () => {
      document.title = previousTitle
    }
  }, [])
  useEffect(() => {
    if (preview || !token) return
    const controller = new AbortController()
    fetch(
      `/api/platform/public/documents/${encodeURIComponent(token)}/package`,
      {
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      }
    )
      .then(readShareResponse)
      .then((next) => {
        if (!controller.signal.aborted) setResult(next)
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ state: "error" })
      })
    return () => controller.abort()
  }, [token, preview, attempt])
  const current: ShareResult = preview
    ? { state: previewState, package: previewPackage }
    : !token
      ? { state: "not_found" }
      : result
  return (
    <div
      className="flex min-h-svh flex-col bg-muted/40"
      data-share-state={current.state}
    >
      {preview && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b bg-primary/5 px-5 py-2 text-xs">
          <span className="text-muted-foreground">
            디자인 미리보기 · 샘플 문서
          </span>
          <label className="flex items-center gap-2">
            화면 상태
            <select
              aria-label="공유 화면 상태"
              className="rounded-md border bg-card px-2 py-1 focus-visible:outline-2 focus-visible:outline-ring"
              value={previewState}
              onChange={(event) => {
                const next = event.target.value as ShareState
                setPreviewState(next)
                const url = new URL(window.location.href)
                url.searchParams.set("state", next)
                window.history.replaceState({}, "", url)
              }}
            >
              {states.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <Header />
      {current.state === "active" && current.package ? (
        <DocumentPackage
          pkg={current.package}
          token={token}
          preview={preview}
        />
      ) : (
        <Unavailable
          key={`${current.state}-${attempt}`}
          result={current}
          retry={() => {
            if (preview) setPreviewState("active")
            else {
              setResult({ state: "loading" })
              setAttempt((value) => value + 1)
            }
          }}
        />
      )}
      <Footer />
    </div>
  )
}

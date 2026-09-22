import { useEffect, useRef, useState } from "react"
import {
  Check,
  FileText,
  Sparkles,
  CircleCheck,
  Link,
  ArrowRight,
  Pause,
  Play,
  Upload,
} from "lucide-react"

import { useReducedMotion } from "@shared/lib/use-reduced-motion"
import { TradeLottie } from "@landing/components/trade-lottie"
import ocrAnimation from "@ecoya/design-system/assets/lottie/ocr-document.json?url"

import { tradeFunctions } from "@landing/lib/trade-landing-content"

function Invoice() {
  return (
    <div className="trade-invoice">
      <div className="trade-invoice-head">
        <span>ECOYA EXPORTS</span>
        <span>초안 · 검토 전</span>
      </div>
      <h3>Commercial Invoice</h3>
      <div className="trade-invoice-meta">
        <span>No. INV-2026-0917</span>
        <span>17 Sep 2026</span>
      </div>
      <div className="trade-invoice-parties">
        <div>
          <span>Seller</span>
          <strong>ECOYA Demo Co.</strong>
          <p>Seoul, Republic of Korea</p>
        </div>
        <div>
          <span>Buyer</span>
          <strong>ACME GmbH</strong>
          <p>Rotterdam, Netherlands</p>
        </div>
      </div>
      <div className="trade-invoice-table">
        <div>
          <span>Description</span>
          <span>Quantity</span>
          <span>Amount</span>
        </div>
        <div>
          <strong>Stainless Steel Coil 304</strong>
          <span>30 MT</span>
          <span>$50,820.00</span>
        </div>
      </div>
      <dl className="trade-invoice-bottom">
        <div>
          <dt>Incoterms</dt>
          <dd>CIF Rotterdam</dd>
        </div>
        <div>
          <dt>Total USD</dt>
          <dd>50,820.00</dd>
        </div>
      </dl>
      <div className="trade-demo-review">
        <ShieldHint />
        <span>AI가 14개 필드를 채웠습니다. 발송 전 확인하세요.</span>
      </div>
    </div>
  )
}
function ShieldHint() {
  return <CircleCheck size={15} aria-hidden />
}
function Extracted({ animated = false }: { animated?: boolean }) {
  return (
    <div className="trade-extracted">
      <div className="trade-upload-file">
        {animated ? (
          <TradeLottie
            src={ocrAnimation}
            className="trade-ocr-animation"
            label="문서의 필드를 읽는 애니메이션"
          />
        ) : (
          <FileText size={32} />
        )}
        <div>
          <strong>Commercial Invoice.pdf</strong>
          <span>문서 읽기 완료 · 2 pages</span>
        </div>
        <CircleCheck size={20} />
      </div>
      <div className="trade-extract-title">
        <h3>AI가 읽은 내용</h3>
        <span>검토 전</span>
      </div>
      <dl>
        {[
          ["거래처", "ACME GmbH", "높음"],
          ["품목", "Stainless Steel Coil 304", "높음"],
          ["수량", "30 MT", "높음"],
          ["총액", "USD 50,820.00", "확인 필요"],
        ].map(([label, value, confidence]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
            <span
              className={
                confidence === "확인 필요"
                  ? "trade-confidence-warning"
                  : "trade-confidence"
              }
            >
              {confidence}
            </span>
          </div>
        ))}
      </dl>
      <p className="trade-demo-warning">
        수량·통화·금액을 원문과 확인한 뒤 확정하세요.
      </p>
      <div className="trade-demo-action">
        <Check size={16} /> 검토 후 거래에 연결
      </div>
    </div>
  )
}
function Answer() {
  return (
    <div className="trade-answer">
      <div className="trade-chat-question">
        이번 분기 ACME 받을 돈은 얼마야?
      </div>
      <div className="trade-chat-answer">
        <Sparkles size={20} />
        <div>
          <strong>ACME GmbH의 받을 돈</strong>
          <span className="trade-answer-amount">USD 50,820.00</span>
          <p>
            예시 거래 1건의 송장 금액입니다.
            <br />
            연결된 문서에서 근거를 확인할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="trade-answer-source">
        <FileText size={18} />
        <div>
          <strong>Commercial Invoice · INV-2026-0917</strong>
          <span>거래 DL-260917-01 · 수출 거래</span>
        </div>
        <ArrowRight size={16} />
      </div>
      <p className="trade-demo-warning">
        질문 → 답변 → 근거 문서까지 한 흐름으로.
      </p>
    </div>
  )
}
function Settlement() {
  return (
    <div className="trade-settlement">
      <div className="trade-money-cards">
        <div>
          <span>받을 돈 · USD</span>
          <strong>50,820.00</strong>
          <small>ACME GmbH · 1건</small>
        </div>
        <div>
          <span>줄 돈 · USD</span>
          <strong>38,400.00</strong>
          <small>공급처 · 1건</small>
        </div>
      </div>
      <h3>이번 주 자금 일정</h3>
      <div className="trade-money-row">
        <span className="trade-money-date">09.21</span>
        <div>
          <strong>ACME GmbH</strong>
          <span>수금 예정 · DL-260917-01</span>
        </div>
        <strong className="trade-money-in">+$50,820</strong>
      </div>
      <div className="trade-money-row">
        <span className="trade-money-date">09.23</span>
        <div>
          <strong>공급처 지급</strong>
          <span>지급 예정 · 같은 거래</span>
        </div>
        <strong>−$38,400</strong>
      </div>
      <p className="trade-demo-warning">
        통화별 AR/AP와 수금·지급 일정을 거래에 연결합니다.
      </p>
    </div>
  )
}
function Delivery() {
  return (
    <div className="trade-delivery">
      <div className="trade-delivery-title">
        <span>
          <Link size={22} />
        </span>
        <div>
          <h3>ACME 거래 서류</h3>
          <p>Magic Link</p>
        </div>
        <span className="trade-confidence">활성</span>
      </div>
      {["Commercial Invoice.pdf", "Sales Contract.pdf"].map((file) => (
        <div key={file} className="trade-delivery-file">
          <FileText size={22} />
          <strong>{file}</strong>
          <span>확정됨</span>
        </div>
      ))}
      <div className="trade-link-preview">
        <Link size={14} />
        <span>ecoya.kr/share/ACME-0917</span>
        <Check size={14} />
      </div>
      <h4>전달·열람 기록</h4>
      <div className="trade-delivery-log">
        <i />
        <div>
          <strong>고객이 서류를 열람했습니다</strong>
          <span>ACME GmbH · 오늘 10:42</span>
        </div>
      </div>
      <div className="trade-delivery-log">
        <i />
        <div>
          <strong>송장·계약서를 링크로 전달</strong>
          <span>오늘 10:30</span>
        </div>
      </div>
    </div>
  )
}

export function TradeFeaturePreview({ index }: { index: number }) {
  if (index === 0) return <Invoice />
  if (index === 1) return <Extracted animated />
  if (index === 2) return <Answer />
  if (index === 3) return <Settlement />
  return <Delivery />
}

export function TradeProductDemo() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [progress, setProgress] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const reduced = useReducedMotion()
  const running = !paused && !reduced && visible && pageVisible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    )
    if (root.current) observer.observe(root.current)
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener("visibilitychange", update)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  useEffect(() => {
    if (!running) return
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      elapsed.current += Math.min(now - previous, 250)
      previous = now
      if (elapsed.current >= 7000) {
        elapsed.current = 0
        setActive((current) => (current + 1) % tradeFunctions.length)
      }
      setProgress(elapsed.current / 7000)
    }, 100)
    return () => window.clearInterval(timer)
  }, [running])
  const select = (index: number) => {
    elapsed.current = 0
    setProgress(0)
    setActive(index)
  }
  const leads = [
    "AI에게 한 줄",
    "PDF 업로드",
    "사내 거래 데이터로 질문",
    "거래 방향에 따라",
    "확정 문서를 Magic Link로",
  ]
  return (
    <div
      className="trade-product-demo"
      ref={root}
      data-running={running}
      data-reduced-motion={reduced}
    >
      <div className="trade-demo-playback">
        {!reduced && (
          <button
            type="button"
            className="trade-feature-play"
            onClick={() => setPaused(!paused)}
            aria-label={
              paused ? "기능 자동 전환 재생" : "기능 자동 전환 일시정지"
            }
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "재생" : "일시정지"}
          </button>
        )}
      </div>
      <div className="trade-demo-panels" aria-live={running ? "off" : "polite"}>
        {tradeFunctions.map((item, index) => (
          <div
            key={item.title}
            className="trade-demo-panel"
            id={`trade-feature-panel-${index}`}
            aria-hidden={active !== index}
            inert={active !== index}
            data-active={active === index}
          >
            <p className="trade-demo-caption">
              <strong>{leads[index]}</strong>
              {item.description
                .slice(leads[index].length)
                .replace(/^[\s—→·.]+/, "")}
            </p>
            <div className="trade-real-preview">
              {index === 0 && (
                <>
                  <div className="trade-prompt">
                    <Sparkles size={18} />
                    <p>
                      ACME에 스테인리스 코일 30MT · CIF 로테르담 — 상업송장
                      만들어줘
                    </p>
                  </div>
                  <Invoice />
                </>
              )}
              {index === 1 && <Extracted animated={active === 1 && running} />}
              {index === 2 && <Answer />}
              {index === 3 && <Settlement />}
              {index === 4 && <Delivery />}
            </div>
          </div>
        ))}
      </div>
      <div className="trade-feature-controls">
        <div
          className="trade-example-tabs"
          role="group"
          aria-label="업무별 안내"
        >
          {tradeFunctions.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-pressed={active === index}
              aria-controls={`trade-feature-panel-${index}`}
              onClick={() => select(index)}
            >
              <span className="trade-feature-progress" aria-hidden="true">
                <i
                  style={{
                    transform: `scaleX(${active === index ? progress : index < active ? 1 : 0})`,
                  }}
                />
              </span>
              <item.icon size={18} aria-hidden />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TradeWorkflowScene({ stage }: { stage: number }) {
  if (stage === 0)
    return (
      <div className="trade-workflow-upload">
        <div className="trade-upload-file">
          <FileText size={30} />
          <div>
            <strong>Commercial Invoice.pdf</strong>
            <span>PDF · 2 pages</span>
          </div>
          <ArrowRight size={20} />
        </div>
        <Invoice />
      </div>
    )
  if (stage === 1) return <Extracted />
  if (stage === 2)
    return (
      <div className="trade-workflow-review">
        <div className="trade-review-heading">
          <CircleCheck size={22} />
          <h3>원문과 추출 값을 확인하세요</h3>
        </div>
        <dl className="trade-review-fields">
          {[
            ["거래처", "ACME GmbH"],
            ["품목", "Stainless Steel Coil 304"],
            ["수량", "30 MT"],
            ["통화 · 금액", "USD 50,820.00"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
              <Check size={18} />
            </div>
          ))}
        </dl>
        <p className="trade-demo-warning">
          수량·통화·금액을 검토한 뒤 확정하세요.
        </p>
        <div className="trade-demo-action">
          <Check size={16} /> 검토 후 확정
        </div>
      </div>
    )
  return (
    <div className="trade-workflow-result">
      <Settlement />
      <div className="trade-workflow-link">
        <Link size={18} />
        <div>
          <strong>Magic Link로 거래 서류 전달</strong>
          <span>송장·계약서 · 전달·열람 기록</span>
        </div>
        <ArrowRight size={18} />
      </div>
    </div>
  )
}

export function TradeTrustVisual({ index }: { index: number }) {
  if (index === 0)
    return (
      <figure
        className="trade-trust-visual"
        aria-label="원문 수량 30 MT와 AI 추출값 30 MT를 나란히 비교하는 예시"
      >
        <div className="trade-trust-minihead">
          <FileText size={16} />
          <span>Commercial Invoice</span>
          <small>예시</small>
        </div>
        <div className="trade-trust-compare">
          <div className="trade-trust-paper">
            <span>원문</span>
            <i />
            <i />
            <div>
              Quantity <strong>30 MT</strong>
            </div>
            <i />
          </div>
          <ArrowRight size={18} aria-hidden />
          <div className="trade-trust-field">
            <span>AI 추출값</span>
            <small>수량</small>
            <strong>30 MT</strong>
            <em>
              <CircleCheck size={14} />
              신뢰도 높음
            </em>
          </div>
        </div>
        <figcaption>
          <Check size={14} />
          원문과 추출값을 함께 확인
        </figcaption>
      </figure>
    )
  if (index === 1)
    return (
      <figure
        className="trade-trust-visual"
        aria-label="계약서 수량 30 MT와 송장 수량 33 MT의 불일치를 강조하는 예시"
      >
        <div className="trade-trust-minihead">
          <CircleCheck size={16} />
          <span>발송 전 문서 비교</span>
          <small>예시</small>
        </div>
        <div className="trade-trust-difference">
          <span>비교 항목</span>
          <span>계약서</span>
          <span>송장</span>
          <span>통화</span>
          <strong>USD</strong>
          <strong>USD</strong>
          <span className="trade-trust-highlight">수량</span>
          <strong className="trade-trust-highlight">30 MT</strong>
          <strong className="trade-trust-highlight">33 MT</strong>
        </div>
        <figcaption className="trade-trust-review-hint">
          <span aria-hidden>!</span>수량이 다릅니다. 발송 전 확인하세요.
        </figcaption>
      </figure>
    )
  return (
    <figure
      className="trade-trust-visual"
      aria-label="하나의 거래에 계약, 선적, 문서, 정산 이력이 순서대로 연결되는 예시"
    >
      <div className="trade-trust-minihead">
        <FileText size={16} />
        <span>ACME · 거래 기록</span>
        <small>예시</small>
      </div>
      <ol className="trade-trust-history">
        {[
          ["계약", "계약서 확정", "09.17"],
          ["선적", "선하증권 연결", "09.18"],
          ["문서", "송장 발송", "09.19"],
          ["정산", "수금 기록", "09.21"],
        ].map(([label, detail, date]) => (
          <li key={label}>
            <span className="trade-trust-history-dot">
              <Check size={11} />
            </span>
            <strong>{label}</strong>
            <span>{detail}</span>
            <time>{date}</time>
          </li>
        ))}
      </ol>
    </figure>
  )
}

export function TradeUploadPreview() {
  return (
    <div
      className="trade-upload-illustration"
      role="img"
      aria-label="PDF를 올리면 AI가 거래처, 품목, 수량과 금액을 읽고 검토를 기다리는 예시"
    >
      <div className="trade-upload-example-source">
        <div className="trade-upload-example-drop">
          <span className="trade-upload-example-icon">
            <Upload size={32} />
          </span>
          <strong>PDF 파일 올리기</strong>
          <span>송장 · 계약서 · 선적 서류</span>
          <div className="trade-upload-example-file">
            <FileText size={24} />
            <div>
              <strong>Commercial Invoice.pdf</strong>
              <span>PDF · 2 pages</span>
            </div>
            <CircleCheck size={20} />
          </div>
        </div>
        <span className="trade-upload-example-caption">
          받은 서류를 그대로 올리세요
        </span>
      </div>
      <ArrowRight
        className="trade-upload-example-arrow"
        size={24}
        aria-hidden
      />
      <div className="trade-upload-example-result">
        <div className="trade-upload-example-heading">
          <span>
            <Sparkles size={20} />
            AI가 읽은 내용
          </span>
          <small>검토 대기</small>
        </div>
        <dl>
          {[
            ["거래처", "ACME GmbH"],
            ["품목", "Stainless Steel Coil 304"],
            ["수량", "30 MT"],
            ["총액", "USD 50,820.00"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
              <Check size={16} />
            </div>
          ))}
        </dl>
        <span className="trade-upload-example-note">
          <CircleCheck size={16} />
          원문과 비교하고, 확인한 값만 확정하세요.
        </span>
      </div>
    </div>
  )
}

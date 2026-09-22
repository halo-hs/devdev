import { useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  Pause,
  Play,
  ShieldCheck,
  FileText,
  FileUp,
  MessageSquare,
  FolderOpen,
  ChartNoAxesCombined,
  Globe,
} from "lucide-react"
import {
  TradeProductDemo,
  TradeWorkflowScene,
  TradeFeaturePreview,
  TradeTrustVisual,
  TradeUploadPreview,
} from "./demo"
import { TradeLottie } from "@landing/shared/trade-lottie"
import { InspoFeatureOverview } from "@landing/shared/feature-overview"
import {
  TradeDealPreview,
  TradeClosingPreview,
  TradeMarketPreview,
  TradeQuestionPreview,
} from "./sections"
import { LandingShell, StartButton } from "../shared/layout"

function WorkflowGuide() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      if (media.matches) setPlaying(false)
    }
    media.addEventListener("change", update)
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 }
    )
    if (root.current) observer.observe(root.current)
    return () => {
      media.removeEventListener("change", update)
      observer.disconnect()
    }
  }, [])
  useEffect(() => {
    if (!playing || !visible) return
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      if (!document.hidden) elapsed.current += Math.min(now - previous, 250)
      previous = now
      if (elapsed.current >= 6000) {
        elapsed.current = 0
        setActive((current) => (current + 1) % workflow.length)
      }
      setProgress(elapsed.current / 6000)
    }, 100)
    return () => window.clearInterval(timer)
  }, [playing, visible])
  const select = (index: number) => {
    setActive(index)
    setPlaying(false)
    elapsed.current = 0
    setProgress(0)
  }
  return (
    <div
      className="trade-timeline"
      ref={root}
      data-inspo-reference="glideapps-com/product"
    >
      <div className="trade-timeline-copy">
        <ol className="trade-timeline-steps" aria-label="서류 처리 단계">
          {workflow.map(([title, detail], index) => (
            <li key={title}>
              <button
                type="button"
                aria-pressed={active === index}
                aria-controls="trade-workflow-scene"
                onClick={() => select(index)}
              >
                <span className="trade-timeline-rule" aria-hidden="true">
                  <i
                    style={{
                      width: active === index ? `${progress * 100}%` : "0%",
                    }}
                  />
                </span>
                <span className="trade-timeline-title">
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                </span>
                <span className="trade-timeline-detail">{detail}</span>
              </button>
            </li>
          ))}
        </ol>
        <button
          className="trade-timeline-play"
          type="button"
          aria-label={
            playing ? "안내 애니메이션 일시정지" : "안내 애니메이션 재생"
          }
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? "일시정지" : "재생"}
        </button>
      </div>
      <div
        id="trade-workflow-scene"
        data-stage={active}
        className="trade-timeline-scene"
        aria-live={playing ? "off" : "polite"}
      >
        <div key={active} className="trade-scene-enter">
          {active === 2 ? (
            <TradeDealPreview />
          ) : active === 4 ? (
            <TradeClosingPreview />
          ) : (
            <TradeWorkflowScene stage={active === 1 ? 2 : active} />
          )}
        </div>
      </div>
    </div>
  )
}

const workflow = [
  ["서류 올리기", "PDF를 올리면 AI가 읽습니다."],
  ["확인", "AI가 읽은 값을 확인합니다."],
  ["거래건", "확인된 문서가 거래건으로 모입니다."],
  ["정산", "받을 돈·보낼 돈을 한눈에 확인합니다."],
  ["결산·인계", "월마감으로 숫자를 동결, 세무사·더존에 인계합니다."],
]
const roles = [
  [
    "실무자",
    "매일 서류를 올리고 확인하는 사람",
    "서류를 옮겨 적는 데 하루를 다 쓰나요?",
    "인보이스·PL·계약서를 하나씩 열어 엑셀로 옮기고 대조하느라, 정작 거래는 뒷전이 됩니다",
  ],
  [
    "관리자",
    "팀 처리 현황과 병목을 챙기는 사람",
    "팀이 어디까지 했는지 매번 물어보나요?",
    "누가 어디까지 처리했는지, 막힌 서류가 무엇인지 한눈에 안 보여 매번 취합하고 확인합니다",
  ],
  [
    "대표",
    "자금과 성과로 판단하는 사람",
    "이번 달 숫자, 마감돼야 보이나요?",
    "매출·미수·자금·성과가 실시간으로 정리되지 않아, 결산이 끝나야 상황이 보입니다",
  ],
]
const sourceFeatures = [
  {
    title: "AI 서류 읽기",
    description:
      "인보이스·PL·계약서에서 거래처·금액·수량·만기를 자동 추출, 확인한 값만 기록에 오릅니다",
    icon: FileUp,
    preview: 1,
  },
  {
    title: "한 줄이면 문서 작성",
    description:
      "견적서·PI·CI·PO를 자연어 한 줄로 초안 생성하고 발송 전 보완합니다",
    icon: FileText,
    preview: 0,
  },
  {
    title: "AI에게 묻기",
    description:
      "“이번 달 ACME 매출은?”처럼 사내 원장과 시장을 자연어로 물으면 조회해 답합니다",
    icon: MessageSquare,
    preview: 2,
  },
  {
    title: "정산 · 수금·지급",
    description:
      "받을 돈·보낼 돈·자금 일정·거래처 신뢰등급을 한 화면에서 관리합니다",
    icon: FolderOpen,
    preview: 3,
  },
  {
    title: "결산 · 영업 성과",
    description:
      "월별 GP·미수·연체율을 추적하고, 확정된 달은 마감해 공식 숫자로 동결합니다",
    icon: ChartNoAxesCombined,
    preview: 4,
  },
  {
    title: "실시간 시장 지표",
    description:
      "USD/KRW·CNY·EUR 환율과 물류 벤치마크를 최신 관측값으로 함께 참조합니다",
    icon: Globe,
    preview: 5,
  },
]
export function TradeLanding() {
  useEffect(() => {
    document.title = "ECOYA Trade OS — 무역 업무 운영 시스템"
  }, [])
  return (
    <LandingShell page="trade">
      <main>
        <section
          className="trade-hero trade-reference-hero"
          aria-labelledby="trade-title"
        >
          <div className="trade-reference-grid">
            <div className="trade-hero-copy">
              <p className="trade-section-label trade-hero-label">
                무역 서류·운영 자동화
              </p>
              <h1 id="trade-title">
                <span>서류는 AI가 읽고 만들고,</span>
                <span>확인만 당신이</span>
              </h1>
              <p className="trade-hero-description">
                서류 한 장이 거래에서 정산·결산까지 끊김 없이 흐릅니다.
              </p>
              <div className="trade-hero-actions">
                <StartButton label="ECOYA Trade OS 시작하기" />
                <a href="#flow">
                  작동 방식 보기 <ChevronDown size={18} />
                </a>
              </div>
              <p className="trade-hero-note">
                <ShieldCheck size={18} />
                AI가 제안합니다 · 사람이 확정합니다 · 시스템이 기록합니다
              </p>
            </div>
            <div className="trade-hero-demo">
              <TradeProductDemo />
            </div>
          </div>
        </section>
        <section id="why" className="trade-trust-section">
          <div className="trade-container trade-section">
            <div className="trade-section-heading">
              <h2>
                당신은 어떤 하루를
                <br />
                보내고 있나요?
              </h2>
              <p>막히는 곳은 저마다 다르지만, 푸는 방식은 하나의 흐름입니다</p>
            </div>
            <div className="trade-trust-grid">
              {roles.map(([role, audience, title, detail], index) => (
                <article key={role}>
                  <p className="trade-section-label">{role}</p>
                  <p>{audience}</p>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                  <TradeTrustVisual index={index} />
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="flow" className="trade-section trade-container">
          <span id="how" aria-hidden="true" />
          <div className="trade-section-heading">
            <div>
              <p className="trade-section-label">작동 방식</p>
              <h2>
                PDF 하나에서 결산까지,
                <br />한 흐름
              </h2>
            </div>
            <p>
              올리면 AI가 읽고, 확인 한 번으로 거래·정산·회계 인계까지 그대로
              이어집니다
            </p>
          </div>
          <div className="trade-receive-send-guidance">
            <div>
              <span>받을 때</span>
              <p>
                PDF만 올리면 AI가 읽고 필드를 채웁니다. 확인하면 거래·정산까지
                이어집니다.
              </p>
            </div>
            <div>
              <span>보낼 때</span>
              <p>
                AI에게 말하면 송장·계약서가 만들어지고, 같은 데이터로
                정산됩니다. 고객은 링크 하나로 받습니다.
              </p>
            </div>
          </div>
          <div className="trade-workflow-animation">
            <WorkflowGuide />
          </div>
        </section>
        <hr className="trade-section-divider" />
        <section id="features" className="trade-feature-section">
          <div className="trade-container trade-section">
            <div className="trade-section-heading">
              <div>
                <p className="trade-section-label">주요 기능</p>
                <h2>
                  흩어져 있던 무역 업무,
                  <br />
                  이제 한 곳에서
                </h2>
              </div>
              <p>기능마다 다른 프로그램을 열 필요가 없습니다</p>
            </div>
            <InspoFeatureOverview>
              {sourceFeatures.map((item) => (
                <article key={item.title} className="trade-overview-feature">
                  <item.icon className="trade-feature-symbol" size={28} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="trade-feature-visual">
                    {item.preview === 4 ? (
                      <TradeClosingPreview />
                    ) : item.preview === 5 ? (
                      <TradeMarketPreview />
                    ) : (
                      <TradeFeaturePreview index={item.preview} />
                    )}
                  </div>
                </article>
              ))}
            </InspoFeatureOverview>
            <section
              className="trade-upload-showcase"
              aria-labelledby="trade-upload-title"
            >
              <div className="trade-upload-intro">
                <div>
                  <h3 id="trade-upload-title">오늘 첫 서류를 올려보세요</h3>
                  <p>파일을 올리고, AI가 읽은 내용을 확인하세요.</p>
                </div>
                <StartButton label="파일 올리기 시작하기" />
              </div>
              <TradeUploadPreview />
              <figure className="trade-upload-motion trade-upload-flow">
                <figcaption>
                  <h3>추출한 내용을 확인한 뒤 거래에 반영합니다.</h3>
                </figcaption>
                <div className="trade-upload-flow-visual">
                  <ol
                    className="trade-upload-flow-labels"
                    aria-label="파일 업로드 처리 흐름"
                  >
                    <li>파일 업로드</li>
                    <li>AI 읽기</li>
                    <li>검토·거래 연결</li>
                  </ol>
                  <TradeLottie
                    src="/lottie/trade-workflow.json"
                    controls
                    className="trade-upload-lottie"
                    label="서류 업로드부터 AI 필드 추출, 거래 연결까지의 흐름"
                  />
                </div>
              </figure>
            </section>
          </div>
        </section>
        <section id="settle" className="trade-owner-section">
          <div className="trade-container trade-section">
            <div className="trade-section-heading">
              <div>
                <p className="trade-section-label">정산</p>
                <h2>
                  받을 돈과 보낼 돈이 오갈 때마다,
                  <br />
                  자금 현황이 정리됩니다
                </h2>
              </div>
              <p>한 번 확인한 숫자는, 다시 입력할 일이 없습니다</p>
            </div>
            <div className="trade-owner-layout">
              <div className="trade-owner-grid">
                {[
                  ["받을 돈 · 줄 돈", "통화별 AR/AP와 이번 주 수금·지급 일정"],
                  ["운영 감시", "처리량·리스크·미확인 플래그 한 화면"],
                  ["결정 필요", "지금 손대야 할 예외만 카드로"],
                ].map(([title, detail]) => (
                  <article key={title}>
                    <CircleCheckIcon />
                    <div>
                      <h3>{title}</h3>
                      <p>{detail}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="trade-owner-preview">
                <span>오늘의 업무</span>
                <h3>진행 중인 거래를 한눈에</h3>
                <div>
                  <strong>ACME GmbH</strong>
                  <span>선적 준비</span>
                </div>
                <p>DL-260917-01 · Stainless Steel Coil</p>
                <dl>
                  <div>
                    <dt>받을 돈</dt>
                    <dd>USD 50,820</dd>
                  </div>
                  <div>
                    <dt>확인할 서류</dt>
                    <dd>Commercial Invoice</dd>
                  </div>
                  <div>
                    <dt>다음 일정</dt>
                    <dd>09.21 수금 예정</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
        <section id="ask" className="trade-trust-section">
          <div className="trade-container trade-section">
            <div className="trade-section-heading">
              <h2>
                숫자를 찾지 말고,
                <br />
                물어보세요
              </h2>
              <p>
                거래 원장과 시장 지표를 자연어로 물으면 AI가 조회해 답합니다
              </p>
            </div>
            <TradeQuestionPreview />
          </div>
        </section>
        <section id="cta" className="trade-bottom-cta trade-logistics-cta">
          <img
            className="trade-logistics-photo"
            src="/images/trade-logistics.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width={2400}
            height={1600}
          />
          <div className="trade-container trade-logistics-content">
            <h2>지금, 첫 서류를 올려보세요</h2>
            <p>몇 분이면 충분합니다</p>
            <StartButton />
          </div>
        </section>
      </main>
    </LandingShell>
  )
}
function CircleCheckIcon() {
  return <ShieldCheck size={24} aria-hidden />
}

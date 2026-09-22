import { useEffect } from "react"
import { SnapIndustryLabels, SnapHeroPreview } from "./snap-landing-hero"
import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Link2,
  Pause,
  Play,
} from "lucide-react"
import { LandingShell, StartButton } from "./landing-shell"
import { snapUseCases, moreSnapUses, snapFaq } from "./snap-landing-content"
import { useSnapPreviewPlayback } from "@landing/lib/use-snap-preview-playback"
import { SnapScreen, type SnapScreenName } from "./snap-landing-screens"

const snapSteps = [
  {
    title: "말로 지시",
    detail: "필요한 작업을 한 문장으로 적습니다",
    heading: "말로 지시",
    Icon: FileText,
  },
  {
    title: "AI가 목록화",
    detail: "업무에 맞는 체크리스트와 찍을 사진을 자동으로 뽑습니다",
    heading: "AI가 목록화",
    Icon: ClipboardCheck,
  },
  {
    title: "현장에서 촬영",
    detail: "작업자는 목록대로 찍으며 작업을 마칩니다",
    heading: "현장에서 촬영",
    Icon: Camera,
  },
  {
    title: "확인 후 전달",
    detail: "사람이 확인하면 믿을 수 있는 리포트로 전달됩니다",
    heading: "확인 후 전달",
    Icon: FileCheck2,
  },
]
const stepScreens: SnapScreenName[] = [
  "create",
  "checklist",
  "capture",
  "review",
]
function SnapPreview({
  step = 1,
  eager = false,
}: {
  step?: number
  eager?: boolean
}) {
  return (
    <div className="ecoya-snap-preview ecoya-snap-preview-screen">
      <h3>{snapSteps[step].heading}</h3>
      <SnapScreen name={stepScreens[step]} eager={eager} />
      {step === 2 && (
        <a
          className="ecoya-snap-app-link"
          href="https://apps.apple.com/kr/app/id6758074089"
          target="_blank"
          rel="noopener noreferrer"
        >
          App Store에서 ECOYA SNAP 보기 <ArrowRight size={16} />
        </a>
      )}
    </div>
  )
}
export function SnapLanding() {
  const hero = useSnapPreviewPlayback()
  const { step, playing, progress, root, select, toggle } =
    useSnapPreviewPlayback()
  useEffect(() => {
    document.title = "ECOYA SNAP — 현장 작업을 믿을 수 있는 증거로"
  }, [])
  return (
    <LandingShell page="snap">
      <main>
        <section
          className="trade-hero trade-reference-hero"
          aria-labelledby="snap-title"
        >
          <div className="trade-reference-grid">
            <div className="trade-hero-copy">
              <p className="trade-section-label trade-hero-label">ECOYA SNAP</p>
              <h1 id="snap-title">
                <span>말로 지시하면,</span>
                <span>AI가 찍을 목록을</span>
                <span>만듭니다</span>
              </h1>
              <p className="trade-hero-description">
                현장은 목록대로 찍기만. 확인을 거쳐 믿을 수 있는 기록으로
                남습니다
              </p>
              <SnapIndustryLabels playing={hero.playing} />
              <div className="trade-hero-actions">
                <StartButton label="ECOYA SNAP 시작하기" product="snap" />
                <a href="/contact?product=snap">
                  도입 문의 <ArrowRight size={18} />
                </a>
                <a href="#snap-how">
                  작동 방식 보기 <ArrowRight size={18} />
                </a>
              </div>
            </div>
            <SnapHeroPreview playback={hero} />
          </div>
        </section>
        <section id="snap-how" className="trade-section trade-container">
          <div className="trade-section-heading">
            <div>
              <p className="trade-section-label">How it works</p>
              <h2>
                말 한마디가,
                <br />
                검증된 기록이 되기까지
              </h2>
            </div>
          </div>
          <div
            className="trade-timeline ecoya-snap-workflow"
            ref={root}
            data-running={playing}
          >
            <div className="trade-timeline-copy">
              <ol className="trade-timeline-steps" aria-label="SNAP 작업 단계">
                {snapSteps.map((item, i) => (
                  <li key={item.title}>
                    <button
                      type="button"
                      aria-pressed={step === i}
                      aria-controls="snap-workflow-preview"
                      onClick={() => select(i)}
                    >
                      <span className="trade-timeline-rule" aria-hidden="true">
                        <i
                          style={{
                            width: step === i ? `${progress * 100}%` : "0%",
                          }}
                        />
                      </span>
                      <span className="trade-timeline-title">
                        <span>0{i + 1}</span>
                        <h3>{item.title}</h3>
                      </span>
                      <span className="trade-timeline-detail">
                        {item.detail}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="trade-timeline-play"
                onClick={toggle}
                aria-label={
                  playing ? "SNAP 작업 안내 일시정지" : "SNAP 작업 안내 재생"
                }
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? "일시정지" : "재생"}
              </button>
            </div>
            <div
              id="snap-workflow-preview"
              className="trade-timeline-scene"
              aria-live={playing ? "off" : "polite"}
            >
              <div key={step} className="trade-scene-enter">
                <SnapPreview step={step} />
              </div>
            </div>
          </div>
        </section>
        <section id="snap-use-cases" className="ecoya-public-muted">
          <div className="trade-section trade-container">
            <div className="trade-section-heading">
              <div>
                <p className="trade-section-label">Any field, one way</p>
                <h2>
                  현장이 다를 뿐,
                  <br />
                  방식은 하나입니다
                </h2>
              </div>
              <p>
                작업을 하고 그걸 증거로 남겨야 하는 곳이면,
                <br />
                산업을 가리지 않습니다
              </p>
            </div>
            <div className="ecoya-use-cases">
              {snapUseCases.map(({ title, detail, icon: Icon }) => (
                <article key={title}>
                  <Icon className="ecoya-use-icon" size={30} />
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
            <div id="snap-more-uses" className="ecoya-more-uses">
              <div>
                {moreSnapUses.map((use) => (
                  <span key={use}>{use}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="snap-ai" className="ecoya-vision trade-section">
          <div className="trade-container">
            <p className="trade-section-label">AI × 사람</p>
            <h2>
              준비는 AI가,
              <br />
              결정은 사람이
            </h2>
            <p className="ecoya-snap-ai-copy">
              AI가 손 가는 준비를 끝내두면, 당신은 무엇을 남길지 판단하기만 하면
              됩니다
            </p>
            <div className="ecoya-principles ecoya-snap-principles">
              {[
                [
                  "AI · 준비",
                  "말을 목록으로 바꿉니다",
                  "자연어 지시를 '찍을 목록'으로 정리해, 준비에 드는 시간을 없앱니다",
                ],
                [
                  "사람 · 판단",
                  "남길 것을 정합니다",
                  "무엇을 확인하고 내보낼지, 결정하는 사람은 당신입니다",
                ],
                [
                  "시스템 · 기록",
                  "근거로 쌓습니다",
                  "확인한 것만 근거와 함께 남아, 언제든 되짚을 수 있습니다",
                ],
              ].map(([label, title, detail]) => (
                <article key={title}>
                  <span>{label}</span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="snap-reports" className="trade-section trade-container">
          <div className="trade-section-heading">
            <div>
              <p className="trade-section-label">Trusted evidence</p>
              <h2>
                확인한 것만,
                <br />
                믿을 수 있는 기록으로 전달됩니다
              </h2>
            </div>
          </div>
          <div className="ecoya-report-formats">
            <article>
              <div className="ecoya-report-copy">
                <Link2 size={30} />
                <span>고객이 받는 웹 리포트</span>
                <h3>다운로드 없이, 링크 하나로</h3>
                <p>
                  링크만 열면 항목별 증거 사진과 승인 상태가 한 화면에
                  펼쳐집니다. 앱 설치도, 회원가입도 필요 없어 받는 사람 누구나
                  바로 확인합니다
                </p>
                <ul>
                  <li>필요한 증거가 다 모였는지 한눈에</li>
                  <li>요청한 범위와 맞는지 함께 표시</li>
                  <li>받은 즉시 열어보고 바로 회신</li>
                </ul>
                <div className="ecoya-report-tags">
                  <small>이렇게 보냅니다</small>
                  <span>웹 링크</span>
                  <span>카카오 · SMS</span>
                  <span>이메일</span>
                </div>
              </div>
              <SnapScreen name="web" />
            </article>
            <article>
              <div className="ecoya-report-copy">
                <FileText size={30} />
                <span>감사·ERP용 PDF 성적서</span>
                <h3>제출용 문서까지 한 번에</h3>
                <p>
                  확인이 끝나면 체크리스트·사진 부록·서명자가 담긴 정식 PDF로
                  자동 정리됩니다. 따로 문서를 만들 필요 없이, 그대로 제출하고
                  첨부합니다
                </p>
                <ul>
                  <li>검사 항목별 결과를 표로 정리</li>
                  <li>현장 사진이 부록으로 함께</li>
                  <li>담당자 서명·발행 정보까지 포함</li>
                </ul>
                <div className="ecoya-report-tags">
                  <small>이런 곳에</small>
                  <span>감사 대응</span>
                  <span>ERP 첨부</span>
                  <span>거래처 제출</span>
                </div>
              </div>
              <SnapScreen name="pdf" />
            </article>
          </div>
          <div className="ecoya-snap-trust">
            {[
              [
                "사람이 확정",
                "사람이 확인합니다",
                "확정 전에는 어디에도 반영되지 않습니다",
              ],
              [
                "감사추적",
                "근거가 남습니다",
                "모든 결정이 구조화된 로그로 기록됩니다",
              ],
              ["증거 체인", "원본이 보존됩니다", "촬영 출처까지 추적됩니다"],
            ].map(([label, title, description]) => (
              <article key={label}>
                <span>{label}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="snap-faq"
          className="trade-section trade-container ecoya-faq"
        >
          <div className="trade-section-heading">
            <div>
              <p className="trade-section-label">FAQ</p>
              <h2>자주 묻는 질문</h2>
            </div>
          </div>
          {snapFaq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="trade-bottom-cta ecoya-public-cta">
          <div className="trade-container">
            <h2>
              현장의 증거,
              <br />
              지금부터 남겨보세요
            </h2>
            <p>
              말 한마디면 시작됩니다. 어떤 현장이든, ECOYA SNAP이 믿을 수 있는
              기록으로 남깁니다
            </p>
            <a className="ecoya-snap-contact" href="/contact?product=snap">
              도입 문의 · 사전등록 <ArrowRight size={18} />
            </a>
            <StartButton product="snap" />
          </div>
        </section>
      </main>
    </LandingShell>
  )
}

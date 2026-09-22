import { useEffect } from "react"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { LandingShell, StartButton } from "./landing-shell"

const principles = [
  [
    "AI가 읽고 제안합니다",
    "사진·서류를 읽어 필드와 리포트를 채우고, 어디를 얼마나 확신하는지 함께 보여줍니다.",
  ],
  [
    "사람이 확인합니다",
    "확정 전에는 어디에도 반영되지 않습니다. 최종 판단은 늘 사람의 몫입니다.",
  ],
  [
    "시스템이 기록합니다",
    "확인한 것만 근거와 함께 남아, 언제든 되짚을 수 있는 기록이 됩니다.",
  ],
]

export function BrandStoryLanding() {
  useEffect(() => {
    document.title = "ECOYA — 브랜드 스토리"
  }, [])
  return (
    <LandingShell page="story">
      <main className="ecoya-brand-main">
        <section
          id="top"
          className="ecoya-story-hero"
          aria-labelledby="brand-title"
        >
          <img
            className="ecoya-story-panorama"
            src="/images/trade-logistics.webp"
            alt="컨테이너와 선박이 오가는 물류 현장"
            fetchPriority="high"
          />
          <div className="trade-container ecoya-story-hero-content">
            <h1 id="brand-title">
              일하는 방식을,
              <br />
              믿을 수 있는 기록으로
            </h1>
            <p className="ecoya-story-description">
              매일 반복되는 확인, 정리, 전달. 중요한 증거는 사진 속에, 문서
              안에, 메일 어딘가에 흩어져 있었습니다. ECOYA는 그 흩어진 순간들을
              사람이 믿고 쓸 수 있는 기록으로 바꿉니다.
            </p>
            <div className="trade-hero-actions">
              <StartButton />
              <a href="#story">
                브랜드 이야기 <ArrowRight size={18} />
              </a>
              <a href="/contact">
                도입 문의 <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        <section
          className="ecoya-brand-section ecoya-story-hook"
          aria-label="첫 번째 기록"
        >
          <div className="trade-container">
            <p>
              현장에서 찍은 사진 한 장이,
              <br />
              <span>누군가에게는 그냥 이미지지만,</span>
              <br />
              우리에게는 그 일을 증명하는
              <br className="ecoya-hook-break" /> <strong>첫 번째 기록</strong>
              이었습니다.
            </p>
          </div>
        </section>

        <section
          id="story"
          className="ecoya-brand-section trade-container ecoya-origin"
          aria-labelledby="brand-story-title"
        >
          <div>
            <p className="trade-section-label">Story</p>
            <h2 id="brand-story-title">
              우리는 먼저
              <br />
              현장을 보았습니다
            </h2>
            <div className="ecoya-origin-copy">
              <p>
                컨테이너 앞에서 사진을 찍고, 번호를 확인하고, 다시{" "}
                <strong>엑셀과 메일로 옮기는 일.</strong> 그 반복 속에 이미
                중요한 증거들이 있었지만,{" "}
                <strong>기록은 늘 흩어져 있었습니다.</strong>
              </p>
              <p>
                그래서 ECOYA는 사진과 서류를,{" "}
                <strong>사람이 믿고 쓸 수 있는 기록으로</strong> 바꾸기
                시작했습니다.
              </p>
            </div>
          </div>
          <div className="ecoya-origin-chain">
            <h3>현장에서 벌어지던 일</h3>
            <ul>
              <li>현장 사진 수백 장</li>
              <li>컨테이너 번호, 씰 번호, 작업 순서</li>
              <li>엑셀 정리 · 이메일 첨부 · 폴더 분류</li>
              <li>매번 반복되는 증빙 작업</li>
              <li className="ecoya-chain-turn">
                그래서 ECOYA SNAP을 만들었습니다
              </li>
              <li>그리고 이 원칙은 Trade OS로 확장됩니다</li>
            </ul>
          </div>
        </section>

        <section
          className="ecoya-brand-section trade-container ecoya-before-after"
          aria-labelledby="brand-change-title"
        >
          <p className="trade-section-label">Before → After</p>
          <h2 id="brand-change-title">
            흩어져 있던 현장 사진과 첨부파일이,
            <br />
            믿고 쓸 수 있는 자료가 됩니다
          </h2>
          <img
            width={1536}
            height={1024}
            className="ecoya-brand-records"
            src="/images/landing-illustrations/brand-records.png"
            loading="lazy"
            alt="흩어진 현장 사진과 서류가 사람의 확인을 거쳐 하나의 기록으로 모이는 과정"
          />
          <div className="ecoya-change-grid">
            <div>
              <p className="trade-section-label">이전</p>
              <h3>흩어진 증거</h3>
              <ul className="ecoya-change-before" role="list">
                <li>여기저기 저장된 현장 사진</li>
                <li>손으로 맞추는 엑셀</li>
                <li>메일 첨부와 폴더 분류</li>
                <li>매번 다시 하는 정리</li>
              </ul>
            </div>
            <ArrowRight
              className="ecoya-change-arrow"
              size={32}
              aria-hidden="true"
            />
            <div>
              <p className="trade-section-label">이후</p>
              <h3>믿을 수 있는 기록</h3>
              <ul className="ecoya-change-after" role="list">
                {[
                  "확인된 하나의 기록",
                  "확인을 거친 리포트",
                  "바로 전달되는 공유 링크",
                  "근거가 남는 감사추적",
                ].map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          className="ecoya-brand-principles"
          aria-labelledby="brand-principles-title"
        >
          <div className="ecoya-brand-section trade-container">
            <div className="ecoya-principles-intro">
              <p className="trade-section-label">How ECOYA works</p>
              <h2 id="brand-principles-title">
                AI가 제안하고,
                <br />
                사람이 확정하고,
                <br />
                시스템이 기록합니다
              </h2>
            </div>
            <ol className="ecoya-belief-rows">
              {principles.map(([title, detail], i) => (
                <li key={title}>
                  <span className="ecoya-belief-number">
                    0{i + 1} {["제안", "확정", "기록"][i]}
                  </span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="ecoya-brand-vision ecoya-brand-section"
          aria-labelledby="brand-vision-title"
        >
          <div className="trade-container">
            <p className="ecoya-story-eyebrow">Our Vision</p>
            <h2 id="brand-vision-title">
              우리가 만들려는 건,
              <br />
              결국 신뢰입니다
            </h2>
            <p className="ecoya-vision-description">
              기록이 정확할수록, 사람은 덜 의심하고 더 빠르게 움직입니다.
              ECOYA는 현장과 서류에 흩어진 증거를 누구나 믿고 쓸 수 있는
              기록으로 모아, 일과 일 사이의 신뢰를 넓혀갑니다.
            </p>
          </div>
        </section>

        <section
          className="ecoya-brand-section ecoya-brand-closing"
          aria-labelledby="brand-closing-title"
        >
          <div className="trade-container">
            <h2 id="brand-closing-title">
              작은 기록 하나가,
              <br />큰 신뢰의 시작입니다
            </h2>
            <p>
              ECOYA는 현장의 사진과 무역의 서류를, 사람이 확인할 수 있는 믿을 수
              있는 기록으로 바꿉니다.
            </p>
            <div className="trade-hero-actions">
              <Button size="lg" asChild>
                <a href="/contact">
                  도입 문의 <ArrowRight />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </LandingShell>
  )
}

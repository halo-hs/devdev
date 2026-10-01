import { useEffect, useState } from "react"
import {
  Camera,
  ClipboardCheck,
  FileCheck2,
  MessageSquare,
  Pause,
  Play,
} from "lucide-react"
import { useReducedMotion } from "@shared/lib/use-reduced-motion"
import { useSnapPreviewPlayback } from "@landing/snap/use-preview-playback"
import { useT } from "../shared/locale"
import { moreSnapUses, snapUseCases } from "./content"
import { SnapScreen, type SnapScreenName } from "./illustrations"

export function SnapIndustryLabels({ playing }: { playing: boolean }) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [interacting, setInteracting] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!playing || interacting || reduced) return
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setIndex((value) => (value + 1) % moreSnapUses.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [playing, interacting, reduced])
  return (
    <div
      className="ecoya-snap-industries"
      aria-label={t("SNAP 활용 분야")}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false)
      }}
    >
      {snapUseCases.slice(0, 5).map(({ title }) => (
        <a href="#snap-use-cases" key={title}>
          {t(title)}
        </a>
      ))}
      <a href="#snap-more-uses" className="ecoya-rotating-use">
        <span>{t("그리고")}</span>
        <span className="ecoya-rotating-use-text" key={index}>
          {t(moreSnapUses[index])}
        </span>
      </a>
    </div>
  )
}

const heroStages: {
  name: SnapScreenName
  title: string
  description: string
  label: string
  icon: typeof Camera
}[] = [
  {
    name: "create",
    title: "말로 지시",
    description: "필요한 작업을 한 문장으로 적습니다",
    label: "말로 지시",
    icon: MessageSquare,
  },
  {
    name: "checklist",
    title: "AI가 목록화",
    description: "업무에 맞는 체크리스트와 찍을 사진을 자동으로 뽑습니다",
    label: "AI 목록화",
    icon: ClipboardCheck,
  },
  {
    name: "capture",
    title: "현장에서 촬영",
    description: "작업자는 목록대로 찍으며 작업을 마칩니다",
    label: "현장 촬영",
    icon: Camera,
  },
  {
    name: "review",
    title: "확인 후 전달",
    description: "사람이 확인하면 믿을 수 있는 리포트로 전달됩니다",
    label: "확인·전달",
    icon: FileCheck2,
  },
]
export function SnapHeroPreview({
  playback,
}: {
  playback: ReturnType<typeof useSnapPreviewPlayback>
}) {
  const t = useT()
  const { step, playing, progress, root, select, toggle } = playback
  const reduced = useReducedMotion()
  const current = heroStages[step]
  return (
    <div
      className="ecoya-snap-hero-demo"
      ref={root}
      data-running={playing && !reduced}
    >
      <div className="trade-demo-playback">
        {!reduced && (
          <button
            className="trade-feature-play"
            type="button"
            onClick={toggle}
            aria-label={
              playing ? t("SNAP 미리보기 일시정지") : t("SNAP 미리보기 재생")
            }
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? t("일시정지") : t("재생")}
          </button>
        )}
      </div>
      <div id="snap-hero-preview" aria-live={playing ? "off" : "polite"}>
        <div className="ecoya-snap-hero-caption">
          <h3>{t(current.title)}</h3>
          <p>{t(current.description)}</p>
        </div>
        <div key={step} className="ecoya-snap-screen-transition">
          <SnapScreen name={current.name} />
        </div>
      </div>
      <div
        className="ecoya-snap-hero-tabs"
        role="group"
        aria-label={t("SNAP 서비스 미리보기")}
      >
        {heroStages.map((item, i) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={step === i}
            aria-controls="snap-hero-preview"
            onClick={() => select(i)}
          >
            <span className="trade-feature-progress" aria-hidden="true">
              <i
                style={{
                  transform: `scaleX(${step === i ? progress : i < step ? 1 : 0})`,
                }}
              />
            </span>
            <item.icon size={18} />
            <span>{t(item.label)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

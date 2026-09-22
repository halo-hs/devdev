import type { ComponentProps, ReactNode } from "react";

import { cx } from "@trade-os/reference-3030/components/ui/utils";

type SectionCardDensity = "default" | "compact";
type SectionCardTone = "default" | "hero";

type SectionCardProps = Omit<ComponentProps<"section">, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  density?: SectionCardDensity;
  tone?: SectionCardTone;
  variant?: "card" | "module";
  flush?: boolean;
  children?: ReactNode;
};

const TONE_CLASS: Record<SectionCardTone, string> = {
  // 정본 --surface-border(#EEEFF1). DS 1.0 의 `border-border-subtle` 은
  // gray-11(#F6F7F9)로 한 단계 옅어 카드 윤곽이 사라진다.
  default: "border-[var(--surface-border,#eeeff1)] bg-surface-card",
  hero: "border-ecoya-blue-8 bg-accent-soft",
};

/**
 * W8-V1d unified section scaffold — merges the two half-solutions that
 * existed before (Home-only `HomeSectionCard` + platform `SectionPanel`)
 * into the ONE card chrome per product-ui-contract "Section card".
 *
 * Chrome only — page CONTENT structure is out of scope (V2). `tone="hero"`
 * carries over HomeSectionCard's one accent variant (Owner Brief).
 *
 * ── 크롬 정본 = Figma SNAP 2.0 `Card — spec`(node 48:5 / 2052:28689)
 * (2026-09-07 갭 감사 TYPO-CARD-17, 정본 우선순위 사용자 확정)
 * 이 컴포넌트의 className 은 원래 erp-v2 canon 과 문자 단위로 같았고 그것이
 * 지난 라운드에 이 갭을 막았다. 정책이 "충돌하면 Figma 가 기준" 으로 확정돼
 * 아래를 Figma 값으로 옮겼다. erp-v2 쪽과는 이제 의도적으로 갈리므로 parity
 * sweep 이 되돌리지 않도록 한다:
 *
 *   header  하단 보더 제거   정본 :218 header 에 border 없음. 카드의 유일한
 *                            구분선은 footer 의 border-t 하나다(:391).
 *   radius  14px → 12px      정본 variables.json `r/lg: 12`.
 *   shadow  레거시 2겹 →      정본 `shadow/section`
 *           0 2px 8px #00000014 = 0 2px 8px rgba(0,0,0,.08).
 *   border  #F6F7F9 → #EEEFF1 정본 `--surface-border`(= Gray 10).
 *   title   17/25.5 → 17/24  정본 :222 (--text-header-6 / --leading-header-6).
 *   desc    13/19.5 #54575C  정본 :240 14/18 #5C5E66
 *           → 14/18 #5C5E66  (--text-body-9 / --leading-body-9 /
 *                             --surface-muted-foreground).
 *
 * 그대로 둔 두 줄(정본과 이미 정확히 일치, 되돌리지 말 것):
 *   header `min-h-12 px-5 py-3` = min-h48/px20/py12 (정본 :218,:219)
 *   content `px-5 py-6`         = px20/py24         (정본 :258)
 *
 * 토큰 표기 규칙 — 왜 어떤 값은 `var(…, 폴백)` 이고 어떤 값은 리터럴인가:
 * 이 컴포넌트는 `[data-ds="2"]` 스코프 **밖**에서 렌더된다.
 *   · `--surface-border` / `--surface-muted-foreground` / `--text-*` /
 *     `--leading-*` 은 globals.css 에 선언이 없는 DS 2.0 전용 이름이라
 *     스코프 밖에서는 폴백(=Figma 값), 안에서는 DS 2.0 토큰으로 해소된다.
 *     양쪽 값이 같으므로 이관 시 표기를 바꿀 필요가 없다.
 *   · `--r-lg` 와 `--shadow-section` 은 두 레이어가 **이름을 공유**해서
 *     스코프 밖에서 조용히 DS 1.0 값(14px / 레거시 2겹)으로 해소된다.
 *     그래서 이 둘만 리터럴로 적었다. DS 1.0 쪽 값이 Figma 와 맞춰지면
 *     SectionCard.test.tsx 의 "이름 충돌" 가드가 실패하며 알려 준다.
 *
 * 이번 범위 밖(담당 finding 이 지목한 4항목 + 보더색만 옮겼다):
 *   footer 슬롯 부재 — 정본 카드에는 footer 가 있지만 소비처가 0이라
 *                      쓰지 않는 API 를 먼저 만들지 않았다.

 */
function SectionCard({
  title,
  description,
  action,
  density = "default",
  tone = "default",
  flush = false,
  variant = "card",
  children,
  className,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[12px] text-text-primary",
        variant === "module" ? "shadow-[0_4px_12px_rgba(0,0,0,0.1)]" : "border shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        TONE_CLASS[tone],
        className,
      )}
      data-ui="section-card"
      {...props}
    >
      {title || description || action ? (
        <header
          className={cx(
            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
            variant === "module" ? "px-5 pt-5 pb-4" : density === "compact" ? "min-h-12 px-4 py-3" : "min-h-12 px-5 py-3",
          )}
          data-ui="section-card-header"
        >
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <h2 className={cx("m-0 font-bold text-text-primary", variant === "module" ? "text-header-22 leading-normal" : "text-[length:var(--text-header-6,17px)] leading-[var(--leading-header-6,24px)]")}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <div className="text-[length:var(--text-body-9,14px)] leading-[var(--leading-body-9,18px)] font-regular text-[var(--surface-muted-foreground,#5c5e66)]">
                {description}
              </div>
            ) : null}
          </div>
          {action ? <div className="self-center">{action}</div> : null}
        </header>
      ) : null}
      <div
        className={flush ? undefined : "px-5 py-6"}
        data-ui="section-card-content"
      >
        {children}
      </div>
    </section>
  );
}

export { SectionCard };
export type { SectionCardDensity, SectionCardProps, SectionCardTone };

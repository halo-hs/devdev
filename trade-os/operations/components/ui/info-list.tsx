import type { HTMLAttributes, ReactNode } from "react";

import { Icon } from "./icon";
import { cx } from "./utils";

export type InfoListVariant = "blue" | "gray" | "caution" | "risk";

export type InfoListProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hideIcon?: boolean;
  variant?: InfoListVariant;
};

/**
 * SNAP 2.0 `Info — spec` 4톤. 정본: Figma node 48:5 · 05_extensions 2206:6357 의
 * 인스턴스 4개 — 2206:6386 positive / 6402 neutral / 6418 caution / 6434 riskHigh.
 * (우리 variant 이름과의 별칭: positive→blue · neutral→gray · riskHigh→risk.)
 *
 * 정본이 칠하는 값 — 배경 / 테두리 / 텍스트(제목·설명 공통):
 *   positive  --color-primary-10 #f1f7fe / --color-primary-9 #dbeafa / --color-primary-4 #166dd7
 *   neutral   --color-gray-11    #f6f7f8 / --color-gray-9    #dedfe3 / --color-indigo     #052d61
 *   caution   --color-yellow-6   #fff7d9 / --color-yellow-5  #fff0b3 / --color-yellow-1   #d29700
 *   riskHigh  --color-red-8      #ffefef / --color-red-6     #f5c0c0 / --color-red-2      #d64c4c
 * 배경 4색은 05_extensions/screenshot.png 픽셀 실측으로도 확인했다
 * (#f1f7fe 11871px · #f6f7f8 6436 · #fff7d9 6430 · #ffefef 6413).
 *
 * 왜 `--ecoya-*`(DS 1.0) 를 버렸나: 12값이 12값 전부 정본과 다르다(blue-10
 * #f4f7fe≠#f1f7fe, blue-4 #3957cc≠#166dd7, indigo #192755≠#052d61 …).
 * 정본은 Figma 하나이므로 소비처를 스코프로 가르지 않고 한 벌만 쓴다 —
 * 이 컴포넌트의 소비처는 현재 전부 DS 1.0 레이어(`[data-ds="2"]` 밖)지만,
 * 그중 DS 1.0 값이 정본인 집합은 존재하지 않기 때문이다.
 *
 * 왜 토큰 참조가 아니라 리터럴인가: 같은 12값이 tokens-ds2.css 에 이미 서 있으나
 * `[data-ds="2"]` 스코프 안에서만 유효하고, 스코프 밖에서는 globals.css:409-422 의
 * `@theme` 가 `--color-primary-4/-10`·`--color-gray-9/-11`·`--color-red-2` 5개를
 * `--ecoya-*` 로 별칭해 둔다. 즉 `var(--color-primary-10,#f1f7fe)` 는 스코프 밖에서
 * 폴백이 아니라 DS 1.0 값(#f4f7fe)으로 조용히 해소된다. 스코프와 무관한 Info 역할
 * 토큰이 서면 그때 참조로 바꾼다(토큰 파일은 이 배치의 소유가 아니다).
 * 값 계약은 info-list.test.tsx 가 12개 전량으로 고정한다.
 */
const variantClassName: Record<InfoListVariant, string> = {
  blue: "border-[#dbeafa] bg-[#f1f7fe] text-[#166dd7]",
  gray: "border-[#dedfe3] bg-[#f6f7f8] text-[#052d61]",
  caution: "border-[#fff0b3] bg-[#fff7d9] text-[#d29700]",
  risk: "border-[#f5c0c0] bg-[#ffefef] text-[#d64c4c]",
};

export function InfoList({
  children,
  className,
  hideIcon = false,
  variant = "blue",
  ...props
}: InfoListProps) {
  return (
    <div
      {...props}
      className={cx(
        // 정본 컨테이너(2206:6386 등 4 인스턴스 + Alert 컴포넌트 기본값):
        // `flex gap-[8px] items-start` + `border 1px` + `rounded-[var(--r-md,8px)]`
        // + `px-4 py-3` (Figma space/16 = 16px, space/12 = 12px). min-height 선언은 없다.
        // items-center·min-h-[44px] 는 정본에 없던 우리 쪽 추가였다 — 전자는 2줄
        // 알림에서 아이콘을 가운데로 내리고, 후자는 정본에 없는 높이 바닥이다
        // (1줄 자연 높이가 18+24+2 = 44px 라 흔한 경우의 렌더는 그대로다).
        "flex items-start gap-2 rounded-[8px] border px-4 py-3",
        variantClassName[variant],
        className,
      )}
      data-ui="info-list"
      // 톤을 색이 아니라 이름으로 읽는 자리. 소비처가 색 클래스를 단언하면 정본
      // 값이 움직일 때마다 같이 깨지고(이번 이동에서 실제로 2건), src/features 로
      // 팔레트 리터럴이 샌다(verify-semantic-usage 의 hex-in-class 규칙).
      data-variant={variant}
    >
      {/* 아이콘 16px 은 정본과 같다. 글리프는 바꾸지 않는다 — 정본의 아이콘은
          컴포넌트 슬롯이라 인스턴스마다 다른 에셋이 꽂힌다(05 스펙 시트는 기본값
          icon_FileText, 22_panel 2375:15226 과 19_Document_Viewer 2343:21292 는
          각각 다른 에셋). 즉 스펙 상수가 아니라 인스턴스 콘텐츠다. */}
      {hideIcon ? null : <Icon className="size-4" name="icon-info-fill" />}
      <span className="min-w-0 flex-1 text-body-14 font-medium">
        {children}
      </span>
    </div>
  );
}

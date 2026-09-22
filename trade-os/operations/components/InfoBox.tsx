import type { ComponentProps, ReactNode } from "react";

import { InfoList, type InfoListVariant } from "@trade-os/operations/components/ui/info-list";

type InfoBoxTone = "positive" | "neutral" | "caution" | "risk";

type InfoBoxProps = Omit<ComponentProps<typeof InfoList>, "variant" | "children" | "title"> & {
  tone?: InfoBoxTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  hideIcon?: boolean;
};

const variantMap: Record<InfoBoxTone, InfoListVariant> = {
  positive: "blue",
  neutral: "gray",
  caution: "caution",
  risk: "risk",
};

/**
 * SNAP 2.0 `Info — spec` 섹션 2 `제목 + 설명 + 액션`.
 * 정본: Figma node 48:5 · 05_extensions 2206:6451 (`Alert / positive · action`).
 *
 * 정본 배선: 컨테이너가 `icon · content · action` 3형제를 `gap-[8px] items-start`
 * 로 놓고, content 는 `flex-[1_0_0] min-w-px` 로 남는 폭을 전부 먹으며
 * (그래서 action 이 오른쪽 끝으로 밀린다) 안에서 `flex-col gap-[2px]` 로
 * 제목 / 설명을 쌓는다. 제목 = --text-body-9 14 / --leading-body-9 18 / Medium,
 * 설명 = 같은 14/18 에 Regular, 색은 둘 다 톤 색을 그대로 상속한다.
 *
 * 우리 쪽은 action 이 InfoList children 안에 들어가는 구조라 같은 정렬을 이
 * 래퍼에서 재현한다 — `items-start`(정본 컨테이너 정렬) + 본문 열 `flex-1`
 * (정본 content 의 flex-[1_0_0]). 설명은 13px 이었는데 정본은 제목과 같은 14/18
 * 이다. `flex-wrap` 은 정본에 없지만 정본 폭(820px)에서는 발동하지 않는 좁은 폭
 * 안전장치라 유지한다.
 */
function InfoBox({ tone = "neutral", title, description, action, hideIcon = false, ...props }: InfoBoxProps) {
  return (
    <InfoList hideIcon={hideIcon} variant={variantMap[tone]} {...props}>
      <span className="flex w-full min-w-0 flex-wrap items-start gap-2">
        <span className="inline-flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="break-keep text-balance text-body-14 font-medium">{title}</span>
          {description && (
            <span className="text-body-14 font-regular">{description}</span>
          )}
        </span>
        {action}
      </span>
    </InfoList>
  );
}

export { InfoBox };
export type { InfoBoxProps, InfoBoxTone };

import type { ComponentProps, ReactNode } from "react";

import { Info } from "lucide-react";

import { Alert } from "@/components/ui/Alert";

type InfoBoxTone = "positive" | "neutral" | "caution" | "risk";

type InfoBoxProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  tone?: InfoBoxTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  hideIcon?: boolean;
};

const variantMap = {
  positive: "positive",
  neutral: "neutral",
  caution: "caution",
  risk: "riskHigh",
} as const satisfies Record<InfoBoxTone, string>;

// Figma Info (2206:6451): title, optional description and action on the shared Alert tones.
function InfoBox({ tone = "neutral", title, description, action, hideIcon = false, className, role, ...props }: InfoBoxProps) {
  return (
    <Alert {...props} className={className} role={role} variant={variantMap[tone]}>
      {hideIcon ? null : <Info aria-hidden="true" />}
      <span className="flex w-full min-w-0 flex-wrap items-start gap-2">
        <span className="inline-flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="break-keep text-balance text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-medium">{title}</span>
          {description && (
            <span className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-normal">{description}</span>
          )}
        </span>
        {action}
      </span>
    </Alert>
  );
}

export { InfoBox };
export type { InfoBoxProps, InfoBoxTone };

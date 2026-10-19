import type { ComponentProps } from "react"
import { AccordionTrigger as DSAccordionTrigger, AccordionContent as DSAccordionContent } from "@ecoya/design-system/ui/accordion"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/accordion"

function AccordionTrigger({ className, ...props }: ComponentProps<typeof DSAccordionTrigger>) {
  return <DSAccordionTrigger {...props} className={cn("min-h-10 items-center py-0 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function AccordionContent({ className, ...props }: ComponentProps<typeof DSAccordionContent>) {
  return <DSAccordionContent {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

export { AccordionTrigger, AccordionContent }

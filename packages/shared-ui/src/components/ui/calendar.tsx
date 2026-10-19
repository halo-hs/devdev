import type { ComponentProps } from "react"
import { Calendar as DSCalendar } from "@ecoya/design-system/ui/calendar"
import { cn } from "@shared/lib/utils"
export { CalendarDayButton } from "@ecoya/design-system/ui/calendar"

function Calendar(props: ComponentProps<typeof DSCalendar>) {
  return <DSCalendar {...props} className={cn(
    "[--text-header-9:var(--text-body-8)] [--leading-header-9:var(--text-base--line-height)] [--font-weight-bold:400] [--font-weight-medium:400]",
    props.className,
  )} />
}
export { Calendar }

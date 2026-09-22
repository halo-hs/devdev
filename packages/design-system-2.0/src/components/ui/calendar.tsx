"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import ChevronDownIcon from "@ecoya/design-system/assets/icons/icon-chevron-down.svg"
import ChevronLeftIcon from "@ecoya/design-system/assets/icons/icon-chevron-left.svg"
import ChevronRightIcon from "@ecoya/design-system/assets/icons/icon-chevron-right.svg"
import { cn } from "@ecoya/design-system/lib/utils"
import { Button, buttonVariants } from "@ecoya/design-system/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar max-w-full overflow-x-auto bg-[var(--calendar-background)] p-2 text-[var(--calendar-foreground)] [--cell-radius:var(--r-sm)] [--cell-size:var(--calendar-cell-size)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit max-w-full", defaultClassNames.root),
        months: cn(
          "relative flex max-w-full flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-xs" }),
          "size-[var(--calendar-nav-size)]! rounded-[var(--r-sm)] bg-transparent! p-0 text-[var(--calendar-foreground)]! shadow-none! select-none hover:bg-[var(--calendar-day-background-hover)]! hover:text-[var(--calendar-foreground)]! active:bg-[var(--calendar-day-background-active)]! disabled:bg-transparent! disabled:text-[var(--calendar-day-disabled-foreground)]! disabled:shadow-none! aria-disabled:bg-transparent! aria-disabled:text-[var(--calendar-day-disabled-foreground)]! aria-disabled:opacity-100 aria-disabled:shadow-none!",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-xs" }),
          "size-[var(--calendar-nav-size)]! rounded-[var(--r-sm)] bg-transparent! p-0 text-[var(--calendar-foreground)]! shadow-none! select-none hover:bg-[var(--calendar-day-background-hover)]! hover:text-[var(--calendar-foreground)]! active:bg-[var(--calendar-day-background-active)]! disabled:bg-transparent! disabled:text-[var(--calendar-day-disabled-foreground)]! disabled:shadow-none! aria-disabled:bg-transparent! aria-disabled:text-[var(--calendar-day-disabled-foreground)]! aria-disabled:opacity-100 aria-disabled:shadow-none!",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-[length:var(--text-header-9)] leading-[var(--leading-header-9)] font-bold text-[var(--calendar-heading-foreground)]",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-[var(--calendar-background)] opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "text-[length:var(--text-header-9)] leading-[var(--leading-header-9)] font-bold text-[var(--calendar-heading-foreground)] select-none",
          captionLayout === "label"
            ? ""
            : "flex items-center gap-1 rounded-(--cell-radius) [&>svg]:size-3.5 [&>svg]:text-[var(--calendar-weekday-foreground)]",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex size-(--cell-size) shrink-0 items-center justify-center rounded-(--cell-radius) text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--calendar-weekday-foreground)] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--calendar-weekday-foreground)] select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative flex size-(--cell-size) shrink-0 items-center justify-center rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-[var(--calendar-range-background)] after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-[var(--calendar-range-background)]",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-[var(--calendar-range-background)] after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-[var(--calendar-range-background)]",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-transparent data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-[var(--calendar-day-outside-foreground)] aria-selected:text-[var(--calendar-day-outside-foreground)]",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-[var(--calendar-day-disabled-foreground)] opacity-100",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-xs"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={modifiers.today && !modifiers.selected}
      data-outside={modifiers.outside}
      className={cn(
        "relative isolate z-10 flex h-[var(--calendar-day-height)]! w-[var(--calendar-day-width)]! min-w-[var(--calendar-day-width)] flex-col gap-1 rounded-[var(--r-xs)] border border-transparent bg-transparent! text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--calendar-day-foreground)]! shadow-none! hover:bg-[var(--calendar-day-background-hover)]! hover:text-[var(--calendar-day-foreground)]! focus-visible:relative focus-visible:z-10 focus-visible:border-transparent! focus-visible:shadow-[var(--shadow-keyboard-focus)]! focus-visible:ring-0! active:bg-[var(--calendar-day-background-active)]! disabled:bg-transparent! disabled:text-[var(--calendar-day-disabled-foreground)]! disabled:opacity-100 aria-disabled:bg-transparent! aria-disabled:text-[var(--calendar-day-disabled-foreground)]! aria-disabled:opacity-100 data-[outside=true]:text-[var(--calendar-day-outside-foreground)]! data-[range-end=true]:rounded-[var(--r-xs)] data-[range-end=true]:bg-[var(--calendar-day-selected-background)]! data-[range-end=true]:text-[var(--calendar-day-selected-foreground)]! data-[range-end=true]:hover:bg-[var(--calendar-day-selected-background)]! data-[range-end=true]:active:bg-[var(--calendar-day-selected-background)]! data-[range-middle=true]:rounded-[var(--r-xs)] data-[range-middle=true]:bg-[var(--calendar-range-background)]! data-[range-middle=true]:text-[var(--calendar-day-foreground)]! data-[range-middle=true]:hover:bg-[var(--calendar-range-background)]! data-[range-middle=true]:active:bg-[var(--calendar-range-background)]! data-[range-start=true]:rounded-[var(--r-xs)] data-[range-start=true]:bg-[var(--calendar-day-selected-background)]! data-[range-start=true]:text-[var(--calendar-day-selected-foreground)]! data-[range-start=true]:hover:bg-[var(--calendar-day-selected-background)]! data-[range-start=true]:active:bg-[var(--calendar-day-selected-background)]! data-[selected-single=true]:bg-[var(--calendar-day-selected-background)]! data-[selected-single=true]:text-[var(--calendar-day-selected-foreground)]! data-[selected-single=true]:hover:bg-[var(--calendar-day-selected-background)]! data-[selected-single=true]:active:bg-[var(--calendar-day-selected-background)]! data-[today=true]:border-[var(--calendar-today-border)]! data-[today=true]:text-[var(--calendar-today-foreground)]! [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

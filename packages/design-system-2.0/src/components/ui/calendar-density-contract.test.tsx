import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Calendar } from "./calendar"

describe("ECOYA Calendar density contract", () => {
  it("defines the Figma density as shared calendar role tokens", () => {
    const tokens = readFileSync(
      resolve(process.cwd(), "src/tokens.css"),
      "utf8"
    )

    expect(tokens).toContain("--calendar-cell-size: 40px")
    expect(tokens).toContain("--calendar-day-width: 26px")
    expect(tokens).toContain("--calendar-day-height: 28px")
    expect(tokens).toContain("--calendar-nav-size: 24px")
  })

  it("owns calendar sizing instead of inheriting the default Button density", () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 2, 1)}
        selected={new Date(2026, 2, 10)}
        mode="single"
      />
    )

    const calendar = document.querySelector<HTMLElement>(
      '[data-slot="calendar"]'
    )
    const selectedDay = document.querySelector<HTMLButtonElement>(
      '[data-day][data-selected-single="true"]'
    )
    const previous = screen.getByRole("button", { name: /previous month/i })
    const next = screen.getByRole("button", { name: /next month/i })

    expect(calendar).toHaveClass(
      "[--cell-size:var(--calendar-cell-size)]",
      "[--cell-radius:var(--r-sm)]"
    )
    expect(selectedDay).not.toBeNull()
    expect(selectedDay).toHaveAttribute("data-size", "icon-xs")
    expect(selectedDay).toHaveClass(
      "h-[var(--calendar-day-height)]!",
      "w-[var(--calendar-day-width)]!",
      "rounded-[var(--r-xs)]"
    )

    for (const navigationButton of [previous, next]) {
      expect(navigationButton).toHaveClass(
        "size-[var(--calendar-nav-size)]!",
        "rounded-[var(--r-sm)]",
        "aria-disabled:text-[var(--calendar-day-disabled-foreground)]!",
        "aria-disabled:opacity-100"
      )
      expect(navigationButton).not.toHaveClass("size-10")
      expect(navigationButton).not.toHaveClass("h-10")
      expect(navigationButton).not.toHaveClass("aria-disabled:opacity-50")
    }
  })

  it("keeps each 40px cell separate from its compact day target", () => {
    render(<Calendar defaultMonth={new Date(2026, 2, 1)} mode="single" />)

    const dayButton =
      document.querySelector<HTMLButtonElement>("button[data-day]")
    const dayCell = dayButton?.parentElement

    expect(dayButton).not.toBeNull()
    expect(dayButton).toHaveClass(
      "h-[var(--calendar-day-height)]!",
      "w-[var(--calendar-day-width)]!"
    )
    expect(dayCell).toHaveClass(
      "size-(--cell-size)",
      "items-center",
      "justify-center"
    )
  })

  it("isolates day typography and interaction states from ghost Button visuals", () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 2, 1)}
        selected={new Date(2026, 2, 10)}
        mode="single"
      />
    )

    const ordinaryDay = document.querySelector<HTMLButtonElement>(
      `button[data-day="${new Date(2026, 2, 11).toLocaleDateString()}"]`
    )
    const selectedDay = document.querySelector<HTMLButtonElement>(
      '[data-day][data-selected-single="true"]'
    )

    expect(ordinaryDay).toHaveClass(
      "text-[length:var(--text-body-10)]",
      "leading-[var(--leading-body-10)]",
      "font-medium",
      "text-[var(--calendar-day-foreground)]!",
      "hover:bg-[var(--calendar-day-background-hover)]!"
    )
    expect(selectedDay).toHaveClass(
      "data-[selected-single=true]:bg-[var(--calendar-day-selected-background)]!",
      "data-[selected-single=true]:text-[var(--calendar-day-selected-foreground)]!"
    )
  })

  it("preserves disabled day styling when DayPicker emits aria-disabled", () => {
    const focusedDay = new Date(2026, 2, 11)
    const { rerender } = render(
      <Calendar defaultMonth={new Date(2026, 2, 1)} mode="single" />
    )
    const daySelector = `button[data-day="${focusedDay.toLocaleDateString()}"]`
    document.querySelector<HTMLButtonElement>(daySelector)?.focus()

    rerender(
      <Calendar
        defaultMonth={new Date(2026, 2, 1)}
        disabled={focusedDay}
        mode="single"
      />
    )

    const disabledDay = document.querySelector<HTMLButtonElement>(daySelector)
    expect(disabledDay).not.toBeNull()
    expect(disabledDay).toHaveAttribute("aria-disabled", "true")
    expect(disabledDay).toHaveClass(
      "aria-disabled:bg-transparent!",
      "aria-disabled:text-[var(--calendar-day-disabled-foreground)]!",
      "aria-disabled:opacity-100"
    )
  })

  it("contains intrinsic multi-month width with horizontal overflow", () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 2, 1)}
        mode="range"
        numberOfMonths={3}
      />
    )

    const calendar = document.querySelector<HTMLElement>(
      '[data-slot="calendar"]'
    )
    expect(calendar).toHaveClass("max-w-full", "overflow-x-auto")
  })

  it("uses semantic calendar roles for today, outside, disabled, and range states", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ui/calendar.tsx"),
      "utf8"
    )

    for (const role of [
      "--calendar-today-border",
      "--calendar-today-foreground",
      "--calendar-day-outside-foreground",
      "--calendar-day-disabled-foreground",
      "--calendar-range-background",
      "--shadow-keyboard-focus",
    ]) {
      expect(source).toContain(role)
    }
  })
})

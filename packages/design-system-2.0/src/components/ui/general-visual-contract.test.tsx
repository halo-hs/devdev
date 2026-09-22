import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const generalPrimitiveFiles = [
  "accordion",
  "alert",
  "attachment",
  "avatar",
  "badge",
  "bubble",
  "button-group",
  "carousel",
  "empty",
  "field",
  "input-otp",
  "item",
  "kbd",
  "marker",
  "message",
  "message-scroller",
  "progress",
  "questionnaire",
  "resizable",
  "scroll-area",
  "separator",
  "sidebar",
  "skeleton",
  "slider",
  "tabs",
  "toggle",
  "toggle-group",
  "tooltip",
] as const

const newOnlyPrimitiveFiles = [
  "attachment",
  "bubble",
  "button-group",
  "carousel",
  "item",
  "kbd",
  "marker",
  "message",
  "message-scroller",
  "questionnaire",
] as const satisfies readonly GeneralPrimitiveFile[]

type GeneralPrimitiveFile = (typeof generalPrimitiveFiles)[number]

function source(file: GeneralPrimitiveFile) {
  return readFileSync(
    resolve(process.cwd(), "src/components/ui", `${file}.tsx`),
    "utf8"
  )
}

describe("general primitive visual contract", () => {
  it.each(generalPrimitiveFiles)(
    "%s avoids visual escape hatches outside the ECOYA token contract",
    (file) => {
      const contents = source(file)

      expect(contents).not.toMatch(/\/80\b/)
      expect(contents).not.toContain("color-mix(")
      expect(contents).not.toContain("oklch(")
      expect(contents).not.toMatch(/\b(?:bg|text)-(?:white|black)\b/)
      expect(contents).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/)
    }
  )

  it.each(newOnlyPrimitiveFiles)(
    "%s uses roles instead of fixed neutral or brand ramps",
    (file) => {
      expect(source(file)).not.toMatch(
        /--color-(?:blue|gray|indigo|primary|system-blue)/
      )
    }
  )

  it("uses the exact system alert colors", () => {
    const alert = source("alert")

    expect(alert).toContain("border-[var(--surface-border)]")
    expect(alert).toContain("bg-[var(--surface-background)]")
    expect(alert).toContain(
      "border-[var(--color-red-6)] bg-[var(--color-red-8)]"
    )
    expect(alert).toContain("text-[var(--color-red-2)]")
  })

  it("preserves badge and bubble role-variable ownership", () => {
    const badge = source("badge")
    const bubble = source("bubble")

    expect(badge).toContain("--badge-default-background")
    expect(badge).toContain("--badge-default-background-active")
    expect(badge).toContain("--badge-background")
    expect(badge).toContain("rounded-[var(--r-pill)]")
    expect(bubble).toContain("--bubble-primary-background")
    expect(bubble).toContain("--bubble-primary-background-active")
    expect(bubble).toContain("--bubble-secondary-background")
    expect(bubble).toContain("--bubble-secondary-background-active")
    expect(bubble).toContain("rounded-[var(--r-xl)]")
  })

  it("uses the ECOYA progress and slider state roles", () => {
    expect(source("progress")).toContain("bg-[var(--color-primary-4)]")
    expect(source("slider")).toContain("bg-[var(--slider-range-background)]")
    expect(source("progress")).toContain("bg-[var(--color-gray-10)]")
    expect(source("slider")).toContain("bg-[var(--slider-track-background)]")
    expect(source("slider")).toContain(
      "focus-visible:shadow-[var(--shadow-keyboard-focus)]"
    )
    expect(source("slider")).toContain("focus-visible:ring-0")
    expect(source("slider")).not.toContain("hover:ring-3")
    expect(source("slider")).not.toContain("active:ring-3")
  })

  it("keeps the ECOYA toggle and tabs height and state contract", () => {
    const toggle = source("toggle")
    const tabs = source("tabs")

    expect(toggle).toContain(
      "h-[var(--control-size-md)] min-w-[var(--control-size-md)]"
    )
    expect(toggle).toContain(
      "h-[var(--control-size-sm)] min-w-[var(--control-size-sm)]"
    )
    expect(toggle).toContain(
      "data-[state=on]:bg-[var(--toggle-background-selected)]"
    )
    expect(toggle).toContain(
      "data-[state=on]:text-[var(--toggle-foreground-selected)]"
    )
    expect(tabs).toContain("bg-[var(--tabs-list-background)]")
    expect(tabs).toContain("shadow-[var(--shadow-input)]")
  })

  it("routes Input OTP focus, invalid, and disabled states through control roles", () => {
    const inputOtp = source("input-otp")

    expect(inputOtp).toContain("has-aria-invalid:shadow-[var(--shadow-input)]")
    expect(inputOtp).toContain("aria-invalid:shadow-[var(--shadow-input)]")
    expect(inputOtp).toContain(
      "data-[active=true]:border-[var(--control-focus-border)]"
    )
    expect(inputOtp).toContain(
      "data-[active=true]:shadow-[var(--shadow-input-focused)]"
    )
    expect(inputOtp).toContain(
      "data-[active=true]:aria-invalid:shadow-[var(--shadow-input-invalid-focused)]"
    )
    expect(inputOtp).toContain(
      "group-has-[[data-input-otp][aria-invalid=true]]/input-otp:data-[active=true]:shadow-[var(--shadow-input-invalid-focused)]"
    )
    expect(inputOtp).toContain(
      "group-has-disabled/input-otp:bg-[var(--control-disabled-background)]"
    )
    expect(inputOtp).toContain(
      "group-has-disabled/input-otp:text-[var(--control-disabled-foreground)]"
    )
    expect(inputOtp).not.toContain("--color-primary-1")
    expect(inputOtp).not.toContain("has-disabled:opacity-50")
    expect(inputOtp).not.toContain("ring-destructive/20")
    expect(inputOtp).not.toMatch(
      /(?:^|\s)aria-invalid:shadow-\[var\(--shadow-input-invalid-focused\)\]/
    )
  })

  it("keeps structural radii role-based and geometric controls circular", () => {
    expect(source("attachment")).toContain("rounded-[var(--r-lg)]")
    expect(source("item")).toContain("rounded-[var(--r-md)]")
    expect(source("tooltip")).toContain("rounded-[var(--r-sm)]")
    expect(source("carousel")).toContain("rounded-[var(--r-pill)]")
  })
})

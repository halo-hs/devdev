import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"

const tokens = readFileSync(resolve(process.cwd(), "src/tokens.css"), "utf8")
const darkTokens = tokens.slice(tokens.indexOf(".dark {"))

describe("Button ECOYA token contract", () => {
  it("keeps the primary role on Indigo Product and exposes every button state", () => {
    expect(tokens).toMatch(/--primary:\s*var\(--color-indigo\)/)
    expect(tokens).toMatch(
      /--button-primary-background:\s*var\(--color-indigo\)/
    )

    for (const token of [
      "--button-primary-disabled-background",
      "--button-secondary-background-hover",
      "--button-outline-border",
      "--button-ghost-background-hover",
      "--button-destructive-background",
      "--button-link-foreground",
      "--button-link-foreground-active",
      "--shadow-btn-primary-blue-disabled",
      "--shadow-btn-primary-red-disabled",
      "--shadow-btn-tertiary-black-disabled",
    ]) {
      expect(tokens).toContain(`${token}:`)
    }
  })

  it("uses semantic state tokens without generic opacity or color mixing", () => {
    const variants = [
      buttonVariants({ variant: "default" }),
      buttonVariants({ variant: "secondary" }),
      buttonVariants({ variant: "outline" }),
      buttonVariants({ variant: "ghost" }),
      buttonVariants({ variant: "destructive" }),
      buttonVariants({ variant: "link" }),
    ].join(" ")

    expect(variants).toContain("bg-[var(--button-primary-background)]")
    expect(variants).toContain("shadow-[var(--shadow-btn-primary-blue)]")
    expect(variants).toContain(
      "disabled:shadow-[var(--shadow-btn-primary-blue-disabled)]"
    )
    expect(buttonVariants({ variant: "link" })).toContain(
      "active:text-[var(--button-link-foreground-active)]"
    )
    expect(variants).not.toContain("color-mix")
    expect(variants).not.toContain("/80")
    expect(variants).not.toContain("disabled:opacity-50")
    expect(variants).not.toMatch(/var\(--color-/)
  })

  it("uses the primary-blue elevation contract on the Indigo default button", () => {
    const primary = buttonVariants({ variant: "default" })
    const normalShadow = tokens.match(
      /--shadow-btn-primary-blue:\s*([^;]+);/
    )?.[1]
    const normalize = (value: string | undefined) =>
      value?.toLowerCase().replace(/0px/g, "0").replace(/\s/g, "")

    expect(primary).toContain("bg-[var(--button-primary-background)]")
    expect(primary).toContain("shadow-[var(--shadow-btn-primary-blue)]")
    expect(primary).toContain(
      "hover:shadow-[var(--shadow-btn-primary-blue-hover)]"
    )
    expect(primary).toContain(
      "active:shadow-[var(--shadow-btn-primary-blue-pressed)]"
    )
    expect(normalize(normalShadow)).toBe(
      "01px2px0rgba(5,29,57,0.1),0000.5pxrgba(23,98,195,0.2)"
    )

    expect(buttonVariants({ variant: "outline" })).toContain(
      "shadow-[var(--shadow-btn-tertiary-black)]"
    )
  })

  it("keeps the pressed perimeter at 1px while retaining the exact keyboard focus shadow", () => {
    for (const token of [
      "--shadow-btn-primary-blue-pressed",
      "--shadow-btn-primary-red-pressed",
      "--shadow-btn-tertiary-black-pressed",
    ]) {
      const tokenValue = tokens.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1]
      const utilityValue = tokens.match(
        new RegExp(`\\.${token.slice(2)}\\s*\\{\\s*box-shadow:\\s*([^;]+);`)
      )?.[1]
      const normalize = (value: string | undefined) => value?.replace(/\s/g, "")

      expect(tokenValue, token).toBeDefined()
      expect(utilityValue, token).toBeDefined()
      expect(normalize(utilityValue), token).toBe(normalize(tokenValue))
      expect(tokenValue, token).toMatch(/0px 0px 0px 1px/)
      expect(tokenValue, token).not.toMatch(/0px 0px 0px 2px/)
    }

    for (const variant of [
      "default",
      "secondary",
      "outline",
      "destructive",
    ] as const) {
      const classes = buttonVariants({ variant })

      expect(classes, variant).toContain("border-transparent")
      expect(classes, variant).toContain("focus-visible:border-transparent")
      expect(classes, variant).toContain(
        "focus-visible:[box-shadow:var(--shadow-input-focused)]"
      )
      expect(classes, variant).not.toContain("focus-visible:ring-")
      expect(classes, variant).toContain("active:shadow-[var(--shadow-btn-")
    }

    const focusShadow = tokens.match(/--shadow-input-focused:\s*([^;]+);/)?.[1]
    const normalize = (value: string | undefined) =>
      value?.toLowerCase().replace(/0px/g, "0").replace(/\s/g, "")

    expect(normalize(focusShadow)).toBe(
      "00 01px#1479eb,00 03pxrgba(24,123,235,0.2),01px2pxrgba(0,0,0,0.25)".replace(
        /\s/g,
        ""
      )
    )
    expect(buttonVariants()).toContain(
      "aria-invalid:focus-visible:[box-shadow:var(--shadow-input-invalid-focused)]"
    )
  })

  it("rebinds every theme-sensitive Button, Badge, and Bubble role in dark mode", () => {
    for (const role of [
      "--button-primary-background",
      "--button-primary-background-hover",
      "--button-primary-background-active",
      "--button-primary-foreground",
      "--button-primary-disabled-background",
      "--button-primary-disabled-foreground",
      "--button-secondary-background",
      "--button-secondary-background-hover",
      "--button-secondary-background-active",
      "--button-secondary-foreground",
      "--button-secondary-disabled-background",
      "--button-secondary-disabled-foreground",
      "--button-outline-background",
      "--button-outline-background-hover",
      "--button-outline-background-active",
      "--button-outline-foreground",
      "--button-outline-foreground-active",
      "--button-outline-border",
      "--button-outline-disabled-background",
      "--button-outline-disabled-foreground",
      "--button-ghost-background",
      "--button-ghost-background-hover",
      "--button-ghost-background-active",
      "--button-ghost-foreground",
      "--button-ghost-disabled-foreground",
      "--button-destructive-background",
      "--button-destructive-background-hover",
      "--button-destructive-background-active",
      "--button-destructive-foreground",
      "--button-destructive-disabled-background",
      "--button-destructive-disabled-foreground",
      "--button-link-foreground",
      "--button-link-foreground-active",
      "--button-link-disabled-foreground",
      "--badge-default-background",
      "--badge-default-background-hover",
      "--badge-default-background-active",
      "--badge-default-foreground",
      "--badge-secondary-background",
      "--badge-secondary-background-hover",
      "--badge-secondary-background-active",
      "--badge-secondary-foreground",
      "--badge-destructive-background",
      "--badge-destructive-background-hover",
      "--badge-destructive-background-active",
      "--badge-destructive-foreground",
      "--bubble-primary-background",
      "--bubble-primary-background-hover",
      "--bubble-primary-background-active",
      "--bubble-primary-foreground",
      "--bubble-secondary-background",
      "--bubble-secondary-background-hover",
      "--bubble-secondary-background-active",
      "--bubble-secondary-foreground",
      "--bubble-muted-background-active",
      "--bubble-tinted-background-active",
      "--bubble-outline-background-active",
      "--bubble-ghost-background-active",
    ]) {
      expect(darkTokens).toContain(`${role}:`)
    }
  })

  it("maps public sizes to the ECOYA 32px default, 40px large, and 24px extra-small scale", () => {
    const expectedClasses = {
      default: ["h-[var(--control-size-sm)]", "px-3", "rounded-[var(--r-md)]"],
      sm: ["h-[var(--control-size-sm)]", "px-3", "rounded-[var(--r-md)]"],
      lg: ["h-[var(--control-size-md)]", "px-4", "rounded-[var(--r-md)]"],
      xs: ["h-[var(--control-size-xs)]", "px-2", "rounded-[var(--r-sm)]"],
      icon: [
        "size-[var(--control-size-sm)]",
        "size-5",
        "rounded-[var(--r-md)]",
      ],
      "icon-sm": [
        "size-[var(--control-size-sm)]",
        "size-5",
        "rounded-[var(--r-md)]",
      ],
      "icon-lg": [
        "size-[var(--control-size-md)]",
        "size-5",
        "rounded-[var(--r-md)]",
      ],
      "icon-xs": [
        "size-[var(--control-size-xs)]",
        "size-4",
        "rounded-[var(--r-sm)]",
      ],
    } as const

    for (const [size, classes] of Object.entries(expectedClasses)) {
      const variantClasses = buttonVariants({
        size: size as keyof typeof expectedClasses,
      })

      for (const className of classes) {
        expect(variantClasses).toContain(className)
      }
    }
  })

  it("defines the shared control and calendar dimension roles", () => {
    for (const [token, value] of [
      ["--control-size-xs", "24px"],
      ["--control-size-sm", "32px"],
      ["--control-size-md", "40px"],
      ["--button-spinner-size-xs", "14px"],
      ["--button-spinner-size-sm", "18px"],
      ["--button-spinner-size-md", "20px"],
      ["--calendar-cell-size", "40px"],
      ["--calendar-day-width", "26px"],
      ["--calendar-day-height", "28px"],
      ["--calendar-nav-size", "24px"],
    ]) {
      expect(tokens).toContain(`${token}: ${value}`)
    }
  })
})

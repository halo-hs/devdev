import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const menuComponents = [
  "select",
  "dropdown-menu",
  "context-menu",
  "menubar",
] as const

function source(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

describe("ECOYA menu semantic and density contract", () => {
  it("keeps floating surfaces on the shared surface roles", () => {
    for (const component of menuComponents) {
      const componentSource = source(component)

      expect(componentSource).toContain("bg-[var(--surface-background)]")
      expect(componentSource).toContain("text-[var(--surface-foreground)]")
      expect(componentSource).toContain("ring-[var(--surface-border)]")
      expect(componentSource).toContain("shadow-[var(--shadow-filter)]")
    }
  })

  it("uses the 40px item role and the legacy 16px/8px item padding", () => {
    const selectSource = source("select")

    expect(selectSource).toContain("min-h-[var(--control-size-md)]")
    expect(selectSource).toContain("py-2 pr-8 pl-4")
    expect(selectSource).toContain("typo-body-8 font-normal")

    for (const component of [
      "dropdown-menu",
      "context-menu",
      "menubar",
    ] as const) {
      const componentSource = source(component)

      expect(componentSource).toContain(
        "min-h-[var(--control-size-md)] cursor-default"
      )
      expect(componentSource).toContain("px-4 py-2")
    }
  })

  it("keeps Select typography and interactive control states on ECOYA roles", () => {
    const selectSource = source("select")

    expect(selectSource).toContain("text-[length:var(--text-body-8)]")
    expect(selectSource).toContain("leading-[var(--leading-body-8)]")
    expect(selectSource).toContain("typo-label-2")
    expect(selectSource).toContain("hover:bg-[var(--control-background-hover)]")
    expect(selectSource).toContain(
      "data-[state=open]:bg-[var(--control-background-open)]"
    )
    expect(selectSource).toContain(
      "focus-visible:shadow-[var(--shadow-input-focused)]"
    )
    expect(selectSource).toContain(
      "aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]"
    )
    expect(selectSource).toContain("--control-accessory-foreground")
  })

  it("routes hover, pressed, selection, and disabled states through menu roles", () => {
    for (const component of menuComponents) {
      const componentSource = source(component)

      expect(componentSource).toContain("text-[var(--menu-item-foreground)]")
      expect(componentSource).toContain(
        "hover:bg-[var(--menu-item-background-hover)]"
      )
      expect(componentSource).toContain(
        "focus:bg-[var(--menu-item-background-hover)]"
      )
      expect(componentSource).toContain(
        "active:bg-[var(--menu-item-background-active)]"
      )
      expect(componentSource).toContain(
        "bg-[var(--menu-item-selected-background)]"
      )
      expect(componentSource).toContain(
        "data-disabled:text-[var(--menu-item-disabled-foreground)]"
      )
      expect(componentSource).toContain("data-disabled:opacity-100")
    }
  })

  it("keeps selected and open menu states above the transient pressed state", () => {
    expect(source("select")).toContain(
      "data-[state=checked]:active:bg-[var(--menu-item-selected-background)]"
    )

    for (const component of ["dropdown-menu", "context-menu", "menubar"]) {
      const componentSource = source(component)

      expect(componentSource).toContain(
        "data-[state=checked]:active:bg-[var(--menu-item-selected-background)]"
      )
      expect(componentSource).toContain(
        "data-open:active:bg-[var(--menu-item-selected-background)]"
      )
      expect(componentSource).toContain(
        "data-[variant=destructive]:active:bg-[var(--badge-destructive-background-active)]"
      )
    }

    expect(source("menubar")).toContain(
      "aria-expanded:active:bg-[var(--menu-item-selected-background)]"
    )

    const navigationMenu = source("navigation-menu")
    expect(navigationMenu).toContain(
      "active:bg-[var(--menu-item-background-active)]"
    )
    expect(navigationMenu).toContain(
      "data-popup-open:active:bg-[var(--menu-item-selected-background)]"
    )
    expect(navigationMenu).toContain(
      "data-open:active:bg-[var(--menu-item-selected-background)]"
    )
    expect(navigationMenu).toContain(
      "data-active:active:bg-[var(--menu-item-selected-background)]"
    )

    const command = source("command")
    expect(command).toContain("active:bg-[var(--menu-item-background-active)]")
    expect(command).toContain(
      "data-selected:active:bg-[var(--menu-item-selected-background)]"
    )
  })

  it("does not bypass semantic roles with palette or shadcn aliases", () => {
    for (const component of menuComponents) {
      const componentSource = source(component)

      expect(componentSource).not.toMatch(/--color-(?:gray|system-blue|red)-/)
      expect(componentSource).not.toMatch(
        /(?:bg|text)-(?:popover|secondary|muted|accent|border)/
      )
      expect(componentSource).not.toContain(
        "--control-selected-soft-background"
      )
      expect(componentSource).not.toContain("data-disabled:opacity-50")
    }
  })
})

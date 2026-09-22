import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function source(component: "combobox" | "command") {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

describe("ECOYA command and combobox token contract", () => {
  it.each(["command", "combobox"] as const)(
    "%s uses shared surface, control, and menu roles",
    (component) => {
      const componentSource = source(component)

      expect(componentSource).toContain("--control-size-md")
      expect(componentSource).toContain("--surface-background")
      expect(componentSource).toContain("--surface-foreground")
      expect(componentSource).toContain("--surface-muted-foreground")
      expect(componentSource).toContain("--surface-border")
      expect(componentSource).toContain("--menu-item-background-hover")
      expect(componentSource).toContain("--menu-item-selected-background")
      expect(componentSource).toContain("--menu-item-disabled-foreground")
    }
  )

  it("keeps command search and rows on the canonical type scale", () => {
    const command = source("command")

    expect(command).toContain("text-[length:var(--text-body-9)]")
    expect(command).toContain("leading-[var(--leading-body-9)]")
    expect(command).toContain("typo-body-9")
    expect(command).toContain("typo-body-10")
    expect(command).toContain("]]:typo-label-2")
    expect(command).toContain("typo-label-3")
  })

  it("keeps combobox options and chips at the inherited ECOYA density", () => {
    const combobox = source("combobox")

    expect(combobox).toContain("typo-body-8")
    expect(combobox).not.toContain("typo-body-9")
    expect(combobox).toContain("text-[length:var(--text-body-8)]")
    expect(combobox).toContain("leading-[var(--leading-body-8)]")
    expect(combobox).toContain("typo-body-10")
    expect(combobox).toContain("typo-label-2")
    expect(combobox).toContain("typo-button-3")
    expect(combobox).toContain("h-[var(--control-size-xs)]")
    expect(combobox).toContain("--badge-default-background")
    expect(combobox).toContain("--badge-default-foreground")
    expect(combobox).toContain(
      "has-[[data-slot=combobox-chip-input]:disabled]:bg-[var(--control-disabled-background)]"
    )
    expect(combobox).toContain(
      "data-[disabled]:bg-[var(--control-disabled-background)]"
    )
    expect(combobox).toContain(
      "data-[disabled]:text-[var(--control-disabled-foreground)]"
    )
    expect(combobox).toContain(
      "aria-disabled:bg-[var(--control-disabled-background)]"
    )
    expect(combobox).toContain(
      "aria-disabled:text-[var(--control-disabled-foreground)]"
    )
    expect(combobox).not.toContain("has-disabled:")
    expect(combobox).toContain(
      "data-[selected]:bg-[var(--menu-item-selected-background)]"
    )
    expect(combobox).not.toContain(
      "data-selected:bg-[var(--menu-item-selected-background)]"
    )
  })

  it("isolates combobox accessories from the generic ghost button palette", () => {
    const combobox = source("combobox")

    for (const role of [
      "--control-accessory-foreground",
      "--control-clear-foreground",
      "--control-clear-foreground-hover",
      "--control-accessory-background-hover",
      "--control-accessory-background-open",
    ]) {
      expect(combobox).toContain(role)
    }

    expect(combobox).not.toContain("data-pressed:bg-transparent")
  })

  it.each(["command", "combobox"] as const)(
    "%s avoids generic shadcn color and disabled-opacity fallbacks",
    (component) => {
      const componentSource = source(component)

      expect(componentSource).not.toMatch(
        /\b(?:bg|text)-(?:border|foreground|muted|muted-foreground|popover|popover-foreground)\b/
      )
      expect(componentSource).not.toContain("disabled:opacity-50")
      expect(componentSource).not.toContain("data-disabled:opacity-50")
      expect(componentSource).not.toContain("has-disabled:opacity-50")
    }
  )
})

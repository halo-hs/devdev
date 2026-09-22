import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function projectSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
}

const select = projectSource("src/components/ui/select.tsx")
const combobox = projectSource("src/components/ui/combobox.tsx")
const inputGroup = projectSource("src/components/ui/input-group.tsx")
const comboboxSelect = projectSource(
  "src/components/extensions/combobox-select.tsx"
)
const multipleSelect = projectSource(
  "src/components/extensions/multiple-select.tsx"
)

describe("ECOYA select family state-token contract", () => {
  it("keeps Select typography and every control state on semantic roles", () => {
    for (const role of [
      "--text-body-8",
      "--leading-body-8",
      "--control-background",
      "--control-background-hover",
      "--control-background-active",
      "--control-background-open",
      "--control-border",
      "--control-border-hover",
      "--control-border-active",
      "--control-focus-border",
      "--control-disabled-background",
      "--control-disabled-foreground",
      "--control-disabled-border",
      "--control-invalid-border",
      "--control-placeholder",
    ]) {
      expect(select).toContain(role)
    }

    expect(select).toContain(
      "aria-invalid:active:border-[var(--control-invalid-border)]"
    )
    expect(select).toContain(
      "aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]"
    )
    expect(select).toContain(
      "aria-invalid:data-[state=open]:shadow-[var(--shadow-input-invalid-open)]"
    )
    expect(select).not.toContain("disabled:opacity-50")
  })

  it("keeps Select and Combobox rows on menu hover, pressed, selected, and disabled roles", () => {
    for (const component of [select, combobox]) {
      expect(component).toContain("typo-body-8")
      expect(component).toContain("--menu-item-background-hover")
      expect(component).toContain("--menu-item-background-active")
      expect(component).toContain("--menu-item-selected-background")
      expect(component).toContain("--menu-item-disabled-foreground")
    }

    expect(select).toContain(
      "data-[state=checked]:active:bg-[var(--menu-item-selected-background)]"
    )
    expect(combobox).toContain(
      "data-[selected]:active:bg-[var(--menu-item-selected-background)]"
    )
  })

  it("inherits Combobox focus, open, disabled, and invalid behavior while adding pressed priority", () => {
    for (const role of [
      "--control-background-hover",
      "--control-focus-border",
      "--control-background-open",
      "--control-disabled-background",
      "--control-disabled-foreground",
      "--control-disabled-border",
      "--control-invalid-border",
    ]) {
      expect(inputGroup).toContain(role)
    }

    expect(combobox).toContain("active:border-[var(--control-border-active)]")
    expect(combobox).toContain(
      "has-[[data-slot=input-group-control][aria-invalid=true]]:active:border-[var(--control-invalid-border)]"
    )
    expect(combobox).toContain(
      "has-[[data-slot=input-group-control][aria-invalid=true][data-popup-open]]:shadow-[var(--shadow-input-invalid-open)]"
    )
    expect(combobox).toContain(
      "disabled:placeholder:text-[var(--control-disabled-foreground)]"
    )
  })

  it("keeps MultipleSelect chips and its anchor on explicit state roles", () => {
    for (const role of [
      "--badge-default-background",
      "--badge-default-background-hover",
      "--badge-default-background-active",
      "--badge-default-foreground",
      "--control-background-open",
      "--control-border-active",
      "--control-invalid-border",
      "--control-disabled-background",
      "--control-disabled-foreground",
    ]) {
      expect(combobox).toContain(role)
    }

    expect(combobox).toContain(
      "has-[[data-slot=combobox-chip-input][data-popup-open]]:border-[var(--control-focus-border)]"
    )
    expect(combobox).toContain(
      "has-[[data-slot=combobox-chip-input][aria-invalid=true][data-popup-open]]:shadow-[var(--shadow-input-invalid-open)]"
    )
    expect(combobox).toContain(
      "aria-disabled:bg-[var(--control-disabled-background)]"
    )
    expect(multipleSelect).toContain("aria-invalid={isInvalid || undefined}")
    expect(multipleSelect).toContain(
      "aria-disabled={option.disabled || undefined}"
    )
  })

  it("keeps ComboboxSelect and MultipleSelect free of local palette and typography overrides", () => {
    expect(comboboxSelect).toContain("border-[var(--surface-border)]")

    for (const component of [comboboxSelect, multipleSelect]) {
      expect(component).not.toMatch(/#[\da-f]{3,8}\b/i)
      expect(component).not.toMatch(/\b(?:text|leading)-\[(?:\d|\.)/)
      expect(component).not.toContain("disabled:opacity-50")
    }
  })
})

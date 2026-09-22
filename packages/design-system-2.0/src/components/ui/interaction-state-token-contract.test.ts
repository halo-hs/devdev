import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const tokens = readFileSync(resolve(process.cwd(), "src/tokens.css"), "utf8")

function uiSource(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

function extensionSource(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/extensions/${component}.tsx`),
    "utf8"
  )
}

function publicComponentSources() {
  return ["ui", "extensions"].flatMap((directory) =>
    readdirSync(resolve(process.cwd(), `src/components/${directory}`))
      .filter((file) => file.endsWith(".tsx") && !file.includes(".test."))
      .map((file) => ({
        file: `${directory}/${file}`,
        contents: readFileSync(
          resolve(process.cwd(), `src/components/${directory}/${file}`),
          "utf8"
        ),
      }))
  )
}

describe("ECOYA interaction-state token contract", () => {
  it("keeps control hover, pressed, and open states explicit", () => {
    expect(tokens).toContain("--control-background-hover: var(--color-gray-12)")
    expect(tokens).toContain(
      "--control-background-active: var(--color-gray-12)"
    )
    expect(tokens).toContain("--control-background-open: var(--color-gray-12)")
    expect(tokens).toContain("--control-border-hover: transparent")
    expect(tokens).toContain("--control-border-active: var(--color-primary-1)")
    expect(tokens).toContain("--control-focus-border: transparent")
  })

  it("keeps list hover, pressed, and selected backgrounds explicit", () => {
    expect(tokens).toContain(
      "--menu-item-background-hover: var(--color-gray-10)"
    )
    expect(tokens).toContain(
      "--menu-item-selected-background: var(--color-system-blue-6)"
    )
    expect(tokens).toContain(
      "--menu-item-background-active: var(--color-gray-10)"
    )
  })

  it("keeps control accessories neutral and background-free", () => {
    expect(tokens).toContain(
      "--control-accessory-foreground: var(--color-gray-5)"
    )
    expect(tokens).toContain("--control-clear-foreground: var(--color-gray-7)")
    expect(tokens).toContain(
      "--control-clear-foreground-hover: var(--color-gray-5)"
    )
    expect(tokens).toContain(
      "--control-accessory-background-hover: transparent"
    )
    expect(tokens).toContain("--control-accessory-background-open: transparent")
  })

  it("maps calendar interaction states to ECOYA semantic roles", () => {
    expect(tokens).toContain(
      "--calendar-day-background-hover: var(--menu-item-background-hover)"
    )
    expect(tokens).toContain(
      "--calendar-day-background-active: var(--menu-item-background-active)"
    )
    expect(tokens).toContain(
      "--calendar-day-selected-background: var(--color-primary-4)"
    )
    expect(tokens).toContain(
      "--calendar-range-background: var(--control-selected-soft-background)"
    )
    expect(tokens).toContain("--calendar-today-border: var(--color-primary-4)")
  })

  it("routes toggle and tabs interaction states through component roles", () => {
    const toggle = uiSource("toggle")
    const tabs = uiSource("tabs")

    for (const role of [
      "--toggle-background-hover",
      "--toggle-background-active",
      "--toggle-foreground-hover",
      "--toggle-background-selected",
      "--toggle-foreground-selected",
      "--toggle-disabled-foreground",
    ]) {
      expect(toggle).toContain(role)
    }
    expect(toggle).not.toContain("disabled:opacity-50")
    expect(toggle).toContain(
      "aria-pressed:active:bg-[var(--toggle-background-selected)]"
    )
    expect(toggle).toContain(
      "data-[state=on]:active:bg-[var(--toggle-background-selected)]"
    )

    for (const role of [
      "--tabs-list-background",
      "--tabs-trigger-foreground-hover",
      "--tabs-trigger-background-active",
      "--tabs-trigger-background-selected",
      "--tabs-trigger-foreground-selected",
      "--tabs-indicator",
      "--tabs-trigger-disabled-foreground",
    ]) {
      expect(tabs).toContain(role)
    }
    expect(tabs).not.toContain("disabled:opacity-50")
    expect(tabs).toContain(
      "data-active:active:bg-[var(--tabs-trigger-background-selected)]"
    )
    expect(tabs).toContain(
      "group-data-[variant=line]/tabs-list:active:bg-transparent"
    )
  })

  it("routes switch and slider states through component roles", () => {
    const switchSource = uiSource("switch")
    const slider = uiSource("slider")

    for (const role of [
      "--switch-track-unchecked",
      "--switch-track-disabled-checked",
      "--switch-track-disabled-unchecked",
      "--switch-thumb-disabled",
    ]) {
      expect(switchSource).toContain(role)
    }
    expect(switchSource).toContain(
      "active:border-[var(--control-border-active)]"
    )

    for (const role of [
      "--slider-track-background",
      "--slider-range-background",
      "--slider-thumb-border",
      "--shadow-keyboard-focus",
      "--slider-disabled-background",
      "--slider-disabled-foreground",
    ]) {
      expect(slider).toContain(role)
    }
    expect(slider).not.toContain("data-disabled:opacity-50")
    expect(slider).not.toContain("disabled:opacity-50")
  })

  it("uses shared focus roles for non-input interactive primitives", () => {
    for (const component of [
      "accordion",
      "attachment",
      "badge",
      "bubble",
      "item",
      "resizable",
      "scroll-area",
    ]) {
      expect(uiSource(component)).toContain("--shadow-keyboard-focus")
    }

    for (const component of ["switch", "tabs", "toggle"]) {
      expect(uiSource(component)).toContain("--shadow-keyboard-focus")
    }

    for (const component of ["badge", "switch", "toggle"]) {
      expect(uiSource(component)).not.toContain("ring-destructive/20")
    }

    expect(uiSource("resizable")).not.toContain(
      "active:ring-[var(--focus-ring)]"
    )
  })

  it("keeps every public focus treatment on canonical roles", () => {
    expect(tokens.match(/--focus-invalid-ring:/g)).toHaveLength(2)

    for (const { file, contents } of publicComponentSources()) {
      expect(contents, file).not.toMatch(
        /\b(?:ring|border)-(?:ring|destructive)(?:\/[\w.]+)?/
      )
    }
  })

  it("uses explicit disabled roles without opacity mixing", () => {
    const accordion = uiSource("accordion")
    const field = uiSource("field")
    const sidebar = uiSource("sidebar")
    const requiredLabel = extensionSource("required-label")

    expect(accordion).toContain(
      "disabled:text-[var(--control-disabled-foreground)]"
    )
    expect(accordion).toContain("active:bg-[var(--control-background-active)]")
    expect(accordion).toContain("active:border-[var(--control-border-active)]")
    expect(accordion).not.toContain("disabled:opacity-50")
    expect(field).toContain(
      "group-data-[disabled=true]/field:text-[var(--control-disabled-foreground)]"
    )
    expect(field).not.toContain("group-data-[disabled=true]/field:opacity-50")
    expect(sidebar).toContain(
      "disabled:bg-[var(--sidebar-disabled-background)]"
    )
    expect(sidebar).toContain(
      "aria-disabled:text-[var(--sidebar-disabled-foreground)]"
    )
    expect(sidebar).toContain("active:bg-sidebar-accent")
    expect(sidebar).toContain("data-open:bg-sidebar-accent")
    expect(sidebar).toContain("data-active:bg-sidebar-accent")
    expect(sidebar).not.toContain("disabled:opacity-50")
    expect(sidebar).not.toContain("aria-disabled:opacity-50")
    expect(requiredLabel).toContain("--control-disabled-foreground")
    expect(requiredLabel).not.toContain("opacity-50")
  })

  it("routes selected, destructive, and modal surface states through roles", () => {
    const field = uiSource("field")
    const bubble = uiSource("bubble")

    expect(field).toContain(
      "has-data-checked:border-[var(--control-selected-border)]"
    )
    expect(field).toContain("[&>a:hover]:text-[var(--button-link-foreground)]")
    expect(field).toContain(
      "[&>a:active]:text-[var(--button-link-foreground-active)]"
    )
    expect(bubble).toContain("--bubble-destructive-background")
    expect(bubble).toContain("--bubble-destructive-background-hover")
    expect(bubble).toContain("--bubble-destructive-background-active")
    expect(bubble).toContain("--bubble-destructive-foreground")

    for (const component of ["dialog", "alert-dialog"]) {
      const componentSource = uiSource(component)

      expect(componentSource).toContain("border-[var(--surface-border)]")
      expect(componentSource).toContain("bg-[var(--surface-background)]")
      expect(componentSource).toContain("text-[var(--surface-foreground)]")
      expect(componentSource).toContain(
        "text-[var(--surface-muted-foreground)]"
      )
    }
  })

  it("routes body links and selectable choices through explicit pressed roles", () => {
    for (const component of [
      "accordion",
      "alert",
      "alert-dialog",
      "breadcrumb",
      "dialog",
      "empty",
      "field",
      "item",
      "marker",
    ]) {
      expect(uiSource(component)).toContain("--button-link-foreground-active")
    }

    const questionnaire = uiSource("questionnaire")
    expect(questionnaire).toContain(
      "active:border-[var(--control-border-active)]"
    )
    expect(questionnaire).toContain(
      "active:bg-[var(--control-background-active)]"
    )
    expect(questionnaire).toContain(
      "data-checked:active:bg-[var(--control-selected-soft-background)]"
    )
  })
})

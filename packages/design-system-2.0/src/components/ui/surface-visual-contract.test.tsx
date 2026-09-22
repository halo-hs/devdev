import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function source(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

describe("ECOYA surface visual contract", () => {
  it("uses the shared dim and modal elevation for blocking overlays", () => {
    for (const component of ["dialog", "alert-dialog", "sheet", "drawer"]) {
      const componentSource = source(component)

      expect(componentSource).toContain("bg-[var(--overlay-dim)]")
      expect(componentSource).toContain("shadow-[var(--shadow-modal)]")
      expect(componentSource).toMatch(
        /border-\[var\(--(?:color-gray-10|surface-border)\)\]/
      )
      expect(componentSource).not.toContain("bg-black/10")
    }
  })

  it("keeps floating surfaces on the ECOYA layer tokens", () => {
    for (const component of [
      "popover",
      "hover-card",
      "dropdown-menu",
      "context-menu",
      "menubar",
      "navigation-menu",
      "combobox",
    ]) {
      const componentSource = source(component)

      expect(componentSource).toMatch(
        /bg-\[var\(--(?:color-gray-12|surface-background)\)\]/
      )
      expect(componentSource).toMatch(
        /text-\[var\(--(?:color-gray-2|surface-foreground)\)\]/
      )
      expect(componentSource).toContain("shadow-[var(--shadow-filter)]")
      expect(componentSource).toMatch(
        /ring-\[var\(--(?:color-gray-10|surface-border)\)\]/
      )
    }
  })

  it("keeps popovers inside the available viewport without shifting layout", () => {
    const popoverSource = source("popover")

    expect(popoverSource).toContain("collisionPadding = 8")
    expect(popoverSource).toContain("collisionPadding={collisionPadding}")
    expect(popoverSource).toContain(
      "max-h-[var(--radix-popover-content-available-height)]"
    )
    expect(popoverSource).toContain(
      "max-w-[var(--radix-popover-content-available-width)]"
    )
    expect(popoverSource).toContain("overflow-y-auto")
    expect(popoverSource).toContain("overscroll-contain")

    const comboboxSource = source("combobox")
    expect(comboboxSource).toContain(
      "min-w-[min(calc(var(--anchor-width)+--spacing(7)),var(--available-width))]"
    )
    expect(comboboxSource).toContain(
      "data-[chips=true]:min-w-[min(var(--anchor-width),var(--available-width))]"
    )
  })

  it("uses neutral hover, soft selection, and explicit disabled menu states", () => {
    for (const component of ["dropdown-menu", "context-menu", "menubar"]) {
      const componentSource = source(component)

      expect(componentSource).toMatch(
        /focus:bg-\[var\(--(?:color-gray-10|menu-item-background-hover)\)\]/
      )
      expect(componentSource).toMatch(
        /data-\[state=checked\]:bg-\[var\(--(?:color-system-blue-6|menu-item-selected-background)\)\]/
      )
      expect(componentSource).toMatch(
        /data-disabled:text-\[var\(--(?:color-gray-7|menu-item-disabled-foreground)\)\]/
      )
      expect(componentSource).not.toContain("data-disabled:opacity-50")
    }

    const comboboxSource = source("combobox")
    expect(comboboxSource).toContain(
      "data-highlighted:bg-[var(--menu-item-background-hover)]"
    )
    expect(comboboxSource).toContain(
      "data-[selected]:bg-[var(--menu-item-selected-background)]"
    )
    expect(comboboxSource).toContain(
      "data-disabled:text-[var(--menu-item-disabled-foreground)]"
    )
    expect(comboboxSource).not.toContain("data-disabled:opacity-50")
  })

  it("restores card, table, calendar, and command product defaults", () => {
    const cardSource = source("card")
    expect(cardSource).toContain("shadow-[var(--shadow-section)]")
    expect(cardSource).toContain("text-[length:var(--text-header-6)]")
    expect(cardSource).toContain("leading-[var(--leading-header-6)]")
    expect(cardSource).toContain("px-5 py-3")
    expect(cardSource).toContain("px-5 py-6")

    const tableSource = source("table")
    expect(tableSource).toContain("bg-[var(--table-header-background)]")
    expect(tableSource).toContain("[&_tr]:border-[var(--table-border)]")
    expect(tableSource).toContain("[&_tr]:bg-[var(--table-header-background)]")
    expect(tableSource).not.toContain("h-11")
    expect(tableSource.match(/px-3 py-3/g)).toHaveLength(2)
    expect(tableSource).toContain("border-[var(--table-border)]")
    expect(tableSource).toContain(
      "hover:[&>td]:bg-[var(--table-row-background-hover)]"
    )
    expect(tableSource).toContain(
      "data-[clickable=true]:active:[&>td]:bg-[var(--table-row-background-active)]"
    )
    expect(tableSource).toContain(
      "data-[state=selected]:[&>td]:bg-[var(--table-row-background-selected)]!"
    )
    expect(tableSource).not.toContain("bg-[var(--color-primary-10)]")

    const calendarSource = source("calendar")
    expect(calendarSource).toContain("bg-[var(--calendar-background)]")
    expect(calendarSource).toContain("bg-[var(--calendar-range-background)]")
    expect(calendarSource).toContain(
      "bg-[var(--calendar-day-selected-background)]!"
    )

    const commandSource = source("command")
    expect(commandSource).toContain("h-[var(--control-size-md)]!")
    expect(commandSource).toContain(
      "data-selected:bg-[var(--menu-item-selected-background)]"
    )
    expect(commandSource).toContain(
      "data-[disabled=true]:text-[var(--menu-item-disabled-foreground)]"
    )
    expect(commandSource).not.toContain("data-[disabled=true]:opacity-50")
  })
})

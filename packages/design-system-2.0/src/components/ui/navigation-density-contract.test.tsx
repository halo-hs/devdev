import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function source(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

describe("ECOYA navigation density contract", () => {
  it("keeps top-level navigation triggers on the compact control role", () => {
    const navigationMenuSource = source("navigation-menu")
    const menubarSource = source("menubar")

    expect(navigationMenuSource).toContain("h-[var(--control-size-sm)] w-max")
    expect(navigationMenuSource).not.toContain(
      "navigation-menu-trigger inline-flex h-10"
    )

    expect(menubarSource).toContain(
      "flex h-[var(--control-size-sm)] items-center"
    )
    expect(menubarSource).not.toContain("flex h-10 items-center")
    expect(menubarSource).toContain(
      "min-h-[var(--control-size-md)] cursor-default"
    )
    expect(menubarSource).not.toContain("min-h-10 cursor-default")
  })

  it("makes pagination compact by default without removing size overrides", () => {
    const paginationSource = source("pagination")

    expect(paginationSource).toContain('size = "icon-sm"')
    expect(paginationSource).toContain(
      'size === "icon-sm" && "size-[var(--control-size-sm)]"'
    )
    expect(paginationSource).toContain(
      'size === "sm" && "h-[var(--control-size-sm)]"'
    )
    expect(paginationSource).toContain('size="sm"')
    expect(paginationSource).toContain("size-[var(--control-size-sm)]")
  })

  it("maps Sidebar size variants to the shared component dimensions", () => {
    const sidebarSource = source("sidebar")

    expect(sidebarSource).toContain(
      'default: "h-[var(--control-size-sm)] text-sm"'
    )
    expect(sidebarSource).toContain('sm: "h-[var(--control-size-xs)] text-xs"')
    expect(sidebarSource).toContain('lg: "h-[var(--control-size-md)] text-sm')
    expect(sidebarSource).toContain("h-[var(--control-size-xs)] min-w-0")
    expect(sidebarSource).not.toContain('lg: "h-12 text-sm')
  })
})

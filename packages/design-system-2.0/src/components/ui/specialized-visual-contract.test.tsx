import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function source(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

describe("ECOYA specialized visual contract", () => {
  it("keeps chart surfaces on semantic ECOYA roles", () => {
    const chartSource = source("chart")

    expect(chartSource).toContain("rounded-[var(--r-lg)]")
    expect(chartSource).toContain("border-[var(--surface-border)]")
    expect(chartSource).toContain("bg-[var(--surface-background)]")
    expect(chartSource).toContain("shadow-[var(--shadow-filter)]")
    expect(chartSource).toContain("stroke-[var(--surface-border)]")
    expect(chartSource).not.toContain("border-border/50")
    expect(chartSource).not.toContain("stroke-border/50")
    expect(chartSource).not.toContain("shadow-xl")
  })

  it("maps Sonner onto surface and radius roles", () => {
    const sonnerSource = source("sonner")

    expect(sonnerSource).toContain('"var(--surface-background)"')
    expect(sonnerSource).toContain('"var(--surface-foreground)"')
    expect(sonnerSource).toContain('"var(--surface-border)"')
    expect(sonnerSource).toContain('"var(--r-md)"')
    expect(sonnerSource).not.toContain('"var(--radius)"')
  })

  it("uses surface text roles for breadcrumb states", () => {
    const breadcrumbSource = source("breadcrumb")

    expect(breadcrumbSource).toContain("var(--surface-muted-foreground)")
    expect(breadcrumbSource).toContain("hover:text-[var(--surface-foreground)]")
    expect(breadcrumbSource).toContain(
      "active:text-[var(--button-link-foreground-active)]"
    )
    expect(breadcrumbSource).not.toContain("hover:text-foreground")
  })

  it("uses an explicit disabled role instead of label opacity", () => {
    const labelSource = source("label")

    expect(labelSource).toContain("var(--control-disabled-foreground)")
    expect(labelSource).toContain("peer-disabled:opacity-100")
    expect(labelSource).not.toContain("opacity-50")
  })
})

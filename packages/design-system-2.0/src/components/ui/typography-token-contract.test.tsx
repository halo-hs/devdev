import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const typographyComponents = [
  "badge",
  "toggle",
  "table",
  "calendar",
  "card",
  "questionnaire",
] as const

function source(component: (typeof typographyComponents)[number]) {
  return readFileSync(
    resolve(process.cwd(), "src/components/ui", `${component}.tsx`),
    "utf8"
  )
}

describe("public UI typography token contract", () => {
  it.each(typographyComponents)(
    "%s has no raw numeric typography escape hatch",
    (component) => {
      const contents = source(component)

      expect(contents).not.toMatch(/\b(?:text|leading)-\[(?:\d|\.\d)/)
      expect(contents).not.toContain("leading-snug")
    }
  )

  it("does not override bridged ECOYA line heights with Tailwind modifiers", () => {
    for (const directory of ["ui", "extensions"]) {
      for (const file of readdirSync(
        resolve(process.cwd(), `src/components/${directory}`)
      ).filter((name) => name.endsWith(".tsx") && !name.includes(".test."))) {
        const contents = readFileSync(
          resolve(process.cwd(), `src/components/${directory}/${file}`),
          "utf8"
        )

        expect(contents, `${directory}/${file}`).not.toMatch(
          /\btext-(?:xs|sm|base|lg|xl|2xl)\/[^\s"']+/
        )
      }
    }
  })

  it("maps component typography to canonical ECOYA roles", () => {
    expect(source("badge")).toContain("--text-badge-sm")
    expect(source("badge")).toContain("--leading-badge-sm")
    expect(source("badge")).toContain("--text-badge-default")
    expect(source("badge")).toContain("--leading-badge-default")
    expect(source("badge")).toContain("--text-badge-lg")
    expect(source("badge")).toContain("--leading-badge-lg")
    expect(source("toggle")).toContain("typo-btn3m")
    expect(source("toggle")).toContain("typo-btn2m")
    expect(source("toggle")).toContain("--control-size-md")
    expect(source("toggle")).toContain("--control-size-sm")
    expect(source("table")).toContain("typo-b9m")
    expect(source("table")).toContain("typo-b9r")
    expect(source("calendar")).toContain("--text-body-10")
    expect(source("calendar")).toContain("--leading-body-10")
    expect(source("calendar")).toContain("--text-header-9")
    expect(source("calendar")).toContain("--leading-header-9")
    expect(source("card")).toContain("--text-header-6")
    expect(source("card")).toContain("--text-header-9")
    expect(source("questionnaire")).toContain("typo-b7m")
    expect(source("questionnaire")).toContain("typo-b9r")
    expect(source("questionnaire")).toContain("--text-label-3")
  })
})

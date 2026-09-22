import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const tokens = readFileSync(resolve(process.cwd(), "src/tokens.css"), "utf8")

function source(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

describe("keyboard focus shadow contract", () => {
  it("aliases the exact ECOYA focus shadows through shared interaction roles", () => {
    const normalize = (value: string | undefined) =>
      value?.toLowerCase().replace(/0px/g, "0").replace(/\s/g, "")
    const focusShadow = tokens.match(/--shadow-input-focused:\s*([^;]+);/)?.[1]

    expect(normalize(focusShadow)).toBe(
      "0001px#1479eb,0003pxrgba(24,123,235,0.2),01px2pxrgba(0,0,0,0.25)"
    )
    expect(tokens).toContain(
      "--shadow-keyboard-focus: var(--shadow-input-focused);"
    )
    expect(tokens).toContain(
      "--shadow-keyboard-focus-invalid: var(--shadow-input-invalid-focused);"
    )
  })

  it("uses the shared shadow only for focus-visible across selection and navigation", () => {
    for (const component of [
      "checkbox",
      "radio-group",
      "switch",
      "toggle",
      "tabs",
      "sidebar",
      "navigation-menu",
    ]) {
      const contents = source(component)

      expect(contents, component).toContain(
        "focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
      )
      expect(contents, component).not.toContain("focus-visible:ring-")
      expect(contents, component).not.toContain("focus-visible:outline-")
      expect(contents, component).not.toMatch(
        /(?:hover|active):\[box-shadow:var\(--shadow-keyboard-focus\)\]/
      )
    }
  })

  it("keeps invalid glow keyboard-only on selection controls", () => {
    for (const component of ["checkbox", "radio-group", "switch", "toggle"]) {
      const contents = source(component)

      expect(contents, component).toContain(
        "aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)]"
      )
      expect(contents, component).not.toContain(
        "aria-invalid:[box-shadow:var(--shadow-keyboard-focus-invalid)]"
      )
    }
  })

  it("does not retain generic focus rings or pointer focus halos in public components", () => {
    for (const directory of ["ui", "extensions"]) {
      for (const file of readdirSync(
        resolve(process.cwd(), `src/components/${directory}`)
      ).filter((name) => name.endsWith(".tsx") && !name.includes(".test."))) {
        const contents = readFileSync(
          resolve(process.cwd(), `src/components/${directory}/${file}`),
          "utf8"
        )

        expect(contents, `${directory}/${file}`).not.toMatch(
          /focus-visible:ring-(?:1|2|3|\[3px\])/u
        )
        expect(contents, `${directory}/${file}`).not.toMatch(
          /(?:hover|active):(?:ring|shadow)-\[var\(--(?:focus-ring|shadow-keyboard-focus)\)\]/u
        )
      }
    }
  })
})

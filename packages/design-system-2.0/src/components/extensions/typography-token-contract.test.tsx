import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Typography, type TypographyVariant } from "./typography"

const utilityFamilies = {
  display: { count: 6, weight: "bold" },
  header: { count: 11, weight: "bold" },
  body: { count: 12, weight: "medium" },
  button: { count: 5, weight: "semibold" },
  label: { count: 3, weight: "medium" },
} as const

const variantRoles: ReadonlyArray<
  readonly [TypographyVariant, string, string?]
> = [
  ["h0", "typo-compat-h0"],
  ["h1", "typo-header-1"],
  ["h2", "typo-header-2"],
  ["h3", "typo-header-3"],
  ["h4", "typo-header-4"],
  ["h5", "typo-header-5"],
  ["h6", "typo-header-6"],
  ["h7", "typo-header-7"],
  ["h9", "typo-header-9"],
  ["d5", "typo-display-5"],
  ["b1m", "typo-body-1"],
  ["b2m", "typo-body-2"],
  ["b3m", "typo-body-3"],
  ["b4m", "typo-body-4"],
  ["b5m", "typo-body-5"],
  ["b5_5m", "typo-compat-body-5-5"],
  ["b6m", "typo-body-6"],
  ["b7m", "typo-body-7"],
  ["b8m", "typo-body-8"],
  ["b9m", "typo-body-9"],
  ["b4r", "typo-body-4", "font-normal"],
  ["b5r", "typo-body-5", "font-normal"],
  ["b5_5r", "typo-compat-body-5-5", "font-normal"],
  ["b6r", "typo-body-6", "font-normal"],
  ["b7r", "typo-body-7", "font-normal"],
  ["b8r", "typo-body-8", "font-normal"],
  ["b9r", "typo-body-9", "font-normal"],
  ["b10r", "typo-body-10", "font-normal"],
  ["btn2m", "typo-button-2"],
  ["btn3m", "typo-button-3"],
  ["btn4m", "typo-button-4"],
  ["btn5m", "typo-button-5"],
  ["label1", "typo-label-1"],
  ["label2", "typo-label-2"],
  ["label3", "typo-label-3"],
  ["badgeS", "typo-body-11"],
  ["badgeL", "typo-compat-badge-lg"],
]

const compatibilityRoles = {
  h0: {
    text: "36px",
    leading: "54px",
    weight: "bold",
  },
  "body-5-5": {
    text: "18px",
    leading: "26.28px",
    weight: "medium",
  },
  "badge-lg": {
    text: "16px",
    leading: "20px",
    weight: "medium",
  },
} as const

function projectSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
}

describe("ECOYA typography token contract", () => {
  it("registers the 37 canonical and 3 compatibility typography roles", () => {
    const globals = projectSource("src/app/globals.css")
    const utilityNames = [
      ...globals.matchAll(/^@utility (typo-[\w-]+) \{/gm),
    ].map((match) => match[1])

    expect(utilityNames).toHaveLength(40)
    expect(new Set(utilityNames).size).toBe(40)

    for (const [family, { count, weight }] of Object.entries(utilityFamilies)) {
      for (let index = 1; index <= count; index += 1) {
        const utility = `typo-${family}-${index}`
        const block = globals.match(
          new RegExp(`@utility ${utility} \\{([\\s\\S]*?)\\n\\}`)
        )?.[1]

        expect(block, utility).toContain(`var(--text-${family}-${index})`)
        expect(block, utility).toContain(`var(--leading-${family}-${index})`)
        expect(block, utility).toContain(`var(--font-weight-${weight})`)
        expect(block, utility).toContain("letter-spacing: 0")
      }
    }
  })

  it("preserves exact legacy typography metrics through dedicated tokens", () => {
    const globals = projectSource("src/app/globals.css")
    const tokens = projectSource("src/tokens.css")
    const component = projectSource("src/components/extensions/typography.tsx")

    for (const [role, contract] of Object.entries(compatibilityRoles)) {
      expect(tokens).toContain(`--text-compat-${role}: ${contract.text}`)
      expect(tokens).toContain(`--leading-compat-${role}: ${contract.leading}`)

      const utility = `typo-compat-${role}`
      const block = globals.match(
        new RegExp(`@utility ${utility} \\{([\\s\\S]*?)\\n\\}`)
      )?.[1]

      expect(block, utility).toContain(`var(--text-compat-${role})`)
      expect(block, utility).toContain(`var(--leading-compat-${role})`)
      expect(block, utility).toContain(`var(--font-weight-${contract.weight})`)
      expect(block, utility).toContain("letter-spacing: 0")
    }

    expect(component).not.toMatch(/\b(?:text|leading)-\[(?:\d|\.)/)
  })

  it("bridges Tailwind text and weight utilities to canonical ECOYA roles", () => {
    const globals = projectSource("src/app/globals.css")
    const tokens = projectSource("src/tokens.css")
    const textRoles = {
      xs: "body-11",
      sm: "body-9",
      base: "body-7",
      lg: "body-6",
      xl: "header-4",
      "2xl": "header-2",
    } as const

    for (const [tailwindRole, ecoyaRole] of Object.entries(textRoles)) {
      expect(globals).toContain(
        `--text-${tailwindRole}: var(--text-${ecoyaRole})`
      )
      expect(globals).toContain(
        `--text-${tailwindRole}--line-height: var(--leading-${ecoyaRole})`
      )
    }

    expect(globals).toContain(
      "--font-weight-normal: var(--font-weight-regular)"
    )
    for (const weight of ["medium", "semibold", "bold"]) {
      expect(tokens).toMatch(new RegExp(`--font-weight-${weight}: \\d+`))
    }
  })

  for (const [variant, role, weight] of variantRoles) {
    it(`maps ${variant} to the canonical ${role} role`, () => {
      render(<Typography variant={variant}>{variant}</Typography>)

      const text = screen.getByText(variant)
      expect(text).toHaveClass(role)
      if (weight) expect(text).toHaveClass(weight)
    })
  }
})

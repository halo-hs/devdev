import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

type Color = readonly [number, number, number]
type Theme = "dark" | "light"

const tokensSource = readFileSync(
  resolve(process.cwd(), "src/tokens.css"),
  "utf8"
)

function declarationMap(blocks: readonly string[]) {
  const declarations = new Map<string, string>()

  for (const block of blocks) {
    for (const match of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      declarations.set(match[1], match[2].trim().replace(/\s+/g, " "))
    }
  }

  return declarations
}

const rootDeclarations = declarationMap(
  [...tokensSource.matchAll(/:root\s*\{([\s\S]*?)\n\}/g)].map(
    (match) => match[1]
  )
)
const darkDeclarations = declarationMap([
  tokensSource.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1] ?? "",
])

function parseHex(value: string): Color | null {
  const match = value.match(/^#([\da-f]{6})$/i)
  if (!match) return null

  return [0, 2, 4].map((offset) =>
    Number.parseInt(match[1].slice(offset, offset + 2), 16)
  ) as unknown as Color
}

function mix(first: Color, second: Color, firstWeight: number): Color {
  return first.map((channel, index) =>
    Math.round(channel * firstWeight + second[index] * (1 - firstWeight))
  ) as unknown as Color
}

function resolveToken(
  token: string,
  theme: Theme,
  stack: readonly string[] = []
): Color {
  if (stack.includes(token)) {
    throw new Error(`Cyclic color token: ${[...stack, token].join(" -> ")}`)
  }

  const value =
    (theme === "dark" ? darkDeclarations.get(token) : undefined) ??
    rootDeclarations.get(token)
  if (!value) throw new Error(`Missing color token: --${token}`)

  const hex = parseHex(value)
  if (hex) return hex

  const alias = value.match(/^var\(\s*--([\w-]+)\s*\)$/)
  if (alias) return resolveToken(alias[1], theme, [...stack, token])

  const colorMix = value.match(
    /^color-mix\(\s*in srgb,\s*var\(\s*--([\w-]+)\s*\)\s+(\d+(?:\.\d+)?)%\s*,\s*var\(\s*--([\w-]+)\s*\)\s*\)$/
  )
  if (colorMix) {
    return mix(
      resolveToken(colorMix[1], theme, [...stack, token]),
      resolveToken(colorMix[3], theme, [...stack, token]),
      Number(colorMix[2]) / 100
    )
  }

  throw new Error(`Unsupported color value for --${token}: ${value}`)
}

function relativeLuminance(color: Color) {
  const [red, green, blue] = color.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrast(foreground: string, background: string, theme: Theme) {
  const foregroundLuminance = relativeLuminance(resolveToken(foreground, theme))
  const backgroundLuminance = relativeLuminance(resolveToken(background, theme))

  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  )
}

const paletteBackgrounds = {
  yellow: "color-yellow-6",
  pink: "color-pink-6",
  "gray-cancel": "color-gray-10",
  grape: "color-grape-6",
  orange: "color-orange-6",
  green: "color-green-6",
  lime: "color-lime-5",
  red: "color-red-8",
  "gray-complete": "color-gray-10",
  blue: "color-blue-6",
} as const

const statePairs = [
  ["surface-muted-foreground", "surface-background"],
  ["button-destructive-foreground", "button-destructive-background"],
  ["button-destructive-foreground", "button-destructive-background-hover"],
  ["button-destructive-foreground", "button-destructive-background-active"],
  ["badge-default-foreground", "badge-default-background"],
  ["badge-default-foreground", "badge-default-background-hover"],
  ["badge-default-foreground", "badge-default-background-active"],
  ["badge-destructive-foreground", "badge-destructive-background"],
  ["badge-destructive-foreground", "badge-destructive-background-hover"],
  ["badge-destructive-foreground", "badge-destructive-background-active"],
  ["bubble-primary-foreground", "bubble-primary-background"],
  ["bubble-primary-foreground", "bubble-primary-background-hover"],
  ["bubble-primary-foreground", "bubble-primary-background-active"],
  ["bubble-secondary-foreground", "bubble-secondary-background"],
  ["bubble-secondary-foreground", "bubble-secondary-background-hover"],
  ["bubble-secondary-foreground", "bubble-secondary-background-active"],
  ["bubble-destructive-foreground", "bubble-destructive-background"],
  ["bubble-destructive-foreground", "bubble-destructive-background-hover"],
  ["bubble-destructive-foreground", "bubble-destructive-background-active"],
] as const

describe("release color-token contract", () => {
  it.each<Theme>(["light", "dark"])(
    "keeps public text state pairs at WCAG AA contrast in %s mode",
    (theme) => {
      for (const [foreground, background] of statePairs) {
        expect(
          contrast(foreground, background, theme),
          `${theme} --${foreground} on --${background}`
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  )

  it.each<Theme>(["light", "dark"])(
    "keeps all palette badge tones at WCAG AA contrast in %s mode",
    (theme) => {
      for (const [palette, background] of Object.entries(paletteBackgrounds)) {
        expect(
          contrast(
            `badge-palette-${palette}-fill-foreground`,
            background,
            theme
          ),
          `${theme} ${palette} fill badge`
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrast(
            `badge-palette-${palette}-outline-foreground`,
            "surface-background",
            theme
          ),
          `${theme} ${palette} outline badge`
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  )

  it("keeps selected calendar text AA-compliant in dark mode", () => {
    expect(
      contrast(
        "calendar-day-selected-foreground",
        "calendar-day-selected-background",
        "dark"
      )
    ).toBeGreaterThanOrEqual(4.5)
  })

  it("keeps cancelled and completed badge states visually distinct", () => {
    expect(
      rootDeclarations.get("badge-palette-gray-cancel-fill-foreground")
    ).not.toBe(
      rootDeclarations.get("badge-palette-gray-complete-fill-foreground")
    )
    expect(
      darkDeclarations.get("badge-palette-gray-cancel-outline-foreground")
    ).not.toBe(
      darkDeclarations.get("badge-palette-gray-complete-outline-foreground")
    )
  })

  it("keeps hover elevation distinct from focus elevation", () => {
    const hoverShadow = rootDeclarations.get("shadow-input-hover")
    const focusShadow = rootDeclarations.get("shadow-input-focused")

    expect(hoverShadow).toContain("rgba(160, 164, 171, 0.2)")
    expect(hoverShadow).not.toBe(focusShadow)
    expect(hoverShadow).not.toContain("var(--shadow-input-focused)")
  })

  it("reserves focus halos for focus-visible instead of pointer active/open", () => {
    expect(rootDeclarations.get("shadow-input-active")).toBe(
      "var(--shadow-input-default)"
    )
    expect(rootDeclarations.get("shadow-input-open")).toBe(
      "var(--shadow-input-default)"
    )
    expect(rootDeclarations.get("shadow-input-invalid-active")).toBe(
      "var(--shadow-input-active)"
    )
    expect(rootDeclarations.get("shadow-input-invalid-open")).toBe(
      "var(--shadow-input-open)"
    )

    for (const state of [
      "shadow-input-active",
      "shadow-input-open",
      "shadow-input-invalid-active",
      "shadow-input-invalid-open",
    ]) {
      expect(rootDeclarations.get(state)).not.toContain("focused")
    }
  })
})

describe("release source integration contract", () => {
  const roleOwnedSources = [
    "src/components/ui/card.tsx",
    "src/components/ui/drawer.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/ui/hover-card.tsx",
    "src/components/ui/table.tsx",
    "src/components/extensions/date-picker.tsx",
  ] as const

  it.each(roleOwnedSources)(
    "keeps %s off fixed neutral/brand ramps",
    (file) => {
      const contents = readFileSync(resolve(process.cwd(), file), "utf8")
      expect(contents).not.toMatch(/var\(--color-(?:gray|primary)-/)
    }
  )

  it("keeps Typography theme-aware by default", () => {
    const contents = readFileSync(
      resolve(process.cwd(), "src/components/extensions/typography.tsx"),
      "utf8"
    )

    expect(contents).toContain('color = "foreground"')
    expect(contents).not.toContain('color = "gray2"')
  })

  it("routes DatePicker month density through a component role", () => {
    const contents = readFileSync(
      resolve(process.cwd(), "src/components/extensions/date-picker.tsx"),
      "utf8"
    )

    expect(contents).toContain("h-[var(--calendar-month-option-height)]!")
    expect(contents).not.toContain("h-[46px]!")
  })

  it("keeps the static Table leaf server-compatible", () => {
    const contents = readFileSync(
      resolve(process.cwd(), "src/components/ui/table.tsx"),
      "utf8"
    )

    expect(contents.trimStart()).not.toMatch(/^["']use client["']/)
    expect(contents).not.toMatch(/\buse(?:State|Effect|Memo|Ref|Callback)\b/)
    expect(contents).not.toMatch(/\bh-11\b/)
    expect(contents.match(/px-3 py-3/g)).toHaveLength(2)
  })
})

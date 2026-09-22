import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

type Rgb = readonly [number, number, number]

const tokenSource = readFileSync(
  resolve(process.cwd(), "src/tokens.css"),
  "utf8"
)
const darkStart = tokenSource.indexOf(".dark {")

function declarations(source: string) {
  const values = new Map<string, string>()

  for (const match of source.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    values.set(match[1], match[2].replace(/\s+/g, " ").trim())
  }

  return values
}

const lightTokens = declarations(tokenSource.slice(0, darkStart))
const darkTokens = new Map([
  ...lightTokens,
  ...declarations(tokenSource.slice(darkStart)),
])

function source(component: string) {
  return readFileSync(
    resolve(process.cwd(), `src/components/ui/${component}.tsx`),
    "utf8"
  )
}

function parseHex(value: string): Rgb | null {
  const match = value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)

  return match
    ? [
        Number.parseInt(match[1], 16),
        Number.parseInt(match[2], 16),
        Number.parseInt(match[3], 16),
      ]
    : null
}

function resolveColor(
  token: string,
  values: ReadonlyMap<string, string>,
  resolving = new Set<string>()
): Rgb {
  if (resolving.has(token)) {
    throw new Error(`Circular color token reference: ${token}`)
  }

  const value = values.get(token)
  if (!value) throw new Error(`Missing color token: ${token}`)

  const hex = parseHex(value)
  if (hex) return hex

  const variable = value.match(/^var\((--[\w-]+)\)$/)
  if (variable) {
    return resolveColor(variable[1], values, new Set([...resolving, token]))
  }

  const colorMix = value.match(
    /^color-mix\(\s*in srgb,\s*var\((--[\w-]+)\)\s+([\d.]+)%,\s*var\((--[\w-]+)\)\s*\)$/
  )
  if (colorMix) {
    const weight = Number.parseFloat(colorMix[2]) / 100
    const first = resolveColor(
      colorMix[1],
      values,
      new Set([...resolving, token])
    )
    const second = resolveColor(
      colorMix[3],
      values,
      new Set([...resolving, token])
    )

    return first.map(
      (channel, index) => channel * weight + second[index] * (1 - weight)
    ) as unknown as Rgb
  }

  throw new Error(`Unsupported color value for ${token}: ${value}`)
}

function luminance([red, green, blue]: Rgb) {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(first: Rgb, second: Rgb) {
  const firstLuminance = luminance(first)
  const secondLuminance = luminance(second)

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  )
}

describe("ECOYA interaction accessibility token contract", () => {
  it("keeps every 15px dark Button state at 4.5:1 or greater", () => {
    const variants = [
      {
        name: "primary",
        foreground: "--button-primary-foreground",
        backgrounds: [
          "--button-primary-background",
          "--button-primary-background-hover",
          "--button-primary-background-active",
        ],
      },
      {
        name: "secondary",
        foreground: "--button-secondary-foreground",
        backgrounds: [
          "--button-secondary-background",
          "--button-secondary-background-hover",
          "--button-secondary-background-active",
        ],
      },
      {
        name: "destructive",
        foreground: "--button-destructive-foreground",
        backgrounds: [
          "--button-destructive-background",
          "--button-destructive-background-hover",
          "--button-destructive-background-active",
        ],
      },
    ] as const

    expect(darkTokens.get("--button-primary-background")).toBe(
      "var(--color-indigo)"
    )

    for (const variant of variants) {
      const foreground = resolveColor(variant.foreground, darkTokens)

      for (const backgroundToken of variant.backgrounds) {
        const ratio = contrast(
          foreground,
          resolveColor(backgroundToken, darkTokens)
        )
        expect(
          ratio,
          `${variant.name} ${backgroundToken} contrast was ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it("keeps focus and invalid focus perimeters at 3:1 or greater", () => {
    for (const [theme, values] of [
      ["light", lightTokens],
      ["dark", darkTokens],
    ] as const) {
      for (const backgroundToken of ["--background", "--surface-background"]) {
        const background = resolveColor(backgroundToken, values)

        for (const ringToken of [
          "--focus-ring",
          "--focus-invalid-ring",
          "--calendar-focus-ring",
        ]) {
          const ratio = contrast(resolveColor(ringToken, values), background)
          expect(
            ratio,
            `${theme} ${ringToken} on ${backgroundToken} was ${ratio.toFixed(2)}:1`
          ).toBeGreaterThanOrEqual(3)
        }
      }
    }

    for (const component of [
      "checkbox",
      "radio-group",
      "switch",
      "navigation-menu",
    ]) {
      expect(source(component), component).toContain("--shadow-keyboard-focus")
      expect(source(component), component).not.toContain("focus-visible:ring-3")
    }
    expect(source("button")).toContain("border border-transparent")
    expect(source("button")).toContain("focus-visible:border-transparent")
    expect(source("button")).toContain(
      "focus-visible:[box-shadow:var(--shadow-input-focused)]"
    )
    expect(source("button")).not.toContain("focus-visible:ring-")
    expect(source("calendar")).toContain(
      "focus-visible:shadow-[var(--shadow-keyboard-focus)]!"
    )
    expect(source("calendar")).toContain("focus-visible:ring-0!")
    expect(source("calendar")).not.toContain(
      "focus-visible:ring-[var(--calendar-focus-ring)]"
    )
    expect(source("calendar")).not.toContain(
      "group-data-[focused=true]/day:ring-"
    )
  })

  it("does not suppress NavigationMenuLink keyboard focus descendants", () => {
    const navigationMenu = source("navigation-menu")

    expect(navigationMenu).not.toContain(
      "**:data-[slot=navigation-menu-link]:focus:ring-0"
    )
    expect(navigationMenu).not.toContain(
      "**:data-[slot=navigation-menu-link]:focus:outline-none"
    )
    expect(navigationMenu).toContain(
      "focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
    )
  })

  it("routes Checkbox and Radio borders through a theme-aware role", () => {
    expect(tokenSource.match(/--selection-control-border:/g)).toHaveLength(2)
    expect(lightTokens.get("--selection-control-border")).toBe(
      "var(--color-gray-7)"
    )
    expect(darkTokens.get("--selection-control-border")).toBe(
      "var(--muted-foreground)"
    )

    for (const component of ["checkbox", "radio-group"]) {
      expect(source(component), component).toContain(
        "border-[var(--selection-control-border)]"
      )
      expect(source(component), component).not.toContain(
        "border-[var(--color-gray-7)]"
      )
    }
  })

  it("keeps invalid selection-control glow exclusive to keyboard focus", () => {
    for (const component of [
      "checkbox",
      "radio-group",
      "switch",
      "questionnaire",
    ]) {
      const contents = source(component)

      expect(contents, component).toContain(
        "aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)]"
      )
      expect(contents, component).not.toContain(
        "aria-invalid:[box-shadow:var(--shadow-keyboard-focus-invalid)]"
      )
    }
  })
})

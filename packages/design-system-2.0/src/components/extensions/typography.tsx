import {
  createElement,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactElement,
} from "react"

import { cn } from "@ecoya/design-system/lib/utils"

export type TypographyVariant =
  | "h0"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "h7"
  | "h9"
  | "d5"
  | "b1m"
  | "b2m"
  | "b3m"
  | "b4m"
  | "b5m"
  | "b5_5m"
  | "b6m"
  | "b7m"
  | "b8m"
  | "b9m"
  | "b4r"
  | "b5r"
  | "b5_5r"
  | "b6r"
  | "b7r"
  | "b8r"
  | "b9r"
  | "b10r"
  | "btn2m"
  | "btn3m"
  | "btn4m"
  | "btn5m"
  | "label1"
  | "label2"
  | "label3"
  | "badgeS"
  | "badgeL"

type NativeElement = keyof React.JSX.IntrinsicElements

type TypographyOwnProps<T extends NativeElement> = {
  /** Native element used to render the text. */
  as?: T
  /** ECOYA typography token. Takes precedence over `typoType`. */
  variant?: TypographyVariant
  /** Legacy-compatible alias for `variant`. */
  typoType?: TypographyVariant
  /** ECOYA token name (for example `gray2`) or any valid CSS color. */
  color?: string
  ellipsis?: boolean
  className?: string
  style?: CSSProperties
}

export type TypographyProps<T extends NativeElement = "span"> =
  TypographyOwnProps<T> &
    Omit<ComponentPropsWithRef<T>, keyof TypographyOwnProps<T>>

const typographyClassMap: Record<TypographyVariant, string> = {
  h0: "typo-compat-h0",
  h1: "typo-header-1",
  h2: "typo-header-2",
  h3: "typo-header-3",
  h4: "typo-header-4",
  h5: "typo-header-5",
  h6: "typo-header-6",
  h7: "typo-header-7",
  h9: "typo-header-9",
  d5: "typo-display-5",
  b1m: "typo-body-1",
  b2m: "typo-body-2",
  b3m: "typo-body-3",
  b4m: "typo-body-4",
  b5m: "typo-body-5",
  b5_5m: "typo-compat-body-5-5",
  b6m: "typo-body-6",
  b7m: "typo-body-7",
  b8m: "typo-body-8",
  b9m: "typo-body-9",
  b4r: "typo-body-4 font-normal",
  b5r: "typo-body-5 font-normal",
  b5_5r: "typo-compat-body-5-5 font-normal",
  b6r: "typo-body-6 font-normal",
  b7r: "typo-body-7 font-normal",
  b8r: "typo-body-8 font-normal",
  b9r: "typo-body-9 font-normal",
  b10r: "typo-body-10 font-normal",
  btn2m: "typo-button-2",
  btn3m: "typo-button-3",
  btn4m: "typo-button-4",
  btn5m: "typo-button-5",
  label1: "typo-label-1",
  label2: "typo-label-2",
  label3: "typo-label-3",
  badgeS: "typo-body-11",
  badgeL: "typo-compat-badge-lg",
}

const legacyTokenPatterns: ReadonlyArray<
  readonly [pattern: RegExp, replacement: string]
> = [
  [/^blue(\d+)$/, "primary-blue-blue-$1"],
  [/^gray(\d+)$/, "gray-gray-$1"],
  [/^systemRed(\d+)$/, "system-red-$1"],
  [/^systemYellow(\d+)$/, "color-system-yellow$1"],
  [/^systemGreen(\d+)$/, "color-system-green$1"],
  [/^systemBlue(\d+)$/, "color-system-blue$1"],
  [/^systemPink(\d+)$/, "color-system-pink$1"],
  [/^systemGrape(\d+)$/, "color-system-grape$1"],
  [/^systemOrange(\d+)$/, "color-system-orange$1"],
  [/^systemLime(\d+)$/, "color-system-lime$1"],
  [/^indigo$/, "indigo-indigo"],
]

const rawCssColorPattern =
  /^(?:#|rgba?\(|hsla?\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color\(|color-mix\(|light-dark\(|var\(|currentColor$|transparent$|inherit$|initial$|unset$)/i

const semanticColorTokens = new Set([
  "accent",
  "accent-foreground",
  "background",
  "border",
  "card",
  "card-foreground",
  "destructive",
  "destructive-foreground",
  "foreground",
  "input",
  "muted",
  "muted-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "ring",
  "secondary",
  "secondary-foreground",
])

function resolveTypographyColor(color: string) {
  const value = color.trim()

  if (rawCssColorPattern.test(value)) return value
  if (value.startsWith("--")) return `var(${value})`

  const legacyToken = legacyTokenPatterns.reduce(
    (token, [pattern, replacement]) =>
      pattern.test(token) ? token.replace(pattern, replacement) : token,
    value
  )

  if (
    legacyToken !== value ||
    semanticColorTokens.has(value) ||
    value.includes("-")
  ) {
    return `var(--${legacyToken})`
  }

  return value
}

function Typography<T extends NativeElement = "span">({
  as,
  variant,
  typoType,
  color = "foreground",
  ellipsis = false,
  className,
  style,
  ...elementProps
}: TypographyProps<T>): ReactElement | null {
  const Component = as ?? "span"
  const resolvedVariant = variant ?? typoType ?? "b7m"

  return createElement(Component, {
    ...elementProps,
    className: cn(
      typographyClassMap[resolvedVariant],
      ellipsis && "truncate",
      className
    ),
    style: {
      ...style,
      color: resolveTypographyColor(color),
    },
  })
}

export { Typography }

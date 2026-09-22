import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

type BadgePalette =
  | "blue"
  | "grape"
  | "grayCancel"
  | "grayComplete"
  | "green"
  | "lime"
  | "orange"
  | "pink"
  | "red"
  | "yellow"

type BadgeTone = "fill" | "outline"
type CanonicalBadgeSize = "default" | "lg" | "sm"
type BadgeSize = CanonicalBadgeSize | "L" | "S"
type LegacyBadgeType = "line" | "normal"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-pill)] border border-transparent font-medium whitespace-nowrap transition-all focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-keyboard-focus)] aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)] [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--badge-default-background)] text-[var(--badge-default-foreground)] [a]:hover:bg-[var(--badge-default-background-hover)] [a]:active:bg-[var(--badge-default-background-active)]",
        secondary:
          "bg-[var(--badge-secondary-background)] text-[var(--badge-secondary-foreground)] [a]:hover:bg-[var(--badge-secondary-background-hover)] [a]:active:bg-[var(--badge-secondary-background-active)]",
        destructive:
          "bg-[var(--badge-destructive-background)] text-[var(--badge-destructive-foreground)] [a]:hover:bg-[var(--badge-destructive-background-hover)] [a]:active:bg-[var(--badge-destructive-background-active)]",
        outline:
          "border-[var(--surface-border)]! text-[var(--surface-foreground)] [a]:hover:bg-[var(--surface-muted-background)]! [a]:hover:text-[var(--surface-muted-foreground)] [a]:active:bg-[var(--menu-item-background-active)]! [a]:active:text-[var(--surface-foreground)]",
        ghost:
          "text-[var(--surface-muted-foreground)] hover:bg-[var(--surface-muted-background)]! hover:text-[var(--surface-foreground)] active:bg-[var(--menu-item-background-active)]! active:text-[var(--surface-foreground)]",
        link: "text-[var(--button-link-foreground)] underline-offset-4 hover:underline active:text-[var(--button-link-foreground-active)]",
      },
      palette: {
        yellow:
          "[--badge-background:var(--color-yellow-6)] [--badge-border:var(--color-yellow-1)] [--badge-fill-foreground:var(--badge-palette-yellow-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-yellow-outline-foreground)]",
        pink: "[--badge-background:var(--color-pink-6)] [--badge-border:var(--color-pink-2)] [--badge-fill-foreground:var(--badge-palette-pink-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-pink-outline-foreground)]",
        grayCancel:
          "[--badge-background:var(--color-gray-10)] [--badge-border:var(--color-gray-7)] [--badge-fill-foreground:var(--badge-palette-gray-cancel-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-gray-cancel-outline-foreground)]",
        grape:
          "[--badge-background:var(--color-grape-6)] [--badge-border:var(--color-grape-3)] [--badge-fill-foreground:var(--badge-palette-grape-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-grape-outline-foreground)]",
        orange:
          "[--badge-background:var(--color-orange-6)] [--badge-border:var(--color-orange-2)] [--badge-fill-foreground:var(--badge-palette-orange-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-orange-outline-foreground)]",
        green:
          "[--badge-background:var(--color-green-6)] [--badge-border:var(--color-green-1)] [--badge-fill-foreground:var(--badge-palette-green-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-green-outline-foreground)]",
        lime: "[--badge-background:var(--color-lime-5)] [--badge-border:var(--color-lime-1)] [--badge-fill-foreground:var(--badge-palette-lime-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-lime-outline-foreground)]",
        red: "[--badge-background:var(--color-red-8)] [--badge-border:var(--color-red-2)] [--badge-fill-foreground:var(--badge-palette-red-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-red-outline-foreground)]",
        grayComplete:
          "[--badge-background:var(--color-gray-10)] [--badge-border:var(--color-gray-4)] [--badge-fill-foreground:var(--badge-palette-gray-complete-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-gray-complete-outline-foreground)]",
        blue: "[--badge-background:var(--color-blue-6)] [--badge-border:var(--color-blue-2)] [--badge-fill-foreground:var(--badge-palette-blue-fill-foreground)] [--badge-outline-foreground:var(--badge-palette-blue-outline-foreground)]",
      },
      tone: {
        fill: "[&[data-palette]]:border-transparent [&[data-palette]]:bg-[var(--badge-background)] [&[data-palette]]:text-[var(--badge-fill-foreground)] [&[data-palette]]:active:bg-[var(--badge-background)]",
        outline:
          "[&[data-palette]]:border-[var(--badge-border)] [&[data-palette]]:bg-transparent [&[data-palette]]:text-[var(--badge-outline-foreground)] [&[data-palette]]:active:bg-transparent",
      },
      size: {
        sm: "h-[var(--badge-size-sm)] gap-1 px-[var(--badge-padding-inline-sm)] py-0 text-[length:var(--text-badge-sm)] leading-[var(--leading-badge-sm)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-2.5!",
        default:
          "h-[var(--badge-size-default)] gap-1.5 px-[var(--badge-padding-inline-default)] py-0.5 text-[length:var(--text-badge-default)] leading-[var(--leading-badge-default)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3!",
        lg: "h-[var(--badge-size-lg)] gap-1.5 px-[var(--badge-padding-inline-lg)] py-1 text-[length:var(--text-badge-lg)] leading-[var(--leading-badge-lg)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&>svg]:size-3.5!",
      },
    },
    defaultVariants: {
      variant: "default",
      tone: "fill",
      size: "default",
    },
  }
)

type OfficialBadgeVariant = Exclude<
  VariantProps<typeof badgeVariants>["variant"],
  null | undefined
>
type BadgeVariant = OfficialBadgeVariant | BadgePalette

type BadgeProps = Omit<React.ComponentProps<"span">, "color"> &
  Omit<VariantProps<typeof badgeVariants>, "size" | "variant"> & {
    asChild?: boolean
    /** Legacy atom text fallback. `children` takes precedence when both exist. */
    text?: React.ReactNode
    /** Legacy palette names are accepted directly as variants. */
    variant?: BadgeVariant
    /** Legacy `line` maps to the canonical `outline` tone. */
    badgeType?: LegacyBadgeType
    /** Legacy token names such as `gray7` and `systemBlue2` remain supported. */
    color?: string
    badgeColor?: string
    borderColor?: string
    /** `S` and `L` are compatibility aliases for `sm` and `lg`. */
    size?: BadgeSize
  }

const badgePalettes = new Set<BadgePalette>([
  "blue",
  "grape",
  "grayCancel",
  "grayComplete",
  "green",
  "lime",
  "orange",
  "pink",
  "red",
  "yellow",
])

function isBadgePalette(value: BadgeVariant): value is BadgePalette {
  return badgePalettes.has(value as BadgePalette)
}

function resolveLegacyTokenColor(color: string | undefined) {
  if (!color) return undefined
  if (/^(#|rgb|hsl|oklch|color\(|var\()/i.test(color)) return color

  const token = color
    .replace(/^blue(\d+)$/, "color-primary-$1")
    .replace(/^gray(\d+)$/, "color-gray-$1")
    .replace(/^systemRed(\d+)$/, "color-red-$1")
    .replace(/^systemYellow(\d+)$/, "color-yellow-$1")
    .replace(/^systemGreen(\d+)$/, "color-green-$1")
    .replace(/^systemBlue(\d+)$/, "color-blue-$1")
    .replace(/^systemPink(\d+)$/, "color-pink-$1")
    .replace(/^systemGrape(\d+)$/, "color-grape-$1")
    .replace(/^systemOrange(\d+)$/, "color-orange-$1")
    .replace(/^systemLime(\d+)$/, "color-lime-$1")
    .replace(/^indigo$/, "color-indigo")

  return `var(--${token})`
}

function normalizeBadgeSize(size: BadgeSize): CanonicalBadgeSize {
  if (size === "S") return "sm"
  if (size === "L") return "lg"
  return size
}

function Badge({
  className,
  variant = "default",
  palette,
  tone,
  size = "default",
  asChild = false,
  text,
  badgeType,
  color,
  badgeColor,
  borderColor,
  children,
  style,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"
  const paletteVariant = isBadgePalette(variant) ? variant : undefined
  const resolvedVariant: OfficialBadgeVariant = paletteVariant
    ? "default"
    : (variant as OfficialBadgeVariant)
  const resolvedPalette = palette ?? paletteVariant
  const resolvedTone = tone ?? (badgeType === "line" ? "outline" : "fill")
  const resolvedSize = normalizeBadgeSize(size)
  const legacyStyle: React.CSSProperties = {
    color: resolveLegacyTokenColor(color),
    backgroundColor:
      resolvedTone === "fill" ? resolveLegacyTokenColor(badgeColor) : undefined,
    borderColor:
      resolvedTone === "outline"
        ? resolveLegacyTokenColor(borderColor)
        : undefined,
    ...style,
  }

  return (
    <Comp
      data-slot="badge"
      data-variant={resolvedVariant}
      data-palette={resolvedPalette ?? undefined}
      data-tone={resolvedPalette ? resolvedTone : undefined}
      data-size={resolvedSize}
      className={cn(
        badgeVariants({
          variant: resolvedVariant,
          palette: resolvedPalette,
          tone: resolvedTone,
          size: resolvedSize,
        }),
        className
      )}
      style={legacyStyle}
      {...props}
    >
      {children ?? text}
    </Comp>
  )
}

export { Badge, badgeVariants }
export type {
  BadgePalette,
  BadgeProps,
  BadgeSize,
  BadgeTone,
  BadgeVariant,
  LegacyBadgeType,
}

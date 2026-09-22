import { render, screen, within } from "@testing-library/react"
import { InfoIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { Alert, AlertDescription, AlertTitle, alertVariants } from "./alert"
import {
  Badge,
  badgeVariants,
  type BadgePalette,
  type BadgeTone,
} from "./badge"

const badgePaletteTokens: Record<BadgePalette, string> = {
  yellow: "--color-yellow-6",
  pink: "--color-pink-6",
  grayCancel: "--color-gray-10",
  grape: "--color-grape-6",
  orange: "--color-orange-6",
  green: "--color-green-6",
  lime: "--color-lime-5",
  red: "--color-red-8",
  grayComplete: "--color-gray-10",
  blue: "--color-blue-6",
}

describe("Badge semantic variants", () => {
  it.each(Object.entries(badgePaletteTokens))(
    "maps the %s palette to ECOYA CSS tokens",
    (palette, backgroundToken) => {
      render(<Badge palette={palette as BadgePalette}>Status</Badge>)

      const badge = screen.getByText("Status")
      expect(badge).toHaveAttribute("data-palette", palette)
      expect(badge).toHaveAttribute("data-tone", "fill")
      expect(badge).toHaveAttribute("data-size", "default")
      expect(badge.className).toContain(backgroundToken)
      expect(badge.className).toContain(
        "[&[data-palette]]:bg-[var(--badge-background)]"
      )
    }
  )

  it.each<BadgeTone>(["fill", "outline"])(
    "registers the %s tone in the CVA contract",
    (tone) => {
      const classes = badgeVariants({ palette: "red", tone })

      expect(classes).toContain(
        tone === "fill"
          ? "[&[data-palette]]:bg-[var(--badge-background)]"
          : "[&[data-palette]]:border-[var(--badge-border)]"
      )
    }
  )

  it("preserves official variants and normalizes legacy size aliases", () => {
    const { rerender } = render(
      <Badge variant="secondary" size="S">
        Compact
      </Badge>
    )

    expect(screen.getByText("Compact")).toHaveAttribute("data-size", "sm")
    expect(badgeVariants({ variant: "secondary" })).toContain(
      "--badge-secondary-background"
    )
    expect(badgeVariants({ variant: "secondary" })).toContain(
      "[a]:active:bg-[var(--badge-secondary-background-active)]"
    )
    expect(badgeVariants({ variant: "destructive" })).toContain(
      "--badge-destructive-foreground"
    )
    expect(badgeVariants({ variant: "destructive" })).toContain(
      "[a]:active:bg-[var(--badge-destructive-background-active)]"
    )
    expect(badgeVariants({ variant: "outline" })).toContain(
      "border-[var(--surface-border)]!"
    )
    expect(badgeVariants({ variant: "outline" })).not.toContain("border-border")
    expect(badgeVariants({ variant: "ghost" })).toContain(
      "hover:bg-[var(--surface-muted-background)]!"
    )
    expect(badgeVariants({ variant: "ghost" })).not.toContain("hover:bg-muted")
    expect(badgeVariants({ variant: "link" })).toContain("underline-offset-4")
    expect(badgeVariants({ variant: "link" })).toContain(
      "active:text-[var(--button-link-foreground-active)]"
    )

    expect(badgeVariants({ palette: "blue", tone: "fill" })).toContain(
      "[&[data-palette]]:active:bg-[var(--badge-background)]"
    )
    expect(badgeVariants({ palette: "blue", tone: "outline" })).toContain(
      "[&[data-palette]]:active:bg-transparent"
    )

    rerender(<Badge size="L">Large</Badge>)
    expect(screen.getByText("Large")).toHaveAttribute("data-size", "lg")
  })

  it("keeps asChild links accessible and carries semantic data", () => {
    render(
      <Badge asChild palette="blue" tone="outline">
        <a href="/orders">Open orders</a>
      </Badge>
    )

    const link = screen.getByRole("link", { name: "Open orders" })
    expect(link).toHaveAttribute("href", "/orders")
    expect(link).toHaveAttribute("data-slot", "badge")
    expect(link).toHaveAttribute("data-palette", "blue")
    expect(link).toHaveAttribute("data-tone", "outline")
  })
})

const infoListVariants = [
  "positive",
  "neutral",
  "caution",
  "riskHigh",
  "blue",
  "gray",
] as const

describe("Alert semantic variants", () => {
  it.each(infoListVariants)(
    "registers the %s InfoList variant with an observable data contract",
    (variant) => {
      render(
        <Alert variant={variant}>
          <AlertTitle>{variant}</AlertTitle>
        </Alert>
      )

      const alert = screen.getByRole("alert")
      expect(alert).toHaveAttribute("data-variant", variant)
      expect(alertVariants({ variant })).toContain("border-[var(--color-")
    }
  )

  it("preserves official default and destructive variants", () => {
    expect(alertVariants({ variant: "default" })).toContain("bg-card")
    expect(alertVariants({ variant: "destructive" })).toContain(
      "text-destructive"
    )
  })

  it("supports an accessible official icon, title, and description composition", () => {
    render(
      <Alert
        variant="caution"
        aria-labelledby="billing-alert-title"
        aria-describedby="billing-alert-description"
      >
        <InfoIcon aria-hidden="true" />
        <AlertTitle id="billing-alert-title">Payment needs review</AlertTitle>
        <AlertDescription id="billing-alert-description">
          Confirm the invoice total before approval.
        </AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole("alert", {
      name: "Payment needs review",
      description: "Confirm the invoice total before approval.",
    })
    expect(within(alert).getByText("Payment needs review")).toBeInTheDocument()
    expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})

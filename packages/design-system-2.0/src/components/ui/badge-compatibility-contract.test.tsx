import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge, badgeVariants } from "./badge"

describe("Badge compatibility contract", () => {
  it("renders the legacy text prop without leaking it to the DOM", () => {
    render(<Badge text="업무 요청" />)

    const badge = screen.getByText("업무 요청")
    expect(badge).not.toHaveAttribute("text")
  })

  it("normalizes palette variants and line badges to the canonical contract", () => {
    render(
      <Badge variant="yellow" badgeType="line">
        검토중
      </Badge>
    )

    const badge = screen.getByText("검토중")
    expect(badge).toHaveAttribute("data-variant", "default")
    expect(badge).toHaveAttribute("data-palette", "yellow")
    expect(badge).toHaveAttribute("data-tone", "outline")
    expect(badge.className).toContain(
      "[&[data-palette]]:border-[var(--badge-border)]"
    )
  })

  it("uses dedicated ECOYA typography and dimension roles for every size", () => {
    expect(badgeVariants({ size: "sm" })).toContain("--text-badge-sm")
    expect(badgeVariants({ size: "default" })).toContain("--text-badge-default")
    expect(badgeVariants({ size: "lg" })).toContain("--text-badge-lg")
    expect(badgeVariants({ size: "sm" })).toContain("--badge-size-sm")
    expect(badgeVariants({ size: "default" })).toContain("--badge-size-default")
    expect(badgeVariants({ size: "lg" })).toContain("--badge-size-lg")
  })

  it("resolves legacy custom token names without exposing compatibility props", () => {
    render(
      <Badge
        text="직접 지정"
        color="systemBlue2"
        badgeColor="systemBlue6"
        borderColor="systemBlue2"
      />
    )

    const badge = screen.getByText("직접 지정")
    expect(badge).toHaveStyle({
      color: "var(--color-blue-2)",
      backgroundColor: "var(--color-blue-6)",
    })
    expect(badge).not.toHaveAttribute("badgecolor")
    expect(badge).not.toHaveAttribute("bordercolor")
  })
})

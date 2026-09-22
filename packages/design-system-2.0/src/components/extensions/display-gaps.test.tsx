import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import {
  ClosableTabs,
  ClosableTabsContent,
  ClosableTabsList,
  ClosableTabsTrigger,
} from "./closable-tabs"
import { ImageTile } from "./image-tile"
import { LabeledProgress } from "./labeled-progress"
import { Typography } from "./typography"

describe("Typography", () => {
  it("maps legacy tokens while preserving native element props and refs", () => {
    const ref = React.createRef<HTMLAnchorElement>()

    render(
      <Typography
        ref={ref}
        as="a"
        href="/invoices"
        typoType="h1"
        color="systemRed2"
        ellipsis
      >
        Invoices
      </Typography>
    )

    const link = screen.getByRole("link", { name: "Invoices" })
    expect(link).toHaveClass("typo-header-1", "truncate")
    expect(link).toHaveAttribute("href", "/invoices")
    expect(link.style.color).toBe("var(--system-red-2)")
    expect(ref.current).toBe(link)
  })

  it("prefers variant over its alias and accepts raw CSS colors", () => {
    const { rerender } = render(
      <Typography variant="b8r" typoType="h0" color="oklch(0.5 0.1 200)">
        Detail
      </Typography>
    )

    const text = screen.getByText("Detail")
    expect(text).toHaveClass("typo-body-8", "font-normal")
    expect(text).not.toHaveClass("typo-display-3")
    expect(text.style.color).toBe("oklch(0.5 0.1 200)")

    rerender(<Typography color="rebeccapurple">Detail</Typography>)
    expect(screen.getByText("Detail").style.color).toBe("rebeccapurple")
  })
})

describe("ImageTile", () => {
  it("uses an accessible image and keeps accessory and hover dim separate", () => {
    render(
      <ImageTile
        imageSrc="/invoice.png"
        alt="Invoice preview"
        topRightAccessory={<button type="button">Remove</button>}
      />
    )

    expect(
      screen.getByRole("img", { name: "Invoice preview" })
    ).toHaveAttribute("src", "/invoice.png")
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
    const dim = document.querySelector('[data-slot="image-tile-dim"]')
    expect(dim).toHaveClass(
      "group-hover:bg-[var(--image-tile-overlay-hover)]",
      "group-focus-within:bg-[var(--image-tile-overlay-hover)]"
    )
    expect(dim).not.toHaveClass("group-hover:bg-foreground/70")
  })

  it("announces loading and exposes alt semantics for its placeholder", () => {
    const { rerender } = render(
      <ImageTile imageSrc="/invoice.png" alt="Invoice preview" loading />
    )

    expect(screen.getByRole("status", { name: "Loading image" })).toBeVisible()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot="image-tile"]')).toHaveAttribute(
      "aria-busy",
      "true"
    )

    rerender(<ImageTile alt="Missing invoice preview" />)
    expect(
      screen.getByRole("img", { name: "Missing invoice preview" })
    ).toBeInTheDocument()
  })
})

describe("ClosableTabs", () => {
  it("keeps close actions outside the tab trigger and keyboard accessible", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <ClosableTabs defaultValue="overview">
        <ClosableTabsList>
          <ClosableTabsTrigger value="overview" onClose={onClose}>
            Overview
          </ClosableTabsTrigger>
          <ClosableTabsTrigger value="history" onClose={onClose}>
            History
          </ClosableTabsTrigger>
        </ClosableTabsList>
        <ClosableTabsContent value="overview">Summary</ClosableTabsContent>
        <ClosableTabsContent value="history">Changes</ClosableTabsContent>
      </ClosableTabs>
    )

    const selectedTab = screen.getByRole("tab", { name: "Overview" })
    const closeHistory = screen.getByRole("button", {
      name: "history 탭 닫기",
    })

    expect(selectedTab).toHaveAttribute("aria-selected", "true")
    closeHistory.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")

    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onClose.mock.calls[0][0]).toBe("history")
    expect(selectedTab).toHaveAttribute("aria-selected", "true")
    expect(closeHistory.closest("button[role=tab]")).toBeNull()
    expect(closeHistory).toHaveClass(
      "text-[var(--control-clear-foreground)]",
      "hover:text-[var(--control-clear-foreground-hover)]",
      "active:text-[var(--control-clear-foreground-hover)]"
    )
    expect(closeHistory.className).not.toContain("opacity-")
  })

  it("disables the close action with its tab by default", () => {
    render(
      <ClosableTabs defaultValue="locked">
        <ClosableTabsList>
          <ClosableTabsTrigger value="locked" disabled onClose={vi.fn()}>
            Locked
          </ClosableTabsTrigger>
        </ClosableTabsList>
      </ClosableTabs>
    )

    expect(
      screen.getByRole("button", { name: "locked 탭 닫기" })
    ).toBeDisabled()
  })
})

describe("LabeledProgress", () => {
  it("clamps its value and exposes an accessible percentage", () => {
    render(
      <LabeledProgress
        value={125}
        aria-label="Upload progress"
        width={120}
        icon={<CircleIcon data-testid="progress-icon" />}
      />
    )

    const progress = screen.getByRole("progressbar", {
      name: "Upload progress",
    })
    expect(progress).toHaveAttribute("aria-valuenow", "100")
    expect(progress).toHaveAttribute("aria-valuetext", "100%")
    expect(progress).toHaveStyle({ width: "120px" })
    expect(screen.getByText("100%")).toBeVisible()
    expect(screen.getByTestId("progress-icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("normalizes invalid values and can hide the visual percentage", () => {
    render(<LabeledProgress value={Number.NaN} showText={false} />)

    expect(
      screen.getByRole("progressbar", { name: "Progress" })
    ).toHaveAttribute("aria-valuenow", "0")
    expect(
      document.querySelector('[data-slot="labeled-progress-percentage"]')
    ).not.toBeInTheDocument()
  })
})

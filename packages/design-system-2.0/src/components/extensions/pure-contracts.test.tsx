import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AsyncButton } from "./async-button"
import { RequiredLabel } from "./required-label"

describe("AsyncButton", () => {
  it("inherits the ECOYA button and loading indicator size roles", () => {
    const { rerender } = render(
      <AsyncButton loading>Default action</AsyncButton>
    )

    let button = screen.getByRole("button", { name: "Default action" })
    expect(button).toHaveClass("h-[var(--control-size-sm)]")
    expect(button.querySelector('[data-slot="spinner"]')).toHaveClass(
      "size-[var(--button-spinner-size-sm)]"
    )

    rerender(
      <AsyncButton size="lg" loading>
        Large action
      </AsyncButton>
    )
    button = screen.getByRole("button", { name: "Large action" })
    expect(button).toHaveClass("h-[var(--control-size-md)]")
    expect(button.querySelector('[data-slot="spinner"]')).toHaveClass(
      "size-[var(--button-spinner-size-md)]"
    )

    rerender(
      <AsyncButton size="xs" loading>
        Inline action
      </AsyncButton>
    )
    button = screen.getByRole("button", { name: "Inline action" })
    expect(button).toHaveClass("h-[var(--control-size-xs)]")
    expect(button.querySelector('[data-slot="spinner"]')).toHaveClass(
      "size-[var(--button-spinner-size-xs)]"
    )
  })

  it("preserves its action name and blocks clicks and form submission while loading", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())

    render(
      <form onSubmit={onSubmit}>
        <AsyncButton
          type="submit"
          variant="destructive"
          loading
          loadingLabel="Saving invoice"
          onClick={onClick}
        >
          Save invoice
        </AsyncButton>
      </form>
    )

    const button = screen.getByRole("button", { name: "Save invoice" })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toHaveAttribute("aria-description", "Saving invoice")
    expect(button).toHaveAttribute("data-loading", "true")
    expect(button).toHaveAttribute("data-variant", "destructive")

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("inherits the safe button type and prevents duplicate activation after pending begins", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())

    function PendingAction() {
      const [loading, setLoading] = React.useState(false)

      return (
        <form onSubmit={onSubmit}>
          <AsyncButton
            loading={loading}
            onClick={() => {
              onAction()
              setLoading(true)
            }}
          >
            Create report
          </AsyncButton>
        </form>
      )
    }

    render(<PendingAction />)

    const button = screen.getByRole("button", { name: "Create report" })
    expect(button).toHaveAttribute("type", "button")

    await user.click(button)
    await user.click(button)

    expect(onAction).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it("supports custom visual loading content without replacing the action name", () => {
    render(
      <AsyncButton
        loading
        loadingLabel="Generating preview"
        loadingContent={<span>잠시만 기다려 주세요</span>}
      >
        Generate preview
      </AsyncButton>
    )

    const button = screen.getByRole("button", { name: "Generate preview" })
    expect(screen.getByText("잠시만 기다려 주세요")).toBeVisible()
    expect(button).toHaveAttribute("aria-description", "Generating preview")
  })
})

describe("RequiredLabel", () => {
  it("keeps native label behavior without announcing its visual marker", async () => {
    const user = userEvent.setup()
    const ref = React.createRef<HTMLLabelElement>()

    render(
      <>
        <RequiredLabel ref={ref} htmlFor="company" required>
          Company
        </RequiredLabel>
        <input id="company" required />
      </>
    )

    const input = screen.getByRole("textbox", { name: "Company" })
    const label = ref.current as HTMLLabelElement
    const marker = label.querySelector('[data-slot="required-label-marker"]')

    expect(label).toHaveAttribute("for", "company")
    expect(label).toHaveAttribute("data-required", "true")
    expect(marker).toHaveTextContent("*")
    expect(marker).toHaveAttribute("aria-hidden", "true")
    expect(input).toHaveAccessibleName("Company")

    await user.click(label)
    expect(input).toHaveFocus()
  })

  it("supports custom marker content and standalone disabled styling", () => {
    render(
      <>
        <RequiredLabel
          htmlFor="email"
          required
          disabled
          marker={<span>필수</span>}
          title="Required field"
        >
          Email
        </RequiredLabel>
        <input id="email" disabled required />
      </>
    )

    const input = screen.getByRole("textbox", { name: "Email" })
    const label = document.querySelector(
      'label[for="email"]'
    ) as HTMLLabelElement
    const marker = label.querySelector('[data-slot="required-label-marker"]')

    expect(label).toHaveAttribute("data-disabled", "true")
    expect(label).toHaveAttribute("title", "Required field")
    expect(label).toHaveClass(
      "pointer-events-none",
      "text-[var(--control-disabled-foreground)]",
      "opacity-100"
    )
    expect(label).not.toHaveClass("opacity-50")
    expect(marker).toHaveTextContent("필수")
    expect(marker).toHaveAttribute("aria-hidden", "true")
    expect(marker).toHaveClass("text-[var(--control-disabled-foreground)]")
    expect(input).toHaveAccessibleName("Email")
  })

  it("does not render a marker for optional fields", () => {
    render(
      <RequiredLabel htmlFor="memo" marker="Required">
        Memo
      </RequiredLabel>
    )

    expect(
      document.querySelector('[data-slot="required-label-marker"]')
    ).not.toBeInTheDocument()
  })
})

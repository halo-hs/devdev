import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { ButtonGroup, ButtonGroupText } from "./button-group"

describe("Button form behavior", () => {
  it("keeps ButtonGroup text aligned with the default 32px button", () => {
    render(
      <ButtonGroup>
        <ButtonGroupText>Sort</ButtonGroupText>
        <Button variant="outline">Created date</Button>
      </ButtonGroup>
    )

    expect(screen.getByText("Sort")).toHaveClass(
      "min-h-[var(--control-size-sm)]"
    )
    expect(screen.getByRole("button", { name: "Created date" })).toHaveClass(
      "h-[var(--control-size-sm)]"
    )
  })

  it("does not submit a form unless submit is explicit", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())

    render(
      <form onSubmit={onSubmit}>
        <Button>Safe action</Button>
        <Button type="submit">Submit</Button>
      </form>
    )

    await user.click(screen.getByRole("button", { name: "Safe action" }))
    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it("keeps the safe default when asChild renders a native button", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())

    render(
      <form onSubmit={onSubmit}>
        <Button asChild>
          <button>Slotted action</button>
        </Button>
      </form>
    )

    const button = screen.getByRole("button", { name: "Slotted action" })
    expect(button).toHaveAttribute("type", "button")
    await user.click(button)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LoadingDots } from "./loading-dots"
import { MultipleInput } from "./multiple-input"
import { NotificationBadge } from "./notification-badge"

describe("MultipleInput", () => {
  it("commits comma-separated values and removes the last value with Backspace", async () => {
    const user = userEvent.setup()

    render(<MultipleInput aria-label="Recipients" />)

    const input = screen.getByRole("textbox", { name: "Recipients" })

    await user.type(input, "alpha,beta{Enter}")

    expect(screen.getByText("alpha")).toBeInTheDocument()
    expect(screen.getByText("beta")).toBeInTheDocument()
    expect(input).toHaveValue("")

    await user.type(input, "{Backspace}")

    expect(screen.queryByText("beta")).not.toBeInTheDocument()
    expect(screen.getByText("alpha")).toBeInTheDocument()
  })

  it("keeps an invalid value editable and announces its validation error", async () => {
    const user = userEvent.setup()
    const onValueRejected = vi.fn()

    render(
      <MultipleInput
        aria-label="Emails"
        validate={(value) => value.includes("@") || "이메일 형식이 아닙니다."}
        onValueRejected={onValueRejected}
      />
    )

    const input = screen.getByRole("textbox", { name: "Emails" })
    await user.type(input, "invalid{Enter}")

    expect(input).toHaveValue("invalid")
    expect(screen.getByText("이메일 형식이 아닙니다.")).toBeInTheDocument()
    expect(onValueRejected).toHaveBeenCalledWith({
      value: "invalid",
      reason: "invalid",
      message: "이메일 형식이 아닙니다.",
    })
  })

  it("commits the remaining input when focus leaves the field", async () => {
    const user = userEvent.setup()

    render(
      <div>
        <MultipleInput aria-label="Tags" />
        <button type="button">Next</button>
      </div>
    )

    await user.type(screen.getByRole("textbox", { name: "Tags" }), "draft")
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByText("draft")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Tags" })).toHaveValue("")
  })

  it("serializes every committed value for native forms", () => {
    const { container } = render(
      <form>
        <MultipleInput name="recipients" defaultValue={["alpha", "beta"]} />
      </form>
    )

    const form = container.querySelector("form") as HTMLFormElement
    expect(new FormData(form).getAll("recipients")).toEqual(["alpha", "beta"])
  })

  it("focuses the visible input after removal even when hidden form inputs exist", async () => {
    const user = userEvent.setup()

    render(
      <MultipleInput
        aria-label="Recipients"
        name="recipients"
        defaultValue={["alpha", "beta"]}
      />
    )

    const input = screen.getByRole("textbox", { name: "Recipients" })
    await user.click(screen.getByRole("button", { name: "beta 삭제" }))

    expect(input).toHaveFocus()
    expect(screen.queryByText("beta")).not.toBeInTheDocument()
  })

  it("restores uncontrolled tags and draft text on native form reset", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <form>
        <MultipleInput
          aria-label="Resettable recipients"
          name="recipients"
          defaultValue={["seed"]}
          defaultInputValue="draft"
        />
        <button type="reset">Reset</button>
      </form>
    )
    const input = screen.getByRole("textbox", {
      name: "Resettable recipients",
    })

    await user.clear(input)
    await user.type(input, "added{Enter}")
    await user.type(input, "pending")
    expect(screen.getByText("added")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reset" }))

    expect(screen.getByText("seed")).toBeInTheDocument()
    expect(screen.queryByText("added")).not.toBeInTheDocument()
    expect(screen.queryByText("pending")).not.toBeInTheDocument()
    expect(input).toHaveValue("draft")
    const form = container.querySelector("form") as HTMLFormElement
    expect(new FormData(form).getAll("recipients")).toEqual(["seed"])
  })

  it("keeps the whole read-only value area clickable", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <MultipleInput
        readOnly
        defaultValue={["contact@example.com"]}
        onClick={onClick}
      />
    )

    await user.click(screen.getByText("contact@example.com"))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe("NotificationBadge", () => {
  it("caps the visual count while preserving the real count for assistive technology", () => {
    render(<NotificationBadge variant="count" count={120} />)

    expect(
      screen.getByRole("status", { name: "새 알림 120개" })
    ).toHaveTextContent("99+")
  })
})

describe("LoadingDots", () => {
  it("announces loading without exposing decorative dots", () => {
    render(<LoadingDots label="저장 중" />)

    const status = screen.getByRole("status")
    expect(status).toHaveAccessibleName("저장 중")
    expect(status).toHaveAttribute("aria-busy", "true")
    expect(status.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })
})

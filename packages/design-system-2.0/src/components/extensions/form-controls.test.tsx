import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BusySwitch } from "./busy-switch"
import { CharacterCountTextarea } from "./character-count-textarea"
import { ClearableInput } from "./clearable-input"

describe("ClearableInput", () => {
  it("clears through native change semantics, preserves form naming, and restores focus", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    const onClear = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())

    const { container } = render(
      <form onSubmit={onSubmit}>
        <ClearableInput
          aria-label="Search"
          name="query"
          defaultValue="draft"
          prefix="https://"
          suffix=".com"
          onChange={onChange}
          onValueChange={onValueChange}
          onClear={onClear}
        />
      </form>
    )

    const input = screen.getByRole("textbox", { name: "Search" })
    const clearButton = screen.getByRole("button", { name: "입력 지우기" })

    expect(screen.getByText("https://")).toBeInTheDocument()
    expect(screen.getByText(".com")).toBeInTheDocument()
    expect(clearButton).toHaveAttribute("type", "button")

    await user.click(clearButton)

    expect(input).toHaveValue("")
    expect(input).toHaveFocus()
    expect(onChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenLastCalledWith("")
    expect(onClear).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      new FormData(container.querySelector("form") as HTMLFormElement).get(
        "query"
      )
    ).toBe("")
  })

  it("supports a parent-controlled native input", async () => {
    const user = userEvent.setup()

    function ControlledExample() {
      const [value, setValue] = React.useState("draft")
      return (
        <ClearableInput
          aria-label="Controlled search"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      )
    }

    render(<ControlledExample />)

    const input = screen.getByRole("textbox", { name: "Controlled search" })
    await user.click(screen.getByRole("button", { name: "입력 지우기" }))
    expect(input).toHaveValue("")

    await user.type(input, "next")
    expect(input).toHaveValue("next")
  })

  it("does not clear disabled or read-only values", async () => {
    const user = userEvent.setup()

    render(
      <>
        <ClearableInput
          aria-label="Disabled value"
          defaultValue="disabled"
          disabled
          clearLabel="Clear disabled value"
        />
        <ClearableInput
          aria-label="Read-only value"
          defaultValue="read only"
          readOnly
          clearLabel="Clear read-only value"
        />
      </>
    )

    const disabledClear = screen.getByRole("button", {
      name: "Clear disabled value",
    })
    const readOnlyClear = screen.getByRole("button", {
      name: "Clear read-only value",
    })

    expect(disabledClear).toBeDisabled()
    expect(readOnlyClear).toBeDisabled()
    await user.click(disabledClear)
    await user.click(readOnlyClear)
    expect(screen.getByRole("textbox", { name: "Disabled value" })).toHaveValue(
      "disabled"
    )
    expect(
      screen.getByRole("textbox", { name: "Read-only value" })
    ).toHaveValue("read only")
  })
})

describe("BusySwitch", () => {
  it("blocks interaction while loading and announces the busy state", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()

    render(
      <BusySwitch
        aria-label="Automatic save"
        defaultChecked
        loading
        loadingLabel="설정을 저장하는 중"
        onCheckedChange={onCheckedChange}
      />
    )

    const control = screen.getByRole("switch", { name: "Automatic save" })
    expect(control).toBeChecked()
    expect(control).toBeDisabled()
    expect(control).toHaveAttribute("aria-busy", "true")
    expect(
      screen.getByRole("status", { name: "설정을 저장하는 중" })
    ).toBeInTheDocument()

    await user.click(control)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(control).toBeChecked()
  })

  it("behaves like the native shadcn Switch when idle", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()

    render(
      <BusySwitch
        aria-label="Automatic save"
        onCheckedChange={onCheckedChange}
      />
    )

    const control = screen.getByRole("switch", { name: "Automatic save" })
    await user.click(control)

    expect(control).toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(control).not.toHaveAttribute("aria-busy")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})

describe("CharacterCountTextarea", () => {
  it("uses native maxLength and wires its label, description, and count", async () => {
    const user = userEvent.setup()

    render(
      <CharacterCountTextarea
        label="소개"
        description="최대 다섯 글자입니다."
        defaultValue="ab"
        maxLength={5}
      />
    )

    const textarea = screen.getByRole("textbox", { name: "소개" })
    expect(textarea).toHaveAttribute("maxlength", "5")
    expect(textarea).toHaveAccessibleDescription("최대 다섯 글자입니다. 2/5자")

    await user.type(textarea, "cdef")
    expect(textarea).toHaveValue("abcde")
    expect(screen.getByText("5/5자")).toBeInTheDocument()
  })

  it("supports controlled values and value callbacks", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    function ControlledExample() {
      const [value, setValue] = React.useState("A")
      return (
        <CharacterCountTextarea
          aria-label="Controlled note"
          value={value}
          onValueChange={(nextValue) => {
            onValueChange(nextValue)
            setValue(nextValue)
          }}
        />
      )
    }

    render(<ControlledExample />)
    const textarea = screen.getByRole("textbox", { name: "Controlled note" })
    await user.type(textarea, "BC")

    expect(textarea).toHaveValue("ABC")
    expect(onValueChange).toHaveBeenLastCalledWith("ABC")
    expect(screen.getByText("3/300자")).toBeInTheDocument()
  })

  it("exposes external help and errors through the textarea accessibility contract", () => {
    render(
      <>
        <p id="external-help">외부 도움말</p>
        <CharacterCountTextarea
          aria-label="Reason"
          aria-describedby="external-help"
          description="사유를 적어주세요."
          error="필수 입력입니다."
          maxLength={10}
        />
      </>
    )

    const textarea = screen.getByRole("textbox", { name: "Reason" })
    const error = screen.getByRole("alert")
    const field = textarea.closest('[data-slot="character-count-textarea"]')

    expect(textarea).toHaveAttribute("aria-invalid", "true")
    expect(textarea).toHaveAttribute("aria-errormessage", error.id)
    expect(textarea).toHaveAccessibleDescription(
      "외부 도움말 사유를 적어주세요. 0/10자 필수 입력입니다."
    )
    expect(field).toHaveAttribute("data-invalid", "true")
  })

  it("restores an uncontrolled default value and count on native form reset", async () => {
    const user = userEvent.setup()

    render(
      <form>
        <CharacterCountTextarea
          aria-label="Resettable note"
          defaultValue="seed"
        />
        <button type="reset">Reset</button>
      </form>
    )

    const textarea = screen.getByRole("textbox", { name: "Resettable note" })
    await user.type(textarea, "ling")
    expect(textarea).toHaveValue("seedling")
    expect(screen.getByText("8/300자")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(textarea).toHaveValue("seed")
    expect(screen.getByText("4/300자")).toBeInTheDocument()
  })
})

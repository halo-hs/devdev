import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CheckboxGroup } from "./checkbox-group"
import { ComboBoxSelect, ComboboxSelect } from "./combobox-select"
import { MultipleSelect } from "./multiple-select"

const options = [
  { value: "alpha", label: "Alpha" },
  { value: "beta", label: "Beta" },
  { value: "locked", label: "Locked", disabled: true },
]

describe("CheckboxGroup", () => {
  it("lays out horizontal options without forcing each field to full width", () => {
    render(
      <CheckboxGroup
        legend="Options"
        orientation="horizontal"
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />
    )

    const group = document.querySelector(
      '[data-slot="checkbox-group"]'
    ) as HTMLElement
    expect(group).toHaveClass("flex-row", "flex-wrap")
    expect(group.querySelector("[data-slot=field]")).toHaveClass(
      "w-auto",
      "flex-none"
    )
  })

  it("preserves string and number values while respecting disabled options", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <CheckboxGroup
        legend="Filters"
        options={[
          { value: 1, label: "Numeric" },
          { value: "text", label: "Text" },
          { value: 2, label: "Disabled", disabled: true },
        ]}
        defaultValue={[1]}
        onValueChange={onValueChange}
      />
    )

    expect(screen.getByRole("checkbox", { name: "Numeric" })).toBeChecked()
    await user.click(screen.getByRole("checkbox", { name: "Text" }))

    expect(onValueChange).toHaveBeenLastCalledWith([1, "text"])
    expect(screen.getByRole("checkbox", { name: "Text" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Disabled" })).toBeDisabled()
  })

  it("serializes selected values and restores defaults on native form reset", async () => {
    const user = userEvent.setup()

    render(
      <form>
        <CheckboxGroup
          name="filter"
          legend="Resettable filters"
          options={[
            { value: 1, label: "Numeric" },
            { value: "text", label: "Text" },
          ]}
          defaultValue={[1]}
        />
        <button type="reset">Reset filters</button>
      </form>
    )

    const form = screen
      .getByRole("group", { name: "Resettable filters" })
      .closest("form") as HTMLFormElement
    expect(new FormData(form).getAll("filter")).toEqual(["1"])

    await user.click(screen.getByRole("checkbox", { name: "Text" }))
    expect(new FormData(form).getAll("filter")).toEqual(["1", "text"])

    await user.click(screen.getByRole("button", { name: "Reset filters" }))
    expect(screen.getByRole("checkbox", { name: "Numeric" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Text" })).not.toBeChecked()
    expect(new FormData(form).getAll("filter")).toEqual(["1"])
  })
})

describe("ComboboxSelect", () => {
  it("searches options and commits a single selected value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <ComboboxSelect
        options={options}
        placeholder="Choose"
        inputAriaLabel="Choose framework"
        onValueChange={onValueChange}
      />
    )

    const input = screen.getByRole("combobox", { name: "Choose framework" })
    expect(screen.getByRole("button", { name: "Open options" })).toBeVisible()
    await user.click(input)
    await user.type(input, "bet")
    await user.click(await screen.findByRole("option", { name: "Beta" }))

    expect(onValueChange).toHaveBeenCalledWith(
      "beta",
      expect.objectContaining(options[1])
    )
    expect(input).toHaveValue("Beta")
  })

  it("keeps an accessible dropdown action above the options", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()

    render(
      <ComboboxSelect
        options={options}
        inputAriaLabel="Choose workplace"
        dropdownHeader={
          <button type="button" onClick={onCreate}>
            Add workplace
          </button>
        }
      />
    )

    await user.click(screen.getByRole("combobox", { name: "Choose workplace" }))
    await user.click(
      await screen.findByRole("button", { name: "Add workplace" })
    )

    expect(onCreate).toHaveBeenCalledOnce()
  })

  it("restores an uncontrolled single value on native form reset", async () => {
    const user = userEvent.setup()

    render(
      <form>
        <ComboboxSelect
          name="framework"
          options={options}
          defaultValue="alpha"
          inputAriaLabel="Resettable framework"
        />
        <button type="reset">Reset framework</button>
      </form>
    )

    const input = screen.getByRole("combobox", {
      name: "Resettable framework",
    })
    const form = input.closest("form") as HTMLFormElement
    expect(input).toHaveValue("Alpha")
    expect(new FormData(form).get("framework")).toBe("alpha")
    await user.click(input)
    const selectedOption = await screen.findByRole("option", { name: "Alpha" })
    expect(selectedOption).toHaveAttribute("data-selected", "")
    expect(selectedOption).toHaveClass(
      "data-[selected]:bg-[var(--menu-item-selected-background)]",
      "data-[selected]:hover:bg-[var(--menu-item-selected-background)]"
    )
    await user.click(await screen.findByRole("option", { name: "Beta" }))
    expect(input).toHaveValue("Beta")

    await user.click(screen.getByRole("button", { name: "Reset framework" }))
    expect(input).toHaveValue("Alpha")
    expect(new FormData(form).get("framework")).toBe("alpha")
  })

  it("blurs only after focus leaves a closed portalled compound", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(
      <div>
        <ComboboxSelect
          options={options}
          inputAriaLabel="Blur-aware framework"
          onBlur={onBlur}
        />
        <button type="button">Next single field</button>
      </div>
    )

    const input = screen.getByRole("combobox", {
      name: "Blur-aware framework",
    })
    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Beta" }))
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Next single field" }))
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })
})

describe("ComboBoxSelect compatibility", () => {
  it("starts and resets at the all sentinel when selection is enforced", async () => {
    const user = userEvent.setup()

    render(
      <form>
        <ComboBoxSelect
          name="framework"
          options={[{ value: "all", label: "All" }, ...options]}
          inputAriaLabel="Resettable filter"
        />
        <button type="reset">Reset filter</button>
      </form>
    )

    const input = screen.getByRole("combobox", { name: "Resettable filter" })
    const form = input.closest("form") as HTMLFormElement
    expect(new FormData(form).getAll("framework")).toEqual(["all"])

    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Alpha" }))
    expect(new FormData(form).getAll("framework")).toEqual(["alpha"])

    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: "Reset filter" }))
    expect(new FormData(form).getAll("framework")).toEqual(["all"])
  })

  it("preserves multi-selection and the all sentinel", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <ComboBoxSelect
        options={[{ value: "all", label: "All" }, ...options]}
        defaultValue={["all"]}
        inputAriaLabel="Filter frameworks"
        onChange={onChange}
      />
    )

    const input = screen.getByRole("combobox", { name: "Filter frameworks" })
    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Alpha" }))

    expect(onChange).toHaveBeenLastCalledWith(["alpha"])
  })
})

describe("MultipleSelect", () => {
  it("adds multiple options and leaves disabled selections locked", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <MultipleSelect
        options={options}
        defaultValue={["locked"]}
        clearable
        inputAriaLabel="Choose frameworks"
        onValueChange={onValueChange}
      />
    )

    const input = screen.getByRole("combobox", { name: "Choose frameworks" })
    const chips = input.closest('[data-slot="combobox-chips"]')
    const lockedChip = screen
      .getAllByText("Locked")
      .map((node) => node.closest('[data-slot="combobox-chip"]'))
      .find((node): node is HTMLElement => node instanceof HTMLElement)

    expect(chips).toHaveClass("min-h-[var(--control-size-md)]")
    expect(chips).not.toHaveClass("min-h-[var(--control-size-sm)]")
    expect(lockedChip).toHaveAttribute("aria-disabled", "true")
    expect(lockedChip).toHaveClass(
      "data-[disabled]:bg-[var(--control-disabled-background)]",
      "data-[disabled]:text-[var(--control-disabled-foreground)]",
      "aria-disabled:bg-[var(--control-disabled-background)]",
      "aria-disabled:text-[var(--control-disabled-foreground)]"
    )

    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Alpha" }))

    expect(onValueChange).toHaveBeenLastCalledWith(
      ["locked", "alpha"],
      [options[2], expect.objectContaining(options[0])]
    )

    await user.click(screen.getByRole("button", { name: "Clear selection" }))

    expect(onValueChange).toHaveBeenLastCalledWith(["locked"], [options[2]])
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0)
  })

  it("restores a disabled selection after keyboard chip deletion", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <MultipleSelect
        options={options}
        defaultValue={["locked"]}
        inputAriaLabel="Locked frameworks"
        onValueChange={onValueChange}
      />
    )

    const input = screen.getByRole("combobox", { name: "Locked frameworks" })
    await user.click(input)
    await user.type(input, "{Backspace}")

    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("retains locked positions and resets uncontrolled form values", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <form>
        <MultipleSelect
          name="framework"
          options={options}
          defaultValue={["alpha", "locked"]}
          inputAriaLabel="Resettable frameworks"
          onValueChange={onValueChange}
        />
        <button type="reset">Reset frameworks</button>
      </form>
    )

    const input = screen.getByRole("combobox", {
      name: "Resettable frameworks",
    })
    const form = input.closest("form") as HTMLFormElement
    expect(new FormData(form).getAll("framework")).toEqual(["alpha", "locked"])
    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Beta" }))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["alpha", "locked", "beta"],
      expect.any(Array)
    )

    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: "Reset frameworks" }))
    expect(new FormData(form).getAll("framework")).toEqual(["alpha", "locked"])
    expect(screen.queryAllByText("Beta")).toHaveLength(0)
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0)
  })

  it("does not blur on popup close and blurs once on final focus exit", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(
      <div>
        <MultipleSelect
          options={options}
          inputAriaLabel="Blur-aware frameworks"
          onBlur={onBlur}
        />
        <button type="button">Next multiple field</button>
      </div>
    )

    const input = screen.getByRole("combobox", {
      name: "Blur-aware frameworks",
    })
    await user.click(input)
    await user.keyboard("{Escape}")
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole("button", { name: "Next multiple field" })
    )
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })
})

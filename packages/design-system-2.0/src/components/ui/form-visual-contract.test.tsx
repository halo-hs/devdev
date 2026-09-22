import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Checkbox } from "./checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
} from "./input-group"
import { Input } from "./input"
import { NativeSelect, NativeSelectOption } from "./native-select"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Select, SelectTrigger, SelectValue } from "./select"
import { Switch } from "./switch"
import { Textarea } from "./textarea"

describe("ECOYA form visual contract", () => {
  it("uses the 40px control shell and semantic state tokens", () => {
    render(
      <>
        <Input aria-label="Input" disabled />
        <Textarea aria-label="Textarea" />
        <InputGroup data-testid="input-group">
          <InputGroupAddon data-testid="input-group-addon">
            <InputGroupText data-testid="input-group-text">
              https://
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="Grouped input" disabled />
        </InputGroup>
        <InputGroup>
          <InputGroupTextarea aria-label="Grouped textarea" />
        </InputGroup>
      </>
    )

    const input = screen.getByRole("textbox", { name: "Input" })
    const textarea = screen.getByRole("textbox", { name: "Textarea" })
    const inputGroup = screen.getByTestId("input-group")
    const inputGroupAddon = screen.getByTestId("input-group-addon")
    const inputGroupText = screen.getByTestId("input-group-text")
    const groupedInput = screen.getByRole("textbox", {
      name: "Grouped input",
    })
    const groupedTextarea = screen.getByRole("textbox", {
      name: "Grouped textarea",
    })

    for (const control of [input, textarea, inputGroup]) {
      expect(control).toHaveClass("rounded-[var(--r-md)]")
      expect(control).toHaveClass("border-[var(--control-border)]")
      expect(control).toHaveClass("bg-[var(--control-background)]")
      expect(control).toHaveClass("shadow-[var(--shadow-input)]")
    }

    for (const control of [input, textarea]) {
      expect(control).toHaveClass("focus-visible:border-transparent")
    }
    expect(inputGroup).toHaveClass(
      "has-[[data-slot=input-group-control]:focus-visible]:border-[var(--control-focus-border)]"
    )

    expect(input).toHaveClass("h-[var(--control-size-md)]")
    expect(input).toHaveClass(
      "disabled:bg-[var(--control-disabled-background)]",
      "disabled:text-[var(--control-disabled-foreground)]",
      "disabled:opacity-100"
    )
    expect(input).not.toHaveClass("disabled:opacity-50")
    for (const control of [input, textarea]) {
      expect(control).toHaveClass(
        "hover:bg-[var(--control-background-hover)]",
        "active:border-[var(--control-border-active)]",
        "active:bg-[var(--control-background-active)]",
        "active:shadow-[var(--shadow-input-active)]",
        "aria-invalid:active:border-[var(--control-invalid-border)]",
        "aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]",
        "focus-visible:shadow-[var(--shadow-input-focused)]",
        "aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]"
      )
    }
    expect(inputGroup).toHaveClass(
      "h-[var(--control-size-md)]",
      "hover:bg-[var(--control-background-hover)]",
      "active:border-[var(--control-border-active)]",
      "active:bg-[var(--control-background-active)]",
      "active:shadow-[var(--shadow-input-active)]",
      "has-disabled:active:bg-[var(--control-disabled-background)]",
      "has-[[data-slot][aria-invalid=true]]:active:border-[var(--control-invalid-border)]",
      "has-[[data-slot][aria-invalid=true]]:active:shadow-[var(--shadow-input-invalid-active)]",
      "has-[[data-slot=input-group-control]:focus-visible]:shadow-[var(--shadow-input-focused)]",
      "has-[[data-slot][aria-invalid=true]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)]"
    )
    for (const innerControl of [groupedInput, groupedTextarea]) {
      expect(innerControl).toHaveClass(
        "border-0!",
        "shadow-none!",
        "focus-visible:shadow-none",
        "aria-invalid:shadow-none"
      )
    }
    for (const accessory of [inputGroupAddon, inputGroupText]) {
      expect(accessory).toHaveClass(
        "text-[var(--control-accessory-foreground)]",
        "group-has-disabled/input-group:text-[var(--control-disabled-foreground)]",
        "group-has-disabled/input-group:opacity-100"
      )
      expect(accessory.className).not.toContain("--color-gray-5")
      expect(accessory.className).not.toContain("opacity-50")
    }
  })

  it("keeps Select and NativeSelect at 40px default and 32px small", () => {
    render(
      <>
        <Select>
          <SelectTrigger aria-label="Default select">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
        <Select>
          <SelectTrigger aria-label="Small select" size="sm">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
        <NativeSelect aria-label="Default native select">
          <NativeSelectOption value="one">One</NativeSelectOption>
        </NativeSelect>
        <NativeSelect aria-label="Small native select" size="sm">
          <NativeSelectOption value="one">One</NativeSelectOption>
        </NativeSelect>
      </>
    )

    const defaultSelect = screen.getByRole("combobox", {
      name: "Default select",
    })
    const smallSelect = screen.getByRole("combobox", {
      name: "Small select",
    })
    const defaultNativeSelect = screen.getByRole("combobox", {
      name: "Default native select",
    })
    const smallNativeSelect = screen.getByRole("combobox", {
      name: "Small native select",
    })

    for (const control of [defaultSelect, defaultNativeSelect]) {
      expect(control).toHaveClass("rounded-[var(--r-md)]")
      expect(control).toHaveClass("bg-[var(--control-background)]")
      expect(control.className).toContain("var(--control-disabled-background)")
    }
    expect(defaultSelect).toHaveClass(
      "data-[size=default]:h-[var(--control-size-md)]",
      "text-[length:var(--text-body-8)]",
      "leading-[var(--leading-body-8)]",
      "hover:bg-[var(--control-background-hover)]",
      "data-[state=open]:bg-[var(--control-background-open)]"
    )
    expect(defaultNativeSelect).toHaveClass(
      "h-[var(--control-size-md)]",
      "hover:bg-[var(--control-background-hover)]",
      "active:border-[var(--control-border-active)]",
      "active:bg-[var(--control-background-active)]",
      "active:shadow-[var(--shadow-input-active)]",
      "aria-invalid:active:border-[var(--control-invalid-border)]",
      "aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]",
      "focus-visible:shadow-[var(--shadow-input-focused)]",
      "aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]"
    )

    expect(smallSelect).toHaveAttribute("data-size", "sm")
    expect(smallSelect).toHaveClass(
      "data-[size=sm]:h-[var(--control-size-sm)]",
      "data-[size=sm]:rounded-[var(--r-sm)]"
    )
    expect(smallNativeSelect).toHaveAttribute("data-size", "sm")
    expect(smallNativeSelect).toHaveClass(
      "data-[size=sm]:h-[var(--control-size-sm)]",
      "data-[size=sm]:rounded-[var(--r-sm)]"
    )
  })

  it("preserves the ECOYA checkbox, radio, and switch dimensions", () => {
    render(
      <>
        <Checkbox aria-label="Checkbox" defaultChecked />
        <Checkbox aria-label="Disabled checkbox" defaultChecked disabled />
        <RadioGroup aria-label="Radio group" defaultValue="one">
          <RadioGroupItem aria-label="Radio" value="one" />
          <RadioGroupItem
            aria-label="Disabled radio"
            value="disabled"
            disabled
          />
        </RadioGroup>
        <Switch aria-label="Switch" defaultChecked />
      </>
    )

    const checkbox = screen.getByRole("checkbox", { name: "Checkbox" })
    const disabledCheckbox = screen.getByRole("checkbox", {
      name: "Disabled checkbox",
    })
    const radio = screen.getByRole("radio", { name: "Radio" })
    const disabledRadio = screen.getByRole("radio", {
      name: "Disabled radio",
    })
    const switchControl = screen.getByRole("switch", { name: "Switch" })

    expect(checkbox).toHaveClass("size-[var(--control-size-xs)]")
    expect(checkbox.className).toContain("var(--control-selected-background)")
    expect(disabledCheckbox).toHaveClass(
      "disabled:data-checked:border-[var(--control-disabled-border)]",
      "disabled:data-checked:bg-[var(--control-disabled-background)]",
      "disabled:data-checked:text-[var(--control-disabled-foreground)]"
    )
    expect(radio).toHaveClass("size-5")
    expect(radio.className).toContain("var(--control-selected-background)")
    expect(disabledRadio).toHaveClass(
      "disabled:data-checked:border-[var(--control-disabled-border)]",
      "disabled:data-checked:bg-[var(--control-disabled-background)]",
      "disabled:data-checked:text-[var(--control-disabled-foreground)]"
    )
    expect(switchControl).toHaveClass(
      "data-[size=default]:h-[22px]",
      "data-[size=default]:w-[44px]"
    )
    expect(switchControl.className).toContain(
      "var(--control-selected-background)"
    )
  })
})

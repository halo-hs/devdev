import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
}

const directControls = [
  "src/components/ui/input.tsx",
  "src/components/ui/textarea.tsx",
  "src/components/ui/native-select.tsx",
] as const

const pickerControls = [
  "src/components/extensions/date-picker.tsx",
  "src/components/extensions/date-time-picker.tsx",
  "src/components/extensions/range-picker.tsx",
  "src/components/extensions/time-picker.tsx",
] as const

describe("control pointer and keyboard shadow contract", () => {
  it.each(directControls)(
    "%s keeps pointer press on elevation and keyboard focus on the halo",
    (path) => {
      const contents = source(path)

      expect(contents).toContain("active:shadow-[var(--shadow-input-active)]")
      expect(contents).toContain(
        "active:focus-visible:shadow-[var(--shadow-input-focused)]"
      )
      expect(contents).toContain(
        "aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]"
      )
      expect(contents).toContain(
        "aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]"
      )
      expect(contents).not.toContain(
        " active:shadow-[var(--shadow-input-focused)]"
      )
    }
  )

  it("keeps Select pointer-open to one border while retaining its keyboard halo", () => {
    const contents = source("src/components/ui/select.tsx")

    expect(contents).toContain(
      "data-[state=open]:shadow-[var(--shadow-input-open)]"
    )
    expect(contents).toContain(
      "data-[state=open]:focus-visible:shadow-[var(--shadow-input-focused)]"
    )
    expect(contents).toContain(
      "aria-invalid:data-[state=open]:shadow-[var(--shadow-input-invalid-open)]"
    )
    expect(contents).toContain(
      "aria-invalid:data-[state=open]:focus-visible:shadow-[var(--shadow-input-invalid-focused)]"
    )
    expect(contents).not.toContain(
      "data-[state=open]:shadow-[var(--shadow-input-focused)]"
    )
  })

  it.each(pickerControls)(
    "%s separates pressed/open elevation from focus-visible",
    (path) => {
      const contents = source(path)

      expect(contents).toContain("active:shadow-[var(--shadow-input-active)]!")
      expect(contents).toContain(
        "aria-expanded:shadow-[var(--shadow-input-open)]!"
      )
      expect(contents).toContain(
        "aria-expanded:focus-visible:shadow-[var(--shadow-input-focused)]!"
      )
      expect(contents).toContain(
        "aria-invalid:aria-expanded:shadow-[var(--shadow-input-invalid-open)]!"
      )
      expect(contents).not.toContain(
        " aria-expanded:shadow-[var(--shadow-input-focused)]!"
      )
    }
  )

  it("keeps grouped combobox controls on the same state roles", () => {
    const inputGroup = source("src/components/ui/input-group.tsx")
    const combobox = source("src/components/ui/combobox.tsx")

    for (const contents of [inputGroup, combobox]) {
      expect(contents).toContain("--shadow-input-active")
      expect(contents).toContain("--shadow-input-open")
      expect(contents).toContain("--shadow-input-invalid-active")
      expect(contents).toContain("--shadow-input-invalid-open")
    }
    expect(inputGroup).toContain(
      "has-[[data-slot=input-group-control][data-popup-open]:focus-visible]:shadow-[var(--shadow-input-focused)]"
    )
    expect(combobox).toContain(
      "has-[[data-slot=combobox-chip-input][data-popup-open]:focus-visible]:shadow-[var(--shadow-input-focused)]"
    )
  })
})

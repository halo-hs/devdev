import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FileDropZone, type FileDropZoneRef } from "./file-drop-zone"
import { InputTimer, formatDuration } from "./input-timer"
import { QuantityStepper } from "./quantity-stepper"
import { Tag } from "./tag"

describe("FileDropZone", () => {
  it("opens from pointer, keyboard, and its imperative handle", async () => {
    const user = userEvent.setup()
    const ref = React.createRef<FileDropZoneRef>()
    const inputClick = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => undefined)

    render(<FileDropZone ref={ref} label="Upload invoice" />)

    const dropZone = screen.getByRole("button", { name: "Upload invoice" })
    await user.click(dropZone)
    dropZone.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    ref.current?.open()
    ref.current?.openFileDialog()

    expect(inputClick).toHaveBeenCalledTimes(5)
    expect(dropZone).toHaveAccessibleDescription(
      "파일을 끌어 놓거나 클릭하여 선택하세요."
    )

    inputClick.mockRestore()
  })

  it("emits stable file arrays, preserves the legacy callback, and resets", async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    const onFileSelect = vi.fn()
    const ref = React.createRef<FileDropZoneRef>()
    const { container } = render(
      <FileDropZone
        ref={ref}
        multiple
        accept=".pdf"
        onFiles={onFiles}
        onFileSelect={onFileSelect}
      />
    )
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')
    const file = new File(["invoice"], "invoice.pdf", {
      type: "application/pdf",
    })

    expect(input).not.toBeNull()
    expect(input).toHaveAttribute("multiple")
    expect(input).toHaveAttribute("accept", ".pdf")

    await user.upload(input as HTMLInputElement, file)
    expect((input as HTMLInputElement).files).toHaveLength(1)
    ref.current?.open()
    expect((input as HTMLInputElement).value).toBe("")
    await user.upload(input as HTMLInputElement, file)

    expect(onFiles).toHaveBeenCalledTimes(2)
    expect(onFiles).toHaveBeenLastCalledWith([file])
    expect(onFileSelect).toHaveBeenCalledTimes(2)
    expect((input as HTMLInputElement).files).toHaveLength(1)
  })

  it("reports drag state and ignores files while disabled", () => {
    const onFiles = vi.fn()
    const onDragStateChange = vi.fn()
    const { rerender } = render(
      <FileDropZone
        aria-label="Documents"
        onFiles={onFiles}
        onDragStateChange={onDragStateChange}
      />
    )
    const dropZone = screen.getByRole("button", { name: "Documents" })
    const file = new File(["a"], "a.txt", { type: "text/plain" })

    expect(dropZone).toHaveClass(
      "border-[var(--file-drop-border)]",
      "bg-[var(--file-drop-background)]",
      "text-[var(--file-drop-foreground)]",
      "hover:bg-[var(--file-drop-background-hover)]",
      "active:bg-[var(--file-drop-background-active)]",
      "data-[dragging=true]:border-[var(--file-drop-border-dragging)]",
      "data-[dragging=true]:bg-[var(--file-drop-background-dragging)]"
    )
    expect(dropZone).not.toHaveClass("data-[disabled=true]:opacity-50")

    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [file] } })
    expect(dropZone).toHaveAttribute("data-dragging", "true")
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })
    expect(onFiles).toHaveBeenLastCalledWith([file])
    expect(onDragStateChange.mock.calls).toEqual([[true], [false]])

    rerender(
      <FileDropZone
        aria-label="Documents"
        disabled
        onFiles={onFiles}
        onDragStateChange={onDragStateChange}
      />
    )
    const disabledDropZone = screen.getByRole("button", { name: "Documents" })
    expect(disabledDropZone).toHaveClass(
      "data-[disabled=true]:border-[var(--file-drop-disabled-border)]",
      "data-[disabled=true]:bg-[var(--file-drop-disabled-background)]",
      "data-[disabled=true]:text-[var(--file-drop-disabled-foreground)]"
    )
    expect(disabledDropZone).not.toHaveClass(
      "hover:bg-[var(--file-drop-background-hover)]",
      "active:bg-[var(--file-drop-background-active)]",
      "data-[disabled=true]:opacity-50"
    )

    fireEvent.drop(disabledDropZone, {
      dataTransfer: { files: [file] },
    })

    expect(onFiles).toHaveBeenCalledTimes(1)
  })

  it("filters dropped files, keeps a single selection, and assigns it to the native input", () => {
    const createFileList = (files: readonly File[]) => {
      const fileList = {
        length: files.length,
        item: (index: number) => files[index] ?? null,
        [Symbol.iterator]: function* () {
          yield* files
        },
      } as FileList

      files.forEach((file, index) => {
        Object.defineProperty(fileList, index, { value: file })
      })
      return fileList
    }
    class DataTransferMock {
      private readonly selectedFiles: File[] = []
      readonly items = {
        add: (file: File) => {
          this.selectedFiles.push(file)
        },
      }
      get files() {
        return createFileList(this.selectedFiles)
      }
    }

    const dataTransferDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "DataTransfer"
    )
    Object.defineProperty(window, "DataTransfer", {
      configurable: true,
      value: DataTransferMock,
    })

    try {
      const onFiles = vi.fn()
      const onFileSelect = vi.fn()
      const { container } = render(
        <form>
          <FileDropZone
            aria-label="Invoice attachment"
            accept=".pdf,image/*"
            name="invoice"
            required
            onFiles={onFiles}
            onFileSelect={onFileSelect}
          />
        </form>
      )
      const input = container.querySelector<HTMLInputElement>(
        'input[type="file"]'
      ) as HTMLInputElement
      let assignedFiles: FileList | null = null
      Object.defineProperty(input, "files", {
        configurable: true,
        get: () => assignedFiles,
        set: (nextFiles: FileList | null) => {
          assignedFiles = nextFiles
        },
      })
      const ignored = new File(["notes"], "notes.txt", {
        type: "text/plain",
      })
      const accepted = new File(["invoice"], "invoice.pdf", {
        type: "application/pdf",
      })
      const extraAccepted = new File(["preview"], "preview.png", {
        type: "image/png",
      })

      fireEvent.drop(
        screen.getByRole("button", { name: "Invoice attachment" }),
        { dataTransfer: { files: [ignored, accepted, extraAccepted] } }
      )

      expect(input).toHaveAttribute("name", "invoice")
      expect(input).toBeRequired()
      expect(input).not.toHaveAttribute("multiple")
      expect(input.files).toHaveLength(1)
      expect(input.files?.item(0)).toBe(accepted)
      expect(onFiles).toHaveBeenLastCalledWith([accepted])
      const emittedFileList = onFileSelect.mock.lastCall?.[0] as FileList
      expect(Array.from(emittedFileList)).toEqual([accepted])
    } finally {
      if (dataTransferDescriptor) {
        Object.defineProperty(window, "DataTransfer", dataTransferDescriptor)
      } else {
        Reflect.deleteProperty(window, "DataTransfer")
      }
    }
  })
})

describe("QuantityStepper", () => {
  it("supports uncontrolled bounds, steps, and legacy callbacks", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onIncrement = vi.fn()

    render(
      <QuantityStepper
        defaultValue={1}
        min={0}
        max={2}
        onValueChange={onValueChange}
        onIncrement={onIncrement}
      />
    )

    await user.click(screen.getByRole("button", { name: "수량 늘리기" }))

    expect(screen.getByRole("status", { name: "수량: 2" })).toHaveTextContent(
      "2"
    )
    expect(screen.getByRole("button", { name: "수량 늘리기" })).toBeDisabled()
    expect(onValueChange).toHaveBeenLastCalledWith(2)
    expect(onIncrement).toHaveBeenCalledOnce()
  })

  it("keeps controlled values under parent control", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(<QuantityStepper value={4} step={2} onValueChange={onValueChange} />)
    await user.click(screen.getByRole("button", { name: "수량 늘리기" }))

    expect(onValueChange).toHaveBeenLastCalledWith(6)
    expect(screen.getByRole("status", { name: "수량: 4" })).toBeInTheDocument()
  })

  it("restores its uncontrolled form value on reset", async () => {
    const user = userEvent.setup()

    render(
      <form>
        <QuantityStepper name="quantity" defaultValue={2} />
        <button type="reset">Reset quantity</button>
      </form>
    )

    await user.click(screen.getByRole("button", { name: "수량 늘리기" }))
    expect(screen.getByRole("status", { name: "수량: 3" })).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Reset quantity" }))
    expect(screen.getByRole("status", { name: "수량: 2" })).toBeVisible()
  })

  it("does not submit a disabled value", () => {
    render(
      <form data-testid="quantity-form">
        <QuantityStepper name="quantity" defaultValue={2} disabled />
      </form>
    )

    const form = screen.getByTestId("quantity-form") as HTMLFormElement
    expect(new FormData(form).has("quantity")).toBe(false)
  })
})

describe("Tag", () => {
  it("provides an accessible removal action without bubbling", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onClick = vi.fn()

    render(
      <Tag label="Invoice" onRemove={onRemove} onClick={onClick} invalid />
    )
    await user.click(screen.getByRole("button", { name: "Invoice 삭제" }))

    expect(onRemove).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
    expect(
      screen.getByText("Invoice").closest("[data-slot=tag]")
    ).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("Invoice").closest("[data-slot=tag]")).toHaveClass(
      "shadow-[var(--shadow-tag-valid)]",
      "data-[invalid=true]:shadow-[var(--shadow-tag-invalid)]"
    )
  })

  it("disables removal when the tag is disabled", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(<Tag label="Locked" onRemove={onRemove} disabled />)
    const remove = screen.getByRole("button", { name: "Locked 삭제" })
    const tag = screen.getByText("Locked").closest("[data-slot=tag]")
    expect(tag).toHaveClass(
      "data-[disabled=true]:bg-[var(--control-disabled-background)]!",
      "data-[disabled=true]:text-[var(--control-disabled-foreground)]!",
      "data-[disabled=true]:shadow-[var(--shadow-tag-disabled)]!"
    )
    expect(tag).not.toHaveClass("opacity-50")
    expect(remove).toBeDisabled()
    await user.click(remove)
    expect(onRemove).not.toHaveBeenCalled()
  })
})

describe("InputTimer", () => {
  it("clamps invalid values and formats longer durations", () => {
    expect(formatDuration(-10)).toBe("00:00")
    expect(formatDuration(Number.NaN)).toBe("00:00")
    expect(formatDuration(3661)).toBe("01:01:01")

    const { rerender } = render(<InputTimer seconds={-10} />)
    expect(screen.getByRole("timer", { name: "0초" })).toHaveTextContent(
      "00:00"
    )

    rerender(<InputTimer seconds={3661} showSuffix />)
    const timer = screen.getByRole("timer", { name: "1시간 1분 1초" })
    expect(timer).toHaveTextContent("01:01:01 sec")
    expect(timer).toHaveAttribute("datetime", "PT3661S")
  })
})

"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"

import { cn } from "@ecoya/design-system/lib/utils"

type FileDropZoneContainerProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"
>

export interface FileDropZoneProps extends FileDropZoneContainerProps {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  clickToSelect?: boolean
  name?: string
  required?: boolean
  label?: React.ReactNode
  /** @deprecated Use label. */
  text?: React.ReactNode
  instructions?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
  onFiles?: (files: File[]) => void
  /** @deprecated Prefer onFiles, which returns a stable array. */
  onFileSelect?: (files: FileList) => void
  onDragStateChange?: (isDragging: boolean) => void
}

export interface FileDropZoneRef {
  open: () => void
  /** @deprecated Use open. */
  openFileDialog: () => void
  clear: () => void
}

function matchesAccept(file: File, accept: string | undefined) {
  const rules =
    accept
      ?.split(",")
      .map((rule) => rule.trim().toLocaleLowerCase())
      .filter(Boolean) ?? []

  if (rules.length === 0) return true

  const fileName = file.name.toLocaleLowerCase()
  const fileType = file.type.toLocaleLowerCase()

  return rules.some((rule) => {
    if (rule.startsWith(".")) return fileName.endsWith(rule)
    if (rule.endsWith("/*")) {
      return fileType.startsWith(`${rule.slice(0, -1)}`)
    }
    return fileType === rule
  })
}

function createFileListFallback(files: readonly File[]): FileList {
  const list = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: function* () {
      yield* files
    },
  } as FileList

  files.forEach((file, index) => {
    Object.defineProperty(list, index, {
      configurable: false,
      enumerable: true,
      value: file,
      writable: false,
    })
  })

  return list
}

function createFileList(input: HTMLInputElement, files: readonly File[]) {
  const DataTransferConstructor = input.ownerDocument.defaultView?.DataTransfer

  if (DataTransferConstructor) {
    try {
      const transfer = new DataTransferConstructor()
      files.forEach((file) => transfer.items.add(file))
      return { fileList: transfer.files, assignable: true }
    } catch {
      // Some browser engines expose DataTransfer without a constructible API.
    }
  }

  return { fileList: createFileListFallback(files), assignable: false }
}

const FileDropZone = React.forwardRef<FileDropZoneRef, FileDropZoneProps>(
  function FileDropZone(
    {
      accept,
      multiple = false,
      disabled = false,
      clickToSelect = true,
      name,
      required,
      label,
      text,
      instructions = "파일을 끌어 놓거나 클릭하여 선택하세요.",
      icon,
      children,
      onFiles,
      onFileSelect,
      onDragStateChange,
      className,
      id,
      role,
      tabIndex,
      onClick,
      onKeyDown,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...containerProps
    },
    ref
  ) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dragDepthRef = React.useRef(0)
    const dragStateRef = React.useRef(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const generatedId = React.useId().replaceAll(":", "")
    const inputId = `${id ?? `file-drop-zone-${generatedId}`}-input`
    const instructionsId = `${inputId}-instructions`
    const visibleLabel = label ?? text ?? "파일 업로드"
    const accessibleLabel =
      ariaLabel ??
      (ariaLabelledBy
        ? undefined
        : typeof visibleLabel === "string"
          ? visibleLabel
          : "파일 업로드")
    const describedBy = [ariaDescribedBy, instructions && instructionsId]
      .filter(Boolean)
      .join(" ")

    const setDragState = React.useCallback(
      (nextState: boolean) => {
        if (dragStateRef.current === nextState) return

        dragStateRef.current = nextState
        setIsDragging(nextState)
        onDragStateChange?.(nextState)
      },
      [onDragStateChange]
    )

    const clear = React.useCallback(() => {
      if (inputRef.current) inputRef.current.value = ""
    }, [])

    const open = React.useCallback(() => {
      if (disabled) return

      clear()
      inputRef.current?.click()
    }, [clear, disabled])

    React.useImperativeHandle(
      ref,
      () => ({ open, openFileDialog: open, clear }),
      [clear, open]
    )

    React.useEffect(() => {
      if (!disabled) return

      dragDepthRef.current = 0
      setDragState(false)
    }, [disabled, setDragState])

    const emitFiles = React.useCallback(
      (fileList: FileList, source: "dialog" | "drop") => {
        const input = inputRef.current
        if (!input || fileList.length === 0) return

        const sourceFiles = Array.from(fileList)
        const acceptedFiles = sourceFiles
          .filter((file) => source === "dialog" || matchesAccept(file, accept))
          .slice(0, multiple ? undefined : 1)

        if (acceptedFiles.length === 0) return

        let emittedFileList = fileList
        const selectionChanged =
          acceptedFiles.length !== sourceFiles.length ||
          acceptedFiles.some((file, index) => file !== sourceFiles[index])

        if (source === "drop" || selectionChanged) {
          const preparedFiles = createFileList(input, acceptedFiles)
          emittedFileList = preparedFiles.fileList

          if (preparedFiles.assignable) {
            try {
              input.files = preparedFiles.fileList
            } catch {
              // Keep callbacks functional in partial DOM implementations. Real
              // browsers accept FileLists created by their own DataTransfer.
            }
          }
        }

        onFiles?.(acceptedFiles)
        onFileSelect?.(emittedFileList)
      },
      [accept, multiple, onFileSelect, onFiles]
    )

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.currentTarget.files) {
        emitFiles(event.currentTarget.files, "dialog")
      }
    }

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (disabled) return

      dragDepthRef.current += 1
      setDragState(true)
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = disabled ? "none" : "copy"
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (disabled) return

      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
      if (dragDepthRef.current === 0) setDragState(false)
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      dragDepthRef.current = 0
      setDragState(false)
      if (disabled) return

      emitFiles(event.dataTransfer.files, "drop")
    }

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (event.defaultPrevented || disabled || !clickToSelect) return

      const target = event.target
      if (
        target instanceof Element &&
        target !== event.currentTarget &&
        target.closest("button, a, input, select, textarea")
      ) {
        return
      }

      open()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (
        event.defaultPrevented ||
        event.target !== event.currentTarget ||
        disabled ||
        !clickToSelect
      ) {
        return
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        open()
      }
    }

    return (
      <>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          onChange={handleInputChange}
        />
        <div
          {...containerProps}
          id={id}
          role={role ?? (clickToSelect ? "button" : "group")}
          tabIndex={tabIndex ?? (!disabled && clickToSelect ? 0 : undefined)}
          aria-label={accessibleLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={describedBy || undefined}
          aria-disabled={disabled || undefined}
          data-slot="file-drop-zone"
          data-dragging={isDragging || undefined}
          data-disabled={disabled || undefined}
          className={cn(
            "flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-[var(--r-md)] border border-dashed border-[var(--file-drop-border)] bg-[var(--file-drop-background)] px-6 py-8 text-center text-sm text-[var(--file-drop-foreground)] transition-colors outline-none focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-keyboard-focus)] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-[var(--file-drop-disabled-border)] data-[disabled=true]:bg-[var(--file-drop-disabled-background)] data-[disabled=true]:text-[var(--file-drop-disabled-foreground)] data-[dragging=true]:border-[var(--file-drop-border-dragging)] data-[dragging=true]:bg-[var(--file-drop-background-dragging)] [&_svg:not([class*='size-'])]:size-5",
            !disabled &&
              clickToSelect &&
              "cursor-pointer hover:bg-[var(--file-drop-background-hover)] active:bg-[var(--file-drop-background-active)]",
            className
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children ?? (
            <>
              {icon ?? <UploadIcon aria-hidden="true" />}
              <span className="font-medium">{visibleLabel}</span>
              {instructions && <span id={instructionsId}>{instructions}</span>}
            </>
          )}
          {children && instructions && (
            <span id={instructionsId} className="sr-only">
              {instructions}
            </span>
          )}
        </div>
      </>
    )
  }
)

FileDropZone.displayName = "FileDropZone"

export { FileDropZone }
export default FileDropZone

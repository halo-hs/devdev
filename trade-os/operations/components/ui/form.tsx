"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";

import { Icon } from "./icon";
import { TextInput } from "./input";
import { cx } from "./utils";

type FormFieldDirection = "horizontal" | "vertical";
type FormFieldAlign = "start" | "center";
type FormFieldLabelAlign = "start" | "center";
type LabelSize = "M" | "S" | "full" | "filter";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  disabled?: boolean;
  required?: boolean;
  size?: LabelSize;
};

type FormFieldProps = {
  align?: FormFieldAlign;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  dataUi?: string;
  direction?: FormFieldDirection;
  helper?: ReactNode;
  label: ReactNode;
  labelAccessory?: ReactNode;
  labelAlign?: FormFieldLabelAlign;
  required?: boolean;
};

type FileUploadRowProps = {
  buttonLabel?: ReactNode;
  className?: string;
  message?: ReactNode;
  width?: "397" | "full";
};

type AddressFieldGroupProps = {
  buttonLabel?: ReactNode;
  className?: string;
  firstTrailingSearch?: boolean;
  placeholders?: {
    city?: string;
    country?: string;
    detail?: string;
  };
  showTopButton?: boolean;
  width?: "397" | "438";
};

type FileDropzoneProps = Pick<FileUploadRowProps, "buttonLabel" | "message"> & {
  className?: string;
};

export type FileDropZoneProps = {
  accept?: string;
  children?: ReactNode;
  className?: string;
  clickToSelect?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onDragStateChange?: (isDragging: boolean) => void;
  onFileSelect?: (files: FileList) => void;
  text?: ReactNode;
};

export type FileDropZoneRef = {
  openFileDialog: () => void;
};

type ImageAttachBoxProps = {
  className?: string;
  label?: ReactNode;
};

const OPEN_DIALOG_COOLDOWN_MS = 500;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  function Label({
    children,
    className,
    disabled = false,
    required = false,
    size = "M",
    ...props
  }, ref) {
    return (
      <label
        className={cx(
          "flex shrink-0 items-center gap-1",
          size === "M" && "w-[164px]",
          size === "S" && "w-[100px]",
          size === "full" && "w-full",
          size === "filter" && "min-w-[60px] max-w-[300px] py-2 pl-1 pr-2",
          disabled
            ? "text-[color:var(--ecoya-gray-8)]"
            : size === "filter"
              ? "text-[color:var(--ecoya-gray-4)]"
              : "text-[color:var(--ecoya-gray-2)]",
          className,
        )}
        data-ui="label"
        ref={ref}
        {...props}
      >
        <span
          className={cx(
            "min-w-0 truncate",
            size === "S" ? "text-body-14 font-regular" : "text-label-15 font-medium",
            size === "filter" && "font-regular",
          )}
        >
          {children}
        </span>
        {required ? (
          <span aria-hidden="true" className="shrink-0 text-ecoya-system-red-2">
            *
          </span>
        ) : null}
      </label>
    );
  },
);

export function FormField({
  align = "start",
  children,
  className,
  contentClassName,
  dataUi,
  direction = "horizontal",
  helper,
  label,
  labelAccessory,
  labelAlign = "center",
  required = true,
}: FormFieldProps) {
  const requiredMark = required ? (
    <span className="text-body-16 font-medium text-ecoya-system-red-2">*</span>
  ) : null;
  const labelContent = labelAccessory ? (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-0.5">
        <span>{label}</span>
        {requiredMark}
      </span>
      {labelAccessory}
    </span>
  ) : (
    <>
      <span>{label}</span>
      {requiredMark}
    </>
  );

  if (direction === "vertical") {
    return (
      <div
        className={cx("flex w-[480px] flex-col items-start gap-3", className)}
        data-ui={dataUi ?? "form-field"}
      >
        <span className="flex h-6 w-full items-start gap-2">
          <span className="flex min-w-0 flex-1 items-start gap-0.5 text-label-15 font-medium text-ecoya-gray-2">
            {labelContent}
          </span>
        </span>
        <span className={cx("flex w-full flex-col gap-2", contentClassName)}>
          {children}
          {helper}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "flex w-[600px] gap-4",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
      data-ui={dataUi ?? "form-field"}
    >
      <span
        className={cx(
          "flex min-w-40 max-w-[300px] shrink-0 gap-0.5 whitespace-nowrap text-label-15 font-medium text-ecoya-gray-2",
          labelAlign === "center" ? "h-10 items-center" : "items-start",
        )}
      >
        {labelContent}
      </span>
      <span className={cx("flex min-w-0 flex-col gap-2.5", !contentClassName && "flex-1", contentClassName)}>
        {children}
        {helper}
      </span>
    </div>
  );
}

export function FileUploadRow({
  buttonLabel,
  className,
  message,
  width = "397",
}: FileUploadRowProps) {
  return (
    <div
      className={cx(
        "flex items-center gap-2",
        width === "full" ? "w-full" : "w-[397px]",
        className,
      )}
      data-ui="file-upload-row"
    >
      <button
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md bg-ecoya-blue-10 py-1.5 pl-2 pr-3 text-button-15 font-medium text-ecoya-indigo shadow-[var(--ecoya-shadow-button-blue)]"
        type="button"
      >
        <Icon className="size-5" name="icon-attach" />
        {buttonLabel ? <span className="shrink-0">{buttonLabel}</span> : null}
      </button>
      {message ? (
        <span className="min-w-0 flex-1 text-body-16 font-regular text-ecoya-gray-7">
          {message}
        </span>
      ) : null}
    </div>
  );
}

export function AddressFieldGroup({
  buttonLabel,
  className,
  firstTrailingSearch = false,
  placeholders,
  showTopButton = true,
  width = "397",
}: AddressFieldGroupProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-start gap-2",
        width === "438" ? "w-[438px]" : "w-[397px]",
        className,
      )}
      data-ui="address-field-group"
    >
      {showTopButton ? (
        <div className="flex w-full items-start justify-end gap-2">
          <button
            className="inline-flex h-6 shrink-0 items-center gap-0.5 overflow-hidden rounded-[6px] bg-ecoya-gray-12 py-0 pl-1 pr-2 text-button-13 font-medium text-ecoya-gray-2 shadow-[var(--ecoya-shadow-button-black)]"
            type="button"
          >
            <Icon className="size-4" name="icon-search" />
            {buttonLabel ? <span className="shrink-0">{buttonLabel}</span> : null}
          </button>
        </div>
      ) : null}
      <TextInput
        className="w-full"
        placeholder={placeholders?.detail}
        showClearIcon={false}
        trailingSlot={
          firstTrailingSearch ? (
            <Icon className="size-5 text-ecoya-gray-2" name="icon-search" />
          ) : undefined
        }
      />
      <TextInput className="w-full" placeholder={placeholders?.city} />
      <div className="flex w-full flex-wrap items-start gap-y-2">
        <TextInput className="min-w-[210px] flex-1" placeholder={placeholders?.country} />
      </div>
    </div>
  );
}

export function FileDropzone({ buttonLabel, className, message }: FileDropzoneProps) {
  return (
    <div
      className={cx("flex w-[480px] flex-col items-start rounded-md border border-ecoya-gray-9 p-4", className)}
      data-ui="file-dropzone"
    >
      <FileUploadRow buttonLabel={buttonLabel} message={message} width="full" />
    </div>
  );
}

export const FileDropZone = forwardRef<FileDropZoneRef, FileDropZoneProps>(
  function FileDropZone({
    accept,
    children,
    className,
    clickToSelect = true,
    disabled = false,
    icon,
    onDragStateChange,
    onFileSelect,
    text = "Please Register the file",
  }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastOpenTimeRef = useRef(0);
    const [isDragOver, setIsDragOver] = useState(false);

    const openFileDialog = useCallback(() => {
      const now = Date.now();
      if (now - lastOpenTimeRef.current < OPEN_DIALOG_COOLDOWN_MS) return;
      lastOpenTimeRef.current = now;
      fileInputRef.current?.click();
    }, []);

    useImperativeHandle(ref, () => ({ openFileDialog }), [openFileDialog]);

    const setDragging = useCallback((nextDragging: boolean) => {
      setIsDragOver(nextDragging);
      onDragStateChange?.(nextDragging);
    }, [onDragStateChange]);

    const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) {
        setDragging(true);
      }
    }, [disabled, setDragging]);

    const handleDragLeave = useCallback(() => {
      setDragging(false);
    }, [setDragging]);

    const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (disabled || event.dataTransfer.files.length === 0) return;
      onFileSelect?.(event.dataTransfer.files);
    }, [disabled, onFileSelect, setDragging]);

    return (
      <>
        <input
          accept={accept}
          aria-label="File upload"
          className="hidden"
          data-testid="file-input"
          data-ui="file-drop-zone-input"
          onChange={(event) => {
            if (event.target.files?.length) {
              onFileSelect?.(event.target.files);
            }
            event.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
        <div
          className={cx(
            // 테두리는 점선이다 (EXTENSIONS-08). 정본: Figma SNAP 2.0 node 48:5 ·
            // "extensions" 보드 FileDropZone(749:12835). 보드 루트 className 이
            // 상태 삼항 **앞**에 `border-dashed` 를 공통으로 두고, 6개 state
            // (default 749:12836 / state4 749:12843 / state5 749:12865 /
            // dragging 749:12850 / disabled 749:12857 / bar 2343:13740) 어디에도
            // 이를 되돌리는 border-solid 선언이 없다.
            // 근거: _workspace/figma-snap2-token-component/05_extensions/design_context.md:117
            "flex h-[95px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-ecoya-blue-7 bg-ecoya-blue-10 p-0 text-body-14 font-medium leading-[20.44px] text-[color:var(--ecoya-blue-4)] transition-all duration-200",
            isDragOver && "border-ecoya-blue-5 bg-ecoya-blue-9",
            disabled && "cursor-default",
            clickToSelect && !disabled && "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4",
            className,
          )}
          data-ui="file-drop-zone"
          onClick={() => {
            if (!disabled && clickToSelect) {
              openFileDialog();
            }
          }}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={(event) => {
            if (!disabled && clickToSelect && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              openFileDialog();
            }
          }}
          role={clickToSelect && !disabled ? "button" : undefined}
          tabIndex={clickToSelect && !disabled ? 0 : undefined}
        >
          {children ?? (
            <>
              {icon ?? <Icon className="size-[21px]" name="icon-arrow-upload" />}
              <span>{text}</span>
            </>
          )}
        </div>
      </>
    );
  },
);

export function ImageAttachBox({ className, label }: ImageAttachBoxProps) {
  return (
    <div
      className={cx("flex h-[95px] w-full items-start gap-2", className)}
      data-ui="image-attach-box"
    >
      <button
        className="flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-md border border-dashed border-ecoya-blue-7 bg-ecoya-blue-10 text-button-13 font-medium text-ecoya-blue-4"
        type="button"
      >
        <Icon className="size-[21px]" name="icon-image-add" />
        {label ? <span>{label}</span> : null}
      </button>
    </div>
  );
}

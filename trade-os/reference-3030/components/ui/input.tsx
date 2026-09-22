"use client";

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { CancelCircleIcon, Icon } from "./icon";
import { cx } from "./utils";

type FieldVisualState =
  | "default"
  | "hover"
  | "focused"
  | "error"
  | "disabled"
  | "success";

type InputSize = "md" | "sm";
type FieldMessageVariant = "error" | "success" | "info";
type InputLabelSize = 14 | 15 | 16;
type InputFieldSize = "M" | "S";
type InputFieldState = "default" | "error" | "success";

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  // erp-v2-adapt: begin — QA-1328 localized accessible name for clear controls
  clearAriaLabel?: string;
  // erp-v2-adapt: end
  leadingSlot?: ReactNode;
  onClear?: () => void;
  showClearIcon?: boolean;
  size?: InputSize;
  trailingSlot?: ReactNode;
  visualState?: FieldVisualState;
};

type TimerInputProps = Omit<TextInputProps, "size"> & {
  timerLabel?: ReactNode;
};

type SelectTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size" | "type"
> & {
  open?: boolean;
  placeholder?: string;
  selectedText?: string;
  size?: InputSize;
  visualState?: FieldVisualState;
};

type DateTriggerProps = SelectTriggerProps;

type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  visualState?: FieldVisualState;
};

type ReadOnlyTextColor = "gray1" | "gray2" | "gray3" | "gray4" | "gray5" | "gray6" | "gray7";
type ReadOnlyTextTypo = "b7r" | "b7m" | "b8r" | "b8m" | "b9r" | "b9m";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  counter?: ReactNode;
  errorMessage?: ReactNode;
  fullWidth?: boolean;
  isReadOnly?: boolean;
  visualState?: FieldVisualState;
};

export type ReadOnlyTextProps = HTMLAttributes<HTMLDivElement> & {
  color?: ReadOnlyTextColor;
  typoType?: ReadOnlyTextTypo;
};

type ChipProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onRemove?: () => void;
};

type ChipInputProps = {
  chips?: Array<string>;
  className?: string;
  disabled?: boolean;
  visualState?: FieldVisualState;
};

type FieldMessageProps = {
  children: ReactNode;
  className?: string;
  variant?: FieldMessageVariant;
};

type InputLabelProps = {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
  size?: InputLabelSize;
};

type InputMessageVariant = "success" | "error" | "guide";

type InputMessageProps = {
  children: ReactNode;
  className?: string;
  variant: InputMessageVariant;
};

type InputTimerProps = {
  className?: string;
  disabled?: boolean;
  seconds: number;
  showSuffix?: boolean;
};

export type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  allowClear?: boolean;
  // erp-v2-adapt: begin — QA-1328 localized accessible name for clear controls
  clearAriaLabel?: string;
  // erp-v2-adapt: end
  guide?: ReactNode;
  inputClassName?: string;
  inputSize?: InputFieldSize;
  label?: ReactNode;
  labelSize?: InputLabelSize;
  message?: ReactNode;
  messageVariant?: InputMessageVariant;
  onClear?: () => void;
  required?: boolean;
  state?: InputFieldState;
  suffix?: ReactNode;
  timerDisabled?: boolean;
  timerSeconds?: number;
};

const inputFrameByState: Record<FieldVisualState, string> = {
  default: "border-ecoya-gray-10 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input)]",
  hover: "border-transparent bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input-hover)]",
  focused: "border-ecoya-blue-1 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input)]",
  error: "border-ecoya-system-red-2 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input)]",
  disabled: "border-ecoya-gray-8 bg-ecoya-gray-10 shadow-[var(--ecoya-shadow-input)]",
  success: "border-ecoya-gray-10 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input)]",
};

const inputTextByState: Record<FieldVisualState, string> = {
  default: "text-ecoya-gray-2 placeholder:text-ecoya-gray-7",
  hover: "text-ecoya-gray-2 placeholder:text-ecoya-gray-7",
  focused: "text-ecoya-gray-2 placeholder:text-ecoya-gray-7",
  error: "text-ecoya-gray-2 placeholder:text-ecoya-gray-7",
  disabled: "text-ecoya-gray-7 placeholder:text-ecoya-gray-7",
  success: "text-ecoya-gray-2 placeholder:text-ecoya-gray-7",
};

const readOnlyTextColorClass: Record<ReadOnlyTextColor, string> = {
  gray1: "text-ecoya-gray-1",
  gray2: "text-ecoya-gray-2",
  gray3: "text-ecoya-gray-3",
  gray4: "text-ecoya-gray-4",
  gray5: "text-ecoya-gray-5",
  gray6: "text-ecoya-gray-6",
  gray7: "text-ecoya-gray-7",
};

const readOnlyTextTypoClass: Record<ReadOnlyTextTypo, string> = {
  b7r: "text-body-16 font-regular",
  b7m: "text-body-16 font-medium",
  b8r: "text-body-15 font-regular",
  b8m: "text-body-15 font-medium",
  b9r: "text-body-14 font-regular",
  b9m: "text-body-14 font-medium",
};

function resolvedState(disabled: boolean | undefined, visualState?: FieldVisualState) {
  return disabled ? "disabled" : (visualState ?? "default");
}

function hasFieldValue(value: TextInputProps["value"] | TextInputProps["defaultValue"]) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).length > 0;
}

function inputFrameClass(
  state: FieldVisualState,
  interactive = true,
  size: InputSize = "md",
) {
  const isInteractive = interactive && state !== "disabled";
  // S(Small)=gray2, M(Medium)=blue1 — 정적 클래스(Tailwind JIT 스캔 대상)
  const focusBorder =
    size === "sm"
      ? "focus-within:border-ecoya-gray-2"
      : "focus-within:border-ecoya-blue-1";

  return cx(
    "relative flex min-w-0 overflow-hidden rounded-md border",
    inputFrameByState[state],
    // hover = 회색 lift (border transparent + shadow.input.hover)
    isInteractive &&
      state !== "error" &&
      "hover:border-transparent hover:shadow-[var(--ecoya-shadow-input-hover)]",
    // focus = border blue1(M)/gray2(S) + shadow.input.default
    isInteractive &&
      state !== "error" &&
      cx("focus-within:shadow-[var(--ecoya-shadow-input)]", focusBorder),
    // error focus/hover = 빨강 border 유지 + invalid-focused ring
    isInteractive &&
      state === "error" &&
      "border-ecoya-system-red-2 hover:border-ecoya-system-red-2 focus-within:border-ecoya-system-red-2 focus-within:shadow-[var(--ecoya-shadow-input-invalid-focused)]",
  );
}

function formatInputTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function inputFieldVisualState(state: InputFieldState): FieldVisualState {
  if (state === "error") return "error";
  if (state === "success") return "success";
  return "default";
}

function inputFieldMessageVariant(
  state: InputFieldState,
  messageVariant?: InputMessageVariant,
): InputMessageVariant | undefined {
  if (messageVariant) return messageVariant;
  if (state === "error") return "error";
  if (state === "success") return "success";
  return undefined;
}

// erp-v2-adapt: begin — QA-1328 localized accessible name for clear controls
function ClearButton({
  label = "Clear input",
  onClear,
}: {
  label?: string;
  onClear?: () => void;
}) {
  const clearIcon = (
    <CancelCircleIcon
      className="size-5 text-ecoya-gray-7 hover:text-ecoya-gray-5"
    />
  );

  if (!onClear) return clearIcon;

  return (
    <button
      aria-label={label}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
      onClick={onClear}
      type="button"
    >
      {clearIcon}
    </button>
  );
}
// erp-v2-adapt: end

function selectFrameClass(state: FieldVisualState, size: InputSize) {
  const frameClass =
    state === "focused" && size === "sm"
      ? "border-ecoya-gray-2 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-input)]"
      : inputFrameByState[state];

  return cx(
    "relative flex min-w-0 overflow-hidden rounded-md border",
    frameClass,
    // hover = 회색 lift (열림/포커스/비활성 제외)
    state !== "disabled" &&
      state !== "focused" &&
      "hover:border-transparent hover:shadow-[var(--ecoya-shadow-input-hover)]",
  );
}

function textInputFrameLayout(state: FieldVisualState, hasAccessorySlot: boolean) {
  if (hasAccessorySlot) return "items-center gap-2";
  if (state === "focused") return "items-center gap-0.5";
  if (state === "disabled") return "content-start flex-wrap items-start gap-y-0.5";
  return "items-center gap-2";
}

function inputTextClass(state: FieldVisualState, hasAccessorySlot: boolean) {
  if (state === "disabled" && hasAccessorySlot) {
    return "text-ecoya-gray-6 placeholder:text-ecoya-gray-6";
  }
  return inputTextByState[state];
}

function numberInputTextClass(state: FieldVisualState, size: InputSize) {
  if (state === "disabled" && size === "md") {
    return "text-ecoya-gray-6 placeholder:text-ecoya-gray-6";
  }
  return inputTextByState[state];
}

function accessoryIconClass(state: FieldVisualState) {
  return state === "disabled" ? "text-ecoya-gray-6" : "text-ecoya-gray-2";
}

function selectTextClass(state: FieldVisualState, hasValue: boolean) {
  if (state === "disabled") return "text-ecoya-gray-6";
  return hasValue ? "text-ecoya-gray-2" : "text-ecoya-gray-7";
}

function selectGapClass(size: InputSize, state: FieldVisualState, hasValue: boolean) {
  if (size === "sm" && state === "default" && hasValue) return "gap-1.5";
  if (size === "md" && state === "disabled") return "gap-4";
  return "gap-2";
}

export function FieldMessage({
  children,
  className,
  variant = "info",
}: FieldMessageProps) {
  const iconByVariant: Record<FieldMessageVariant, string> = {
    error: "icon-error-circle",
    success: "icon-info-success",
    info: "icon-info-guide",
  };
  const colorByVariant: Record<FieldMessageVariant, string> = {
    error: "text-ecoya-system-red-2",
    success: "text-ecoya-system-green-1",
    info: "text-ecoya-gray-5",
  };

  return (
    <p
      className={cx(
        "flex min-h-5 items-center gap-1.5 text-[length:var(--text-body-14)] leading-5 font-regular",
        colorByVariant[variant],
        className,
      )}
      data-ui="field-message"
    >
      <Icon className="size-4" name={iconByVariant[variant]} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function InputLabel({
  children,
  className,
  htmlFor,
  required,
  size = 14,
}: InputLabelProps) {
  return (
    <label
      className={cx(
        "mb-1 inline-flex items-center gap-1 text-ecoya-gray-2",
        size === 14 ? "text-body-14 font-medium" : size === 15 ? "text-label-15 font-medium" : "text-body-16 font-medium",
        className,
      )}
      data-ui="input-label"
      htmlFor={htmlFor}
    >
      <span>{children}</span>
      {required ? (
        <span
          className={cx(
            "text-ecoya-system-red-2",
            size === 14 ? "text-body-14 font-medium" : size === 15 ? "text-label-15 font-medium" : "text-body-16 font-medium",
          )}
        >
          *
        </span>
      ) : null}
    </label>
  );
}

export function InputMessage({
  children,
  className,
  variant,
}: InputMessageProps) {
  const fieldVariant: FieldMessageVariant =
    variant === "guide" ? "info" : variant;

  return (
    <FieldMessage className={className} variant={fieldVariant}>
      {children}
    </FieldMessage>
  );
}

export function InputTimer({
  className,
  disabled,
  seconds,
  showSuffix,
}: InputTimerProps) {
  return (
    <span
      className={cx(
        "text-body-14 font-medium tabular-nums",
        disabled ? "text-ecoya-gray-7" : "text-ecoya-system-red-2",
        className,
      )}
      data-ui="input-timer"
    >
      {formatInputTimer(seconds)}
      {showSuffix ? " sec" : null}
    </span>
  );
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField({
  allowClear = true,
  className,
  // erp-v2-adapt: begin — QA-1328 keep the custom label off the native input
  clearAriaLabel,
  // erp-v2-adapt: end
  guide,
  id,
  inputClassName,
  inputSize = "M",
  label,
  labelSize = 14,
  message,
  messageVariant,
  onClear,
  required,
  state = "default",
  suffix,
  timerDisabled,
  timerSeconds,
  ...props
}, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const visualState = inputFieldVisualState(state);
  const resolvedMessageVariant = inputFieldMessageVariant(state, messageVariant);
  const textInputSize: InputSize = inputSize === "S" ? "sm" : "md";
  // TimerInput는 size prop 미지원 → 컨테이너 패딩 오버라이드 유지
  const sizedInputClassName = cx(inputSize === "S" && "h-8 px-3 py-1.5", inputClassName);
  const showClearIcon = allowClear ? undefined : false;

  return (
    <div
      className={cx("flex w-full flex-col gap-2", className)}
      data-ui="input-field"
    >
      {label ? (
        <InputLabel htmlFor={inputId} required={required} size={labelSize}>
          {label}
        </InputLabel>
      ) : null}
      {timerSeconds === undefined ? (
        <TextInput
          className={inputClassName}
          clearAriaLabel={clearAriaLabel}
          id={inputId}
          onClear={onClear}
          ref={ref}
          showClearIcon={showClearIcon}
          size={textInputSize}
          trailingSlot={suffix}
          visualState={visualState}
          {...props}
        />
      ) : (
        <TimerInput
          className={sizedInputClassName}
          clearAriaLabel={clearAriaLabel}
          id={inputId}
          onClear={onClear}
          ref={ref}
          showClearIcon={showClearIcon}
          timerLabel={<InputTimer disabled={timerDisabled} seconds={timerSeconds} />}
          trailingSlot={suffix}
          visualState={visualState}
          {...props}
        />
      )}
      {message && resolvedMessageVariant ? (
        <InputMessage variant={resolvedMessageVariant}>{message}</InputMessage>
      ) : null}
      {guide && !message ? <InputMessage variant="guide">{guide}</InputMessage> : null}
    </div>
  );
});

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({
  className,
  // erp-v2-adapt: begin — QA-1328 keep the custom label off the native input
  clearAriaLabel,
  // erp-v2-adapt: end
  defaultValue,
  disabled,
  leadingSlot,
  onClear,
  showClearIcon,
  size = "md",
  trailingSlot,
  value,
  visualState,
  ...props
}, ref) {
  const state = resolvedState(disabled, visualState);
  const shouldShowClearIcon =
    state !== "disabled" &&
    (showClearIcon ?? (hasFieldValue(value) || hasFieldValue(defaultValue)));
  const shouldShowErrorSlot = state === "error" && shouldShowClearIcon && !trailingSlot;
  const hasTrailingSlot = shouldShowClearIcon || trailingSlot;
  const hasAccessorySlot = Boolean(leadingSlot || trailingSlot);

  return (
    <div
      className={cx(
        inputFrameClass(state, true, size),
        size === "sm" ? "h-8 w-full px-3 py-1.5" : "h-10 w-full px-4 py-2",
        textInputFrameLayout(state, hasAccessorySlot),
        className,
      )}
      data-ui="text-input"
    >
      {leadingSlot ? (
        <span className="inline-flex shrink-0 items-center justify-center gap-2 text-ecoya-gray-6">
          {leadingSlot}
        </span>
      ) : null}
      <input
        className={cx(
          "min-w-0 flex-1 bg-transparent font-regular outline-none",
          // 타이포 토큰 전환 (utils.ts extendTailwindMerge로 twMerge 오분류 해소됨)
          size === "sm" ? "text-body-14" : "text-body-16",
          "disabled:cursor-not-allowed",
          props.type === "search" &&
            onClear &&
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          inputTextClass(state, hasAccessorySlot),
        )}
        defaultValue={defaultValue}
        disabled={disabled || visualState === "disabled"}
        ref={ref}
        value={value}
        {...props}
      />
      {hasTrailingSlot ? (
        <span className="inline-flex shrink-0 items-center justify-center gap-2 text-ecoya-gray-6">
          {shouldShowErrorSlot ? (
            <span aria-hidden="true" className="size-5 shrink-0" data-ui="input-error-icon-slot" />
          ) : null}
          {shouldShowClearIcon ? (
            // erp-v2-adapt: begin — QA-1328 localize the clear control
            <ClearButton label={clearAriaLabel} onClear={onClear} />
            // erp-v2-adapt: end
          ) : null}
          {trailingSlot}
        </span>
      ) : null}
    </div>
  );
});

export function SearchInput({ disabled, visualState, ...props }: TextInputProps) {
  const state = resolvedState(disabled, visualState);

  return (
    <TextInput
      disabled={disabled}
      trailingSlot={<Icon className={cx("size-5", accessoryIconClass(state))} name="icon-search" />}
      visualState={visualState}
      {...props}
    />
  );
}

export function DateInput({ disabled, visualState, ...props }: TextInputProps) {
  const state = resolvedState(disabled, visualState);

  return (
    <TextInput
      disabled={disabled}
      trailingSlot={<Icon className={cx("size-5", accessoryIconClass(state))} name="icon-calendar" />}
      visualState={visualState}
      {...props}
    />
  );
}

// products#242 재QA: 캘린더 전용 날짜 필드의 트리거는 서비스 공통 입력 문법(값 좌측 ·
// 캘린더 아이콘 우측 · 입력 필드 프레임)을 그대로 쓰되, 자유 텍스트 경로가 없어야 하므로
// input 이 아니라 SelectTrigger 와 같은 버튼형 필드다. 필드 본문·아이콘이 한 버튼이라
// 어느 쪽을 눌러도 같은 picker 가 열린다.
export const DateTrigger = forwardRef<HTMLButtonElement, DateTriggerProps>(function DateTrigger({
  className,
  disabled,
  open = false,
  placeholder,
  selectedText,
  size = "md",
  visualState,
  ...props
}, ref) {
  const resolved = resolvedState(disabled, visualState);
  const state = open && resolved !== "disabled" ? "focused" : resolved;
  const value = selectedText ?? placeholder ?? "";
  const hasValue = selectedText !== undefined;

  return (
    <button
      className={cx(
        selectFrameClass(state, size),
        "w-full items-center text-left",
        selectGapClass(size, state, hasValue),
        size === "md"
          ? "h-10 px-4 py-2 text-body-16"
          : "h-8 px-3 py-1.5 text-body-14",
        selectTextClass(state, hasValue),
        "focus-visible:outline-none focus-visible:border-ecoya-blue-1 focus-visible:shadow-[var(--ecoya-shadow-input)]",
        className,
      )}
      data-ui="date-trigger"
      disabled={disabled || visualState === "disabled"}
      ref={ref}
      type="button"
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <Icon
        className={cx("size-5 shrink-0", accessoryIconClass(state))}
        name="icon-calendar"
      />
    </button>
  );
});

export const TimerInput = forwardRef<HTMLInputElement, TimerInputProps>(function TimerInput({
  className,
  // erp-v2-adapt: begin — QA-1328 keep the custom label off the native input
  clearAriaLabel,
  // erp-v2-adapt: end
  defaultValue,
  disabled,
  leadingSlot,
  onClear,
  showClearIcon,
  timerLabel,
  trailingSlot,
  value,
  visualState,
  ...props
}, ref) {
  const state = resolvedState(disabled, visualState);
  const hasValue = hasFieldValue(value) || hasFieldValue(defaultValue);
  const shouldShowClearIcon =
    state !== "disabled" && state !== "success" && (showClearIcon ?? hasValue);
  const shouldShowStatusSlot = state === "error" || state === "success";
  const timerColor =
    state === "disabled" || state === "success" || (state === "default" && !hasValue)
      ? "text-ecoya-gray-7"
      : "text-ecoya-system-red-2";
  const framePadding =
    !hasValue && (state === "default" || state === "hover") ? "pl-4 pr-2.5 py-2" : "px-4 py-2";
  const frameGap = state === "disabled" ? "gap-0.5" : "gap-2";

  return (
    <div
      className={cx(
        inputFrameClass(state),
        "h-10 w-full items-center",
        frameGap,
        framePadding,
        className,
      )}
      data-ui="timer-input"
    >
      {leadingSlot ? (
        <span className="inline-flex shrink-0 items-center justify-center gap-2 text-ecoya-gray-6">
          {leadingSlot}
        </span>
      ) : null}
      <input
        className={cx(
          "min-w-0 flex-1 bg-transparent text-body-16 font-regular outline-none",
          "disabled:cursor-not-allowed",
          inputTextByState[state],
        )}
        defaultValue={defaultValue}
        disabled={disabled || visualState === "disabled"}
        value={value}
        ref={ref}
        {...props}
      />
      {shouldShowStatusSlot ? (
        <span aria-hidden="true" className="size-6 shrink-0" data-ui="timer-status-icon-slot" />
      ) : null}
      {shouldShowClearIcon ? (
        // erp-v2-adapt: begin — QA-1328 localize the clear control
        <ClearButton label={clearAriaLabel} onClear={onClear} />
        // erp-v2-adapt: end
      ) : null}
      {trailingSlot}
      {timerLabel ? (
        <span
          className={cx(
            "h-[18px] w-[65px] shrink-0 whitespace-nowrap text-right text-body-14 font-medium leading-[20px] tabular-nums",
            timerColor,
          )}
        >
          {timerLabel}
        </span>
      ) : null}
    </div>
  );
});

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(function SelectTrigger({
  className,
  disabled,
  open = false,
  placeholder,
  selectedText,
  size = "md",
  visualState,
  ...props
}, ref) {
  // open=true 면 focused 시각 상태(border blue1/M·gray2/S) 적용
  const resolved = resolvedState(disabled, visualState);
  const state = open && resolved !== "disabled" ? "focused" : resolved;
  const value = selectedText ?? placeholder ?? "";
  const hasValue = selectedText !== undefined;
  const shouldShowClearIcon = size === "md" && state === "focused" && hasValue;
  // chevron: default/hover/focus=gray2, disabled=gray6
  const chevronColor = state === "disabled" ? "text-ecoya-gray-6" : "text-ecoya-gray-2";

  return (
    <button
      className={cx(
        selectFrameClass(state, size),
        "w-full items-center text-left",
        selectGapClass(size, state, hasValue),
        size === "md"
          ? "h-10 px-4 py-2 text-body-16"
          : "h-8 px-3 py-1.5 text-body-14",
        selectTextClass(state, hasValue),
        // focus-visible: 닫힌 상태 키보드 포커스 시 focused 시각(border-blue-1+shadow) 재현 — outline 제거 후 대체 보장
        "focus-visible:outline-none focus-visible:border-ecoya-blue-1 focus-visible:shadow-[var(--ecoya-shadow-input)]",
        className,
      )}
      data-ui="select-trigger"
      disabled={disabled || visualState === "disabled"}
      ref={ref}
      type="button"
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{value}</span>
      {shouldShowClearIcon ? (
        <CancelCircleIcon className="size-5 text-ecoya-gray-7" />
      ) : null}
      <Icon
        className={cx(
          "size-5 transition-transform",
          chevronColor,
          open && "rotate-180",
        )}
        name="icon-chevron-down"
      />
    </button>
  );
});

export function NumberInput({
  className,
  disabled,
  size = "md",
  visualState,
  ...props
}: NumberInputProps) {
  const state = resolvedState(disabled, visualState);

  return (
    <div
      className={cx(
        inputFrameClass(state),
        "items-center justify-center",
        size === "md" ? "h-14 w-[52px] px-4 py-2" : "h-9 w-[50px] p-2",
        className,
      )}
      data-ui="number-input"
    >
      <input
        className={cx(
          "w-full bg-transparent text-center font-regular outline-none",
          size === "md" ? "text-body-16" : "text-body-14",
          numberInputTextClass(state, size),
        )}
        disabled={disabled || visualState === "disabled"}
        inputMode="numeric"
        {...props}
      />
    </div>
  );
}

export function TextArea({
  className,
  counter,
  disabled,
  errorMessage,
  fullWidth = false,
  isReadOnly = false,
  visualState,
  ...props
}: TextAreaProps) {
  const state = resolvedState(disabled, visualState);
  const counterColor = state === "disabled" ? "text-ecoya-gray-6" : "text-ecoya-gray-7";

  return (
    <div className={cx("flex flex-col gap-2", fullWidth ? "w-full" : "w-[283px]", className)}>
      <div
        className={cx(inputFrameClass(state), "w-full items-start gap-2.5 px-4", counter != null ? "h-16 py-2" : "h-[156px] py-2.5")}
        data-ui="text-area"
      >
        <textarea
          className={cx(
            "h-full min-w-0 flex-1 resize-none bg-transparent font-regular outline-none",
            counter != null ? "text-body-14" : "text-body-16",
            inputTextByState[state],
          )}
          {...props}
          disabled={disabled || visualState === "disabled"}
          readOnly={isReadOnly || props.readOnly}
        />
      </div>
      {counter != null ? (
        <span data-ui="textarea-counter" className={cx("text-left text-body-16 font-regular", counterColor)}>
          {counter}
        </span>
      ) : null}
      {state === "error" && errorMessage ? (
        <FieldMessage variant="error">{errorMessage}</FieldMessage>
      ) : null}
    </div>
  );
}

export function ReadOnlyText({
  children,
  className,
  color = "gray2",
  typoType = "b7r",
  ...props
}: ReadOnlyTextProps) {
  return (
    <div
      className={cx(
        "w-full whitespace-pre-wrap break-words border-0 outline-none [word-break:break-all]",
        readOnlyTextColorClass[color],
        readOnlyTextTypoClass[typoType],
        className,
      )}
      data-ui="read-only-text"
      {...props}
    >
      {children}
    </div>
  );
}

function Chip({ children, className, disabled, onRemove }: ChipProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center gap-1 rounded-[64px] py-0.5 pl-2 pr-1.5 text-body-15 font-medium",
        disabled
          ? "bg-ecoya-gray-10 text-ecoya-gray-6 shadow-[0_0_0_0.5px_rgba(160,164,171,0.2),0_1px_2px_0_rgba(5,29,57,0.1)]"
          : "bg-ecoya-blue-10 text-ecoya-blue-4 shadow-[0_0_0_0.5px_rgba(23,98,195,0.2),0_1px_2px_0_rgba(5,29,57,0.1)]",
        className,
      )}
      data-ui="chip"
    >
      <span>{children}</span>
      {disabled ? null : (
        <button
          aria-label="Remove chip"
          className="flex size-4 items-center justify-center rounded-full text-ecoya-blue-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ecoya-blue-4"
          onClick={onRemove}
          type="button"
        >
          <Icon className="size-4" name="icon-close" />
        </button>
      )}
    </span>
  );
}

export function ChipInput({
  chips = [],
  className,
  disabled,
  visualState,
}: ChipInputProps) {
  const state = resolvedState(disabled, visualState);
  const trailingIconName = state === "focused" ? "icon-search" : "icon-chevron-down";
  const shouldShowTrailingIcon = state !== "disabled";

  return (
    <div
      className={cx(
        inputFrameClass(state, false),
        "h-10 w-full items-center gap-2 px-4 py-[7px]",
        className,
      )}
      data-ui="chip-input"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {chips.map((chip, index) => (
          <Chip disabled={state === "disabled"} key={`${chip}-${index}`}>
            {chip}
          </Chip>
        ))}
      </div>
      {shouldShowTrailingIcon ? (
        <Icon className="size-5 text-ecoya-gray-2" name={trailingIconName} />
      ) : null}
    </div>
  );
}

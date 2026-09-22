"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type AriaAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "@trade-os/operations/compat/portal";

// erp-v2-adapt: begin — QA-1372 removes canon's decorative scrollbar from the functional dropdown.
// erp-v2-adapt: end
import { CancelCircleIcon, Icon } from "./icon";
import { SelectTrigger } from "./input";
import { cx } from "./utils";

type ComboBoxItemSize = "md" | "sm";
type ComboBoxItemState = "default" | "hover" | "selected" | "disabled";
type ComboBoxItemVariant = "default" | "icon" | "badge";

type ComboBoxItemProps = {
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
  iconName?: string;
  onMouseEnter?: () => void;
  onSelect?: () => void;
  showCheck?: boolean;
  size?: ComboBoxItemSize;
  state?: ComboBoxItemState;
  variant?: ComboBoxItemVariant;
};

export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type DropdownListProps = {
  className?: string;
  directInput?: boolean;
  directInputLabel?: ReactNode;
  disabledIndexes?: Array<number>;
  highlightedIndex?: number;
  id?: string;
  items?: Array<string>;
  onHighlightChange?: (index: number) => void;
  onSelect?: (item: string, index: number) => void;
  selectedIndex?: number;
};

type PortalPosition = {
  left: number;
  top: number;
  width: number;
};

export type SelectProps = {
  /** combobox(trigger)에 부여할 접근명. 미지정 시 현재 선택값 라벨/placeholder 로 폴백(기존 동작). */
  "aria-label"?: string;
  "aria-describedby"?: AriaAttributes["aria-describedby"];
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  clearLabel?: string;
  clearable?: boolean;
  className?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string, option: SelectOption) => void;
  open?: boolean;
  options?: Array<SelectOption>;
  placeholder?: string;
  /** trigger(combobox) 요소를 부모 ref map 에 등록해 누락필드 자동 스크롤/포커스(정본 §B)를 잇는다. */
  registerControl?: (node: HTMLElement | null) => void;
  size?: "md" | "sm";
  /** Portal dropdown — fixed position anchored to trigger rect (forms.md:317-318).
   *  Default false: inline absolute dropdown unchanged. */
  usePortal?: boolean;
  value?: string;
};

const EMPTY_DISABLED_INDEXES: Array<number> = [];
const EMPTY_DROPDOWN_ITEMS: Array<string> = [];
const EMPTY_SELECT_OPTIONS: Array<SelectOption> = [];

const itemBase =
  // hover 게이트: button 분기는 disabled 속성, div 분기는 aria-disabled — 정본 !$disabled && !$isSelected 양면 대응
  // transition 0.15s: 정본 OptionItem `transition: background-color 0.15s` (hover/selected 페이드)
  "flex w-[248px] items-center justify-between gap-2 overflow-hidden rounded-[4px] px-4 py-2 text-ellipsis transition-[background-color] duration-150 [&:not([disabled]):not([aria-disabled=true]):not([aria-selected=true])]:hover:bg-ecoya-gray-10";

function isSamePortalPosition(current: PortalPosition | null, next: PortalPosition | null) {
  if (current === next) return true;
  if (!current || !next) return false;
  return current.left === next.left && current.top === next.top && current.width === next.width;
}

function disabledOptionIndexes(options: Array<SelectOption>) {
  const disabledIndexes: Array<number> = [];
  for (let index = 0; index < options.length; index += 1) {
    if (options[index]?.disabled) {
      disabledIndexes.push(index);
    }
  }
  return disabledIndexes;
}

const itemStateClass: Record<ComboBoxItemState, string> = {
  default: "bg-transparent text-[color:var(--ecoya-gray-2)]",
  hover: "bg-ecoya-gray-10 text-[color:var(--ecoya-gray-2)]",
  selected: "bg-ecoya-system-blue-6 text-[color:var(--ecoya-gray-2)]",
  disabled: "bg-transparent text-[color:var(--ecoya-gray-7)]",
};

export function ComboBadge({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 shrink-0 items-center justify-center rounded-2xl bg-ecoya-system-pink-6 px-3 py-0.5 text-label-12 font-medium text-[color:var(--ecoya-system-pink-2)]",
        className,
      )}
      data-ui="combo-badge"
    >
      {children}
    </span>
  );
}

export function ComboBoxItem({
  badge,
  children,
  className,
  iconName = "icon-plus",
  onMouseEnter,
  onSelect,
  showCheck = false,
  size = "md",
  state = "default",
  variant = "default",
}: ComboBoxItemProps) {
  const isSmall = size === "sm";
  const isSelected = state === "selected";
  const isDisabled = state === "disabled";
  const hasIcon = variant === "icon";
  const hasBadge = variant === "badge";

  const content = (
    <>
      {hasIcon ? (
        <Icon
          className={cx("size-5", isDisabled ? "text-ecoya-gray-7" : "text-ecoya-gray-2")}
          name={iconName}
        />
      ) : null}
      {hasBadge ? badge : null}
      <span
        className={cx(
          "min-w-0 flex-1 truncate font-regular",
          isSmall && hasIcon ? "text-button-15 font-medium" : null,
        )}
      >
        {children}
      </span>
      {isSelected && showCheck ? (
        <Icon className="size-5 text-ecoya-system-blue-2" name="icon-checkmark" />
      ) : null}
    </>
  );

  const itemClassName = cx(
    itemBase,
    itemStateClass[state],
    onSelect && !isDisabled && "cursor-pointer",
    isSmall ? "h-9 text-body-14" : "h-10 text-body-16",
    // focus-visible: 리스트 내부라 overflow clip 방지용 음수 offset
    "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ecoya-blue-4",
    className,
  );

  if (onSelect) {
    return (
      <button
        aria-disabled={isDisabled || undefined}
        aria-selected={isSelected}
        className={itemClassName}
        data-ui="combo-box-item"
        disabled={isDisabled}
        onClick={onSelect}
        onMouseEnter={onMouseEnter}
        role="option"
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-disabled={isDisabled || undefined}
      aria-selected={isSelected}
      className={itemClassName}
      data-ui="combo-box-item"
      onMouseEnter={onMouseEnter}
      role="option"
      tabIndex={-1}
    >
      {content}
    </div>
  );
}

export function DropdownList({
  className,
  directInput = false,
  directInputLabel,
  disabledIndexes = EMPTY_DISABLED_INDEXES,
  highlightedIndex,
  id,
  items = EMPTY_DROPDOWN_ITEMS,
  onHighlightChange,
  onSelect,
  selectedIndex = -1,
}: DropdownListProps) {
  const isEmpty = !directInput && items.length === 0;
  // erp-v2-adapt: begin — QA-1372 keeps keyboard-highlighted options inside the native scroll viewport.
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedIndex === undefined) return;
    const highlightedOption =
      itemsContainerRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[highlightedIndex];
    if (typeof highlightedOption?.scrollIntoView === "function") {
      highlightedOption.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);
  // erp-v2-adapt: end

  return (
    <div
      className={cx(
        "flex flex-col items-start rounded-md border border-ecoya-gray-10 bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-filter)]",
        directInput ? "w-[415px]" : "w-full",
        className,
      )}
      data-ui="dropdown-list"
      id={id}
      role="listbox"
    >
      <div className="flex w-full items-start rounded-md p-1.5">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {directInput ? (
            <ComboBoxItem
              className="w-full text-ecoya-blue-4"
              iconName="icon-plus"
              state="default"
              variant="icon"
            >
              {directInputLabel}
            </ComboBoxItem>
          ) : null}
          {isEmpty ? (
            <div
              className="flex w-full items-center justify-center px-4 py-3 text-body-14 font-regular text-ecoya-gray-7"
              data-ui="dropdown-empty"
            >
              No options
            </div>
          ) : (
            <div
              // erp-v2-adapt: begin — QA-1372 replaces canon's clipped list with bounded native scrolling.
              className="flex max-h-[240px] min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain"
              ref={itemsContainerRef}
              // erp-v2-adapt: end
            >
              {items.map((item, index) => {
                const isDisabled = disabledIndexes.includes(index);
                return (
                  <ComboBoxItem
                    className="w-full"
                    key={`${item}-${index}`}
                    onMouseEnter={!isDisabled && onHighlightChange ? () => onHighlightChange(index) : undefined}
                    onSelect={!isDisabled && onSelect ? () => onSelect(item, index) : undefined}
                    showCheck={false}
                    state={
                      isDisabled
                        ? "disabled"
                        : index === selectedIndex
                          ? "selected"
                          : index === highlightedIndex
                            ? "hover"
                            : "default"
                    }
                  >
                    {item}
                  </ComboBoxItem>
                );
              })}
            </div>
          )}
        </div>
        {
          // erp-v2-adapt: begin — QA-1372 omits canon's non-interactive EtcScroll sibling.
          null
          // erp-v2-adapt: end
        }
      </div>
    </div>
  );
}

function firstEnabledOptionIndex(options: Array<SelectOption>, fromIndex = 0, direction: 1 | -1 = 1) {
  if (options.length === 0) return -1;

  for (let offset = 0; offset < options.length; offset += 1) {
    const index = (fromIndex + offset * direction + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }

  return -1;
}

export function Select({
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  clearLabel = "Clear selected option",
  clearable,
  className,
  defaultOpen = false,
  defaultValue,
  disabled,
  onOpenChange,
  onValueChange,
  open,
  options = EMPTY_SELECT_OPTIONS,
  placeholder = "Select",
  registerControl,
  size = "md",
  usePortal = false,
  value,
}: SelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  // portal 드롭다운은 body 직속이라 rootRef 밖 — 외부 클릭 판정에 별도 ref 필요 (정본 dropdownRef 동일 패턴)
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  // Portal position: fixed coords derived from trigger getBoundingClientRect (forms.md:317-318)
  const [portalPos, setPortalPos] = useState<PortalPosition | null>(null);
  const isOpen = open ?? uncontrolledOpen;
  const selectedValue = value ?? uncontrolledValue;
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    firstEnabledOptionIndex(options, selectedIndex >= 0 ? selectedIndex : 0),
  );
  const activeHighlightedIndex =
    highlightedIndex >= 0
      ? highlightedIndex
      : firstEnabledOptionIndex(options, selectedIndex >= 0 ? selectedIndex : 0);
  const canClear = Boolean(clearable && selectedOption && !disabled);

  const updatePortalPosition = useCallback(
    (anchor: HTMLDivElement | null) => {
      if (!usePortal || typeof document === "undefined" || !anchor) {
        setPortalPos((current) => (current === null ? current : null));
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const nextPosition = { top: rect.bottom + 4, left: rect.left, width: rect.width };
      setPortalPos((current) => (isSamePortalPosition(current, nextPosition) ? current : nextPosition));
    },
    [usePortal],
  );
  const updateCurrentPortalPosition = useEffectEvent(() => {
    updatePortalPosition(rootRef.current);
  });

  const setRootNode = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
    },
    [],
  );

  const onPointerDown = useEffectEvent((event: MouseEvent) => {
    const target = event.target as Node;
    // 정본 Select handleClickOutside(index.tsx:139-144) 동일: 트리거 영역과
    // portal 드롭다운 영역 둘 다 밖일 때만 닫는다 (portal 내부 클릭 시 조기 닫힘 방지)
    if (rootRef.current?.contains(target)) return;
    if (dropdownRef.current?.contains(target)) return;
    if (open === undefined) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  });

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      onPointerDown(event);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !usePortal || typeof window === "undefined") {
      return;
    }

    const handleUpdate = () => updateCurrentPortalPosition();

    handleUpdate();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, usePortal]);

  function notifyOpenChange(nextOpen: boolean) {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  function openDropdown() {
    if (disabled) return;
    updatePortalPosition(rootRef.current);
    setHighlightedIndex(firstEnabledOptionIndex(options, selectedIndex >= 0 ? selectedIndex : 0));
    notifyOpenChange(true);
  }

  function closeDropdown() {
    if (disabled) return;
    setPortalPos(null);
    notifyOpenChange(false);
  }

  function toggleDropdown() {
    if (isOpen) {
      closeDropdown();
      return;
    }
    openDropdown();
  }

  function commitValue(option: SelectOption) {
    if (option.disabled) return;
    if (value === undefined) {
      setUncontrolledValue(option.value);
    }
    onValueChange?.(option.value, option);
    closeDropdown();
  }

  function clearValue() {
    if (!canClear) return;
    if (value === undefined) {
      setUncontrolledValue(undefined);
    }
    onValueChange?.("", { label: "", value: "" });
    closeDropdown();
  }

  function moveHighlight(direction: 1 | -1) {
    const startIndex = activeHighlightedIndex >= 0 ? activeHighlightedIndex + direction : selectedIndex + direction;
    const nextIndex = firstEnabledOptionIndex(options, startIndex, direction);
    if (nextIndex >= 0) {
      setHighlightedIndex(nextIndex);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      moveHighlight(-1);
      return;
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(firstEnabledOptionIndex(options));
      return;
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(firstEnabledOptionIndex(options, options.length - 1, -1));
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      const option = options[activeHighlightedIndex];
      if (option) commitValue(option);
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeDropdown();
      return;
    }

    if ((event.key === "Backspace" || event.key === "Delete") && !isOpen && canClear) {
      event.preventDefault();
      clearValue();
    }
  }

  return (
    <div
      className={cx("relative inline-flex w-full flex-col", className)}
      data-ui="select"
      ref={setRootNode}
    >
      <SelectTrigger
        aria-controls={isOpen ? listboxId : undefined}
        aria-describedby={ariaDescribedBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={ariaInvalid}
        // 명시 aria-label 우선(필드명 등 안정 접근명) → 미지정 시 현재 선택값/placeholder 폴백(기존 동작).
        aria-label={ariaLabel ?? selectedOption?.label ?? placeholder}
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        open={isOpen}
        placeholder={placeholder}
        ref={registerControl}
        role="combobox"
        selectedText={selectedOption?.label}
        size={size}
      />
      {canClear ? (
        <button
          aria-label={clearLabel}
          className="absolute right-9 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded text-ecoya-gray-7 hover:text-ecoya-gray-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
          onClick={clearValue}
          type="button"
        >
          <CancelCircleIcon className="size-5" />
        </button>
      ) : null}
      {isOpen ? (() => {
        const list = (
          <DropdownList
            disabledIndexes={disabledOptionIndexes(options)}
            highlightedIndex={activeHighlightedIndex}
            id={listboxId}
            items={options.map((option) => String(option.label))}
            onHighlightChange={setHighlightedIndex}
            onSelect={(_, index) => commitValue(options[index])}
            selectedIndex={selectedIndex}
          />
        );
        if (usePortal && portalPos && typeof document !== "undefined") {
          // Portal mode: fixed position from trigger rect, z uses --ecoya-z-dropdown token
          return createPortal(
            <div
              className="z-(--ecoya-z-dropdown)"
              data-ui="select-dropdown"
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: portalPos.top,
                left: portalPos.left,
                width: portalPos.width,
              }}
            >
              {list}
            </div>,
            document.body,
          );
        }
        return (
          <div className="absolute left-0 top-full z-10 mt-1 w-full" data-ui="select-dropdown">
            {list}
          </div>
        );
      })() : null}
    </div>
  );
}

"use client";

import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";

import { Button } from "./button";
import { FieldMessage } from "./input";
import { Icon } from "./icon";
import { cx } from "./utils";

type DatePickerType = "date" | "dateWord" | "month" | "time" | "timePicker";
type DateValue = Date | null;

export type DateRangeValue = {
  end: DateValue;
  start: DateValue;
};

export type DateRangePreset = {
  id?: string;
  label: ReactNode;
  value?: DateRangeValue | (() => DateRangeValue);
};

export type DatePickerProps = {
  defaultDisplayMonth?: Date;
  defaultValue?: DateValue;
  disabledDate?: (date: Date) => boolean;
  displayMonth?: Date;
  guideMessages?: Array<ReactNode>;
  hourStep?: number;
  locale?: string;
  maxHour?: number;
  minuteStep?: number;
  monthLabels?: Array<string>;
  nowLabel?: ReactNode;
  okLabel?: ReactNode;
  onDisplayMonthChange?: (month: Date) => void;
  onValueChange?: (value: Date) => void;
  todayLabel?: ReactNode;
  type?: DatePickerType;
  value?: DateValue;
  weekLabels?: Array<string>;
};

export type DateRangePickerProps = {
  defaultDisplayMonth?: Date;
  defaultPresetLabel?: string;
  defaultValue?: DateRangeValue;
  disabledDate?: (date: Date) => boolean;
  displayMonth?: Date;
  locale?: string;
  onPresetChange?: (presetLabel: string) => void;
  onValueChange?: (value: DateRangeValue) => void;
  presetLabels?: Array<string>;
  presets?: Array<DateRangePreset>;
  value?: DateRangeValue;
  weekLabels?: Array<string>;
};

type CalendarCell = {
  date: Date;
  label: string;
  muted?: boolean;
};

type DateRangePresetOption = {
  fallbackLabel: string;
  id: string;
  label: ReactNode;
  value?: DateRangeValue | (() => DateRangeValue);
};

const sundayUtc = Date.UTC(2023, 0, 1);
const emptyRange: DateRangeValue = { end: null, start: null };
const shortMonthTitles = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function sameDate(left?: DateValue, right?: DateValue) {
  return Boolean(
    left &&
      right &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate(),
  );
}

function isBetween(date: Date, range?: DateRangeValue) {
  if (!range?.start || !range.end) return false;
  const time = startOfDay(date).getTime();
  return time > startOfDay(range.start).getTime() && time < startOfDay(range.end).getTime();
}

function monthLabelsForLocale(locale?: string) {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
      new Date(Date.UTC(2023, index, 1)),
    ),
  );
}

function weekLabelsForLocale(locale?: string) {
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" }).format(
      new Date(sundayUtc + index * 24 * 60 * 60 * 1000),
    ),
  );
}

function formatMonthTitle(displayMonth: Date) {
  return `${shortMonthTitles[displayMonth.getMonth()]}  ${displayMonth.getFullYear()}`;
}

function formatTimeTitle(date?: DateValue) {
  if (!date) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function generateTimeValues(step: number, maxExclusive: number) {
  const normalizedStep = Math.max(1, Math.floor(step));
  return Array.from(
    { length: Math.ceil(maxExclusive / normalizedStep) },
    (_, index) => String(index * normalizedStep).padStart(2, "0"),
  ).filter((value) => Number(value) < maxExclusive);
}

function generateHourValues(hourStep = 1, maxHour = 23) {
  return generateTimeValues(hourStep, maxHour + 1);
}

function generateMinuteValues(minuteStep = 1) {
  return generateTimeValues(minuteStep, 60);
}

function monthRequiresSixCalendarRows(displayMonth: Date) {
  const firstWeekday = startOfMonth(displayMonth).getDay();
  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
  return firstWeekday + daysInMonth > 35;
}

function calendarCellsForMonth(displayMonth: Date): Array<CalendarCell> {
  const monthStart = startOfMonth(displayMonth);
  const firstWeekday = monthStart.getDay();
  const firstCell = addDays(monthStart, -firstWeekday);
  const cellCount = monthRequiresSixCalendarRows(displayMonth) ? 42 : 35;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(firstCell, index);
    return {
      date,
      label: String(date.getDate()),
      muted: date.getMonth() !== displayMonth.getMonth(),
    };
  });
}

function defaultPresetRange(label: string): DateRangeValue {
  const today = startOfDay(new Date());
  const monthMatch = label.match(/^(\d+)\s*month/i);

  if (label.toLowerCase() === "today") {
    return { end: today, start: today };
  }

  if (monthMatch) {
    return { end: addDays(addMonths(today, Number(monthMatch[1])), -1), start: today };
  }

  return emptyRange;
}

function dateRangePresetId(preset: DateRangePreset, index: number) {
  if (preset.id) return preset.id;
  if (typeof preset.label === "string") return preset.label;
  return `preset-${index}`;
}

function dateRangePresetFallbackLabel(preset: DateRangePreset, id: string) {
  return typeof preset.label === "string" ? preset.label : id;
}

function DateNav({
  displayMonth,
  onNextMonth,
  onNextYear,
  onPreviousMonth,
  onPreviousYear,
  title,
  titleClassName,
}: {
  displayMonth?: Date;
  onNextMonth?: () => void;
  onNextYear?: () => void;
  onPreviousMonth?: () => void;
  onPreviousYear?: () => void;
  title?: string;
  titleClassName?: string;
}) {
  const resolvedTitle = title ?? (displayMonth ? formatMonthTitle(displayMonth) : "FEB  2023");

  return (
    <div className="flex w-full items-center gap-2 border-b border-ecoya-gray-9 bg-ecoya-gray-12 px-3 py-2.5">
      <button aria-label="Previous year" className="size-4 rounded text-ecoya-gray-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4" onClick={onPreviousYear} type="button">
        <Icon className="size-4" name="icon-double-left" />
      </button>
      <button aria-label="Previous month" className="size-4 rounded text-ecoya-gray-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4" onClick={onPreviousMonth} type="button">
        <Icon className="size-4" name="icon-chevron-left" />
      </button>
      <span
        className={cx(
          "min-w-0 flex-1 whitespace-pre-wrap text-center text-header-14 font-bold text-[color:var(--ecoya-gray-1)]",
          titleClassName,
        )}
      >
        {resolvedTitle}
      </span>
      <button aria-label="Next month" className="size-4 rounded text-ecoya-gray-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4" onClick={onNextMonth} type="button">
        <Icon className="size-4" name="icon-chevron-right" />
      </button>
      <button aria-label="Next year" className="size-4 rounded text-ecoya-gray-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4" onClick={onNextYear} type="button">
        <Icon className="size-4" name="icon-double-right" />
      </button>
    </div>
  );
}

function DateCell({
  date,
  disabled,
  inRange,
  label,
  muted,
  onKeyboardMove,
  onSelect,
  selected,
  weekday,
}: {
  date?: Date;
  disabled?: boolean;
  inRange?: boolean;
  label: string;
  muted?: boolean;
  onKeyboardMove?: (date: Date) => void;
  onSelect?: (date: Date) => void;
  selected?: boolean;
  weekday?: boolean;
}) {
  const isToday = Boolean(date) && sameDate(date, new Date());
  const content = (
    <span
      className={cx(
        "flex min-h-[28px] min-w-[26px] items-center justify-center rounded text-body-14 font-medium leading-[20.44px]",
        weekday
          ? "text-[color:var(--ecoya-gray-6)]"
          : selected
            ? "bg-ecoya-blue-4 text-[color:var(--ecoya-gray-12)]"
            : inRange
              ? "bg-ecoya-system-blue-6 text-[color:var(--ecoya-gray-1)]"
              : disabled
                ? "text-[color:var(--ecoya-gray-8)]"
                : isToday
                  ? "border border-ecoya-blue-4 text-[color:var(--ecoya-blue-4)] group-hover:bg-ecoya-gray-10"
                  : muted
                    ? "text-[color:var(--ecoya-gray-7)] group-hover:bg-ecoya-gray-10"
                    : "text-[color:var(--ecoya-gray-1)] group-hover:bg-ecoya-gray-10",
      )}
    >
      {label}
    </span>
  );

  if (!date) {
    return (
      <span
        className="flex w-10 flex-col items-center overflow-hidden px-1 py-1.5"
        data-ui="date-picker-item"
      >
        {content}
      </span>
    );
  }
  const cellDate = date;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!onKeyboardMove) return;

    const movementByKey: Record<string, number | undefined> = {
      ArrowDown: 7,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
    };
    const movement = movementByKey[event.key];
    if (movement === undefined) return;

    event.preventDefault();
    onKeyboardMove(addDays(cellDate, movement));
  }

  return (
    <button
      aria-disabled={disabled || undefined}
      aria-pressed={selected || undefined}
      className="group flex w-10 flex-col items-center overflow-hidden px-1 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4 focus-visible:rounded"
      data-ui="date-picker-item"
      disabled={disabled}
      onClick={onSelect ? () => onSelect(cellDate) : undefined}
      onKeyDown={handleKeyDown}
      type="button"
    >
      {content}
    </button>
  );
}

function CalendarGrid({
  disabledDate,
  displayMonth,
  onMoveDate,
  onSelectDate,
  range,
  selectedDate,
  weekLabels,
}: {
  disabledDate?: (date: Date) => boolean;
  displayMonth: Date;
  onMoveDate?: (date: Date) => void;
  onSelectDate?: (date: Date) => void;
  range?: DateRangeValue;
  selectedDate?: DateValue;
  weekLabels: Array<string>;
}) {
  const cells = useMemo(() => calendarCellsForMonth(displayMonth), [displayMonth]);

  return (
    <div className="flex flex-col items-start p-2.5" data-ui="date-picker-grid">
      <div className="grid grid-cols-7">
        {weekLabels.map((label) => (
          <DateCell key={label} label={label} weekday />
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const disabled = disabledDate?.(cell.date);
          return (
            <DateCell
              date={cell.date}
              disabled={disabled}
              inRange={isBetween(cell.date, range)}
              key={cell.date.getTime()}
              label={cell.label}
              muted={cell.muted}
              onKeyboardMove={onMoveDate}
              onSelect={onSelectDate}
              selected={
                sameDate(cell.date, selectedDate) ||
                sameDate(cell.date, range?.start) ||
                sameDate(cell.date, range?.end)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function TodayFooter({
  onToday,
  todayLabel,
}: {
  onToday?: () => void;
  todayLabel: ReactNode;
}) {
  return (
    <div className="flex h-10 w-full shrink-0 flex-col items-center justify-center overflow-hidden border-t border-ecoya-gray-9 px-1">
      <button
        className="rounded px-1 py-1 text-body-14 font-medium text-[color:var(--ecoya-gray-1)] hover:bg-ecoya-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
        onClick={onToday}
        type="button"
      >
        {todayLabel}
      </button>
    </div>
  );
}

function DatePanel({
  disabledDate,
  displayMonth,
  footer = true,
  forceSixCalendarRows,
  guideMessages = [],
  onDisplayMonthChange,
  onMoveDate,
  onSelectDate,
  onToday,
  range,
  selectedDate,
  todayLabel,
  weekLabels,
  withGuide,
}: {
  disabledDate?: (date: Date) => boolean;
  displayMonth: Date;
  footer?: boolean;
  forceSixCalendarRows?: boolean;
  guideMessages?: Array<ReactNode>;
  onDisplayMonthChange?: (month: Date) => void;
  onMoveDate?: (date: Date) => void;
  onSelectDate?: (date: Date) => void;
  onToday?: () => void;
  range?: DateRangeValue;
  selectedDate?: DateValue;
  todayLabel?: ReactNode;
  weekLabels: Array<string>;
  withGuide?: boolean;
}) {
  const hasSixCalendarRows = forceSixCalendarRows || monthRequiresSixCalendarRows(displayMonth);
  const heightClass = withGuide
    ? hasSixCalendarRows
      ? "h-[440.003px]"
      : "h-[400.003px]"
    : footer
      ? hasSixCalendarRows
        ? "h-[384px]"
        : "h-[344px]"
      : hasSixCalendarRows
        ? "h-[344px]"
        : "h-[304px]";

  return (
    <div
      className={cx(
        "flex w-[300px] shrink-0 flex-col items-start overflow-hidden rounded-[8px] bg-ecoya-gray-12 shadow-[0_2px_8px_0_rgba(5,29,57,0.18)]",
        heightClass,
      )}
      data-ui="date-picker"
    >
      <DateNav
        displayMonth={displayMonth}
        onNextMonth={() => onDisplayMonthChange?.(addMonths(displayMonth, 1))}
        onNextYear={() => onDisplayMonthChange?.(addMonths(displayMonth, 12))}
        onPreviousMonth={() => onDisplayMonthChange?.(addMonths(displayMonth, -1))}
        onPreviousYear={() => onDisplayMonthChange?.(addMonths(displayMonth, -12))}
      />
      <CalendarGrid
        disabledDate={disabledDate}
        displayMonth={displayMonth}
        onMoveDate={onMoveDate}
        onSelectDate={onSelectDate}
        range={range}
        selectedDate={selectedDate}
        weekLabels={weekLabels}
      />
      {withGuide && guideMessages.length > 0 ? (
        <div className="flex w-full flex-col gap-1 overflow-hidden border-t border-ecoya-gray-9 px-3 py-1.5">
          {guideMessages.map((message, index) => (
            <FieldMessage key={index} variant="info">{message}</FieldMessage>
          ))}
        </div>
      ) : footer && todayLabel ? (
        <TodayFooter onToday={onToday} todayLabel={todayLabel} />
      ) : null}
    </div>
  );
}

function MonthPanel({
  displayMonth,
  labels,
  onMonthSelect,
}: {
  displayMonth: Date;
  labels: Array<string>;
  onMonthSelect?: (monthIndex: number) => void;
}) {
  return (
    <div
      className="flex h-64 w-[300px] flex-col overflow-hidden rounded-[8px] border border-ecoya-gray-9 bg-ecoya-gray-12 shadow-[0_2px_8px_0_rgba(5,29,57,0.18)]"
      data-ui="month-picker"
    >
      <DateNav title={String(displayMonth.getFullYear())} titleClassName="text-body-16 font-bold leading-6 text-[color:var(--ecoya-blue-1)]" />
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-4">
        {labels.map((label, index) => {
          const isSelectedMonth = displayMonth.getMonth() === index;
          const isCurrentMonth =
            new Date().getMonth() === index && new Date().getFullYear() === displayMonth.getFullYear();
          return (
            <button
              aria-pressed={isSelectedMonth}
              className={cx(
                "flex items-center justify-center p-3.5 text-body-14 font-medium leading-[20.44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4",
                isSelectedMonth
                  ? "rounded-[4px] bg-ecoya-blue-4 text-[color:var(--ecoya-gray-12)]"
                  : isCurrentMonth
                    ? "text-[color:var(--ecoya-blue-4)] hover:bg-ecoya-gray-10"
                    : "text-[color:var(--ecoya-gray-1)] hover:bg-ecoya-gray-10",
              )}
              key={label}
              onClick={() => onMonthSelect?.(index)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeOption({
  label,
  onSelect,
  selected,
}: {
  label: string;
  onSelect?: (value: string) => void;
  selected?: boolean;
}) {
  return (
    <button
      aria-pressed={selected || undefined}
      className="flex h-10 w-[50px] shrink-0 items-center justify-center p-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ecoya-blue-4"
      onClick={() => onSelect?.(label)}
      type="button"
    >
      <span
        className={cx(
          "flex h-7 min-w-[26px] items-center justify-center rounded text-body-14 font-medium leading-[20.44px] text-[color:var(--ecoya-gray-1)]",
          selected && "bg-ecoya-blue-4 text-[color:var(--ecoya-gray-12)]",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function TimeColumns({
  hourValues,
  minuteValues,
  onHourSelect,
  onMinuteSelect,
  selectedDate,
}: {
  hourValues: Array<string>;
  minuteValues: Array<string>;
  onHourSelect?: (hour: string) => void;
  onMinuteSelect?: (minute: string) => void;
  selectedDate?: DateValue;
}) {
  const selectedHour = selectedDate ? String(selectedDate.getHours()).padStart(2, "0") : undefined;
  const selectedMinute = selectedDate ? String(selectedDate.getMinutes()).padStart(2, "0") : undefined;

  return (
    <div className="flex h-[280px] items-start overflow-hidden">
      <div className="flex h-[280px] w-[50px] flex-col overflow-y-auto border-r border-ecoya-gray-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hourValues.map((value) => (
          <TimeOption key={`hour-${value}`} label={value} onSelect={onHourSelect} selected={value === selectedHour} />
        ))}
      </div>
      <div className="flex h-[280px] w-[50px] flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {minuteValues.map((value) => (
          <TimeOption
            key={`minute-${value}`}
            label={value}
            onSelect={onMinuteSelect}
            selected={value === selectedMinute}
          />
        ))}
      </div>
    </div>
  );
}

function TimePanel({
  disabledDate,
  displayMonth,
  hourValues,
  minuteValues,
  okLabel,
  onDisplayMonthChange,
  onHourSelect,
  onMinuteSelect,
  onMoveDate,
  onSelectDate,
  selectedDate,
  weekLabels,
}: {
  disabledDate?: (date: Date) => boolean;
  displayMonth: Date;
  hourValues: Array<string>;
  minuteValues: Array<string>;
  okLabel?: ReactNode;
  onDisplayMonthChange?: (month: Date) => void;
  onHourSelect?: (hour: string) => void;
  onMinuteSelect?: (minute: string) => void;
  onMoveDate?: (date: Date) => void;
  onSelectDate?: (date: Date) => void;
  selectedDate?: DateValue;
  weekLabels: Array<string>;
}) {
  return (
    <div
      className="flex w-[398px] flex-col overflow-hidden rounded-[8px] bg-ecoya-gray-12 shadow-[0_2px_8px_0_rgba(5,29,57,0.18)]"
      data-ui="time-date-picker"
    >
      <div className="flex w-full items-start">
        <div className="flex min-w-0 flex-1 flex-col">
          <DateNav
            displayMonth={displayMonth}
            onNextMonth={() => onDisplayMonthChange?.(addMonths(displayMonth, 1))}
            onNextYear={() => onDisplayMonthChange?.(addMonths(displayMonth, 12))}
            onPreviousMonth={() => onDisplayMonthChange?.(addMonths(displayMonth, -1))}
            onPreviousYear={() => onDisplayMonthChange?.(addMonths(displayMonth, -12))}
          />
          <CalendarGrid
            disabledDate={disabledDate}
            displayMonth={displayMonth}
            onMoveDate={onMoveDate}
            onSelectDate={onSelectDate}
            selectedDate={selectedDate}
            weekLabels={weekLabels}
          />
        </div>
        <div className="flex w-[100px] flex-col">
          <div className="flex h-[38px] items-center justify-center border-b border-l border-ecoya-gray-9 text-header-14 font-bold text-[color:var(--ecoya-gray-1)]">
            {formatTimeTitle(selectedDate)}
          </div>
          <div className="border-l border-ecoya-gray-9">
            <TimeColumns
              hourValues={hourValues}
              minuteValues={minuteValues}
              onHourSelect={onHourSelect}
              onMinuteSelect={onMinuteSelect}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
      {okLabel ? (
        <div className="flex w-full justify-end border-t border-ecoya-gray-9 px-2 py-1.5">
          <Button size="md" variant="tertiary">
            {okLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function TimePickerPanel({
  hourValues,
  minuteValues,
  nowLabel,
  okLabel,
  onHourSelect,
  onMinuteSelect,
  onNow,
  selectedDate,
}: {
  hourValues: Array<string>;
  minuteValues: Array<string>;
  nowLabel?: ReactNode;
  okLabel?: ReactNode;
  onHourSelect?: (hour: string) => void;
  onMinuteSelect?: (minute: string) => void;
  onNow?: () => void;
  selectedDate?: DateValue;
}) {
  return (
    <div
      className="flex w-[100px] flex-col overflow-hidden rounded-[8px] bg-ecoya-gray-12 shadow-[0_2px_8px_0_rgba(5,29,57,0.18)]"
      data-ui="time-picker"
    >
      <TimeColumns
        hourValues={hourValues}
        minuteValues={minuteValues}
        onHourSelect={onHourSelect}
        onMinuteSelect={onMinuteSelect}
        selectedDate={selectedDate}
      />
      <div className="flex h-11 items-center justify-end gap-2.5 border-t border-ecoya-gray-9 px-2">
        {nowLabel ? (
          <button
            className="rounded text-body-14 font-medium leading-[20.44px] text-[color:var(--ecoya-system-blue-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
            onClick={onNow}
            type="button"
          >
            {nowLabel}
          </button>
        ) : null}
        {okLabel ? (
          <Button size="md" variant="tertiary">
            {okLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function DatePicker({
  defaultDisplayMonth,
  defaultValue = null,
  disabledDate,
  displayMonth,
  guideMessages,
  hourStep = 1,
  locale,
  maxHour = 23,
  minuteStep = 1,
  monthLabels,
  nowLabel,
  okLabel,
  onDisplayMonthChange,
  onValueChange,
  todayLabel,
  type = "date",
  value,
  weekLabels,
}: DatePickerProps) {
  const resolvedWeekLabels = weekLabels ?? weekLabelsForLocale(locale);
  const hourValues = useMemo(() => generateHourValues(hourStep, maxHour), [hourStep, maxHour]);
  const minuteValues = useMemo(() => generateMinuteValues(minuteStep), [minuteStep]);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedDate = value !== undefined ? value : uncontrolledValue;
  const [uncontrolledDisplayMonth, setUncontrolledDisplayMonth] = useState(() =>
    startOfMonth(defaultDisplayMonth ?? selectedDate ?? new Date()),
  );
  const resolvedDisplayMonth = displayMonth ? startOfMonth(displayMonth) : uncontrolledDisplayMonth;

  function commitDisplayMonth(month: Date) {
    const nextMonth = startOfMonth(month);
    if (displayMonth === undefined) {
      setUncontrolledDisplayMonth(nextMonth);
    }
    onDisplayMonthChange?.(nextMonth);
  }

  function commitDate(date: Date) {
    if (disabledDate?.(date)) return;
    const nextDate =
      type === "time" && selectedDate
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            selectedDate.getHours(),
            selectedDate.getMinutes(),
          )
        : startOfDay(date);
    if (value === undefined) {
      setUncontrolledValue(nextDate);
    }
    commitDisplayMonth(nextDate);
    onValueChange?.(nextDate);
  }

  function commitTimePart(part: "hour" | "minute", numericValue: string) {
    const base = selectedDate ?? new Date();
    const nextDate = new Date(base);
    if (part === "hour") {
      nextDate.setHours(Number(numericValue));
    } else {
      nextDate.setMinutes(Number(numericValue));
    }
    nextDate.setSeconds(0, 0);

    if (value === undefined) {
      setUncontrolledValue(nextDate);
    }
    commitDisplayMonth(nextDate);
    onValueChange?.(nextDate);
  }

  function moveDisplayDate(date: Date) {
    if (date.getMonth() !== resolvedDisplayMonth.getMonth()) {
      commitDisplayMonth(date);
    }
  }

  function commitMonth(monthIndex: number) {
    const nextDate = new Date(resolvedDisplayMonth.getFullYear(), monthIndex, 1);
    commitDate(nextDate);
  }

  function commitToday() {
    commitDate(new Date());
  }

  function commitNow() {
    const nextDate = new Date();
    if (value === undefined) {
      setUncontrolledValue(nextDate);
    }
    commitDisplayMonth(nextDate);
    onValueChange?.(nextDate);
  }

  if (type === "month") {
    return (
      <MonthPanel
        displayMonth={resolvedDisplayMonth}
        labels={monthLabels ?? monthLabelsForLocale(locale)}
        onMonthSelect={commitMonth}
      />
    );
  }
  if (type === "time") {
    return (
      <TimePanel
        disabledDate={disabledDate}
        displayMonth={resolvedDisplayMonth}
        hourValues={hourValues}
        minuteValues={minuteValues}
        okLabel={okLabel}
        onDisplayMonthChange={commitDisplayMonth}
        onHourSelect={(hour) => commitTimePart("hour", hour)}
        onMinuteSelect={(minute) => commitTimePart("minute", minute)}
        onMoveDate={moveDisplayDate}
        onSelectDate={commitDate}
        selectedDate={selectedDate}
        weekLabels={resolvedWeekLabels}
      />
    );
  }
  if (type === "timePicker") {
    return (
      <TimePickerPanel
        hourValues={hourValues}
        minuteValues={minuteValues}
        nowLabel={nowLabel}
        okLabel={okLabel}
        onHourSelect={(hour) => commitTimePart("hour", hour)}
        onMinuteSelect={(minute) => commitTimePart("minute", minute)}
        onNow={commitNow}
        selectedDate={selectedDate}
      />
    );
  }
  return (
    <DatePanel
      disabledDate={disabledDate}
      displayMonth={resolvedDisplayMonth}
      guideMessages={guideMessages}
      onDisplayMonthChange={commitDisplayMonth}
      onMoveDate={moveDisplayDate}
      onSelectDate={commitDate}
      onToday={commitToday}
      selectedDate={selectedDate}
      todayLabel={todayLabel}
      weekLabels={resolvedWeekLabels}
      withGuide={type === "dateWord"}
    />
  );
}

export function DateRangePicker({
  defaultDisplayMonth,
  defaultPresetLabel,
  defaultValue,
  disabledDate,
  displayMonth,
  locale,
  onPresetChange,
  onValueChange,
  presetLabels = [],
  presets = [],
  value,
  weekLabels,
}: DateRangePickerProps) {
  const resolvedWeekLabels = weekLabels ?? weekLabelsForLocale(locale);
  const [uncontrolledRange, setUncontrolledRange] = useState(
    defaultValue ?? (defaultPresetLabel ? defaultPresetRange(defaultPresetLabel) : emptyRange),
  );
  const range = value ?? uncontrolledRange;
  const [selectedPresetLabel, setSelectedPresetLabel] = useState(defaultPresetLabel);
  const [uncontrolledDisplayMonth, setUncontrolledDisplayMonth] = useState(() =>
    startOfMonth(defaultDisplayMonth ?? range.start ?? new Date()),
  );
  const resolvedDisplayMonth = displayMonth ? startOfMonth(displayMonth) : uncontrolledDisplayMonth;
  const hasSixCalendarRows = useMemo(
    () =>
      monthRequiresSixCalendarRows(resolvedDisplayMonth) ||
      monthRequiresSixCalendarRows(addMonths(resolvedDisplayMonth, 1)),
    [resolvedDisplayMonth],
  );
  const presetOptions: Array<DateRangePresetOption> =
    presetLabels.length > 0
      ? presetLabels.map((label) => {
          const preset = presets.find(
            (item) => item.id === label || (typeof item.label === "string" && item.label === label),
          );
          return {
            fallbackLabel: label,
            id: label,
            label,
            value: preset?.value,
          };
        })
      : presets.map((preset, index) => {
          const id = dateRangePresetId(preset, index);
          return {
            fallbackLabel: dateRangePresetFallbackLabel(preset, id),
            id,
            label: preset.label,
            value: preset.value,
          };
        });

  function commitDisplayMonth(month: Date) {
    const nextMonth = startOfMonth(month);
    if (displayMonth === undefined) {
      setUncontrolledDisplayMonth(nextMonth);
    }
  }

  function commitRange(nextRange: DateRangeValue) {
    if (value === undefined) {
      setUncontrolledRange(nextRange);
    }
    onValueChange?.(nextRange);
  }

  function commitDate(date: Date) {
    if (disabledDate?.(date)) return;
    const nextDate = startOfDay(date);
    const hasOpenStart = range.start && !range.end;
    let nextRange: DateRangeValue;

    if (!hasOpenStart) {
      nextRange = { end: null, start: nextDate };
    } else if (range.start && nextDate.getTime() < startOfDay(range.start).getTime()) {
      nextRange = { end: range.start, start: nextDate };
    } else {
      nextRange = { end: nextDate, start: range.start };
    }

    setSelectedPresetLabel(undefined);
    commitDisplayMonth(nextDate);
    commitRange(nextRange);
  }

  function moveDisplayDate(date: Date) {
    if (date.getMonth() !== resolvedDisplayMonth.getMonth()) {
      commitDisplayMonth(date);
    }
  }

  function commitPreset(preset: DateRangePresetOption) {
    const nextRange =
      typeof preset.value === "function"
        ? preset.value()
        : preset.value ?? defaultPresetRange(preset.fallbackLabel);

    setSelectedPresetLabel(preset.id);
    onPresetChange?.(preset.id);
    if (nextRange.start) {
      commitDisplayMonth(nextRange.start);
    }
    commitRange(nextRange);
  }

  return (
    <div
      className={cx(
        "flex w-[729px] flex-col items-start rounded-lg bg-ecoya-gray-12 shadow-[var(--ecoya-shadow-filter)]",
        hasSixCalendarRows ? "h-[368px]" : "h-[328px]",
      )}
      data-ui="date-range-picker"
    >
      <div className="flex h-full gap-2 p-3">
        <div className="flex w-[89px] shrink-0 flex-col gap-[5px]">
          {presetOptions.map((preset) => (
            <button
              aria-pressed={selectedPresetLabel === preset.id}
              className={cx(
                "flex h-10 w-full items-center justify-center overflow-hidden whitespace-nowrap rounded-md px-4 text-body-15 font-medium leading-[21.9px] text-[color:var(--ecoya-gray-2)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ecoya-blue-4",
                selectedPresetLabel === preset.id ? "bg-ecoya-gray-10" : "bg-ecoya-gray-12",
              )}
              key={preset.id}
              onClick={() => commitPreset(preset)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <DatePanel
          disabledDate={disabledDate}
          displayMonth={resolvedDisplayMonth}
          footer={false}
          forceSixCalendarRows={hasSixCalendarRows}
          onDisplayMonthChange={commitDisplayMonth}
          onMoveDate={moveDisplayDate}
          onSelectDate={commitDate}
          range={range}
          weekLabels={resolvedWeekLabels}
        />
        <DatePanel
          disabledDate={disabledDate}
          displayMonth={addMonths(resolvedDisplayMonth, 1)}
          footer={false}
          forceSixCalendarRows={hasSixCalendarRows}
          onDisplayMonthChange={commitDisplayMonth}
          onMoveDate={moveDisplayDate}
          onSelectDate={commitDate}
          range={range}
          weekLabels={resolvedWeekLabels}
        />
      </div>
    </div>
  );
}

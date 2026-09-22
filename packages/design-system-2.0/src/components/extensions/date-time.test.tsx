import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { addMonths, startOfDay } from "date-fns"
import { describe, expect, it, vi } from "vitest"

import { DateTimePicker } from "./date-time-picker"
import { DatePicker } from "./date-picker"
import {
  get1MonthDateRange,
  get3MonthDateRange,
  RangePicker,
} from "./range-picker"
import { TimePicker } from "./time-picker"

describe("picker native form participation", () => {
  it("serializes canonical local values and resets uncontrolled pickers", async () => {
    const user = userEvent.setup()
    const date = new Date(2026, 2, 10, 14, 30)
    const range: [Date, Date] = [new Date(2026, 2, 10), new Date(2026, 2, 12)]

    render(
      <>
        <form id="picker-owner">
          <button type="reset">Reset all pickers</button>
        </form>
        <DatePicker
          form="picker-owner"
          name="date"
          defaultValue={date}
          format="dd/MM/yyyy"
        />
        <TimePicker
          form="picker-owner"
          name="time"
          defaultValue={date}
          use12Hours
          showNow={false}
        />
        <DateTimePicker
          form="picker-owner"
          name="dateTime"
          defaultValue={date}
          dateFormat="dd/MM/yyyy"
          timeFormat="hh:mm a"
        />
        <RangePicker
          form="picker-owner"
          name="range"
          defaultValue={range}
          format="dd/MM/yyyy"
        />
      </>
    )

    const form = document.getElementById("picker-owner") as HTMLFormElement
    let data = new FormData(form)
    expect(data.get("date")).toBe("2026-03-10")
    expect(data.get("time")).toBe("14:30")
    expect(data.get("dateTime")).toBe("2026-03-10T14:30")
    expect(data.getAll("range")).toEqual(["2026-03-10", "2026-03-12"])

    await user.click(screen.getByRole("button", { name: "Clear date" }))
    await user.click(
      screen.getAllByRole("button", { name: "Choose time: 02:30 PM" })[0]
    )
    await user.click(screen.getByRole("button", { name: "Clear" }))
    await user.click(
      screen.getByRole("button", { name: "Clear date and time" })
    )
    await user.click(
      screen.getByRole("button", {
        name: "Choose date range: 10/03/2026 – 12/03/2026",
      })
    )
    await user.click(screen.getByRole("button", { name: "Clear" }))

    data = new FormData(form)
    expect(data.get("date")).toBe("")
    expect(data.get("time")).toBe("")
    expect(data.get("dateTime")).toBe("")
    expect(data.getAll("range")).toEqual(["", ""])

    await user.click(screen.getByRole("button", { name: "Reset all pickers" }))
    await waitFor(() => {
      const resetData = new FormData(form)
      expect(resetData.get("date")).toBe("2026-03-10")
      expect(resetData.get("time")).toBe("14:30")
      expect(resetData.get("dateTime")).toBe("2026-03-10T14:30")
      expect(resetData.getAll("range")).toEqual(["2026-03-10", "2026-03-12"])
    })
  })

  it("uses validating native controls and omits disabled pickers", () => {
    render(
      <>
        <form id="required-pickers" />
        <DatePicker form="required-pickers" name="date" required />
        <TimePicker form="required-pickers" name="time" required />
        <DateTimePicker form="required-pickers" name="dateTime" required />
        <RangePicker form="required-pickers" name="range" required />

        <form id="disabled-pickers" />
        <DatePicker
          form="disabled-pickers"
          name="date"
          defaultValue={new Date(2026, 2, 10)}
          disabled
        />
        <TimePicker
          form="disabled-pickers"
          name="time"
          defaultValue={new Date(2026, 2, 10, 14, 30)}
          disabled
        />
        <DateTimePicker
          form="disabled-pickers"
          name="dateTime"
          defaultValue={new Date(2026, 2, 10, 14, 30)}
          disabled
        />
        <RangePicker
          form="disabled-pickers"
          name="range"
          defaultValue={[new Date(2026, 2, 10), new Date(2026, 2, 12)]}
          disabled
        />
      </>
    )

    const requiredForm = document.getElementById(
      "required-pickers"
    ) as HTMLFormElement
    const requiredControls = Array.from(requiredForm.elements).filter(
      (element): element is HTMLInputElement =>
        element instanceof HTMLInputElement
    )
    expect(requiredControls).toHaveLength(5)
    for (const control of requiredControls) {
      expect(control.willValidate).toBe(true)
      expect(control.checkValidity()).toBe(false)
    }
    expect(requiredForm.checkValidity()).toBe(false)

    const disabledForm = document.getElementById(
      "disabled-pickers"
    ) as HTMLFormElement
    const disabledData = new FormData(disabledForm)
    expect([...disabledData.keys()]).toEqual([])
  })
})

describe("TimePicker", () => {
  it("applies an allowed stepped time and returns its formatted value", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const initial = new Date(2026, 2, 10, 9, 30)

    render(
      <TimePicker
        defaultValue={initial}
        minuteStep={15}
        minTime={new Date(2026, 2, 10, 9, 0)}
        maxTime={new Date(2026, 2, 10, 17, 0)}
        showNow={false}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 09:30" }))
    const hour = screen.getByRole("spinbutton", { name: "Hour" })
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(hour)
    await user.type(hour, "10")
    await user.clear(minute)
    await user.type(minute, "45")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    const [selected, formatted] = onChange.mock.lastCall as [Date, string]
    expect(selected.getHours()).toBe(10)
    expect(selected.getMinutes()).toBe(45)
    expect(formatted).toBe("10:45")
  })

  it("rejects values outside the configured minute step", async () => {
    const user = userEvent.setup()

    render(
      <TimePicker
        defaultValue={new Date(2026, 2, 10, 9, 30)}
        minuteStep={15}
        showNow={false}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 09:30" }))
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(minute)
    await user.type(minute, "46")

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
    expect(
      screen.getByText("Choose a time within the allowed range and step.")
    ).toBeInTheDocument()
  })

  it("uses exact absolute second boundaries and exposes the selected time in its name", async () => {
    const user = userEvent.setup()

    render(
      <TimePicker
        defaultValue={new Date(2026, 2, 10, 9, 1)}
        min={new Date(2026, 2, 10, 9, 0, 30)}
        showNow={false}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 09:01" }))
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(minute)
    await user.type(minute, "0")

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
    expect(minute).toHaveAccessibleDescription(
      "Choose a time within the allowed range and step."
    )
  })

  it("supports a same-date recurring overnight window", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <TimePicker
        defaultValue={new Date(2026, 2, 10, 23, 30)}
        minTime={new Date(2026, 2, 10, 22, 0)}
        maxTime={new Date(2026, 2, 10, 2, 0)}
        minuteStep={30}
        showNow={false}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 23:30" }))
    const hour = screen.getByRole("spinbutton", { name: "Hour" })
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(hour)
    await user.type(hour, "1")
    await user.clear(minute)
    await user.type(minute, "30")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    expect(onChange).toHaveBeenLastCalledWith(
      new Date(2026, 2, 10, 1, 30),
      "01:30"
    )
  })

  it("keeps min and max as absolute timestamps instead of recurring clock bounds", async () => {
    const user = userEvent.setup()

    render(
      <TimePicker
        defaultValue={new Date(2026, 2, 11, 1, 0)}
        max={new Date(2026, 2, 10, 2, 0)}
        showNow={false}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 01:00" }))

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
  })

  it("resynchronizes a dirty open editor when its owner form resets", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const initial = new Date(2026, 2, 10, 9, 30)

    render(
      <>
        <form id="open-time-reset" />
        <TimePicker
          form="open-time-reset"
          name="time"
          defaultValue={initial}
          showNow={false}
          onChange={onChange}
        />
      </>
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 09:30" }))
    const hour = screen.getByRole("spinbutton", { name: "Hour" })
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(hour)
    await user.type(hour, "10")
    await user.clear(minute)
    await user.type(minute, "45")

    act(() => {
      ;(document.getElementById("open-time-reset") as HTMLFormElement).reset()
    })

    await waitFor(() => {
      expect(hour).toHaveValue(9)
      expect(minute).toHaveValue(30)
    })
    expect(
      new FormData(
        document.getElementById("open-time-reset") as HTMLFormElement
      ).get("time")
    ).toBe("09:30")

    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(onChange).toHaveBeenLastCalledWith(initial, "09:30")
  })

  it("resynchronizes an open editor after controlled value and reference changes", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TimePicker
        value={new Date(2026, 2, 10, 9, 30)}
        referenceDate={new Date(2026, 2, 10, 8, 0)}
        showNow={false}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 09:30" }))
    const hour = screen.getByRole("spinbutton", { name: "Hour" })
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(hour)
    await user.type(hour, "11")

    rerender(
      <TimePicker
        value={new Date(2026, 2, 10, 14, 15)}
        referenceDate={new Date(2026, 2, 10, 8, 0)}
        showNow={false}
      />
    )

    await waitFor(() => {
      expect(hour).toHaveValue(14)
      expect(minute).toHaveValue(15)
    })

    rerender(
      <TimePicker
        value={null}
        referenceDate={new Date(2026, 2, 10, 16, 45)}
        showNow={false}
      />
    )

    await waitFor(() => {
      expect(hour).toHaveValue(16)
      expect(minute).toHaveValue(45)
    })
  })

  it("blurs only after focus leaves the trigger and portalled editor", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(
      <div>
        <TimePicker
          defaultValue={new Date(2026, 2, 10, 9, 30)}
          showNow={false}
          onBlur={onBlur}
        />
        <button type="button">Next time field</button>
      </div>
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 09:30" }))
    await user.click(screen.getByRole("spinbutton", { name: "Hour" }))
    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Next time field" }))
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })
})

describe("DateTimePicker", () => {
  it("clears the date and time as one value", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <DateTimePicker
        defaultValue={new Date(2026, 2, 10, 14, 30)}
        onChange={onChange}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Clear date and time" })
    )

    expect(onChange).toHaveBeenLastCalledWith(null, null)
    expect(
      screen.getByRole("button", { name: "Choose date" })
    ).toHaveTextContent("Choose date")
  })

  it("resynchronizes its open time editor when its owner form resets", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const initial = new Date(2026, 2, 10, 14, 30)

    render(
      <>
        <form id="open-date-time-reset" />
        <DateTimePicker
          form="open-date-time-reset"
          name="dateTime"
          defaultValue={initial}
          showNow={false}
          onChange={onChange}
        />
      </>
    )

    await user.click(screen.getByRole("button", { name: "Choose time: 14:30" }))
    const hour = screen.getByRole("spinbutton", { name: "Hour" })
    const minute = screen.getByRole("spinbutton", { name: "Minute" })
    await user.clear(hour)
    await user.type(hour, "16")
    await user.clear(minute)
    await user.type(minute, "45")

    act(() => {
      ;(
        document.getElementById("open-date-time-reset") as HTMLFormElement
      ).reset()
    })

    await waitFor(() => {
      expect(hour).toHaveValue(14)
      expect(minute).toHaveValue(30)
    })
    expect(
      new FormData(
        document.getElementById("open-date-time-reset") as HTMLFormElement
      ).get("dateTime")
    ).toBe("2026-03-10T14:30")

    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(onChange.mock.lastCall?.[0]).toEqual(initial)
  })

  it("normalizes a selected day to the closest stepped time inside exact bounds", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const boundaryDay = new Date(2026, 2, 10)

    render(
      <DateTimePicker
        min={new Date(2026, 2, 10, 9, 0, 30)}
        max={new Date(2026, 2, 10, 17, 0)}
        minHour={9}
        minuteStep={15}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose date" }))
    const day = document.querySelector<HTMLButtonElement>(
      `button[data-day="${boundaryDay.toLocaleDateString()}"]`
    )
    expect(day).not.toBeNull()
    await user.click(day as HTMLButtonElement)

    const [selected] = onChange.mock.lastCall as [Date, string]
    expect(selected).toEqual(new Date(2026, 2, 10, 9, 15))
  })

  it("fires composite blur only after focus leaves both controls", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(
      <div>
        <DateTimePicker
          defaultValue={new Date(2026, 2, 10, 14, 30)}
          onBlur={onBlur}
        />
        <button type="button">Next field</button>
      </div>
    )

    await user.click(
      screen.getByRole("button", { name: "Choose date: 2026-03-10" })
    )
    const selectedDay = document.querySelector<HTMLButtonElement>(
      `button[data-day="${new Date(2026, 2, 10).toLocaleDateString()}"]`
    )
    expect(selectedDay).not.toBeNull()
    await user.click(selectedDay as HTMLButtonElement)
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Next field" }))
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })

  it("keeps focus within both portalled pickers and blurs once on final exit", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(
      <div>
        <DateTimePicker
          defaultValue={new Date(2026, 2, 10, 14, 30)}
          showNow={false}
          onBlur={onBlur}
        />
        <button type="button">Next field</button>
      </div>
    )

    await user.click(
      screen.getByRole("button", { name: "Choose date: 2026-03-10" })
    )
    await user.click(
      screen.getByRole("button", { name: "Go to the Next Month" })
    )
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Choose time: 14:30" }))
    await user.click(screen.getByRole("spinbutton", { name: "Hour" }))
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Next field" }))
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })

  it("rejects a skipped DST time against the clamped active date", async () => {
    const previousTimezone = process.env.TZ
    process.env.TZ = "America/New_York"

    try {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <DateTimePicker
          min={new Date(2030, 2, 10, 0, 0)}
          max={new Date(2030, 2, 10, 23, 59)}
          showNow={false}
          onChange={onChange}
        />
      )

      await user.click(screen.getByRole("button", { name: "Choose time" }))
      const hour = screen.getByRole("spinbutton", { name: "Hour" })
      const minute = screen.getByRole("spinbutton", { name: "Minute" })
      await user.clear(hour)
      await user.type(hour, "2")
      await user.clear(minute)
      await user.type(minute, "30")

      expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ
      else process.env.TZ = previousTimezone
    }
  })
})

describe("DatePicker", () => {
  it("selects and clears native Date values with an accessible current value", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <DatePicker defaultValue={new Date(2026, 2, 10)} onChange={onChange} />
    )

    expect(
      screen.getByRole("button", { name: "Choose date: 2026-03-10" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear date" }))
    expect(onChange).toHaveBeenLastCalledWith(null, null)
    expect(
      screen.getByRole("button", { name: "Choose date" })
    ).toHaveTextContent("YYYY-MM-DD")
  })

  it("selects a bounded month as the first day of that month", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <DatePicker
        mode="month"
        defaultValue={new Date(2026, 2, 1)}
        minDate={new Date(2026, 1, 15)}
        maxDate={new Date(2026, 3, 15)}
        showToday={false}
        onChange={onChange}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Choose date: 2026-03" })
    )
    expect(screen.getByRole("button", { name: "Jan 2026" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Apr 2026" }))

    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 3, 1), "2026-04")
  })

  it("keeps a controlled value until its owner updates it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<DatePicker value={new Date(2026, 2, 10)} onChange={onChange} />)

    await user.click(
      screen.getByRole("button", { name: "Choose date: 2026-03-10" })
    )
    const nextDay = document.querySelector<HTMLButtonElement>(
      `button[data-day="${new Date(2026, 2, 11).toLocaleDateString()}"]`
    )
    expect(nextDay).not.toBeNull()
    await user.click(nextDay as HTMLButtonElement)

    expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 11), "2026-03-11")
    expect(
      screen.getByRole("button", { name: "Choose date: 2026-03-10" })
    ).toBeInTheDocument()
  })

  it("commits Today without blurring until focus leaves the compound", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onBlur = vi.fn()

    render(
      <div>
        <DatePicker format="dd/MM/yyyy" onChange={onChange} onBlur={onBlur} />
        <button type="button">Next date field</button>
      </div>
    )

    await user.click(screen.getByRole("button", { name: "Choose date" }))
    await user.click(screen.getByRole("button", { name: "Today" }))

    const today = startOfDay(new Date())
    expect(onChange).toHaveBeenLastCalledWith(
      today,
      `${String(today.getDate()).padStart(2, "0")}/${String(
        today.getMonth() + 1
      ).padStart(2, "0")}/${today.getFullYear()}`
    )
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Next date field" }))
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })

  it("disables both selection and clearing when disabled", () => {
    render(<DatePicker disabled defaultValue={new Date(2026, 2, 10)} />)

    expect(
      screen.getByRole("button", { name: "Choose date: 2026-03-10" })
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Clear date" })).toBeDisabled()
  })

  it("renders guidance as a note instead of the Today shortcut", async () => {
    const user = userEvent.setup()

    render(<DatePicker guide="Only business days can be selected." />)
    await user.click(screen.getByRole("button", { name: "Choose date" }))

    expect(screen.getByRole("note")).toHaveTextContent(
      "Only business days can be selected."
    )
    expect(
      screen.queryByRole("button", { name: "Today" })
    ).not.toBeInTheDocument()
  })
})

describe("RangePicker", () => {
  it("keeps the clear action visible while dense mobile content scrolls", async () => {
    const user = userEvent.setup()

    render(
      <RangePicker
        defaultValue={[new Date(2026, 2, 10), new Date(2026, 2, 12)]}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: "Choose date range: 2026-03-10 – 2026-03-12",
      })
    )

    const scrollArea = document.querySelector(
      '[data-slot="range-picker-scroll-area"]'
    )
    const actions = document.querySelector('[data-slot="range-picker-actions"]')

    expect(scrollArea).toHaveClass(
      "min-h-0",
      "max-w-full",
      "overflow-x-auto",
      "overflow-y-auto",
      "overscroll-contain"
    )
    expect(actions).toHaveClass(
      "shrink-0",
      "border-[var(--surface-border)]",
      "bg-[var(--surface-background)]"
    )
    expect(actions).toContainElement(
      screen.getByRole("button", { name: "Clear" })
    )
  })

  it("commits a range only after the end date is selected", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const start = new Date(2026, 2, 10)
    const end = new Date(2026, 2, 12)

    render(<RangePicker defaultValue={[start, null]} onChange={onChange} />)

    await user.click(
      screen.getByRole("button", {
        name: "Choose date range: 2026-03-10 – End date",
      })
    )
    const endDay = document.querySelector<HTMLButtonElement>(
      `button[data-day="${end.toLocaleDateString()}"]`
    )

    expect(endDay).not.toBeNull()
    await user.click(endDay as HTMLButtonElement)

    const [[selectedStart, selectedEnd], formatted] = onChange.mock
      .lastCall as [[Date, Date], [string, string]]
    expect(selectedStart).toEqual(start)
    expect(selectedEnd).toEqual(end)
    expect(formatted).toEqual(["2026-03-10", "2026-03-12"])
  })

  it("does not blur on selection close and blurs once after focus exits", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()
    const end = new Date(2026, 2, 12)

    render(
      <div>
        <RangePicker
          defaultValue={[new Date(2026, 2, 10), null]}
          onBlur={onBlur}
        />
        <button type="button">Next range field</button>
      </div>
    )

    await user.click(
      screen.getByRole("button", {
        name: "Choose date range: 2026-03-10 – End date",
      })
    )
    const endDay = document.querySelector<HTMLButtonElement>(
      `button[data-day="${end.toLocaleDateString()}"]`
    )
    expect(endDay).not.toBeNull()
    await user.click(endDay as HTMLButtonElement)
    expect(onBlur).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Next range field" }))
    await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1))
  })

  it("clears a complete range", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RangePicker
        defaultValue={[new Date(2026, 2, 10), new Date(2026, 2, 12)]}
        onChange={onChange}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: "Choose date range: 2026-03-10 – 2026-03-12",
      })
    )
    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(onChange).toHaveBeenLastCalledWith([null, null], ["", ""])
  })

  it("canonicalizes an end-only controlled value as a visible start", () => {
    render(<RangePicker value={[null, new Date(2026, 2, 12)]} />)

    expect(
      screen.getByRole("button", {
        name: "Choose date range: 2026-03-12 – End date",
      })
    ).toBeInTheDocument()
  })

  it("renders customizable presets and commits their complete range", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const presetRange: [Date, Date] = [
      new Date(2026, 3, 1),
      new Date(2026, 5, 30),
    ]

    render(
      <RangePicker
        presets={[{ label: "Quarter", value: presetRange }]}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "Choose date range" }))
    expect(
      screen.getByRole("group", { name: "Date range presets" })
    ).toHaveTextContent("Quarter")
    await user.click(screen.getByRole("button", { name: "Quarter" }))

    expect(onChange).toHaveBeenLastCalledWith(presetRange, [
      "2026-04-01",
      "2026-06-30",
    ])
    expect(
      screen.getByRole("button", {
        name: "Choose date range: 2026-04-01 – 2026-06-30",
      })
    ).toBeInTheDocument()
  })

  it("shows the default forward presets in the picker UI", async () => {
    const user = userEvent.setup()
    render(<RangePicker />)

    await user.click(screen.getByRole("button", { name: "Choose date range" }))
    const presetGroup = screen.getByRole("group", {
      name: "Date range presets",
    })
    expect(presetGroup).toHaveTextContent("Today")
    expect(presetGroup).toHaveTextContent("1 month")
    expect(presetGroup).toHaveTextContent("3 months")
  })

  it("keeps the legacy forward-looking month presets", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 12, 15, 30))

    const today = startOfDay(new Date())
    expect(get1MonthDateRange()).toEqual([today, addMonths(today, 1)])
    expect(get3MonthDateRange()).toEqual([today, addMonths(today, 3)])

    vi.useRealTimers()
  })
})

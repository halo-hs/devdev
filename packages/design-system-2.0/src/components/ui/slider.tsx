"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "group/slider relative flex w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-disabled:opacity-100 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-[var(--slider-track-background)] group-data-disabled/slider:bg-[var(--slider-disabled-background)] data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-[var(--slider-range-background)] select-none group-data-disabled/slider:bg-[var(--slider-disabled-foreground)] data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="relative block size-3 shrink-0 rounded-full border border-[var(--slider-thumb-border)] bg-[var(--surface-background)] transition-[color,box-shadow] select-none group-data-disabled/slider:border-[var(--slider-disabled-foreground)] group-data-disabled/slider:bg-[var(--slider-disabled-background)] group-data-disabled/slider:opacity-100 after:absolute after:-inset-2 focus-visible:border-transparent focus-visible:shadow-[var(--shadow-keyboard-focus)] focus-visible:ring-0 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-100"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

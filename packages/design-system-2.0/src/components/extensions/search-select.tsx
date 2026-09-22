"use client"

import * as React from "react"

import {
  ComboboxSelect,
  type ComboboxSelectProps,
} from "@ecoya/design-system/extensions/combobox-select"

type SearchSelectProps = ComboboxSelectProps

const SearchSelect = React.forwardRef<HTMLDivElement, SearchSelectProps>(
  function SearchSelect(
    {
      placeholder = "Search",
      emptyText = "No matches found.",
      autoHighlight = true,
      ...props
    },
    ref
  ) {
    return (
      <ComboboxSelect
        ref={ref}
        placeholder={placeholder}
        emptyText={emptyText}
        autoHighlight={autoHighlight}
        {...props}
      />
    )
  }
)

export { SearchSelect }
export type { SearchSelectProps }
export default SearchSelect

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"

import type { Option } from "./regionOptions"

export function SearchableSetting({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  return (
    <Combobox
      items={options}
      value={selected ?? null}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(option, query) =>
        `${option.label} ${option.value} ${option.search ?? ""}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())
      }
      onValueChange={(option) => {
        if (option) {
          onChange(option.value)
          setOpen(false)
        }
      }}
    >
      <ComboboxTrigger
        aria-label={label}
        render={
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal"
          />
        }
      >
        <span className="min-w-0 truncate">{selected?.label ?? value}</span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          aria-label={`${label} 검색`}
          placeholder={`${label} 검색`}
          showTrigger={false}
        />
        <ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>
        <ComboboxList>
          {(option: Option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

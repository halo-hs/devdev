import { useState } from "react"
import { Button } from "@shared/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@shared/components/ui/combobox"

type Option = { value: string; label: string; search?: string }

// ISO 3166-1 alpha-2. Display names come from the browser's CLDR data.
const countryCodes =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " "
  )
const koreanNames = new Intl.DisplayNames(["ko"], { type: "region" })
const englishNames = new Intl.DisplayNames(["en"], { type: "region" })
export const countryOptions: Option[] = countryCodes
  .map((value) => ({
    value,
    label: koreanNames.of(value) ?? value,
    search: `${value} ${englishNames.of(value)}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "ko"))

export const languageOptions: Option[] = [
  { value: "ko-KR", label: "한국어" },
  { value: "en-US", label: "English (미국)" },
  { value: "en-GB", label: "English (영국)" },
  { value: "ja-JP", label: "日本語 (일본어)" },
  { value: "de-DE", label: "Deutsch (독일어)" },
  { value: "fr-FR", label: "Français (프랑스어)" },
]

const zoneAliases: Record<string, string> = {
  "Asia/Seoul": "서울 대한민국",
  "Asia/Tokyo": "도쿄 일본",
  "Asia/Singapore": "싱가포르",
  "America/New_York": "뉴욕 미국",
  "America/Los_Angeles": "로스앤젤레스 미국",
  "Europe/London": "런던 영국",
  "Europe/Berlin": "베를린 독일",
  "Europe/Paris": "파리 프랑스",
}
export const timeZoneOptions: Option[] = [
  "UTC",
  ...Intl.supportedValuesOf("timeZone"),
].map((value) => ({
  value,
  label:
    value === "Asia/Seoul" ? "서울 · Asia/Seoul" : value.replaceAll("_", " "),
  search: zoneAliases[value],
}))

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

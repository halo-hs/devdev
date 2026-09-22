import { describe, expect, it } from "vitest"

import * as extensions from "./index.ts"

const requiredComponents = [
  "AsyncButton",
  "BusySwitch",
  "CharacterCountTextarea",
  "CheckboxGroup",
  "ClearableInput",
  "ClosableTabs",
  "ClosableTabsContent",
  "ClosableTabsList",
  "ClosableTabsTrigger",
  "ComboBoxSelect",
  "ComboboxSelect",
  "SearchSelect",
  "MultipleSelect",
  "DatePicker",
  "TimePicker",
  "DateTimePicker",
  "RangePicker",
  "MultipleInput",
  "NotificationBadge",
  "LoadingDots",
  "FileDropZone",
  "ImageTile",
  "LabeledProgress",
  "PaginationController",
  "DataTable",
  "QuantityStepper",
  "RequiredLabel",
  "InputTimer",
  "Tag",
  "Typography",
] as const

describe("extension export contract", () => {
  it("keeps every non-shadcn capability on the local extension export verifier", () => {
    for (const componentName of requiredComponents) {
      expect(extensions[componentName], componentName).toBeDefined()
    }
  })
})

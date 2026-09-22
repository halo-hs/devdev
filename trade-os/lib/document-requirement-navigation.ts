export function focusDocumentRequirement(selector: string) {
  // A destination pane may be mounted by the same click.
  window.setTimeout(() => {
    const target = document.querySelector<HTMLElement>(selector)
    // Header actions can precede the field. A validation link must focus the control.
    const control = target?.querySelector<HTMLElement>(
      '[data-slot="form-field-control"] input:not([disabled]), [data-slot="form-field-control"] textarea:not([disabled]), [data-slot="form-field-control"] [role="combobox"]:not([disabled])'
    ) ?? target?.querySelector<HTMLElement>("input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]")
    control?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, 100)
}

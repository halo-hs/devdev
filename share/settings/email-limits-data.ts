export type EmailReceiptLimits = {
  maxAttachmentCount: number
  maxAttachmentBytes: number
  acceptedFormats: string[]
  maxMessageBytes?: number
}
export type EmailLimitsLoader = () => Promise<EmailReceiptLimits | null>

// Preview response only; production must inject its server loader. Message size
// is deliberately different and must never be displayed as the per-file limit.
export const emailLimitsPreview: EmailLimitsLoader = async () => ({
  maxAttachmentCount: 5,
  maxAttachmentBytes: 20 * 1024 * 1024,
  acceptedFormats: ["PDF", "JPG", "PNG"],
  maxMessageBytes: 30 * 1024 * 1024,
})

export function validEmailLimits(
  value: EmailReceiptLimits | null
): value is EmailReceiptLimits {
  return Boolean(
    value &&
    Number.isSafeInteger(value.maxAttachmentCount) &&
    value.maxAttachmentCount > 0 &&
    Number.isSafeInteger(value.maxAttachmentBytes) &&
    value.maxAttachmentBytes > 0 &&
    Array.isArray(value.acceptedFormats) &&
    value.acceptedFormats.length &&
    value.acceptedFormats.every(
      (format) => typeof format === "string" && format.trim()
    )
  )
}

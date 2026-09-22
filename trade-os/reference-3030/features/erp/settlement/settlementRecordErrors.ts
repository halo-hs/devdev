import { ApiError } from "@trade-os/reference-3030/lib/api/client";

import type { AppMessages } from "@trade-os/reference-3030/i18n/messages";

type RecordErrorCopy = AppMessages["erpSettlement"]["settlement"]["ledger"]["recordErrors"];

export function recordCashErrorMessage(
  error: unknown,
  copy: RecordErrorCopy,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) return fallback;
  switch (error.code) {
    // Live backend guards cover currency consistency and source-document deduplication.
    case "ERP_SETTLEMENT_CURRENCY_MISMATCH":
      return copy.currencyMismatch;
    case "ERP_SETTLEMENT_SCHEDULE_CLOSED":
      return copy.scheduleClosed;
    case "ERP_SETTLEMENT_DUPLICATE_SOURCE_DOCUMENT":
      return copy.duplicateSourceDocument;
    case "ERP_SETTLEMENT_VALIDATION":
      return copy.validation;
    case "ERP_SETTLEMENT_SCHEDULE_NOT_FOUND":
      return copy.scheduleNotFound;
    case "ERP_SETTLEMENT_PAYMENT_NOT_FOUND":
      return copy.paymentNotFound;
    default:
      return fallback;
  }
}

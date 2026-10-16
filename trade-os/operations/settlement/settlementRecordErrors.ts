import { ApiError } from "@trade-os/operations/lib/api/client";

import type { AppMessages } from "@trade-os/operations/i18n/messages";

type RecordErrorCopy = AppMessages["erpSettlement"]["settlement"]["ledger"]["recordErrors"];

export function recordCashErrorMessage(
  error: unknown,
  copy: RecordErrorCopy,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401 || error.code === "AUTH_MISSING_TOKEN" || error.code === "AUTH_INVALID_TOKEN") return "로그인이 끊겨 기록하지 못했습니다. 다시 로그인한 뒤 확인해 주세요. 입력한 값은 유지됩니다.";
  switch (error.code) {
    case "ERP_SETTLEMENT_COUNTERPARTY_MISMATCH":
      return "거래처가 이 일정과 달라 기록하지 못했습니다. 거래처와 일정을 확인해 주세요.";
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
      return error.status >= 400 && error.status < 500 ? "서버가 기록을 받지 않았습니다. 입력한 내용을 확인해 주세요." : fallback;
  }
}

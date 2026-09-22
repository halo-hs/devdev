"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@trade-os/operations/components/ui/button";
import { Select, TextInput } from "@trade-os/operations/components/ui/index";
import { TextLink } from "@trade-os/operations/components/ui/text-link";
import {
  listOverpaymentRefunds,
  listSchedulePayments,
  listScheduleAdjustments,
  listScheduleOverpayments,
  recordOverpaymentRefund,
  recordScheduleAdjustment,
  recordScheduleOverpayment,
  type LedgerEntry,
  type RecordSettlementAdjustmentBody,
  type RecordSettlementOverpaymentBody,
  type RecordSettlementOverpaymentRefundBody,
  type SettlementAdjustment,
  type SettlementAdjustmentKind,
  type SettlementOverpayment,
  type SettlementOverpaymentKind,
  type SettlementOverpaymentRefund,
  type SettlementPaymentEntry,
} from "@trade-os/operations/lib/api/settlement";
import { normalizeDecimalInput } from "@trade-os/operations/lib/money";
import { financeDecimalMagnitude, isFinanceDecimal } from "@trade-os/operations/lib/financeDecimal";
import type { Loadable } from "@trade-os/operations/lib/loadable";

export type SettlementExceptionCopy = {
  title: string;
  subtitle: string;
  close: string;
  loading: string;
  error: string;
  retry: string;
  restricted: string;
  saved: string;
  saving: string;
  validation: string;
  overpayments: {
    title: string;
    empty: string;
    amount: string;
    currency: string;
    paymentId: string;
    paymentHistory: string;
    paymentHistoryEmpty: string;
    kind: string;
    overpay: string;
    advanceReceivable: string;
    advancePayable: string;
    remaining: string;
    allocated: string;
    refunded: string;
    recordTitle: string;
    record: string;
    refundTitle: string;
    refundAmount: string;
    refundEvidence: string;
    refundReason: string;
    refundDocument: string;
    refund: string;
    return: string;
    refundEmpty: string;
    refundHint: string;
    returnHint: string;
  };
  adjustments: {
    title: string;
    empty: string;
    original: string;
    current: string;
    total: string;
    writtenOff: string;
    amount: string;
    currency: string;
    kind: string;
    credit: string;
    adjustment: string;
    refund: string;
    return: string;
    reason: string;
    evidence: string;
    document: string;
    recordTitle: string;
    recordHint: string;
    record: string;
  };
};

type SettlementExceptionPanelProps = {
  entry: LedgerEntry;
  canRecord: boolean;
  allowLegacyOverpaymentRecord?: boolean;
  copy: SettlementExceptionCopy;
  formatMoney: (amount: string, currency: string) => string;
  getIdToken: () => Promise<string>;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
};

type RefundDraft = Record<"amount" | "evidence" | "reason" | "document", string>;

const EMPTY_REFUND_DRAFT: RefundDraft = {
  amount: "",
  evidence: "",
  reason: "",
  document: "",
};

type RefLike<T> = { current: T };

function nextRequestId(ref: RefLike<number>) {
  ref.current += 1;
  return ref.current;
}

function nextRefundRequestId(ref: RefLike<Record<string, number>>, id: string) {
  const next = (ref.current[id] ?? 0) + 1;
  ref.current[id] = next;
  return next;
}

function requestIsCurrent(
  mountedRef: RefLike<boolean>,
  requestRef: RefLike<number>,
  requestId: number,
) {
  return mountedRef.current && requestRef.current === requestId;
}

function refundRequestIsCurrent(
  mountedRef: RefLike<boolean>,
  loadRequestRef: RefLike<number>,
  refundRequestRef: RefLike<Record<string, number>>,
  loadRequestId: number,
  overpaymentId: string,
  refundRequestId: number,
) {
  return (
    requestIsCurrent(mountedRef, loadRequestRef, loadRequestId) &&
    refundRequestRef.current[overpaymentId] === refundRequestId
  );
}

function loadableError<T>(state: Loadable<T>, error: string, retry: string, onRetry: () => void) {
  if (state.status !== "error") return null;
  return (
    <div className="flex flex-wrap items-center gap-2" role="alert">
      <span className="text-label-12 text-status-danger">{error}</span>
      {state.retryable ? (
        <Button onClick={onRetry} size="sm" type="button" variant="tertiary">
          {retry}
        </Button>
      ) : null}
    </div>
  );
}

// SC-21 Badge Matrix: the exception vocabulary separates `초과 입금` from the
// advance balances, and the advance wording follows the schedule direction —
// `선수금` on a receivable (SC-21 line 42) and `선급금` on a payable (line 43).
function kindLabel(
  kind: SettlementOverpaymentKind,
  entryType: LedgerEntry["type"],
  copy: SettlementExceptionCopy["overpayments"],
) {
  if (kind === "overpay") return copy.overpay;
  return entryType === "payable" ? copy.advancePayable : copy.advanceReceivable;
}

function adjustmentKindLabel(
  kind: SettlementAdjustmentKind,
  copy: SettlementExceptionCopy["adjustments"],
) {
  return copy[kind];
}


// The backend always serializes `written_off_total` (COALESCE to "0"), so an
// exact zero means "no written-off event" and must not render a constant
// `대손 확정 합계: 0` line next to the adjustment totals (SC-21 line 41).
function hasWrittenOffTotal(raw: string | null | undefined): raw is string {
  return isFinanceDecimal(raw) && financeDecimalMagnitude(raw) !== BigInt(0);
}

export function SettlementExceptionPanel({
  allowLegacyOverpaymentRecord = true,
  canRecord,
  copy,
  entry,
  formatMoney,
  getIdToken,
  onBusyChange,
  onClose,
  onSaved,
}: SettlementExceptionPanelProps) {
  const [overpayments, setOverpayments] = useState<Loadable<SettlementOverpayment[]>>({ status: "loading" });
  const [adjustments, setAdjustments] = useState<Loadable<SettlementAdjustment[]>>({ status: "loading" });
  const [paymentHistory, setPaymentHistory] = useState<Loadable<SettlementPaymentEntry[]>>({ status: "loading" });
  const [adjustmentSummary, setAdjustmentSummary] = useState<{
    original: string;
    current: string;
    total: string;
    writtenOff: string | null;
  } | null>(null);
  const [refunds, setRefunds] = useState<Record<string, Loadable<SettlementOverpaymentRefund[]>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const mutationBusyRef = useRef(false);
  const overpaymentAmountRef = useRef<HTMLInputElement>(null);
  const overpaymentCurrencyRef = useRef<HTMLInputElement>(null);
  const overpaymentPaymentRef = useRef<HTMLInputElement>(null);
  const adjustmentAmountRef = useRef<HTMLInputElement>(null);
  const adjustmentCurrencyRef = useRef<HTMLInputElement>(null);
  const adjustmentReasonRef = useRef<HTMLInputElement>(null);
  const refundAmountRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const refundEvidenceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const refundReasonRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [validationField, setValidationField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const [refundRetry, setRefundRetry] = useState<{ id: string; nonce: number } | null>(null);
  const mountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const refundRequestIdsRef = useRef<Record<string, number>>({});
  const overpaymentKind: SettlementOverpaymentKind = entry.type === "payable" ? "advance" : "overpay";
  const [overpaymentDraft, setOverpaymentDraft] = useState({
    amount: "",
    currency: entry.currency,
    kind: overpaymentKind,
    paymentId: "",
  });
  const [adjustmentDraft, setAdjustmentDraft] = useState({
    amount: "",
    currency: entry.currency,
    kind: "adjustment" as SettlementAdjustmentKind,
    reason: "",
    evidence: "",
    document: "",
  });
  const [refundDrafts, setRefundDrafts] = useState<Record<string, RefundDraft>>({});
  const exceptionErrorId = `settlement-exceptions-error-${entry.id}`;

  const load = useCallback(async () => {
    const requestId = nextRequestId(loadRequestIdRef);
    const isCurrent = () => requestIsCurrent(mountedRef, loadRequestIdRef, requestId);

    setOverpayments({ status: "loading" });
    setAdjustments({ status: "loading" });
    setPaymentHistory({ status: "loading" });
    setAdjustmentSummary(null);
    setRefunds({});
    const [overpaymentResult, adjustmentResult, paymentResult] = await Promise.allSettled([
      listScheduleOverpayments(entry.id, getIdToken),
      listScheduleAdjustments(entry.id, getIdToken),
      listSchedulePayments(entry.id, getIdToken),
    ]);

    if (!isCurrent()) return;

    if (overpaymentResult.status === "fulfilled") {
      const rows = overpaymentResult.value.overpayments ?? [];
      setOverpayments(rows.length > 0 ? { status: "ready", data: rows } : { status: "empty" });
      if (rows.length > 0) {
        void Promise.allSettled(
          rows.map(async (row) => {
            const refundRequestId = nextRefundRequestId(refundRequestIdsRef, row.id);
            return [row.id, refundRequestId, await listOverpaymentRefunds(row.id, getIdToken)] as const;
          }),
        ).then((refundResults) => {
          if (!isCurrent()) return;
          const nextRefunds: Record<string, Loadable<SettlementOverpaymentRefund[]>> = {};
          refundResults.forEach((result, index) => {
            const rowId = rows[index]?.id;
            if (!rowId || result.status !== "fulfilled") {
              if (rowId) nextRefunds[rowId] = { status: "error", retryable: true };
              return;
            }
            const [, refundRequestId, response] = result.value;
            if (refundRequestIdsRef.current[rowId] !== refundRequestId) return;
            nextRefunds[rowId] = response.refunds.length > 0
              ? { status: "ready", data: response.refunds }
              : { status: "empty" };
          });
          setRefunds(nextRefunds);
        });
      }
    } else {
      setOverpayments({ status: "error", retryable: true });
    }

    if (adjustmentResult.status === "fulfilled") {
      const response = adjustmentResult.value;
      const rows = response.adjustments ?? [];
      setAdjustments(rows.length > 0 ? { status: "ready", data: rows } : { status: "empty" });
      setAdjustmentSummary({
        current: response.current_target,
        original: response.original_amount,
        total: response.adjustment_total,
        writtenOff: hasWrittenOffTotal(response.written_off_total) ? response.written_off_total : null,
      });
    } else {
      setAdjustments({ status: "error", retryable: true });
    }

    if (paymentResult.status === "fulfilled" && paymentResult.value.schedule_id === entry.id) {
      const rows = paymentResult.value.payments ?? [];
      setPaymentHistory(rows.length > 0 ? { status: "ready", data: rows } : { status: "empty" });
    } else {
      setPaymentHistory({ status: "error", retryable: true });
    }
  }, [entry.id, getIdToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, loadRetryCount]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      loadRequestIdRef.current += 1;
    };
  }, []);

  const retryLoad = useCallback(() => {
    setLoadRetryCount((current) => current + 1);
  }, []);

  const retryRefund = useCallback((overpaymentId: string) => {
    setRefundRetry((current) => ({
      id: overpaymentId,
      nonce: current?.id === overpaymentId ? current.nonce + 1 : 1,
    }));
  }, []);

  useEffect(() => {
    if (!refundRetry) return;
    const { id: overpaymentId } = refundRetry;
    const loadRequestId = loadRequestIdRef.current;
    const refundRequestId = nextRefundRequestId(refundRequestIdsRef, overpaymentId);
    void listOverpaymentRefunds(overpaymentId, getIdToken).then((response) => {
      if (!refundRequestIsCurrent(mountedRef, loadRequestIdRef, refundRequestIdsRef, loadRequestId, overpaymentId, refundRequestId)) return;
      setRefunds((current) => ({
        ...current,
        [overpaymentId]: response.refunds.length > 0
          ? { status: "ready", data: response.refunds }
          : { status: "empty" },
      }));
    }).catch(() => {
      if (!refundRequestIsCurrent(mountedRef, loadRequestIdRef, refundRequestIdsRef, loadRequestId, overpaymentId, refundRequestId)) return;
      setRefunds((current) => ({ ...current, [overpaymentId]: { status: "error", retryable: true } }));
    });
  }, [getIdToken, refundRetry]);

  const refundRows = useMemo(
    () => (overpayments.status === "ready" ? overpayments.data : []),
    [overpayments],
  );

  const updateRefundDraft = (id: string, field: keyof RefundDraft, value: string) => {
    const fieldKey = `refund.${id}.${field}`;
    setValidationField((current) => (current === fieldKey ? null : current));
    setRefundDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? EMPTY_REFUND_DRAFT), [field]: value },
    }));
  };

  const clearValidation = (field: string) => {
    setValidationField((current) => (current === field ? null : current));
  };

  const reportValidation = (field: string, target: HTMLInputElement | null) => {
    setError(copy.validation);
    setValidationField(field);
    setSaved(false);
    target?.focus();
  };

  const submitOverpayment = async () => {
    if (!canRecord || mutationBusyRef.current) return;
    const draft = overpaymentDraft;
    const amount = normalizeDecimalInput(draft.amount);
    const amountNumber = Number(amount);
    if (
      !amount ||
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0 ||
      !draft.currency.trim() ||
      !draft.paymentId.trim()
    ) {
      reportValidation(
        !amount || !Number.isFinite(amountNumber) || amountNumber <= 0
          ? "overpayment.amount"
          : !draft.currency.trim()
            ? "overpayment.currency"
            : "overpayment.paymentId",
        !amount || !Number.isFinite(amountNumber) || amountNumber <= 0
          ? overpaymentAmountRef.current
          : !draft.currency.trim()
            ? overpaymentCurrencyRef.current
            : overpaymentPaymentRef.current,
      );
      return;
    }
    const body: RecordSettlementOverpaymentBody = {
      amount,
      currency: draft.currency.trim(),
      kind: overpaymentKind,
      payment_id: draft.paymentId.trim(),
      deal_id: entry.deal_id ?? undefined,
      counterparty_name: entry.counterparty_name ?? undefined,
    };
    mutationBusyRef.current = true;
    onBusyChange(true);
    setBusy("overpayment");
    setError(null);
    setValidationField(null);
    setSaved(false);
    try {
      await recordScheduleOverpayment(entry.id, body, getIdToken);
      setOverpaymentDraft((current) => ({ ...current, amount: "", paymentId: "" }));
      setSaved(true);
      onSaved();
      await load();
    } catch {
      setError(copy.error);
      setValidationField(null);
      setSaved(false);
    } finally {
      onBusyChange(false);
      mutationBusyRef.current = false;
      setBusy(null);
    }
  };

  const submitAdjustment = async () => {
    if (!canRecord || mutationBusyRef.current) return;
    const draft = adjustmentDraft;
    const amount = normalizeDecimalInput(draft.amount);
    const amountNumber = Number(amount);
    if (
      !amount ||
      !Number.isFinite(amountNumber) ||
      amountNumber === 0 ||
      !draft.currency.trim() ||
      !draft.reason.trim()
    ) {
      reportValidation(
        !amount || !Number.isFinite(amountNumber) || amountNumber === 0
          ? "adjustment.amount"
          : !draft.currency.trim()
            ? "adjustment.currency"
            : "adjustment.reason",
        !amount || !Number.isFinite(amountNumber) || amountNumber === 0
          ? adjustmentAmountRef.current
          : !draft.currency.trim()
            ? adjustmentCurrencyRef.current
            : adjustmentReasonRef.current,
      );
      return;
    }
    const body: RecordSettlementAdjustmentBody = {
      amount,
      currency: draft.currency.trim(),
      kind: draft.kind,
      reason: draft.reason.trim(),
      deal_id: entry.deal_id ?? undefined,
      document_no: draft.document.trim() || undefined,
      evidence: draft.evidence.trim() || undefined,
    };
    mutationBusyRef.current = true;
    onBusyChange(true);
    setBusy("adjustment");
    setError(null);
    setValidationField(null);
    setSaved(false);
    try {
      await recordScheduleAdjustment(entry.id, body, getIdToken);
      setAdjustmentDraft((current) => ({ ...current, amount: "", reason: "", evidence: "", document: "" }));
      setSaved(true);
      onSaved();
      await load();
    } catch {
      setError(copy.error);
      setValidationField(null);
      setSaved(false);
    } finally {
      onBusyChange(false);
      mutationBusyRef.current = false;
      setBusy(null);
    }
  };

  const submitRefund = async (overpayment: SettlementOverpayment) => {
    if (!canRecord || mutationBusyRef.current) return;
    const draft = refundDrafts[overpayment.id] ?? EMPTY_REFUND_DRAFT;
    const amount = normalizeDecimalInput(draft.amount);
    const amountNumber = Number(amount);
    if (
      !amount ||
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0 ||
      !draft.evidence.trim() ||
      !draft.reason.trim()
    ) {
      reportValidation(
        !amount || !Number.isFinite(amountNumber) || amountNumber <= 0
          ? `refund.${overpayment.id}.amount`
          : !draft.evidence.trim()
            ? `refund.${overpayment.id}.evidence`
            : `refund.${overpayment.id}.reason`,
        !amount || !Number.isFinite(amountNumber) || amountNumber <= 0
          ? refundAmountRefs.current[overpayment.id]
          : !draft.evidence.trim()
            ? refundEvidenceRefs.current[overpayment.id]
            : refundReasonRefs.current[overpayment.id],
      );
      return;
    }
    const body: RecordSettlementOverpaymentRefundBody = {
      amount,
      currency: overpayment.currency,
      evidence: draft.evidence.trim(),
      reason: draft.reason.trim(),
      document_no: draft.document.trim() || undefined,
    };
    mutationBusyRef.current = true;
    onBusyChange(true);
    setBusy(`refund:${overpayment.id}`);
    setError(null);
    setValidationField(null);
    setSaved(false);
    try {
      await recordOverpaymentRefund(overpayment.id, body, getIdToken);
      setRefundDrafts((current) => ({ ...current, [overpayment.id]: EMPTY_REFUND_DRAFT }));
      setSaved(true);
      onSaved();
      await load();
    } catch {
      setError(copy.error);
      setValidationField(null);
      setSaved(false);
    } finally {
      onBusyChange(false);
      mutationBusyRef.current = false;
      setBusy(null);
    }
  };

  const subtitleParts = copy.subtitle.match(/^([\s\S]*?[.!?。！？])\s*([\s\S]+)$/u);

  return (
    <div
      aria-busy={busy !== null}
      className="sticky left-0 w-[min(44rem,calc(100vw-6rem))] max-w-full md:w-[min(44rem,calc(100vw-22rem))]"
      data-ui="settlement-exceptions"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-header-16 font-semibold text-text-primary">{copy.title}</h4>
          <p className="mt-1 break-keep text-label-12 text-pretty text-text-muted">
            {subtitleParts ? (
              <>
                {subtitleParts[1]}{" "}
                {subtitleParts[2]}
              </>
            ) : copy.subtitle}
          </p>
        </div>
        <TextLink disabled={busy !== null} onClick={onClose} size="inherit">
          {copy.close}
        </TextLink>
      </div>
      {error ? (
        <p className="mb-3 text-pretty text-label-12 text-status-danger" id={exceptionErrorId} role="alert">{error}</p>
      ) : null}
      {busy ? (
        <p aria-live="polite" className="mb-3 text-pretty text-label-12 text-text-muted" role="status">
          {copy.saving}
        </p>
      ) : null}
      {saved && !busy ? (
        <p aria-live="polite" className="mb-3 text-pretty text-label-12 text-status-success" role="status">{copy.saved}</p>
      ) : null}
      {!canRecord ? (
        <p className="mb-3 text-pretty text-label-12 text-text-muted">{copy.restricted}</p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby={`settlement-overpayments-${entry.id}`} className="rounded-md border border-border-muted bg-surface-card p-3">
          <h5 className="text-body-14 font-semibold text-text-primary" id={`settlement-overpayments-${entry.id}`}>
            {copy.overpayments.title}
          </h5>
          {overpayments.status === "loading" ? <p className="mt-2 text-label-12 text-text-muted">{copy.loading}</p> : null}
          {loadableError(overpayments, copy.error, copy.retry, retryLoad)}
          {overpayments.status === "empty" ? <p className="mt-2 text-label-12 text-text-muted">{copy.overpayments.empty}</p> : null}
          {overpayments.status === "ready" ? (
            <ul className="mt-2 space-y-3">
              {refundRows.map((overpayment) => {
                const refundState = refunds[overpayment.id] ?? { status: "loading" as const };
                const refundDraft = refundDrafts[overpayment.id] ?? EMPTY_REFUND_DRAFT;
                return (
                  <li className="border-t border-border-subtle pt-2 text-label-12 first:border-t-0 first:pt-0" key={overpayment.id}>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-text-primary">
                      <span className="font-medium">{kindLabel(overpayment.kind, entry.type, copy.overpayments)}</span>
                      <span>{formatMoney(overpayment.amount, overpayment.currency)}</span>
                    </div>
                    <p className="mt-1 break-all text-text-muted">
                      {copy.overpayments.paymentId}: <span className="font-mono">{overpayment.payment_id}</span>
                    </p>
                    <div className="mt-1 grid gap-x-3 gap-y-1 text-text-muted sm:grid-cols-3">
                      <span>{copy.overpayments.remaining}: {formatMoney(overpayment.remaining, overpayment.currency)}</span>
                      <span>{copy.overpayments.allocated}: {formatMoney(overpayment.allocated_amount, overpayment.currency)}</span>
                      <span>{copy.overpayments.refunded}: {formatMoney(overpayment.refunded_total, overpayment.currency)}</span>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-text-secondary">{copy.overpayments.refundTitle}</span>
                      {refundState.status === "loading" ? <p className="mt-1 text-text-muted">{copy.loading}</p> : null}
                      {loadableError(refundState, copy.error, copy.retry, () => retryRefund(overpayment.id))}
                      {refundState.status === "empty" ? <p className="mt-1 text-text-muted">{copy.overpayments.refundEmpty}</p> : null}
                      {refundState.status === "ready" ? (
                        <ul className="mt-1 space-y-1 text-text-muted">
                          {refundState.data.map((refund) => (
                            <li className="break-words" key={refund.id}>
                              <span>{formatMoney(refund.amount, refund.currency)} · {refund.reason}</span>
                              <span className="block break-all">{copy.overpayments.refundEvidence}: {refund.evidence}</span>
                              {refund.document_no ? (
                                <span className="block break-all">{copy.overpayments.refundDocument}: {refund.document_no}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {canRecord ? (
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                          <p className="w-full text-pretty text-text-muted" id={`settlement-refund-hint-${overpayment.id}`}>
                            {entry.type === "payable" ? copy.overpayments.returnHint : copy.overpayments.refundHint}
                          </p>
                          <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                            {copy.overpayments.refundAmount}
                            <TextInput
                              className="w-24"
                              inputMode="decimal"
                              showClearIcon={false}
                              size="sm"
                              value={refundDraft.amount}
                              ref={(element) => {
                                refundAmountRefs.current[overpayment.id] = element;
                              }}
                              aria-describedby={validationField === `refund.${overpayment.id}.amount` ? exceptionErrorId : undefined}
                              aria-invalid={validationField === `refund.${overpayment.id}.amount` || undefined}
                              onChange={(event) => updateRefundDraft(overpayment.id, "amount", event.target.value)}
                            />
                          </label>
                          <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                            {copy.overpayments.refundEvidence}
                            <TextInput
                              className="w-32"
                              showClearIcon={false}
                              size="sm"
                              value={refundDraft.evidence}
                              ref={(element) => {
                                refundEvidenceRefs.current[overpayment.id] = element;
                              }}
                              aria-describedby={validationField === `refund.${overpayment.id}.evidence` ? exceptionErrorId : undefined}
                              aria-invalid={validationField === `refund.${overpayment.id}.evidence` || undefined}
                              onChange={(event) => updateRefundDraft(overpayment.id, "evidence", event.target.value)}
                            />
                          </label>
                          <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                            {copy.overpayments.refundReason}
                            <TextInput
                              className="w-40"
                              showClearIcon={false}
                              size="sm"
                              value={refundDraft.reason}
                              ref={(element) => {
                                refundReasonRefs.current[overpayment.id] = element;
                              }}
                              aria-describedby={validationField === `refund.${overpayment.id}.reason` ? exceptionErrorId : undefined}
                              aria-invalid={validationField === `refund.${overpayment.id}.reason` || undefined}
                              onChange={(event) => updateRefundDraft(overpayment.id, "reason", event.target.value)}
                            />
                          </label>
                          <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                            {copy.overpayments.refundDocument}
                            <TextInput
                              className="w-32"
                              showClearIcon={false}
                              size="sm"
                              value={refundDraft.document}
                              onChange={(event) => updateRefundDraft(overpayment.id, "document", event.target.value)}
                            />
                          </label>
                          <Button
                            aria-label={busy === `refund:${overpayment.id}` ? copy.saving : undefined}
                            disabled={busy !== null}
                            loading={busy === `refund:${overpayment.id}`}
                            onClick={() => void submitRefund(overpayment)}
                            aria-describedby={`settlement-refund-hint-${overpayment.id}`}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            {entry.type === "payable" ? copy.overpayments.return : copy.overpayments.refund}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-3 border-t border-border-subtle pt-3">
            <p className="mb-2 text-label-12 font-medium text-text-secondary">{copy.overpayments.paymentHistory}</p>
            {paymentHistory.status === "loading" ? <p className="text-label-12 text-text-muted">{copy.loading}</p> : null}
            {loadableError(paymentHistory, copy.error, copy.retry, retryLoad)}
            {paymentHistory.status === "empty" ? <p className="text-label-12 text-text-muted">{copy.overpayments.paymentHistoryEmpty}</p> : null}
            {paymentHistory.status === "ready" ? (
              <ul className="space-y-1 text-label-12 text-text-muted">
                {paymentHistory.data.map((payment) => (
                  <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1" key={payment.id}>
                    {canRecord && allowLegacyOverpaymentRecord ? (
                      <TextLink
                        className="font-mono"
                        onClick={() => setOverpaymentDraft((current) => ({ ...current, paymentId: payment.id }))}
                        size="inherit"
                        tone="secondary"
                      >
                        {payment.id}
                      </TextLink>
                    ) : (
                      <span className="font-mono">{payment.id}</span>
                    )}
                    <span>{formatMoney(payment.amount, payment.currency)}</span>
                    <span>{payment.value_date}</span>
                    {payment.fee_amount !== "0" ? <span>{payment.fee_amount}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {canRecord && allowLegacyOverpaymentRecord ? (
            <div className="mt-3 border-t border-border-subtle pt-3">
              <p className="mb-2 text-label-12 font-medium text-text-secondary">{copy.overpayments.recordTitle}</p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.overpayments.amount}
                  <TextInput
                    className="w-24"
                    inputMode="decimal"
                    showClearIcon={false}
                    size="sm"
                    value={overpaymentDraft.amount}
                    ref={overpaymentAmountRef}
                    aria-describedby={validationField === "overpayment.amount" ? exceptionErrorId : undefined}
                    aria-invalid={validationField === "overpayment.amount" || undefined}
                    onChange={(event) => {
                      clearValidation("overpayment.amount");
                      setOverpaymentDraft((current) => ({ ...current, amount: event.target.value }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.overpayments.currency}
                  <TextInput
                    className="w-20 uppercase"
                    showClearIcon={false}
                    size="sm"
                    value={overpaymentDraft.currency}
                    ref={overpaymentCurrencyRef}
                    aria-describedby={validationField === "overpayment.currency" ? exceptionErrorId : undefined}
                    aria-invalid={validationField === "overpayment.currency" || undefined}
                    onChange={(event) => {
                      clearValidation("overpayment.currency");
                      setOverpaymentDraft((current) => ({ ...current, currency: event.target.value }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.overpayments.kind}
                  <Select
                    aria-label={copy.overpayments.kind}
                    className="w-44"
                    options={entry.type === "payable"
                      ? [{ label: copy.overpayments.advancePayable, value: "advance" }]
                      : [{ label: copy.overpayments.overpay, value: "overpay" }]}
                    size="sm"
                    value={overpaymentDraft.kind}
                    onValueChange={(value) => setOverpaymentDraft((current) => ({ ...current, kind: value as SettlementOverpaymentKind }))}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.overpayments.paymentId}
                  <TextInput
                    className="w-56 font-mono"
                    showClearIcon={false}
                    size="sm"
                    value={overpaymentDraft.paymentId}
                    ref={overpaymentPaymentRef}
                    aria-describedby={validationField === "overpayment.paymentId" ? exceptionErrorId : undefined}
                    aria-invalid={validationField === "overpayment.paymentId" || undefined}
                    onChange={(event) => {
                      clearValidation("overpayment.paymentId");
                      setOverpaymentDraft((current) => ({ ...current, paymentId: event.target.value }));
                    }}
                  />
                </label>
                <Button
                  aria-label={busy === "overpayment" ? copy.saving : undefined}
                  disabled={busy !== null}
                  loading={busy === "overpayment"}
                  onClick={() => void submitOverpayment()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {copy.overpayments.record}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section aria-labelledby={`settlement-adjustments-${entry.id}`} className="rounded-md border border-border-muted bg-surface-card p-3">
          <h5 className="text-body-14 font-semibold text-text-primary" id={`settlement-adjustments-${entry.id}`}>
            {copy.adjustments.title}
          </h5>
          {adjustmentSummary ? (
            <div className="mt-2 grid gap-1 text-label-12 text-text-muted sm:grid-cols-3">
              <span>{copy.adjustments.original}: {formatMoney(adjustmentSummary.original, entry.currency)}</span>
              <span>{copy.adjustments.current}: {formatMoney(adjustmentSummary.current, entry.currency)}</span>
              <span>{copy.adjustments.total}: {formatMoney(adjustmentSummary.total, entry.currency)}</span>
              {adjustmentSummary.writtenOff !== null ? (
                <span>{copy.adjustments.writtenOff}: {formatMoney(adjustmentSummary.writtenOff, entry.currency)}</span>
              ) : null}
            </div>
          ) : null}
          {adjustments.status === "loading" ? <p className="mt-2 text-label-12 text-text-muted">{copy.loading}</p> : null}
          {loadableError(adjustments, copy.error, copy.retry, retryLoad)}
          {adjustments.status === "empty" ? <p className="mt-2 text-label-12 text-text-muted">{copy.adjustments.empty}</p> : null}
          {adjustments.status === "ready" ? (
            <ul className="mt-2 space-y-1 text-label-12 text-text-muted">
              {adjustments.data.map((adjustment) => (
                <li className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-border-subtle pt-1 first:border-t-0 first:pt-0" key={adjustment.id}>
                  <span className="min-w-0 break-words">
                    <span>{adjustmentKindLabel(adjustment.kind, copy.adjustments)} · {adjustment.reason}</span>
                    {adjustment.evidence ? (
                      <span className="block break-all">{copy.adjustments.evidence}: {adjustment.evidence}</span>
                    ) : null}
                    {adjustment.document_no ? (
                      <span className="block break-all">{copy.adjustments.document}: {adjustment.document_no}</span>
                    ) : null}
                  </span>
                  <span className="font-medium text-text-primary">{formatMoney(adjustment.amount, adjustment.currency)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {canRecord ? (
            <div className="mt-3 border-t border-border-subtle pt-3">
              <p className="mb-2 text-label-12 font-medium text-text-secondary">{copy.adjustments.recordTitle}</p>
              <p className="mb-2 text-pretty text-label-12 text-text-muted" id={`settlement-adjustment-hint-${entry.id}`}>
                {copy.adjustments.recordHint}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.adjustments.amount}
                  <TextInput
                    className="w-24"
                    inputMode="decimal"
                    showClearIcon={false}
                    size="sm"
                    value={adjustmentDraft.amount}
                    ref={adjustmentAmountRef}
                    aria-describedby={validationField === "adjustment.amount" ? exceptionErrorId : undefined}
                    aria-invalid={validationField === "adjustment.amount" || undefined}
                    onChange={(event) => {
                      clearValidation("adjustment.amount");
                      setAdjustmentDraft((current) => ({ ...current, amount: event.target.value }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.adjustments.currency}
                  <TextInput
                    className="w-20 uppercase"
                    showClearIcon={false}
                    size="sm"
                    value={adjustmentDraft.currency}
                    ref={adjustmentCurrencyRef}
                    aria-describedby={validationField === "adjustment.currency" ? exceptionErrorId : undefined}
                    aria-invalid={validationField === "adjustment.currency" || undefined}
                    onChange={(event) => {
                      clearValidation("adjustment.currency");
                      setAdjustmentDraft((current) => ({ ...current, currency: event.target.value }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.adjustments.kind}
                  <Select
                    aria-label={copy.adjustments.kind}
                    aria-describedby={`settlement-adjustment-hint-${entry.id}`}
                    className="w-44"
                    options={[
                      { label: copy.adjustments.credit, value: "credit" },
                      { label: copy.adjustments.adjustment, value: "adjustment" },
                      { label: copy.adjustments.refund, value: "refund" },
                      { label: copy.adjustments.return, value: "return" },
                    ]}
                    size="sm"
                    value={adjustmentDraft.kind}
                    onValueChange={(value) => setAdjustmentDraft((current) => ({ ...current, kind: value as SettlementAdjustmentKind }))}
                  />
                </label>
                <label className="flex min-w-44 flex-1 flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.adjustments.reason}
                  <TextInput
                    className="w-full"
                    showClearIcon={false}
                    size="sm"
                    value={adjustmentDraft.reason}
                    ref={adjustmentReasonRef}
                    aria-describedby={validationField === "adjustment.reason" ? exceptionErrorId : undefined}
                    aria-invalid={validationField === "adjustment.reason" || undefined}
                    onChange={(event) => {
                      clearValidation("adjustment.reason");
                      setAdjustmentDraft((current) => ({ ...current, reason: event.target.value }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.adjustments.evidence}
                  <TextInput
                    className="w-32"
                    showClearIcon={false}
                    size="sm"
                    value={adjustmentDraft.evidence}
                    onChange={(event) => setAdjustmentDraft((current) => ({ ...current, evidence: event.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                  {copy.adjustments.document}
                  <TextInput
                    className="w-32"
                    showClearIcon={false}
                    size="sm"
                    value={adjustmentDraft.document}
                    onChange={(event) => setAdjustmentDraft((current) => ({ ...current, document: event.target.value }))}
                  />
                </label>
                <Button
                  aria-label={busy === "adjustment" ? copy.saving : undefined}
                  disabled={busy !== null}
                  loading={busy === "adjustment"}
                  onClick={() => void submitAdjustment()}
                  aria-describedby={`settlement-adjustment-hint-${entry.id}`}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {copy.adjustments.record}
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

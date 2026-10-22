"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { ApiError } from "@trade-os/operations/lib/api/client";
import {
  getScheduleCashApplications,
  recordScheduleCashApplication,
  replacePaymentApplication,
  reversePaymentApplication,
  type RecordScheduleCashResponse,
  type ScheduleCashEvent,
  type ScheduleCashLedger,
} from "@trade-os/operations/lib/api/scheduleCash";
import {
  listSchedulePayments,
  type ScheduleSettlement,
} from "@trade-os/operations/lib/api/settlement";
import { isUuidLike } from "@trade-os/operations/lib/api/erpExtraction";
import { financeDecimalMagnitude, isFinanceDecimal } from "@trade-os/operations/lib/financeDecimal";
import type { Loadable } from "@trade-os/operations/lib/loadable";
import { normalizeDecimalInput } from "@trade-os/operations/lib/money";

import {
  moneyCommandSlot,
  releaseMoneyCommandKey,
  resolveMoneyCommandKey,
} from "./moneyCommandKeys";

export type CanonicalScheduleCashCopy = {
  title: string;
  scope: string;
  actual: string;
  applied: string;
  scheduled: string;
  outstanding: string;
  unapplied: string;
  date: string;
  fee: string;
  memo: string;
  sourceDocument: string;
  save: string;
  cancel: string;
  loading: string;
  retry: string;
  loadError: string;
  invalid: string;
  saved: string;
  replayed: string;
  failed: string;
  writerDisabled: string;
  history: string;
  historyEmpty: string;
  current: string;
  superseded: string;
  cashFact: string;
  applicationLineage: string;
  reverse: string;
  replace: string;
  correctionReason: string;
  replacementAmount: string;
  cashFactUnchanged: string;
  correctionSaved: string;
  staleRevision: string;
  truncated: string;
  reconciliationTitle: string;
  reconciliationBody: string;
  reconciliationCounts: string;
  reconciliationRefresh: string;
  legacyHistory: string;
  legacyHistoryEmpty: string;
  legacyHistoryLoadError: string;
  eventTypes: Record<"application" | "replacement" | "reversal", string>;
};

type Props = {
  scheduleId: string;
  currency: string;
  outstanding: string;
  initialDate: string;
  copy: CanonicalScheduleCashCopy;
  getIdToken: () => Promise<string>;
  canRecord: boolean;
  canFinalize: boolean;
  disabled?: boolean;
  formatMoney: (value: string, currency?: string) => string;
  formatValueDate: (value: string) => string;
  mapCommandError?: (
    error: unknown,
    capability: "erp.money.record" | "erp.money",
  ) => string | null;
  onBusyChange: (busy: boolean) => void;
  onRecorded: (result: RecordScheduleCashResponse) => void;
  onChanged: (message: string) => void;
  onClose: () => void;
};

type CorrectionDraft = {
  event: ScheduleCashEvent;
  kind: "reversal" | "replacement";
  reason: string;
  replacementAmount: string;
};

const ZERO = BigInt(0);
const inputClass =
  "h-9 rounded-md border border-border bg-[var(--color-gray-12)] px-2 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-2)]";

function isPositiveMoney(value: string) {
  return isFinanceDecimal(value) && financeDecimalMagnitude(value) > ZERO;
}

function commandError(error: unknown, copy: CanonicalScheduleCashCopy) {
  if (!(error instanceof ApiError)) return copy.failed;
  switch (error.code) {
    case "ERP_SETTLEMENT_RECONCILIATION_REQUIRED":
      return copy.reconciliationBody;
    case "ERP_SETTLEMENT_STALE_REVISION":
    case "ERP_SETTLEMENT_PAYMENT_NOT_FOUND":
      return copy.staleRevision;
    default:
      return copy.failed;
  }
}

export function CanonicalScheduleCashPanel({
  scheduleId,
  currency,
  outstanding,
  initialDate,
  copy,
  getIdToken,
  canRecord,
  canFinalize,
  disabled = false,
  formatMoney,
  formatValueDate,
  mapCommandError,
  onBusyChange,
  onRecorded,
  onChanged,
  onClose,
}: Props) {
  const [ledger, setLedger] = useState<Loadable<ScheduleCashLedger>>({
    status: "loading",
  });
  const [legacyHistory, setLegacyHistory] = useState<Loadable<ScheduleSettlement>>({
    status: "loading",
  });
  const [actualAmount, setActualAmount] = useState(outstanding);
  const [applicationAmount, setApplicationAmount] = useState(outstanding);
  const [valueDate, setValueDate] = useState(initialDate);
  const [fee, setFee] = useState("");
  const [memo, setMemo] = useState("");
  const [sourceDocumentId, setSourceDocumentId] = useState("");
  const [correction, setCorrection] = useState<CorrectionDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLedger({ status: "loading" });
    setError(null);
    try {
      const result = await getScheduleCashApplications(scheduleId, getIdToken);
      if (requestIdRef.current !== requestId || result.schedule_id !== scheduleId) return;
      setLedger({ status: "ready", data: result });
      if (!result.reconciliation_required) {
        setLegacyHistory({ status: "loading" });
        return;
      }
      setLegacyHistory({ status: "loading" });
      try {
        const legacy = await listSchedulePayments(scheduleId, getIdToken);
        if (requestIdRef.current !== requestId || legacy.schedule_id !== scheduleId) return;
        setLegacyHistory({ status: "ready", data: legacy });
      } catch {
        if (requestIdRef.current === requestId) {
          setLegacyHistory({ status: "error", retryable: true });
        }
      }
    } catch {
      if (requestIdRef.current === requestId) {
        setLedger({ status: "error", retryable: true });
      }
    }
  }, [getIdToken, scheduleId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [load]);

  const readyLedger = ledger.status === "ready" ? ledger.data : null;
  const reconciliationRequired = Boolean(readyLedger?.reconciliation_required);
  const writerLocked =
    disabled ||
    busy ||
    !readyLedger?.writer_enabled ||
    reconciliationRequired;

  async function recordCash() {
    if (!canRecord || busyRef.current || writerLocked) return;
    const amount = normalizeDecimalInput(actualAmount);
    const applied = normalizeDecimalInput(applicationAmount);
    const normalizedFee = normalizeDecimalInput(fee) || "0";
    const source = sourceDocumentId.trim();
    if (
      !isPositiveMoney(amount) ||
      !isPositiveMoney(applied) ||
      financeDecimalMagnitude(applied) > financeDecimalMagnitude(amount) ||
      (readyLedger &&
        financeDecimalMagnitude(applied) >
          financeDecimalMagnitude(readyLedger.outstanding)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valueDate) ||
      !isFinanceDecimal(normalizedFee) ||
      financeDecimalMagnitude(normalizedFee) < ZERO ||
      !/^[A-Z]{3}$/.test(currency) ||
      (source !== "" && !isUuidLike(source))
    ) {
      setError(copy.invalid);
      return;
    }
    const body = {
      amount,
      application_amount: applied,
      currency,
      fee: normalizedFee,
      value_date: valueDate,
      note: memo.trim() || undefined,
      source_document_id: source || undefined,
    };
    const fingerprint = JSON.stringify([scheduleId, body]);
    const slot = moneyCommandSlot(scheduleId, "record");
    const idempotencyKey = resolveMoneyCommandKey(slot, fingerprint);
    busyRef.current = true;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    setNotice(null);
    try {
      const result = await recordScheduleCashApplication(
        scheduleId,
        body,
        idempotencyKey,
        getIdToken,
      );
      releaseMoneyCommandKey(slot, fingerprint);
      setNotice(
        result.cash_receipt.idempotency_replayed ||
          result.application.idempotency_replayed
          ? copy.replayed
          : copy.saved,
      );
      onRecorded(result);
    } catch (nextError) {
      setError(
        mapCommandError?.(nextError, "erp.money.record") ??
          commandError(nextError, copy),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  function openCorrection(event: ScheduleCashEvent, kind: CorrectionDraft["kind"]) {
    setCorrection({
      event,
      kind,
      reason: "",
      replacementAmount: event.amount,
    });
    setError(null);
    setNotice(null);
  }

  async function submitCorrection() {
    if (
      !correction ||
      !canFinalize ||
      busyRef.current ||
      writerLocked
    ) return;
    const reason = correction.reason.trim();
    const replacementAmount = normalizeDecimalInput(correction.replacementAmount);
    if (
      reason === "" ||
      [...reason].length > 500 ||
      (correction.kind === "replacement" && !isPositiveMoney(replacementAmount))
    ) {
      setError(copy.invalid);
      return;
    }
    const body =
      correction.kind === "replacement"
        ? {
            expected_revision: correction.event.revision,
            reason,
            replacement_amount: replacementAmount,
          }
        : { expected_revision: correction.event.revision, reason };
    const fingerprint = JSON.stringify([
      correction.event.id,
      correction.kind,
      body,
    ]);
    // Addressed by the event under correction, not the schedule: the
    // fingerprint above already names the event, so a sibling correction on the
    // same schedule must not evict this one's pending key.
    const slot = moneyCommandSlot(correction.event.id, "correction");
    const idempotencyKey = resolveMoneyCommandKey(slot, fingerprint);
    busyRef.current = true;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    setNotice(null);
    try {
      const result =
        correction.kind === "replacement"
          ? await replacePaymentApplication(
              correction.event.id,
              {
                expected_revision: correction.event.revision,
                reason,
                replacement_amount: replacementAmount,
              },
              idempotencyKey,
              getIdToken,
            )
          : await reversePaymentApplication(
              correction.event.id,
              { expected_revision: correction.event.revision, reason },
              idempotencyKey,
              getIdToken,
            );
      releaseMoneyCommandKey(slot, fingerprint);
      setCorrection(null);
      const message = result.idempotency_replayed
        ? copy.replayed
        : copy.correctionSaved;
      setNotice(message);
      onChanged(message);
      await load();
    } catch (nextError) {
      setError(
        mapCommandError?.(nextError, "erp.money") ??
          commandError(nextError, copy),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <section
      aria-label={copy.title}
      className="space-y-3"
      data-ui="canonical-schedule-cash"
    >
      <div>
        <h3 className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-medium text-[var(--color-gray-2)]">{copy.title}</h3>
        <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">{copy.scope}</p>
      </div>

      {ledger.status === "loading" ? <p role="status">{copy.loading}</p> : null}
      {ledger.status === "error" ? (
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <span>{copy.loadError}</span>
          <Button variant="outline" size="xs" onClick={() => void load()} type="button">
            {copy.retry}
          </Button>
        </div>
      ) : null}

      {readyLedger && !readyLedger.writer_enabled ? (
        <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-yellow-1)]" role="status">
          {copy.writerDisabled}
        </p>
      ) : null}

      {readyLedger?.reconciliation_required ? (
        <div className="rounded-md border border-[var(--color-yellow-1)] bg-[var(--color-gray-11)] p-3">
          <h4 className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-medium text-[var(--color-gray-2)]">
            {copy.reconciliationTitle}
          </h4>
          <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
            {copy.reconciliationBody}
          </p>
          <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
            {copy.reconciliationCounts
              .replace(
                "{payments}",
                String(readyLedger.reconciliation.legacy_payment_count),
              )
              .replace(
                "{amount}",
                formatMoney(
                  readyLedger.reconciliation.legacy_payment_amount,
                  currency,
                ),
              )
              .replace(
                "{applications}",
                String(readyLedger.reconciliation.pre_lineage_application_count),
              )}
          </p>
          <Button variant="outline" size="xs"
            className="mt-2"
            onClick={() => void load()}
            type="button"
          >
            {copy.reconciliationRefresh}
          </Button>
        </div>
      ) : null}

      {readyLedger?.reconciliation_required ? (
        <div>
          <h4 className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--color-gray-4)]">
            {copy.legacyHistory}
          </h4>
          {legacyHistory.status === "loading" ? (
            <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{copy.loading}</p>
          ) : null}
          {legacyHistory.status === "error" ? (
            <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-red-1)]" role="alert">
              {copy.legacyHistoryLoadError}
            </p>
          ) : null}
          {legacyHistory.status === "ready" &&
          legacyHistory.data.payments.length === 0 ? (
            <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{copy.legacyHistoryEmpty}</p>
          ) : null}
          {legacyHistory.status === "ready" &&
          legacyHistory.data.payments.length > 0 ? (
            <ul className="mt-2 space-y-1" data-ui="legacy-cash-history-read-only">
              {legacyHistory.data.payments.map((payment) => (
                <li className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]" key={payment.id}>
                  {formatValueDate(payment.value_date)} · {formatMoney(payment.amount, currency)}
                  {payment.note ? ` · ${payment.note}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {readyLedger && !readyLedger.reconciliation_required ? (
        <>
          <dl
            className="grid grid-cols-2 gap-2 rounded-md bg-[var(--color-gray-11)] p-3 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] sm:grid-cols-4"
            data-ui="canonical-schedule-position"
          >
            <div>
              <dt className="text-[var(--color-gray-5)]">{copy.scheduled}</dt>
              <dd className="font-medium text-[var(--color-gray-2)]">
                {formatMoney(readyLedger.amount, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-gray-5)]">{copy.applied}</dt>
              <dd className="font-medium text-[var(--color-gray-2)]">
                {formatMoney(readyLedger.paid, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-gray-5)]">{copy.outstanding}</dt>
              <dd className="font-medium text-[var(--color-gray-2)]">
                {formatMoney(readyLedger.outstanding, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-gray-5)]">{copy.history}</dt>
              <dd className="font-medium text-[var(--color-gray-2)]">
                {readyLedger.events.length}
              </dd>
            </div>
          </dl>

          {correction ? (
            <fieldset
              className="space-y-2 rounded-md border border-border p-3"
              disabled={writerLocked || !canFinalize}
            >
              <legend className="px-1 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-medium text-[var(--color-gray-2)]">
                {correction.kind === "reversal" ? copy.reverse : copy.replace}
              </legend>
              <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.cashFactUnchanged}
              </p>
              <label className="block text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.correctionReason}
                <input
                  className={`${inputClass} mt-1 w-full`}
                  maxLength={500}
                  value={correction.reason}
                  onChange={(event) =>
                    setCorrection((current) =>
                      current ? { ...current, reason: event.target.value } : current,
                    )
                  }
                />
              </label>
              {correction.kind === "replacement" ? (
                <label className="block text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                  {copy.replacementAmount}
                  <input
                    className={`${inputClass} mt-1 w-40`}
                    inputMode="decimal"
                    value={correction.replacementAmount}
                    onChange={(event) =>
                      setCorrection((current) =>
                        current
                          ? { ...current, replacementAmount: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button size="xs"
                  disabled={busy}
                  onClick={() => void submitCorrection()}
                  type="button"
                >
                  {correction.kind === "reversal" ? copy.reverse : copy.replace}
                </Button>
                <Button variant="outline" size="xs"
                  disabled={busy}
                  onClick={() => {
                    setCorrection(null);
                    setError(null);
                  }}
                  type="button"
                >
                  {copy.cancel}
                </Button>
              </div>
            </fieldset>
          ) : canRecord ? (
            <fieldset
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              disabled={writerLocked}
            >
              <legend className="sr-only">{copy.save}</legend>
              <label className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.actual}
                <input
                  // The panel is mounted only after the operator explicitly opens
                  // the record action, so focusing its first field preserves the
                  // existing keyboard flow without stealing focus on page load.
                  // a11y-exception(justified, SC-2.4.3): focus follows the user's explicit record-cash action into the opened form.
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className={`${inputClass} mt-1 w-full`}
                  inputMode="decimal"
                  value={actualAmount}
                  onChange={(event) => setActualAmount(event.target.value)}
                />
              </label>
              <label className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.applied}
                <input
                  className={`${inputClass} mt-1 w-full`}
                  inputMode="decimal"
                  value={applicationAmount}
                  onChange={(event) => setApplicationAmount(event.target.value)}
                />
              </label>
              <label className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.date}
                <DatePicker
                  ariaLabel={copy.date}
                  className="mt-1 w-full"
                  value={valueDate}
                  onValueChange={setValueDate}
                />
              </label>
              <label className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.fee}
                <input
                  className={`${inputClass} mt-1 w-full`}
                  inputMode="decimal"
                  value={fee}
                  onChange={(event) => setFee(event.target.value)}
                />
              </label>
              <label className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.memo}
                <input
                  className={`${inputClass} mt-1 w-full`}
                  maxLength={2000}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                />
              </label>
              <label className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">
                {copy.sourceDocument}
                <input
                  className={`${inputClass} mt-1 w-full`}
                  value={sourceDocumentId}
                  onChange={(event) => setSourceDocumentId(event.target.value)}
                />
              </label>
              <Button size="xs"
                disabled={busy}
                onClick={() => void recordCash()}
                type="button"
              >
                {copy.save}
              </Button>
            </fieldset>
          ) : null}

          <div>
            <h4 className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--color-gray-4)]">
              {copy.history}
            </h4>
            {readyLedger.events.length === 0 ? (
              <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{copy.historyEmpty}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {readyLedger.events.map((event) => (
                  <li
                    className="rounded-md border border-border p-3 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]"
                    data-current={event.current ? "true" : "false"}
                    key={event.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[var(--color-gray-2)]">
                          {copy.eventTypes[event.event_type]} · {formatMoney(event.amount, event.currency)}
                        </p>
                        <p className="text-[var(--color-gray-4)]">
                          {formatValueDate(event.value_date)} · {event.current ? copy.current : copy.superseded} · r{event.revision}
                        </p>
                      </div>
                      {event.current && canFinalize ? (
                        <div className="flex gap-2">
                          <Button variant="link" type="button" className="h-auto p-0 font-normal text-[length:inherit] leading-[inherit] text-[var(--color-gray-4)] hover:text-[var(--color-gray-2)]"
                            disabled={writerLocked || correction !== null}
                            onClick={() => openCorrection(event, "replacement")}
                          >
                            {copy.replace}
                          </Button>
                          <Button variant="link" type="button" className="h-auto p-0 font-normal text-[length:inherit] leading-[inherit] text-[var(--color-gray-4)] hover:text-[var(--color-gray-2)]"
                            disabled={writerLocked || correction !== null}
                            onClick={() => openCorrection(event, "reversal")}
                          >
                            {copy.reverse}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[var(--color-gray-4)]">
                        {copy.cashFact}: {formatMoney(event.cash_amount, event.currency)} · {copy.unapplied}: {formatMoney(event.cash_unapplied, event.currency)}
                      </summary>
                      <dl className="mt-2 space-y-1 break-all text-[var(--color-gray-5)]">
                        <div><dt className="inline">{copy.fee}: </dt><dd className="inline">{formatMoney(event.cash_fee, event.currency)}</dd></div>
                        <div><dt className="inline">{copy.cashFact}: </dt><dd className="inline font-mono">{event.cash_receipt_id}</dd></div>
                        <div><dt className="inline">{copy.applicationLineage}: </dt><dd className="inline font-mono">{event.root_application_id}</dd></div>
                        {event.note ? <div><dt className="inline">{copy.memo}: </dt><dd className="inline">{event.note}</dd></div> : null}
                        {event.source_document_id ? <div><dt className="inline">{copy.sourceDocument}: </dt><dd className="inline font-mono">{event.source_document_id}</dd></div> : null}
                        {event.reason ? <div><dt className="inline">{copy.correctionReason}: </dt><dd className="inline">{event.reason}</dd></div> : null}
                      </dl>
                    </details>
                  </li>
                ))}
              </ul>
            )}
            {readyLedger.truncated ? (
              <p className="mt-2 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-yellow-1)]" role="status">
                {copy.truncated}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {notice ? <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-green-1)]" role="status">{notice}</p> : null}
      {error ? <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-red-1)]" role="alert">{error}</p> : null}
      <Button variant="outline" size="xs"
        disabled={busy}
        onClick={onClose}
        type="button"
      >
        {copy.cancel}
      </Button>
    </section>
  );
}

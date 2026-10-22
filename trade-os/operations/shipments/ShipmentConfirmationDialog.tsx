"use client";

import { useRef, useState, useEffect } from "react";


import type { HTMLAttributes, LabelHTMLAttributes } from "react";
import { ShipmentConfirmationRecord } from "./ShipmentConfirmationRecord";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateInput } from "@/components/platform/DateInput";
import { ApiError } from "../lib/api/client";
import { effectiveShipmentEta, effectiveShipmentEtd, type Shipment, type ShipmentConfirmation, type ShipmentStatus } from "../lib/api/shipments";

import type { AppMessages } from '../i18n/messages';
type ShipmentsCopy = AppMessages['erpShipments']['shipments'];
function Field(props: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`space-y-2 ${props.className || ''}`} />; }
function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) { return <label {...props} />; }
function FieldDescription(props: HTMLAttributes<HTMLParagraphElement>) { return <p {...props} className={`text-sm text-muted-foreground ${props.className || ''}`} />; }
function Alert({variant, ...props}: HTMLAttributes<HTMLDivElement> & {variant?: string}) { return <div {...props} role={props.role || 'alert'} className={variant === 'destructive' ? 'text-destructive' : ''} />; }
function AlertDescription(props: HTMLAttributes<HTMLDivElement>) { return <div {...props} />; }
function AlertTitle(props: HTMLAttributes<HTMLHeadingElement>) { return <h3 {...props} />; }

type ConfirmationField = "confirmed_eta" | "confirmed_etd" | "confirmed_status";
type Edits = Partial<Pick<ShipmentConfirmation, ConfirmationField>>;
const fields: ConfirmationField[] = ["confirmed_etd", "confirmed_eta", "confirmed_status"];
const statuses: ShipmentStatus[] = ["unknown", "booked", "loaded", "departed", "arrived", "delivered"];

function values(ship: Shipment): Record<ConfirmationField, string> {
  return {
    confirmed_eta: effectiveShipmentEta(ship)?.slice(0, 10) ?? "",
    confirmed_etd: effectiveShipmentEtd(ship)?.slice(0, 10) ?? "",
    confirmed_status: ship.status,
  };
}

export function ShipmentConfirmationDialog({ shipment, copy, canWrite, onSave, onReload, onClose, returnFocus }: {
  shipment: Shipment;
  copy: ShipmentsCopy;
  canWrite: boolean;
  onSave: (body: ShipmentConfirmation) => Promise<void>;
  onReload: () => Promise<Shipment>;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const c = copy.confirmation;
  const [baseline, setBaseline] = useState(shipment);
  const [draft, setDraft] = useState(() => values(shipment));
  const [edits, setEdits] = useState<Edits>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [latest, setLatest] = useState<Shipment | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const live = useRef(true);
  const saving = useRef(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const initial = values(baseline);
  const invalidDate = fields.some((field) => field !== "confirmed_status" && edits[field] !== undefined && edits[field] !== null && !draft[field]);
  const writable = canWrite && Boolean(baseline.edit_token);

  const setField = (field: ConfirmationField, value: string) => {
    setDraft((old) => ({ ...old, [field]: value }));
    setEdits((old) => {
      const next = { ...old };
      if (value === initial[field]) delete next[field];
      else if (field === "confirmed_status") next[field] = value as ShipmentStatus;
      else next[field] = value;
      return next;
    });
  };

  const submit = async () => {
    if (!writable || saving.current || needsReview || invalidDate || !Object.keys(edits).length) return;
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      await onSave({ expected_edit_token: baseline.edit_token!, ...edits });
      if (live.current) onClose();
    } catch (failure) {
      if (!live.current) return;
      let message = c.saveError;
      let review = true;
      if (failure instanceof ApiError) {
        if (failure.code === "TRADE_SHIPMENT_EDIT_CONFLICT") message = c.conflict;
        else if (failure.code === "TRADE_SHIPMENT_READ_ONLY") { message = c.readOnly; review = false; }
        else if (failure.status === 403 || failure.status === 401) { message = c.forbidden; review = false; }
        else if (failure.status === 402) { message = c.unavailable; review = false; }
        else if (failure.status === 404) { message = c.missing; review = false; }
        else if (failure.status === 400) { message = c.invalidDate; review = false; }
      }
      setError(message);
      setNeedsReview(review);
      setLatest(null);
    } finally {
      saving.current = false;
      if (live.current) setPending(false);
    }
  };

  const reload = async () => {
    setLoadingLatest(true);
    try {
      const row = await onReload();
      if (live.current) { setLatest(row); setError(c.conflict); }
    } catch { if (live.current) setError(c.reloadError); }
    finally { if (live.current) setLoadingLatest(false); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto" onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }}>
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{[baseline.bl_number, baseline.container_number].filter(Boolean).join(" · ") || copy.rowFallback} — {c.description}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <FieldDescription className="text-[var(--color-gray-4)]">{c.manualHint}</FieldDescription>
          {fields.map((field) => {
            const label = field === "confirmed_etd" ? c.etd : field === "confirmed_eta" ? c.eta : c.status;
            const released = edits[field] === null;
            const changed = Object.hasOwn(edits, field);
            return (
              <Field key={field}>
                <FieldLabel htmlFor={`shipment-${field}`}>{label}</FieldLabel>
                {field === "confirmed_status" ? (
                  <Select disabled={pending || released || !writable} onValueChange={(value) => setField(field, value)} value={draft[field]}>
                    <SelectTrigger aria-describedby="shipment-status-hint" id={`shipment-${field}`}><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" style={{ zIndex: "calc(var(--z-dialog) + 2)" }}>{statuses.map((status) => <SelectItem key={status} value={status}>{copy.status[status]}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <DateInput ariaLabel={label} className="w-full" disabled={pending || released || !writable} id={`shipment-${field}`} invalid={changed && !released && !draft[field]} onValueChange={(value) => setField(field, value)} value={draft[field] ?? ""} />
                )}
                {field === "confirmed_status" ? <ShipmentConfirmationRecord shipment={baseline} /> : null}
                {field === "confirmed_status" ? <FieldDescription className="text-[var(--color-gray-4)]" id="shipment-status-hint">{c.statusHint}</FieldDescription> : null}
                {released ? <FieldDescription className="text-[var(--color-gray-4)]" role="status">{field === "confirmed_status" ? c.releaseStatusHint : c.releaseHint}</FieldDescription> : null}
                <div className="flex flex-wrap gap-2">
                  {!changed && draft[field] ? <Button aria-label={`${label}: ${c.confirmValue}`} disabled={pending || !writable} onClick={() => setEdits((old) => ({ ...old, [field]: draft[field] }))} size="sm" type="button" variant="link">{c.confirmValue}</Button> : null}
                  {baseline[field] != null && !released ? <Button aria-label={`${label}: ${field === "confirmed_status" ? c.useProviderStatus : c.useSource}`} disabled={pending || !writable} onClick={() => setEdits((old) => ({ ...old, [field]: null }))} size="sm" type="button" variant="link">{field === "confirmed_status" ? c.useProviderStatus : c.useSource}</Button> : null}
                  {changed ? <Button aria-label={`${label}: ${c.undo}`} disabled={pending} onClick={() => { setDraft((old) => ({ ...old, [field]: initial[field] })); setEdits((old) => { const next = { ...old }; delete next[field]; return next; }); }} size="sm" type="button" variant="link">{c.undo}</Button> : null}
                </div>
              </Field>
            );
          })}
          {!canWrite || !baseline.edit_token ? <Alert variant="destructive"><AlertDescription>{!canWrite ? c.forbidden : c.missingToken}</AlertDescription></Alert> : null}
          {invalidDate ? <Alert id="shipment-date-error" variant="destructive"><AlertDescription>{c.invalidDate}</AlertDescription></Alert> : null}
          {pending ? <FieldDescription className="text-[var(--color-gray-4)]" role="status">{c.savingContinues}</FieldDescription> : null}
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
          {needsReview || !baseline.edit_token ? <Button disabled={loadingLatest || pending} onClick={() => void reload()} type="button" variant="outline">{loadingLatest ? c.loadingLatest : c.loadLatest}</Button> : null}
          {latest ? (
            <Alert aria-label={c.latest} role="region" variant="neutral">
              <AlertTitle>{c.latest}</AlertTitle>
              <AlertDescription>
              <p>{[latest.bl_number, latest.container_number].filter(Boolean).join(" · ") || copy.rowFallback}</p>
              <dl className="my-2">
                <dt>{c.etd}</dt><dd>{values(latest).confirmed_etd || "—"}</dd>
                <dt>{c.eta}</dt><dd>{values(latest).confirmed_eta || "—"}</dd>
                <dt>{c.status}</dt><dd>{copy.status[latest.status]}</dd>
              </dl>
              <Button disabled={!latest.edit_token} onClick={() => { setBaseline(latest); setDraft((old) => ({ ...values(latest), ...Object.fromEntries(Object.keys(edits).map((key) => [key, old[key as ConfirmationField]])) })); setLatest(null); setNeedsReview(false); setError(null); }} type="button" variant="outline">{c.keepDraft}</Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button onClick={onClose} size="lg" type="button" variant="outline">{pending ? c.close : c.cancel}</Button>
            <Button disabled={!writable || pending || needsReview || invalidDate || !Object.keys(edits).length} size="lg" type="submit">{pending ? c.saving : c.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

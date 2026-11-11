"use client";

import { useRef, useState, useEffect } from "react";


import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShipmentConfirmationRecord } from "./ShipmentConfirmationRecord";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { ApiError } from "../lib/api/client";
import { effectiveShipmentEta, effectiveShipmentEtd, type Shipment, type ShipmentConfirmation, type ShipmentStatus } from "../lib/api/shipments";

import type { AppMessages } from '../lib/i18n/messages';
type ShipmentsCopy = AppMessages['erpShipments']['shipments'];

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

export type ShipmentContainerIdentity = { number: string; seal: string; size: string };
export type ShipmentIdentity = { blNumber: string; containers: ShipmentContainerIdentity[] };
const containerSizes = ["20FT GP", "40FT GP", "40FT HC", "45FT HC", "20FT RF", "40FT RF"];

function initialIdentity(ship: Shipment): ShipmentIdentity {
  const numbers = (ship.container_number ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  return {
    blNumber: ship.bl_number ?? "",
    containers: numbers.length ? numbers.map((number) => ({ number, seal: "", size: "40FT HC" })) : [{ number: "", seal: "", size: "40FT HC" }],
  };
}

export function ShipmentConfirmationDialog({ shipment, copy, canWrite, onSave, onSaveIdentity, onReload, onClose, returnFocus }: {
  shipment: Shipment;
  copy: ShipmentsCopy;
  canWrite: boolean;
  onSave: (body: ShipmentConfirmation) => Promise<void>;
  /** Prototype: B/L·컨테이너 식별정보는 선적 건 로컬 값으로 저장한다(실무 피드백 #87). */
  onSaveIdentity?: (identity: ShipmentIdentity) => void;
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
  const [identityBaseline] = useState(() => initialIdentity(shipment));
  const [identity, setIdentity] = useState(() => initialIdentity(shipment));
  const identityChanged = JSON.stringify(identity) !== JSON.stringify(identityBaseline);
  const duplicateContainer = new Set(identity.containers.map((row) => row.number.trim().toUpperCase()).filter(Boolean)).size !== identity.containers.filter((row) => row.number.trim()).length;
  const updateContainer = (index: number, patch: Partial<ShipmentContainerIdentity>) =>
    setIdentity((old) => ({ ...old, containers: old.containers.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
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
    const hasEdits = Object.keys(edits).length > 0;
    if (!canWrite || saving.current || needsReview || invalidDate || duplicateContainer || (!hasEdits && !identityChanged)) return;
    if (hasEdits && !writable) return;
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      if (hasEdits) await onSave({ expected_edit_token: baseline.edit_token!, ...edits });
      if (identityChanged) onSaveIdentity?.({ blNumber: identity.blNumber.trim(), containers: identity.containers.filter((row) => row.number.trim()).map((row) => ({ ...row, number: row.number.trim().toUpperCase() })) });
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }}>
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.description}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <section aria-label="선적 식별정보" className="flex flex-col gap-3 rounded-[var(--r-md)] border border-[var(--surface-border)] p-3">
            <div>
              <h3 className="text-sm font-semibold">선적 식별정보</h3>
              <p className="mt-0.5 text-xs text-[var(--color-gray-4)]">이 선적 건의 B/L·컨테이너 번호를 직접 고칩니다. 원본 B/L 서류 파일은 바뀌지 않습니다.</p>
            </div>
            <Field data-disabled={pending || !canWrite}>
              <FieldLabel htmlFor="shipment-bl-number">B/L 번호</FieldLabel>
              <Input id="shipment-bl-number" disabled={pending || !canWrite} value={identity.blNumber} placeholder="예: HDMUMELB2607014" onChange={(event) => setIdentity((old) => ({ ...old, blNumber: event.target.value.toUpperCase() }))} />
            </Field>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">컨테이너 {identity.containers.length}개</span>
                <Button disabled={pending || !canWrite} onClick={() => setIdentity((old) => ({ ...old, containers: [...old.containers, { number: "", seal: "", size: old.containers.at(-1)?.size ?? "40FT HC" }] }))} size="xs" type="button" variant="outline"><Plus data-icon="inline-start" />컨테이너 추가</Button>
              </div>
              <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_112px_32px] gap-2 text-[11px] text-[var(--color-gray-4)] sm:grid">
                <span>컨테이너 번호</span><span>씰 번호</span><span>규격</span><span className="sr-only">삭제</span>
              </div>
              {identity.containers.map((row, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_32px] gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_112px_32px]">
                  <Input aria-label={`컨테이너 ${index + 1} 번호`} disabled={pending || !canWrite} value={row.number} placeholder="ABCU1234567" onChange={(event) => updateContainer(index, { number: event.target.value.toUpperCase() })} />
                  <Button aria-label={`컨테이너 ${index + 1} 삭제`} className="size-9 sm:order-last" disabled={pending || !canWrite || identity.containers.length === 1} onClick={() => setIdentity((old) => ({ ...old, containers: old.containers.filter((_, i) => i !== index) }))} size="icon-sm" type="button" variant="ghost"><Trash2 /></Button>
                  <Input aria-label={`컨테이너 ${index + 1} 씰 번호`} disabled={pending || !canWrite} value={row.seal} placeholder="씰 번호" onChange={(event) => updateContainer(index, { seal: event.target.value.toUpperCase() })} />
                  <Select disabled={pending || !canWrite} onValueChange={(value) => updateContainer(index, { size: value })} value={row.size}>
                    <SelectTrigger aria-label={`컨테이너 ${index + 1} 규격`}><SelectValue /></SelectTrigger>
                    <SelectContent position="popper"><SelectGroup>{containerSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </div>
              ))}
              {duplicateContainer ? <p className="text-xs text-destructive" role="alert">같은 컨테이너 번호가 두 번 입력되었습니다.</p> : null}
            </div>
          </section>
          <FieldDescription className="text-[var(--color-gray-4)]">{c.manualHint}</FieldDescription>
          <FieldGroup className="gap-4">
          {fields.map((field) => {
            const label = field === "confirmed_etd" ? c.etd : field === "confirmed_eta" ? c.eta : c.status;
            const released = edits[field] === null;
            const changed = Object.hasOwn(edits, field);
            return (
              <Field key={field} data-disabled={pending || released || !writable} data-invalid={field !== "confirmed_status" && changed && !released && !draft[field]}>
                <FieldLabel htmlFor={`shipment-${field}`}>{label}</FieldLabel>
                {field === "confirmed_status" ? (
                  <Select disabled={pending || released || !writable} onValueChange={(value) => setField(field, value)} value={draft[field]}>
                    <SelectTrigger aria-describedby="shipment-status-hint" id={`shipment-${field}`}><SelectValue /></SelectTrigger>
                    <SelectContent position="popper"><SelectGroup>{statuses.map((status) => <SelectItem key={status} value={status}>{copy.status[status]}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                ) : (
                  <DatePicker ariaLabel={label} className="w-full" disabled={pending || released || !writable} id={`shipment-${field}`} invalid={changed && !released && !draft[field]} onValueChange={(value) => setField(field, value)} value={draft[field] ?? ""} />
                )}
                {field === "confirmed_status" ? <ShipmentConfirmationRecord shipment={baseline} /> : null}
                {field === "confirmed_status" ? <FieldDescription className="text-[var(--color-gray-4)]" id="shipment-status-hint">{c.statusHint}</FieldDescription> : null}
                {released ? <FieldDescription className="text-[var(--color-gray-4)]" role="status">{field === "confirmed_status" ? c.releaseStatusHint : c.releaseHint}</FieldDescription> : null}
                <div className="flex flex-wrap gap-2">
                  {baseline[field] != null && !released ? <Button aria-label={`${label}: ${field === "confirmed_status" ? c.useProviderStatus : c.useSource}`} disabled={pending || !writable} onClick={() => setEdits((old) => ({ ...old, [field]: null }))} size="sm" type="button" variant="link">{field === "confirmed_status" ? c.useProviderStatus : c.useSource}</Button> : null}
                  {changed ? <Button aria-label={`${label}: ${c.undo}`} disabled={pending} onClick={() => { setDraft((old) => ({ ...old, [field]: initial[field] })); setEdits((old) => { const next = { ...old }; delete next[field]; return next; }); }} size="sm" type="button" variant="link">{c.undo}</Button> : null}
                </div>
              </Field>
            );
          })}
          </FieldGroup>
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
            <Button disabled={!canWrite || (Object.keys(edits).length > 0 && !writable) || pending || needsReview || invalidDate || duplicateContainer || (!Object.keys(edits).length && !identityChanged)} size="lg" type="submit">{pending ? c.saving : c.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

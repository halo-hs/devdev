"use client";

import { useRef, useState, useEffect } from "react";


import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShipmentConfirmationRecord } from "./ShipmentConfirmationRecord";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { ApiError } from "../lib/api/client";
import { effectiveShipmentEta, effectiveShipmentEtd, type Shipment, type ShipmentConfirmation, type ShipmentStatus } from "../lib/api/shipments";

import type { AppMessages } from '../lib/i18n/messages';
type ShipmentsCopy = AppMessages['erpShipments']['shipments'];

export type ShipmentContainerEdit = {
  number: string;
  sealNumber?: string | null;
  packageCount?: string | null;
  packageUnit?: string | null;
  grossWeight?: string | null;
  volume?: string | null;
};

type ConfirmationField = "confirmed_eta" | "confirmed_etd" | "confirmed_status";
type Edits = Partial<Pick<ShipmentConfirmation, ConfirmationField>>;
type DetailField = "bl_number" | "container_number" | "pol" | "pod" | "vessel" | "carrier";
type DetailEdits = Partial<Pick<ShipmentConfirmation, DetailField>>;
const fields: ConfirmationField[] = ["confirmed_etd", "confirmed_eta", "confirmed_status"];
const detailFields: Array<{ key: DetailField; label: string }> = [
  { key: "bl_number", label: "B/L 번호" },
  { key: "container_number", label: "컨테이너 번호" },
  { key: "pol", label: "선적항" },
  { key: "pod", label: "도착항" },
  { key: "vessel", label: "선박명" },
  { key: "carrier", label: "선사" },
];
const statuses: ShipmentStatus[] = ["unknown", "booked", "loaded", "departed", "arrived", "delivered"];

function values(ship: Shipment): Record<ConfirmationField, string> {
  return {
    confirmed_eta: effectiveShipmentEta(ship)?.slice(0, 10) ?? "",
    confirmed_etd: effectiveShipmentEtd(ship)?.slice(0, 10) ?? "",
    confirmed_status: ship.status,
  };
}

function detailValues(ship: Shipment): Record<DetailField, string> {
  return {
    bl_number: ship.bl_number ?? "",
    container_number: ship.container_number ?? "",
    pol: ship.pol ?? "",
    pod: ship.pod ?? "",
    vessel: ship.vessel ?? "",
    carrier: ship.carrier ?? "",
  };
}

type ContainerDetailDraft = {
  number: string;
  sealNumber: string;
  packageCount: string;
  packageUnit: string;
  grossWeight: string;
  volume: string;
};

function containerValues(containers?: ShipmentContainerEdit[]): ContainerDetailDraft[] {
  return (containers ?? []).map((container) => ({
    number: container.number,
    sealNumber: container.sealNumber ?? "",
    packageCount: container.packageCount ?? "",
    packageUnit: container.packageUnit ?? "",
    grossWeight: container.grossWeight ?? "",
    volume: container.volume ?? "",
  }));
}

export function ShipmentConfirmationDialog({ shipment, copy, canWrite, onSave, onReload, onClose, returnFocus, containerDetails, onSaveContainerDetails }: {
  shipment: Shipment;
  copy: ShipmentsCopy;
  canWrite: boolean;
  onSave: (body: ShipmentConfirmation) => Promise<void>;
  onReload: () => Promise<Shipment>;
  onClose: () => void;
  returnFocus: () => void;
  containerDetails?: ShipmentContainerEdit[];
  onSaveContainerDetails?: (containers: ShipmentContainerEdit[]) => void;
}) {
  const c = copy.confirmation;
  const [baseline, setBaseline] = useState(shipment);
  const [draft, setDraft] = useState(() => values(shipment));
  const [edits, setEdits] = useState<Edits>({});
  const [details, setDetails] = useState(() => detailValues(shipment));
  const [initialContainerDetails] = useState(() => containerValues(containerDetails));
  const [containerDrafts, setContainerDrafts] = useState<ContainerDetailDraft[]>(() => containerValues(containerDetails));
  const [detailEdits, setDetailEdits] = useState<DetailEdits>({});
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
  const containerDetailsChanged = JSON.stringify(containerDrafts) !== JSON.stringify(initialContainerDetails);
  const hasChanges = Object.keys(edits).length > 0 || Object.keys(detailEdits).length > 0 || containerDetailsChanged;

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

  const setDetailField = (field: DetailField, value: string) => {
    setDetails((old) => ({ ...old, [field]: value }));
    setDetailEdits((old) => {
      const next = { ...old };
      if (value === detailValues(baseline)[field]) delete next[field];
      else next[field] = value;
      return next;
    });
  };

  const setContainerField = (index: number, field: keyof ContainerDetailDraft, value: string) => {
    setContainerDrafts((current) => current.map((container, containerIndex) => containerIndex === index ? { ...container, [field]: value } : container));
  };

  const submit = async () => {
    if (!writable || saving.current || needsReview || invalidDate || !hasChanges) return;
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      await onSave({ expected_edit_token: baseline.edit_token!, ...edits, ...detailEdits });
      if (containerDetailsChanged) onSaveContainerDetails?.(containerDrafts.map((container) => ({
        number: container.number,
        sealNumber: container.sealNumber || null,
        packageCount: container.packageCount || null,
        packageUnit: container.packageUnit || null,
        grossWeight: container.grossWeight || null,
        volume: container.volume || null,
      })));
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
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-3xl" onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }}>
        <DialogHeader>
          <DialogTitle>선적 정보 확인·수정</DialogTitle>
          <DialogDescription>선적 기본 정보, 일정과 운송 상태를 수정합니다.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <FieldDescription className="text-[var(--color-gray-4)]">{c.manualHint}</FieldDescription>
          <section className="rounded-lg border p-4" aria-label="선적 기본 정보">
            <h3 className="text-sm font-semibold">선적 기본 정보</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {detailFields.filter(({ key }) => !(containerDetails && key === "container_number")).map(({ key, label }) => (
                <Field key={key} data-disabled={pending || !writable}>
                  <FieldLabel htmlFor={`shipment-${key}`}>{label}</FieldLabel>
                  <Input id={`shipment-${key}`} value={details[key]} disabled={pending || !writable} onChange={(event) => setDetailField(key, event.target.value)} />
                </Field>
              ))}
            </div>
            {containerDetails ? (
              <section className="mt-4 border-t pt-4" aria-label="컨테이너 정보">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">컨테이너 정보</h4>
                  <span className="text-xs text-muted-foreground">{containerDrafts.length}대</span>
                </div>
                <div className="mt-3 grid gap-3">
                  {containerDrafts.map((container, index) => (
                    <fieldset key={`${container.number}-${index}`} className="rounded-md border bg-muted/20 p-3">
                      <legend className="px-1 text-xs font-medium text-muted-foreground">컨테이너 {index + 1}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field data-disabled={pending || !writable}>
                          <FieldLabel htmlFor={`shipment-container-${index}-number`}>컨테이너 번호</FieldLabel>
                          <Input id={`shipment-container-${index}-number`} value={container.number} disabled={pending || !writable} onChange={(event) => setContainerField(index, "number", event.target.value)} />
                        </Field>
                        <Field data-disabled={pending || !writable}>
                          <FieldLabel htmlFor={`shipment-container-${index}-sealNumber`}>씰 번호</FieldLabel>
                          <Input id={`shipment-container-${index}-sealNumber`} value={container.sealNumber} disabled={pending || !writable} onChange={(event) => setContainerField(index, "sealNumber", event.target.value)} />
                        </Field>
                        <Field data-disabled={pending || !writable}>
                          <FieldLabel htmlFor={`shipment-container-${index}-packageCount`}>포장 수 / 단위</FieldLabel>
                          <div className="flex gap-2">
                            <Input id={`shipment-container-${index}-packageCount`} className="min-w-0 flex-1" value={container.packageCount} disabled={pending || !writable} onChange={(event) => setContainerField(index, "packageCount", event.target.value)} />
                            <Select disabled={pending || !writable} value={container.packageUnit || "bundles"} onValueChange={(value) => setContainerField(index, "packageUnit", value)}>
                              <SelectTrigger aria-label={`컨테이너 ${index + 1} 포장 단위`} className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent position="popper"><SelectGroup>
                                {['bundles', 'cartons', 'pallets', 'bags'].map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                              </SelectGroup></SelectContent>
                            </Select>
                          </div>
                        </Field>
                        <Field data-disabled={pending || !writable}>
                          <FieldLabel htmlFor={`shipment-container-${index}-grossWeight`}>총중량</FieldLabel>
                          <Input id={`shipment-container-${index}-grossWeight`} value={container.grossWeight} disabled={pending || !writable} onChange={(event) => setContainerField(index, "grossWeight", event.target.value)} />
                        </Field>
                        <Field data-disabled={pending || !writable}>
                          <FieldLabel htmlFor={`shipment-container-${index}-volume`}>용적</FieldLabel>
                          <Input id={`shipment-container-${index}-volume`} value={container.volume} disabled={pending || !writable} onChange={(event) => setContainerField(index, "volume", event.target.value)} />
                        </Field>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
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
              <Button disabled={!latest.edit_token} onClick={() => { setBaseline(latest); setDraft((old) => ({ ...values(latest), ...Object.fromEntries(Object.keys(edits).map((key) => [key, old[key as ConfirmationField]])) })); setDetails((old) => ({ ...detailValues(latest), ...Object.fromEntries(Object.keys(detailEdits).map((key) => [key, old[key as DetailField]])) })); setLatest(null); setNeedsReview(false); setError(null); }} type="button" variant="outline">{c.keepDraft}</Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button onClick={onClose} size="lg" type="button" variant="outline">{pending ? c.close : c.cancel}</Button>
              <Button disabled={!writable || pending || needsReview || invalidDate || !hasChanges} size="lg" type="submit">{pending ? c.saving : c.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

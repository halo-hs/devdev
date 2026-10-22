import { PageHeading, SettingsSection } from "./views/SettingsSection"
import {
  useState,
  type ReactNode,
} from "react"
import {
  Loader2,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { cn } from "@/lib/utils"

export type ProductEntitlement = "erp" | "snap"

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

type ApprovalMode = "disabled" | "optional" | "required" | "conditional"
type ApprovalPolicy = {
  id: string
  revision: number
  scopeKind: "org" | "document_type"
  scopeRef: string
  mode: ApprovalMode
  amountEnabled: boolean
  amountCurrency: string
  amountThreshold: string
  counterpartyRiskEnabled: boolean
  counterpartyRiskMinGrade: "A" | "B" | "C" | "D"
  discrepancyEnabled: boolean
  newCounterpartyEnabled: boolean
}

const emptyApprovalPolicy: ApprovalPolicy = {
  id: "",
  revision: 0,
  scopeKind: "org",
  scopeRef: "",
  mode: "conditional",
  amountEnabled: true,
  amountCurrency: "USD",
  amountThreshold: "50000",
  counterpartyRiskEnabled: true,
  counterpartyRiskMinGrade: "C",
  discrepancyEnabled: true,
  newCounterpartyEnabled: true,
}

const approvalModeLabel: Record<ApprovalMode, string> = {
  disabled: "사용 안 함",
  optional: "선택 승인",
  required: "항상 승인",
  conditional: "조건부 승인",
}

export function ApprovalPolicySettings() {
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([
    { ...emptyApprovalPolicy, id: "AP-ORG-001", revision: 3 },
  ])
  const [form, setForm] = useState<ApprovalPolicy>(emptyApprovalPolicy)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [confirmAction, setConfirmAction] = useState<
    { kind: "save" } | { kind: "delete"; policy: ApprovalPolicy } | null
  >(null)

  const affectedDraftCount =
    form.mode === "disabled"
      ? 0
      : form.mode === "required"
        ? 12
        : [
            form.amountEnabled ? 4 : 0,
            form.counterpartyRiskEnabled ? 3 : 0,
            form.discrepancyEnabled ? 2 : 0,
            form.newCounterpartyEnabled ? 3 : 0,
          ].reduce((sum, value) => sum + value, 0)
  const amountInvalid =
    form.amountEnabled &&
    (!/^[A-Z]{3}$/.test(form.amountCurrency) ||
      !Number.isFinite(Number(form.amountThreshold)) ||
      Number(form.amountThreshold) < 0)
  const scopeInvalid = form.scopeKind === "document_type" && !form.scopeRef.trim()

  const savePolicy = async () => {
    if (amountInvalid || scopeInvalid || pending) return
    setPending(true)
    setError("")
    setMessage("")
    const nextPolicy = {
      ...form,
      id: form.id || `AP-${Date.now()}`,
      revision: form.revision + 1,
      amountCurrency: form.amountCurrency.toUpperCase(),
    }
    const result = await prototypeBackend.settings.saveApprovalPolicy(nextPolicy)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPolicies((current) =>
      form.id
        ? current.map((policy) =>
            policy.id === form.id ? nextPolicy : policy
          )
        : [...current, nextPolicy]
    )
    setForm(emptyApprovalPolicy)
    setConfirmAction(null)
    setMessage("결재 정책을 저장했습니다.")
  }

  const deletePolicy = async (policy: ApprovalPolicy) => {
    if (pending) return
    setPending(true)
    setError("")
    const result = await prototypeBackend.settings.deleteApprovalPolicy(policy.id)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPolicies((current) => current.filter((item) => item.id !== policy.id))
    if (form.id === policy.id) setForm(emptyApprovalPolicy)
    setConfirmAction(null)
    setMessage("결재 정책을 삭제했습니다.")
  }

  return (
    <div>
      <PageHeading
        title="결재 정책"
        description="생성 문서에 적용할 승인 방식과 조건을 관리합니다. 실제 적용 정책은 조직 정책과 문서 유형 정책의 우선순위로 결정됩니다."
        action={<Badge variant="secondary">조직 소유자</Badge>}
      />
      <div className="space-y-7">
        <SettingsSection title="등록된 정책" description="문서 유형 정책이 조직 기본 정책보다 먼저 적용됩니다."
          action={<Button variant="outline" onClick={() => { setForm(emptyApprovalPolicy); setMessage("") }}>새 정책</Button>}>
          <div className="divide-y">
            {policies.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                등록된 정책이 없습니다. 승인 없이 문서를 확정할 수 있습니다.
              </div>
            ) : (
              policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {policy.scopeKind === "org"
                          ? "조직 기본"
                          : policy.scopeRef}
                      </span>
                      <Badge variant="outline">
                        {approvalModeLabel[policy.mode]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      정책 버전 {policy.revision} · 금액, 거래처 위험, 불일치, 신규 거래처 조건
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({ ...policy })
                      setMessage("")
                    }}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmAction({ kind: "delete", policy })}
                  >
                    삭제
                  </Button>
                </div>
              ))
            )}
          </div>
        </SettingsSection>

        <SettingsSection title={form.id ? "정책 수정" : "정책 만들기"} description="적용 범위와 승인 조건을 설정합니다.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="적용 범위">
              <Select
                value={form.scopeKind}
                onValueChange={(value) =>
                  value &&
                  setForm((current) => ({
                    ...current,
                    scopeKind: value as ApprovalPolicy["scopeKind"],
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">조직 전체</SelectItem>
                  <SelectItem value="document_type">문서 유형</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="승인 방식">
              <Select
                value={form.mode}
                onValueChange={(value) =>
                  value &&
                  setForm((current) => ({
                    ...current,
                    mode: value as ApprovalMode,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(approvalModeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.scopeKind === "document_type" ? (
              <Field label="문서 유형" className="sm:col-span-2">
                <Input
                  value={form.scopeRef}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, scopeRef: event.target.value }))
                  }
                  placeholder="commercial_invoice"
                />
              </Field>
            ) : null}
          </div>
          <div className="mt-5 divide-y rounded-md border px-4">
            <div className="grid gap-3 py-4 sm:grid-cols-[1fr_9rem_12rem] sm:items-center">
              <label className="flex items-center gap-3 text-sm font-medium">
                <Checkbox
                  checked={form.amountEnabled}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, amountEnabled: checked === true }))
                  }
                />
                금액 기준
              </label>
              <Input
                value={form.amountCurrency}
                disabled={!form.amountEnabled}
                maxLength={3}
                aria-label="승인 기준 통화"
                onChange={(event) =>
                  setForm((current) => ({ ...current, amountCurrency: event.target.value.toUpperCase() }))
                }
              />
              <Input
                value={form.amountThreshold}
                disabled={!form.amountEnabled}
                inputMode="decimal"
                aria-label="승인 기준 금액"
                onChange={(event) =>
                  setForm((current) => ({ ...current, amountThreshold: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-[1fr_12rem] sm:items-center">
              <label className="flex items-center gap-3 text-sm font-medium">
                <Checkbox
                  checked={form.counterpartyRiskEnabled}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, counterpartyRiskEnabled: checked === true }))
                  }
                />
                거래처 위험 등급
              </label>
              <Select
                value={form.counterpartyRiskMinGrade}
                disabled={!form.counterpartyRiskEnabled}
                onValueChange={(value) =>
                  value &&
                  setForm((current) => ({ ...current, counterpartyRiskMinGrade: value as ApprovalPolicy["counterpartyRiskMinGrade"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["A", "B", "C", "D"] as const).map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade} 이상 위험</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {[
              ["discrepancyEnabled", "문서 불일치 warning 이상"],
              ["newCounterpartyEnabled", "신규 거래처"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 py-4 text-sm font-medium">
                <Checkbox
                  checked={Boolean(form[key as "discrepancyEnabled" | "newCounterpartyEnabled"])}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, [key]: checked === true }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            현재 입력값으로 저장하면 작성 중인 초안 {affectedDraftCount}건의 유효 정책이 달라집니다.
          </div>
          {amountInvalid || scopeInvalid ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {scopeInvalid
                ? "문서 유형을 입력해 주세요."
                : "통화 3자리 코드와 0 이상의 기준 금액을 확인해 주세요."}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <Button
              disabled={pending || amountInvalid || scopeInvalid}
              onClick={() =>
                affectedDraftCount > 0
                  ? setConfirmAction({ kind: "save" })
                  : void savePolicy()
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              정책 저장
            </Button>
            {form.id ? (
              <Button variant="outline" onClick={() => setForm(emptyApprovalPolicy)}>
                취소
              </Button>
            ) : null}
            {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
          </div>
        </SettingsSection>
      </div>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && !pending && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === "delete" ? "결재 정책을 삭제할까요?" : "결재 정책을 적용할까요?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "delete"
                ? "이 범위에는 상위 정책이 즉시 적용됩니다. 작성 중인 문서의 승인 조건이 달라질 수 있습니다."
                : `작성 중인 초안 ${affectedDraftCount}건의 승인 조건이 달라집니다. 저장 후 각 문서의 유효 정책을 다시 확인해 주세요.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                if (confirmAction?.kind === "delete") {
                  void deletePolicy(confirmAction.policy)
                } else {
                  void savePolicy()
                }
              }}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              {confirmAction?.kind === "delete" ? "삭제" : "저장"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


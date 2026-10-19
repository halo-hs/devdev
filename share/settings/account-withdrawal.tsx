import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Building2,
  CircleAlert,
  CircleCheck,
  Clock3,
  KeyRound,
  Loader2,
  RefreshCw,
} from "lucide-react"
import GoogleIcon from "@ecoya/design-system/assets/icons/icon-google.svg"
import { appLocation } from "@/app/app-location"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { PageHeading, SettingsSection } from "./settings-layout"
import type {
  WithdrawalGateway,
  WithdrawalMembership,
  WithdrawalMethod,
  WithdrawalResult,
} from "./withdrawal-data"

function checkedMemberships(
  value: WithdrawalMembership[]
): WithdrawalMembership[] {
  if (!Array.isArray(value)) throw new Error("membership-result-unavailable")
  return value
}

type Stage = "entry" | "reauth" | "confirm" | "result" | "create"
const roleNames = { OWNER: "소유자", ADMIN: "관리자", MEMBER: "멤버" }

export function WithdrawalResultView({
  result,
  busy = false,
  onRetry,
}: {
  result: WithdrawalResult
  busy?: boolean
  onRetry?: () => void
}) {
  const unknown = result.status === "unknown"
  const failed = result.status === "failed"
  const completed = result.status === "completed"
  const Icon = completed
    ? CircleCheck
    : unknown || failed
      ? CircleAlert
      : Clock3
  const title = completed
    ? "계정 탈퇴가 완료되었습니다."
    : failed
      ? "처리를 완료하지 못했습니다."
      : unknown
        ? "접수 여부를 확인하지 못했습니다."
        : "계정 탈퇴를 처리하고 있습니다."
  return (
    <div aria-live="polite">
      <PageHeading
        title="계정 탈퇴 처리"
        description={
          completed
            ? "처리 완료"
            : failed
              ? "처리 실패"
              : unknown
                ? "접수 확인 필요"
                : result.status === "accepted"
                  ? "요청 접수"
                  : "처리 중"
        }
      />
      <div className="rounded-xl border p-5 sm:p-6">
        <Icon
          aria-hidden="true"
          className={`mb-4 size-7 ${failed || unknown ? "text-destructive" : completed ? "text-emerald-600" : "text-muted-foreground"}`}
        />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {completed
            ? "이 계정은 복구할 수 없습니다. 같은 이메일로 다시 가입하면 새 계정으로 시작합니다."
            : failed
              ? "확인 후 다시 처리합니다. 지원 문의를 통해 처리 상황을 확인할 수 있습니다."
              : unknown
                ? "같은 요청의 처리 상태를 다시 확인해 주세요. 결과를 확인하기 전에는 새 요청을 보내지 않습니다."
                : "탈퇴 결과를 확인한 뒤 이메일로 안내드립니다."}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {unknown ? (
            <Button variant="outline" disabled={busy} onClick={onRetry}>
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}처리
              상태 다시 확인
            </Button>
          ) : failed ? (
            <Button
              variant="outline"
              onClick={() =>
                appLocation.assign(
                  "mailto:contact@ecoya.kr?subject=" +
                    encodeURIComponent("계정 탈퇴 처리 문의")
                )
              }
            >
              지원 문의
            </Button>
          ) : (
            <Button onClick={() => appLocation.assign("/login")}>
              로그인 화면으로
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Native modal makes the product shell inert after submission, including keyboard navigation. */
export function WithdrawalResultSurface(
  props: Parameters<typeof WithdrawalResultView>[0]
) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      aria-label="계정 탈퇴 처리"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-background p-5 text-foreground backdrop:bg-background sm:p-10"
    >
      <div className="mx-auto max-w-[720px] py-7">
        <WithdrawalResultView {...props} />
      </div>
    </dialog>
  )
}

export function AccountWithdrawal({
  gateway,
  onCancel,
  onOrganizations,
  onResult,
}: {
  gateway: WithdrawalGateway
  onCancel: () => void
  onOrganizations: () => void
  onResult: (result: WithdrawalResult) => void
}) {
  const [stage, setStage] = useState<Stage>("entry")
  const [memberships, setMemberships] = useState<WithdrawalMembership[] | null>(
    null
  )
  const [membershipError, setMembershipError] = useState(false)
  const [method, setMethod] = useState<WithdrawalMethod>("unknown")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(true)
  const [recovery, setRecovery] = useState(false)
  const [organizationName, setOrganizationName] = useState("")
  const [result, setResult] = useState<WithdrawalResult | null>(null)
  const requestId = useRef<string | null>(null)
  const generation = useRef(0)
  const pending = useRef(false)
  const heading = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const current = ++generation.current
    gateway.reset()
    void gateway
      .memberships()
      .then((response) => {
        const value = checkedMemberships(response)
        if (generation.current === current) {
          setMemberships(value)
          setBusy(false)
        }
      })
      .catch(() => {
        if (generation.current === current) {
          setMembershipError(true)
          setBusy(false)
        }
      })
    return () => {
      generation.current = current + 1
      gateway.reset()
    }
  }, [gateway])
  useEffect(() => {
    heading.current?.focus()
  }, [stage])

  async function run(action: () => Promise<void>) {
    if (pending.current) return
    const current = generation.current
    pending.current = true
    setBusy(true)
    setError("")
    try {
      await action()
    } finally {
      if (generation.current === current) {
        pending.current = false
        setBusy(false)
      }
    }
  }
  const cancel = () => {
    generation.current++
    gateway.reset()
    setPassword("")
    onCancel()
  }
  const checkMemberships = () =>
    run(async () => {
      const current = generation.current
      setMemberships(null)
      setMembershipError(false)
      setStage("entry")
      try {
        const value = checkedMemberships(await gateway.memberships())
        if (generation.current === current) setMemberships(value)
      } catch {
        if (generation.current === current) setMembershipError(true)
      }
    })
  const checkMethod = () =>
    run(async () => {
      const current = generation.current
      setPassword("")
      setMethod("unknown")
      setRecovery(false)
      setStage("reauth")
      try {
        const value = await gateway.method()
        if (generation.current === current) setMethod(value)
      } catch {
        if (generation.current === current)
          setError("인증 수단을 확인하지 못했습니다. 다시 확인해 주세요.")
      }
    })
  const authenticate = () =>
    run(async () => {
      if (method === "unknown" || (method === "password" && !password)) return
      const current = generation.current
      const enteredPassword = password
      setPassword("")
      try {
        const response = await gateway.reauthenticate(
          method,
          method === "password" ? enteredPassword : undefined
        )
        if (generation.current !== current) return
        if (
          response.status === "verified" &&
          response.accountId === gateway.identity.id
        ) {
          setStage("confirm")
        } else {
          setError(
            response.status === "invalid-password"
              ? "비밀번호가 올바르지 않습니다. 다시 입력해 주세요."
              : response.status === "cancelled"
                ? "Google 계정 확인을 취소했습니다. 다시 확인해 주세요."
                : response.status === "identity-mismatch" ||
                    response.status === "verified"
                  ? "현재 로그인한 계정과 다른 계정입니다. 같은 계정으로 다시 확인해 주세요."
                  : "본인 확인을 완료하지 못했습니다. 다시 시도해 주세요."
          )
        }
      } catch {
        if (generation.current === current)
          setError("본인 확인을 완료하지 못했습니다. 다시 시도해 주세요.")
      }
    })
  function showResult(value: WithdrawalResult) {
    if (value.status === "not-received") {
      setStage("confirm")
      setError(
        "요청이 접수되지 않았습니다. 내용을 확인한 뒤 다시 시도해 주세요."
      )
    } else if (value.status === "unknown") {
      setResult(value)
      setStage("result")
    } else {
      // Terminal account surface: no protected navigation after confirmed receipt.
      setPassword("")
      onResult(value)
    }
  }
  const submit = () =>
    run(async () => {
      const current = generation.current
      requestId.current ??= crypto.randomUUID()
      try {
        const response = await gateway.submit(requestId.current)
        if (generation.current !== current) return
        if (response.kind === "result") showResult(response.result)
        else if (response.kind === "reauth-required") {
          setStage("reauth")
          setPassword("")
          setError(
            "본인 확인이 만료되었거나 계정이 일치하지 않습니다. 다시 확인해 주세요."
          )
        } else {
          gateway.reset()
          setStage("entry")
          const validMemberships =
            response.kind === "memberships" &&
            Array.isArray(response.memberships)
          setMemberships(validMemberships ? response.memberships : null)
          setMembershipError(!validMemberships)
        }
      } catch {
        if (generation.current === current)
          showResult({ requestId: requestId.current, status: "unknown" })
      }
    })
  const retryResult = () =>
    run(async () => {
      if (!result) return
      const current = generation.current
      try {
        const value = await gateway.result(result.requestId)
        if (generation.current === current) showResult(value)
      } catch {
        /* Keep unknown. A failed read must not enable a fresh submission. */
      }
    })
  const createOrganization = () =>
    run(async () => {
      const current = generation.current
      try {
        await gateway.createOrganization(organizationName.trim())
        const value = checkedMemberships(await gateway.memberships())
        if (generation.current !== current) return
        setMemberships(value)
        setMembershipError(false)
        setStage("entry")
      } catch {
        if (generation.current === current)
          setError(
            "조직 생성 결과를 확인하지 못했습니다. 소속을 다시 확인해 주세요."
          )
      }
    })

  if (stage === "result" && result)
    return (
      <WithdrawalResultSurface
        result={result}
        busy={busy}
        onRetry={retryResult}
      />
    )
  const title =
    stage === "entry"
      ? "계정 탈퇴"
      : stage === "reauth"
        ? "본인 확인"
        : stage === "create"
          ? "새 조직 만들기"
          : "계정 탈퇴 최종 확인"
  return (
    <div ref={heading} tabIndex={-1} className="outline-none" aria-busy={busy}>
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-muted-foreground"
        disabled={busy}
        onClick={cancel}
      >
        <ArrowLeft />내 계정으로 돌아가기
      </Button>
      <PageHeading title={title} description={gateway.identity.email} />
      {stage === "entry" && (
        <SettingsSection title="소속 조직 확인">
          {busy ? (
            <p role="status" className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              소속을 확인하고 있습니다.
            </p>
          ) : membershipError ? (
            <div role="alert" className="space-y-4">
              <p className="text-sm text-destructive">
                소속 여부를 확인할 수 없습니다. 다시 확인해 주세요.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={checkMemberships}>
                  <RefreshCw />
                  다시 확인
                </Button>
              </div>
            </div>
          ) : memberships && memberships.length > 0 ? (
            <>
              <p className="text-sm leading-6">
                계정 탈퇴를 위해 소속 조직의 OWNER에게 문의하세요.
              </p>
              <ul className="mt-5 divide-y border-y">
                {memberships.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-4 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Building2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="break-words">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {roleNames[item.role]}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    gateway.reset()
                    onOrganizations()
                  }}
                >
                  소속 Organization 보기
                </Button>
              </div>
            </>
          ) : memberships ? (
            <>
              <p className="text-sm font-medium">소속된 조직이 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                새 조직을 만들거나 조직 관리자에게 초대를 요청하세요.
                <br />
                초대 메일을 받았다면 메일의 링크에서 수락할 수 있습니다.
              </p>
              <p className="mt-5 border-t pt-5 text-sm leading-6">
                계정을 탈퇴하면 로그인과 개인 프로필 접근이 종료되며, 완료
                후에는 계정을 복구할 수 없습니다.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  onClick={() => {
                    setError("")
                    setStage("create")
                  }}
                >
                  새 조직 만들기
                </Button>
                <Button variant="destructive" onClick={checkMethod}>
                  탈퇴 계속
                </Button>
              </div>
            </>
          ) : null}
        </SettingsSection>
      )}
      {stage === "reauth" && (
        <SettingsSection
          title="로그인 계정 확인"
          description="계정 탈퇴를 계속하려면 다시 확인해 주세요."
        >
          {busy && method === "unknown" ? (
            <p role="status" className="text-sm">
              인증 수단을 확인하고 있습니다.
            </p>
          ) : method === "unknown" ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                인증 수단을 확인할 수 없습니다.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" disabled={busy} onClick={checkMethod}>
                  <RefreshCw />
                  다시 확인
                </Button>
              </div>
            </div>
          ) : method === "password" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void authenticate()
              }}
            >
              <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                <label
                  htmlFor="withdrawal-password"
                  className="text-sm font-medium"
                >
                  비밀번호
                </label>
                <Input
                  autoFocus
                  id="withdrawal-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={busy || recovery}
                  aria-invalid={!!error}
                  aria-describedby={error ? "withdrawal-error" : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
                <Button
                  variant="link"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPassword("")
                    setError("")
                    setRecovery(true)
                  }}
                >
                  비밀번호를 잊으셨나요?
                </Button>
                <Button type="submit" disabled={!password || busy || recovery}>
                  {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
                  비밀번호 확인
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" disabled={busy} onClick={authenticate}>
                {busy ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <GoogleIcon aria-hidden="true" className="size-4" />
                )}
                Google 계정으로 확인
              </Button>
            </div>
          )}
          {recovery && (
            <div className="mt-5 border-t pt-5">
              <p className="text-sm leading-6">
                비밀번호를 재설정하면 다시 로그인한 뒤 계정 탈퇴를 처음부터
                시작해야 합니다.
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setRecovery(false)}>
                  본인 확인으로 돌아가기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    gateway.reset()
                    setPassword("")
                    appLocation.assign("/password-recovery")
                  }}
                >
                  비밀번호 재설정으로 이동
                </Button>
              </div>
            </div>
          )}
        </SettingsSection>
      )}
      {stage === "confirm" && (
        <SettingsSection title="탈퇴 전 확인해 주세요">
          <dl className="divide-y">
            {[
              [
                "로그인과 개인 프로필 접근 종료",
                "탈퇴 처리 후 이 계정으로 로그인하거나 개인 프로필에 접근할 수 없습니다.",
              ],
              [
                "조직의 작업·게시물·문서는 유지",
                "조직에 귀속된 기록은 남으며, 탈퇴한 사용자의 실명·닉네임은 표시하지 않습니다.",
              ],
              [
                "탈퇴 완료 후 계정 복구 불가",
                "조직 삭제의 30일 복구는 개인 계정 탈퇴에 적용되지 않습니다.",
              ],
              [
                "재가입 시 조직 권한 자동 복원 없음",
                "동일한 이메일로 다시 가입해도 새 계정이며, 이전 소속과 권한은 자동 복원되지 않습니다.",
              ],
            ].map(([label, description]) => (
              <div key={label} className="py-4 first:pt-0">
                <dt className="text-sm font-medium">{label}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            법령에 따라 보존해야 하는 정보는 해당 기간 동안 분리 보관됩니다.
          </p>
          <p className="mt-5 border-t pt-5 text-sm font-medium">
            계정 탈퇴는 조직 삭제나 구독 해지를 대신하지 않습니다.
          </p>
        </SettingsSection>
      )}
      {stage === "create" && (
        <SettingsSection
          title="조직 정보"
          description="우리 팀이 함께 사용할 조직 이름을 입력하세요."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void createOrganization()
            }}
            className="space-y-4"
          >
            <label
              htmlFor="withdrawal-organization"
              className="block text-sm font-medium"
            >
              조직명
            </label>
            <Input
              id="withdrawal-organization"
              autoComplete="organization"
              autoFocus
              value={organizationName}
              disabled={busy}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="예: ECOYA 무역"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={checkMemberships}
              >
                소속 다시 확인
              </Button>
              <Button type="submit" disabled={busy || !organizationName.trim()}>
                {busy && <Loader2 className="animate-spin" />}조직 만들기
              </Button>
            </div>
          </form>
        </SettingsSection>
      )}
      {error && (
        <p
          id="withdrawal-error"
          role="alert"
          className="mt-4 text-sm leading-6 text-destructive"
        >
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={busy && stage === "confirm"}
          onClick={cancel}
        >
          취소
        </Button>
        {stage === "confirm" && (
          <Button variant="destructive" disabled={busy} onClick={submit}>
            {busy && <Loader2 className="animate-spin" />}계정 탈퇴 확정
          </Button>
        )}
      </div>
    </div>
  )
}

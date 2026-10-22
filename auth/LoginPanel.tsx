import { useState, type FormEvent } from "react"
import { authFieldError } from "@auth/lib/auth-validation"
import { Button } from "@shared/components/ui/button"
import { Loader2, Building2, MapPin, AlertCircle, RefreshCw, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@shared/components/ui/card"
import { AuthInputField } from "@auth/AuthInputField"
import googleIcon from "@ecoya/design-system/assets/icons/icon-google.svg"
import appleIcon from "@ecoya/design-system/assets/icons/icon-apple.svg"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@shared/components/ui/select"
import { type CommonPrototypeScreenProps, type CommonAuthState, type Feedback, AuthSurface, showPreviewControls, InlineFeedback } from "@auth/AuthSurface"

export function CommonLoginPrototype({
  onNavigate,
  onProductLanding,
  initialProduct,
  loginNotice,
}: CommonPrototypeScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<CommonAuthState>("idle")
  const [submitted, setSubmitted] = useState(false)
  const fieldErrors = {
    email: authFieldError(email, "이메일", { email: true }),
    password: authFieldError(password, "비밀번호"),
  }

  const stateFeedback: Partial<Record<CommonAuthState, Feedback>> = {
    "network-error": {
      tone: "error",
      title: "연결하지 못했습니다",
      description:
        "네트워크 연결을 확인한 뒤 다시 로그인해 주세요. 입력한 이메일은 유지됩니다.",
    },
    "page-error": {
      tone: "error",
      title: "계정과 조직 정보를 불러오지 못했습니다",
      description:
        "일시적인 오류입니다. 조직이 없는 상태가 아니므로 새로 가입하지 마세요. 잠시 후 다시 확인해 주세요.",
    },
    "rate-limited": {
      tone: "warning",
      title: "로그인 시도가 너무 많습니다",
      description:
        "잠시 후 다시 시도해 주세요. 비밀번호가 기억나지 않으면 비밀번호 찾기를 이용하세요.",
    },
    rejected: {
      tone: "error",
      title: "로그인 정보를 확인해주세요",
      description:
        "이메일 또는 비밀번호가 올바르지 않습니다. 비밀번호를 다시 입력하거나 비밀번호 찾기를 이용해주세요.",
    },
    "provider-error": {
      tone: "error",
      title: "인증 공급자에 연결하지 못했습니다",
      description: "잠시 후 다시 시도하거나 이메일 로그인을 사용해주세요.",
    },
    "no-organization": {
      tone: "warning",
      title: "연결된 조직이 없습니다",
      description: "조직 초대를 확인하거나 새 조직 생성을 요청해주세요.",
    },
    "pending-approval": {
      tone: "info",
      title: "조직 승인을 기다리고 있습니다",
      description: "계정 인증은 완료됐지만 제품 업무 화면은 승인 후 열립니다.",
    },
    "session-expired": {
      tone: "warning",
      title: "세션이 만료되었습니다",
      description: "보안을 위해 다시 로그인해주세요.",
    },
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (state === "submitting") return
    setSubmitted(true)
    const firstError = Object.entries(fieldErrors).find(([, error]) => error)
    if (firstError) {
      ;(event.currentTarget as HTMLFormElement)
        .querySelector<HTMLInputElement>(`[name="${firstError[0]}"]`)
        ?.focus()
      return
    }
    setSubmitted(false)
    const valid =
      email.trim().toLowerCase() === "ecoya@ecoya.kr" && password === "ecoya"
    if (!valid) {
      setState("rejected")
      return
    }

    // Account, organization and product access are one server-owned landing
    // decision. Keep the form out of the way while that decision completes so
    // the user cannot submit the credentials again.
    setState("submitting")
    window.setTimeout(() => {
      if (initialProduct && onProductLanding) {
        onProductLanding(initialProduct)
        return
      }
      setPassword("")
      setState("authenticated")
    }, 350)
  }

  return (
    <AuthSurface
      variant="login"
      title={
        state === "authenticated" ? "사용할 제품을 선택해 주세요" : "로그인"
      }
      footer={
        state === "idle" ||
        state === "rejected" ||
        state === "provider-error" ||
        state === "network-error" ||
        state === "page-error" ||
        state === "rate-limited" ||
        state === "no-organization" ||
        state === "pending-approval" ||
        state === "session-expired" ? (
          <p className="text-center text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Button
              className="h-auto p-0"
              variant="link"
              onClick={() => onNavigate?.("signup")}
            >
              회원가입
            </Button>
          </p>
        ) : undefined
      }
    >
      {state === "submitting" ? (
        <div
          className="flex flex-col items-center gap-3 py-8 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
          <p className="font-semibold">로그인 처리 중</p>
          <p className="text-sm text-muted-foreground">잠시만 기다려 주세요.</p>
        </div>
      ) : state === "authenticated" ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            계정에 연결된 제품에서 계속할 곳을 선택하세요.
          </p>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trade OS</CardTitle>
              <CardDescription>거래와 문서 업무를 관리합니다.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                type="button"
                onClick={() => onProductLanding?.("erp")}
              >
                <Building2 /> Trade OS 열기
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SNAP</CardTitle>
              <CardDescription>문서와 현장 업무를 관리합니다.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={() => onProductLanding?.("snap")}
              >
                <MapPin /> SNAP 열기
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
          {loginNotice && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground"
            >
              <AlertCircle
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden
              />
              <p>{loginNotice}</p>
            </div>
          )}
          {showPreviewControls() && (
            <p className="text-xs text-muted-foreground">
              데모 계정: ecoya@ecoya.kr / ecoya
            </p>
          )}
          {stateFeedback[state] ? (
            <InlineFeedback feedback={stateFeedback[state]!} />
          ) : null}
          {state === "page-error" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setState("idle")}
            >
              <RefreshCw /> 로그인 화면으로 돌아가기
            </Button>
          )}
          <AuthInputField
            name="email"
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
            submitted={submitted}
          />
          <AuthInputField
            name="password"
            label="비밀번호"
            password
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            submitted={submitted}
          />
          <div className="flex justify-end">
            <Button
              className="h-auto p-0"
              type="button"
              variant="link"
              onClick={() => onNavigate?.("password-recovery")}
            >
              비밀번호 찾기
            </Button>
          </div>
          <Button type="submit">
            <ArrowRight /> 로그인
          </Button>
          <div className="my-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            또는
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <div className="grid gap-2">
            {[
              { name: "Google", icon: googleIcon },
              { name: "Apple", icon: appleIcon },
            ].map((provider) => (
              <Button
                key={provider.name}
                type="button"
                variant="outline"
                className="h-10 w-full"
                onClick={() => {
                  setPassword("")
                  setState("provider-error")
                }}
              >
                <provider.icon aria-hidden="true" className="size-4" />
                {provider.name}로 계속하기
              </Button>
            ))}
            {showPreviewControls() && (
              <Select
                value={state}
                onValueChange={(value) =>
                  value && (setPassword(""), setState(value as CommonAuthState))
                }
              >
                <SelectTrigger aria-label="로그인 데모 상태">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="idle">기본 상태</SelectItem>
                    <SelectItem value="rejected">인증 실패</SelectItem>
                    <SelectItem value="provider-error">
                      소셜 로그인 오류
                    </SelectItem>
                    <SelectItem value="network-error">네트워크 오류</SelectItem>
                    <SelectItem value="page-error">
                      계정·조직 조회 오류
                    </SelectItem>
                    <SelectItem value="rate-limited">
                      로그인 시도 제한
                    </SelectItem>
                    <SelectItem value="no-organization">조직 없음</SelectItem>
                    <SelectItem value="pending-approval">승인 대기</SelectItem>
                    <SelectItem value="session-expired">세션 만료</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </form>
      )}
    </AuthSurface>
  )
}

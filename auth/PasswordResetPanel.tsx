import { type ReactNode, useState } from "react"
import { Input } from "@shared/components/ui/input"
import { Button } from "@shared/components/ui/button"
import { EyeOff, Eye, ArrowLeft, Mail, Clock3, ArrowRight, RefreshCw, KeyRound, LogOut } from "lucide-react"
import { type CommonPrototypeScreenProps, AuthSurface, InlineFeedback, showPreviewControls } from "@auth/AuthSurface"

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: "current-password" | "new-password"
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        className="pr-10"
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        className="absolute top-0 right-0"
        type="button"
        variant="ghost"
        size="icon"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

type RecoveryStep = "request" | "sent" | "reset" | "expired" | "complete"

export function CommonPasswordRecoveryPrototype({
  onNavigate,
  initialProduct = "erp",
}: CommonPrototypeScreenProps) {
  const minimumLength = initialProduct === "erp" ? 6 : 8
  const [step, setStep] = useState<RecoveryStep>("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  return (
    <AuthSurface
      variant="recovery"
      title="비밀번호 복구"
      description="이메일로 받은 링크를 열어 새 비밀번호를 설정하세요. 링크는 30분 동안 한 번 사용할 수 있습니다."
      footer={
        <Button variant="link" onClick={() => onNavigate?.("login")}>
          <ArrowLeft /> 로그인으로 돌아가기
        </Button>
      }
    >
      {step === "request" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            setStep("sent")
          }}
        >
          <FormField label="이메일">
            <Input
              type="email"
              value={email}
              placeholder="name@company.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={!email}>
            <Mail /> 복구 링크 보내기
          </Button>
        </form>
      ) : null}
      {step === "sent" ? (
        <div className="flex flex-col gap-4">
          <InlineFeedback
            feedback={{
              tone: "success",
              title: "이메일을 확인해주세요",
              description:
                "등록된 계정이 있다면 입력하신 이메일로 복구 링크를 보냈습니다. 받은편지함과 스팸함을 확인해주세요.",
            }}
          />
          <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <Clock3 />
            <span>링크는 30분 동안 한 번 사용할 수 있습니다.</span>
          </div>
          {showPreviewControls() && (
            <Button onClick={() => setStep("reset")}>
              복구 링크 데모 열기 <ArrowRight />
            </Button>
          )}
          <Button variant="outline" onClick={() => setStep("request")}>
            <RefreshCw /> 다른 이메일로 재발급
          </Button>
        </div>
      ) : null}
      {step === "reset" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (password === confirm && password.length >= minimumLength)
              setStep("complete")
          }}
        >
          <FormField
            label="새 비밀번호"
            hint={`${minimumLength}자 이상 입력해주세요`}
          >
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          </FormField>
          <FormField
            label="새 비밀번호 확인"
            error={
              confirm && password !== confirm
                ? "비밀번호가 일치하지 않습니다."
                : undefined
            }
          >
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />
          </FormField>
          <Button
            type="submit"
            disabled={password.length < minimumLength || password !== confirm}
          >
            <KeyRound /> 비밀번호 변경
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep("expired")}
          >
            만료 링크 상태 보기
          </Button>
        </form>
      ) : null}
      {step === "expired" ? (
        <div className="flex flex-col gap-4">
          <InlineFeedback
            feedback={{
              tone: "error",
              title: "복구 링크가 만료됐습니다",
              description:
                "이미 사용했거나 새 링크 발급으로 폐기된 링크입니다.",
            }}
          />
          <Button onClick={() => setStep("request")}>
            <RefreshCw /> 새 링크 요청
          </Button>
        </div>
      ) : null}
      {step === "complete" ? (
        <div className="flex flex-col gap-4">
          <InlineFeedback
            feedback={{
              tone: "success",
              title: "비밀번호를 변경했습니다",
              description:
                "보안을 위해 기존 로그인 세션을 모두 종료했습니다. 새 비밀번호로 다시 로그인해주세요.",
            }}
          />
          <Button onClick={() => onNavigate?.("login")}>
            <LogOut /> 로그인 화면으로 이동
          </Button>
        </div>
      ) : null}
    </AuthSurface>
  )
}

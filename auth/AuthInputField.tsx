import { useId, useState } from "react"
import { CircleAlert, Eye, EyeOff, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AuthInputField({
  label,
  name,
  value,
  onChange,
  error,
  submitted,
  password = false,
  type = "text",
  autoComplete,
  placeholder,
  hint,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
  submitted: boolean
  password?: boolean
  type?: "text" | "email"
  autoComplete?: string
  placeholder?: string
  hint?: string
}) {
  const id = useId()
  const [touched, setTouched] = useState(false)
  const [visible, setVisible] = useState(false)
  const shownError = touched || submitted ? error : undefined
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[15px] leading-[22px] font-normal text-[var(--color-gray-2)]"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          required
          value={value}
          type={password ? (visible ? "text" : "password") : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`h-10 border-[var(--color-gray-6)] text-[17px] leading-6 placeholder:text-[var(--color-gray-7)] md:text-[17px] ${password ? "pr-11" : ""}`}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError || hint ? `${id}-message` : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        {password && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-2 size-8 text-[var(--color-gray-4)] [&_svg]:size-4"
            aria-label={`${label} ${visible ? "숨기기" : "보기"}`}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
      {shownError ? (
        <p
          id={`${id}-message`}
          className="flex items-start gap-1 text-[13px] leading-[18px] text-destructive"
          role="alert"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          {shownError}
        </p>
      ) : hint ? (
        <p
          id={`${id}-message`}
          className="flex items-start gap-1 text-[13px] leading-[18px] text-[var(--color-gray-5)]"
        >
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          {hint}
        </p>
      ) : null}
    </div>
  )
}

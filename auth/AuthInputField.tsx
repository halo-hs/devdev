import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@shared/components/ui/input"
import { Button } from "@shared/components/ui/button"

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
      <label htmlFor={id} className="text-base font-medium">
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
          className={`h-12 text-base md:text-base ${password ? "pr-12" : ""}`}
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
            className="absolute top-1 right-1 size-10"
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
          className="text-sm leading-6 text-destructive"
          role="alert"
        >
          {shownError}
        </p>
      ) : hint ? (
        <p
          id={`${id}-message`}
          className="text-sm leading-6 text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

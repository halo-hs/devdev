export function authFieldError(
  value: string,
  label: string,
  options: { email?: boolean; minLength?: number; match?: string } = {}
) {
  if (!value.trim())
    return label === "비밀번호 확인"
      ? "비밀번호를 한 번 더 입력해 주세요."
      : `${label}${["이름", "조직명", "이메일"].includes(label) ? "을" : "를"} 입력해 주세요.`
  if (options.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "이메일 주소 형식을 확인해 주세요. 예: name@company.com"
  if (options.minLength && value.length < options.minLength)
    return `비밀번호는 ${options.minLength}자 이상 입력해 주세요.`
  if (options.match !== undefined && value !== options.match)
    return "비밀번호가 일치하지 않습니다."
  return undefined
}

export type AuthLayoutVariant = "login" | "signup" | "recovery"
export const authGridColumns = {
  login: "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
  signup: "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
  recovery: "lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]",
} as const

// Figma 로그인 화면 3차: 48px primary and social actions with 17px labels.
export const authActionButtonClass =
  "h-12 w-full rounded-xl px-6 text-[17px] leading-6"
export const authSocialButtonClass = `${authActionButtonClass} gap-1.5 border-[var(--color-gray-9)] pr-6 pl-[22px] text-[var(--color-gray-2)] shadow-[0_1px_2px_rgb(5_29_57/10%)] [&_svg]:size-5`

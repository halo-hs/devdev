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
  login: "lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]",
  signup: "lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]",
  recovery: "lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]",
} as const

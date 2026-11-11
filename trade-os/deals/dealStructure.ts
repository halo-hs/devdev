// 통관 해당 여부 — 선적항·도착항으로 조용히 판단한다(로컬 시안).
// 원칙: 기본은 '통관 필요'. 두 항구가 모두 해외로 확인될 때만 '해당 없음'.
// 담당자가 직접 바꾼 값이 추론보다 우선한다.
import { createContext, useContext } from "react"

const portCountries: Record<string, string> = {
  busan: "KR", incheon: "KR", pyeongtaek: "KR", gwangyang: "KR", ulsan: "KR", krpus: "KR", krinc: "KR",
  melbourne: "AU", sydney: "AU", shanghai: "CN", ningbo: "CN", qingdao: "CN", singapore: "SG",
  hamburg: "DE", rotterdam: "NL", "ho chi minh": "VN", haiphong: "VN", tokyo: "JP", osaka: "JP",
  "los angeles": "US", "long beach": "US",
}

export function portCountry(port: string) {
  const key = port.trim().toLowerCase().replace(/\s*\(.*\)$/, "")
  if (/^[a-z]{2}[a-z0-9]{3}$/.test(key) && !portCountries[key]) return key.slice(0, 2).toUpperCase()
  return portCountries[key] ?? null
}

export type CustomsManual = "required" | "not_applicable" | null
export type Ports = { pol: string; pod: string }

export function autoCustoms(ports: Ports): "required" | "not_applicable" {
  const pol = portCountry(ports.pol)
  const pod = portCountry(ports.pod)
  // 모르는 항구가 있으면 바꾸지 않는다(보수적).
  return pol && pod && pol !== "KR" && pod !== "KR" ? "not_applicable" : "required"
}

export type DealCustomsContextValue = {
  ports: Ports
  setPorts: (ports: Ports) => void
  manual: CustomsManual
  setManual: (manual: CustomsManual) => void
}

export const DealCustomsContext = createContext<DealCustomsContextValue | null>(null)

export function useDealCustoms() {
  const value = useContext(DealCustomsContext)
  const ports = value?.ports ?? { pol: "", pod: "" }
  const auto = autoCustoms(ports)
  const effective = value?.manual ?? auto
  return {
    ports,
    auto,
    manual: value?.manual ?? null,
    setManual: value?.setManual,
    setPorts: value?.setPorts,
    notApplicable: effective === "not_applicable",
    route: `${ports.pol || "선적항 미정"} → ${ports.pod || "도착항 미정"}`,
    // 사람이 '해당 없음'으로 두었는데 도착항이 국내면 자동으로 바꾸지 않고 알리기만 한다.
    warning:
      value?.manual === "not_applicable" && portCountry(ports.pod) === "KR"
        ? `도착항이 국내(${ports.pod})인데 통관 ‘해당 없음’으로 바꿔 두었습니다.`
        : null,
  }
}

// 지급 계좌 변경 안내 닫기 — 화면에서만 숨긴다(백엔드 점수·위험은 그대로).
// 확인한 계좌에 묶어 저장하므로 계좌가 또 바뀌면 안내가 다시 뜬다.
export type BankNoticeAck = { acknowledged: boolean; acknowledge: () => void }
export const DealBankNoticeContext = createContext<BankNoticeAck | null>(null)
export function useDealBankNotice(): BankNoticeAck {
  return useContext(DealBankNoticeContext) ?? { acknowledged: false, acknowledge: () => {} }
}

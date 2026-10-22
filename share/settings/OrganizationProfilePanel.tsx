import { type ReactNode, useState } from "react"
import { languageOptions, SearchableSetting, countryOptions, timeZoneOptions } from "@share/settings/RegionControls"
import { PageHeading } from "@share/settings/views/SettingsSection"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { type SettingsRole, type ProductEntitlement } from "@share/settings/SettingsRoutePage"

function OrganizationField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2 [&_[role=combobox]]:h-10">
      {htmlFor ? <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label> : <p className="text-sm font-medium">{label}</p>}
      {children}
    </div>
  )
}

export function OrganizationPage({ role, products }: { role: SettingsRole; products: readonly ProductEntitlement[] }) {
  const editable = role === "owner"
  const [country, setCountry] = useState("KR")
  const [locale, setLocale] = useState("ko-KR")
  const [timezone, setTimezone] = useState("Asia/Seoul")
  const [saveError, setSaveError] = useState("")
  const locales = products.includes("erp") ? languageOptions : languageOptions.filter(option => ["ko-KR", "en-US", "ja-JP"].includes(option.value))
  const regionLabel = country === "KR" ? "시·도" : country === "JP" ? "도도부현" : "주·지역"
  const cityLabel = country === "KR" ? "시·군·구" : "도시"
  return (
    <div>
      <PageHeading title="조직 정보" description="현재 조직의 기본 정보와 주소, 언어를 관리합니다." />
      <form onSubmit={event => { event.preventDefault(); if (editable) setSaveError("조직 정보를 저장할 수 없습니다. 잠시 후 다시 시도해 주세요. 입력한 내용은 유지됩니다.") }} className="space-y-6">
        <section aria-labelledby="organization-basics" className="space-y-3">
          <h2 id="organization-basics" className="text-base font-semibold">기본 정보</h2>
          <Card className="shadow-none">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <OrganizationField label="법정 이름" htmlFor="organization-legal-name"><Input id="organization-legal-name" data-guide-target="organization" aria-label="법정 이름" autoComplete="organization" defaultValue="Hanbit Trading Co., Ltd." readOnly={!editable} /></OrganizationField>
                <OrganizationField label="표시 이름" htmlFor="organization-display-name"><Input id="organization-display-name" aria-label="표시 이름" defaultValue="한빛무역" readOnly={!editable} /></OrganizationField>
                <OrganizationField label="사업자·세무 식별값" htmlFor="organization-tax-id"><Input id="organization-tax-id" aria-label="사업자·세무 식별값" defaultValue="120-88-260708" readOnly={!editable} /></OrganizationField>
                <OrganizationField label="대표 연락처" htmlFor="organization-phone"><Input id="organization-phone" aria-label="대표 연락처" type="tel" autoComplete="tel" defaultValue="+82 2 2607 0801" readOnly={!editable} /></OrganizationField>
                <div className="sm:col-span-2">
                  <OrganizationField label="대표 이메일" htmlFor="organization-email"><Input id="organization-email" aria-label="대표 이메일" type="email" autoComplete="email" defaultValue="trade@hanbit.example" readOnly={!editable} /></OrganizationField>
                </div>
              </div>
              <div role="group" aria-labelledby="organization-address" className="space-y-4 border-t pt-5">
                <h3 id="organization-address" className="text-sm font-semibold">주소</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <OrganizationField label="국가·지역">
                    <SearchableSetting label="국가·지역" value={country} options={countryOptions} onChange={setCountry} disabled={!editable} />
                  </OrganizationField>
                  <OrganizationField label="우편번호" htmlFor="organization-postal-code"><Input id="organization-postal-code" aria-label="우편번호" autoComplete="postal-code" placeholder={country === "US" ? "예: 10001" : country === "JP" ? "예: 100-0001" : "우편번호"} readOnly={!editable} /></OrganizationField>
                  <OrganizationField label={regionLabel} htmlFor="organization-state"><Input id="organization-state" aria-label={regionLabel} autoComplete="address-level1" defaultValue="서울특별시" readOnly={!editable} /></OrganizationField>
                  <OrganizationField label={cityLabel} htmlFor="organization-city"><Input id="organization-city" aria-label={cityLabel} autoComplete="address-level2" defaultValue="중구" readOnly={!editable} /></OrganizationField>
                  <OrganizationField label="기본 주소" htmlFor="organization-address-line1"><Input id="organization-address-line1" aria-label="기본 주소" autoComplete="address-line1" placeholder="도로명, 건물 번호" readOnly={!editable} /></OrganizationField>
                  <OrganizationField label="상세 주소 (선택)" htmlFor="organization-address-line2"><Input id="organization-address-line2" aria-label="상세 주소" autoComplete="address-line2" placeholder="동, 층, 호수" readOnly={!editable} /></OrganizationField>
                </div>
                {country !== "KR" ? <p role="status" className="text-xs text-muted-foreground">국가를 변경했습니다. 기존 주소와 우편번호가 새 국가에 맞는지 확인해 주세요.</p> : null}
              </div>
              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <OrganizationField label="기본 언어">
                  <SearchableSetting label="기본 언어" value={locale} options={locales} onChange={setLocale} disabled={!editable} />
                </OrganizationField>
                <OrganizationField label="기본 시간대">
                  <SearchableSetting label="기본 시간대" value={timezone} options={timeZoneOptions} onChange={setTimezone} disabled={!editable} />
                </OrganizationField>
              </div>
            </CardContent>
          </Card>
        </section>
        {editable ? <div className="flex flex-wrap items-center justify-end gap-3">
          {saveError ? <p role="alert" className="w-full text-sm text-destructive">{saveError}</p> : null}
          <Button type="submit">조직 정보 저장</Button>
        </div> : <p className="text-xs text-muted-foreground">조직 정보 변경은 Organization OWNER에게 요청하세요.</p>}
      </form>
    </div>
  )
}

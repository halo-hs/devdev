import { useState } from "react"
import { PageHeading, SettingsSection } from "@share/settings/views/SettingsSection"
import { Badge } from "@/components/ui/badge"
import { SettingRow } from "@share/settings/views/SettingRow"
import { SearchableSetting, languageOptions, timeZoneOptions } from "@share/settings/RegionControls"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { SaveRow } from "@share/settings/views/SettingsSaveRow"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Download } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { appLocation } from "@/app/appLocation"
import { type SettingsRole } from "@share/settings/SettingsRoutePage"
import { BrandColorPicker } from "@share/settings/CompanyProfileSettings"

export function SnapSimplePage({
  type,
  role,
}: {
  type: "operations" | "branding" | "localization"
  role: SettingsRole
}) {
  const [channels, setChannels] = useState({ app: true, email: true })
  const [channelError, setChannelError] = useState("")
  const [locale, setLocale] = useState("ko-KR")
  const [timezone, setTimezone] = useState("Asia/Seoul")
  const content =
    type === "operations"
      ? {
          title: "현장 운영",
          description: "SNAP 현장 업무의 기본 동작과 전달 채널을 설정합니다.",
        }
      : type === "branding"
        ? {
            title: "브랜딩",
            description:
              "승인 리포트에 사용하는 표시 이름과 로고를 설정합니다.",
          }
        : {
            title: "지역화",
            description:
              "SNAP 현장 화면과 리포트의 언어·시간대·표시 형식을 설정합니다.",
          }
  return (
    <div>
      <PageHeading
        title={content.title}
        description={content.description}
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <SettingsSection title="기본 설정">
        <div>
          <SettingRow label={type === "localization" ? "기본 언어" : "표시 이름"}>
            {type === "localization" ? <SearchableSetting label="기본 언어" value={locale} options={languageOptions.filter(option => ["ko-KR", "en-US", "ja-JP"].includes(option.value))} onChange={setLocale} disabled={role === "member"} /> : <Input aria-label="표시 이름" defaultValue="ECOYA SNAP" readOnly={role === "member"} />}
          </SettingRow>
          {type === "branding" ? (
            <SettingRow label="브랜드 색상"><BrandColorPicker label="브랜드 색상" initialColor="#0B3971" disabled={role === "member"} /></SettingRow>
          ) : type === "operations" ? (
            <SettingRow label="전달 채널" description="업무 결과를 전달할 채널을 선택하세요.">
              <div role="group" aria-label="전달 채널" className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
                {([["app", "앱 링크"], ["email", "이메일"]] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox aria-label={label} disabled={role === "member"} checked={channels[key]} onCheckedChange={checked => { setChannels(current => ({ ...current, [key]: checked === true })); setChannelError("") }} />{label}
                </label>)}
              </div>
            </SettingRow>
          ) : (
            <SettingRow label="시간대"><SearchableSetting label="시간대" value={timezone} options={timeZoneOptions} onChange={setTimezone} disabled={role === "member"} /></SettingRow>
          )}
        </div>
        {type !== "branding" ? role !== "member" ? <div className="mt-5 flex flex-wrap justify-end gap-3 border-t pt-5">
          {channelError ? <p role="alert" className="w-full text-sm text-destructive">{channelError}</p> : null}
          <Button onClick={() => setChannelError(type === "operations" ? "전달 설정을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요. 선택한 채널은 유지됩니다." : "지역화 설정을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요. 선택한 언어와 시간대는 유지됩니다.")}>변경사항 저장</Button>
        </div> : <p className="mt-5 text-xs text-muted-foreground">설정 변경은 관리자에게 요청하세요.</p> : <SaveRow />}
      </SettingsSection>
    </div>
  )
}

export function SnapDataPage() {
  const rows = [
    ["원본 현장 증거", "365"],
    ["승인 리포트", "1825"],
    ["공유 링크", "30"],
    ["아카이브 전환", "180"],
  ]
  return (
    <div>
      <PageHeading
        title="데이터 및 보존"
        description="SNAP 데이터 거주 지역, 저장 공간, 보존·파기와 조직 데이터 작업을 관리합니다."
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <div className="space-y-7">
        <SettingsSection title="데이터 저장">
          <div>
            <SettingRow label="데이터 거주 지역">
              <Select defaultValue="kr">
                <SelectTrigger aria-label="데이터 거주 지역" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kr">대한민국</SelectItem>
                  <SelectItem value="sg">싱가포르</SelectItem>
                  <SelectItem value="eu">유럽 연합</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="조직 저장 공간"><p className="text-sm text-muted-foreground md:text-right">실시간 저장량 조회가 연결되지 않았습니다.</p></SettingRow>
          </div>
        </SettingsSection>
        <SettingsSection
          title="보존 정책"
          description="기존 법적 보존 의무보다 짧게 변경할 수 없습니다."
          action={<Badge variant="outline">일 단위</Badge>}
        >
          <div>
            {rows.map(([label, value]) => (
              <SettingRow key={label} label={label}><Input aria-label={label} type="number" min="1" defaultValue={value} /></SettingRow>
            ))}
          </div>
          <SaveRow label="데이터 정책 저장" />
        </SettingsSection>
        <SettingsSection
          title="조직 데이터 및 감사 이력"
          description="삭제 요청과 파기 실행은 감사 로그에 남습니다."
        >
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline">
              <Download /> 조직 데이터 내보내기
            </Button>
            <Button variant="outline">감사 로그 보기</Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

export function SnapUsagePage({ role }: { role: SettingsRole }) {
  // Display fixtures only. Technical limits remain server-owned and nonbilling.
  const usageExamples = [
    { label: "저장 공간", description: "사진·영상·문서의 저장 용량", used: 50, limit: 100, unit: "GB" },
    { label: "AI 처리 요청", description: "이번 달 누적 요청", used: 500, limit: 1000, unit: "회" },
    { label: "요청 속도", description: "최근 1분간 요청", used: 30, limit: 60, unit: "회/분" },
  ]
  return (
    <div>
      <PageHeading
        title="사용량 및 기술 한도"
        description="저장량·AI·속도 제한은 결제 잔액이 아닌 비과금 기술 한도입니다."
      />
      <SettingsSection title="현재 사용량">
        <dl className="divide-y">
          {usageExamples.map(({ label, description, used, limit, unit }) => {
            const percentage = Math.round((used / limit) * 100)
            return (
              <div key={label} className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-10">
                <dt>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </dt>
                <dd className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="tabular-nums">
                      <strong className="font-semibold">{used.toLocaleString("ko-KR")}</strong>
                      <span className="text-muted-foreground"> / {limit.toLocaleString("ko-KR")} {unit}</span>
                    </span>
                    <span className="font-medium tabular-nums">{percentage}% 사용</span>
                  </div>
                  <Progress
                    value={percentage}
                    aria-label={`${label} 사용량`}
                    aria-valuenow={percentage}
                    aria-valuetext={`${percentage}% 사용`}
                    className="h-1.5 [&_[data-slot=progress-indicator]]:bg-primary"
                  />
                </dd>
              </div>
            )
          })}
        </dl>
        {role === "owner" ? (
          <Button
            className="mt-5 ml-auto flex"
            variant="outline"
            onClick={() => appLocation.assign("/erp/settings?section=products")}
          >
            제품 및 구독 보기
          </Button>
        ) : null}
      </SettingsSection>
    </div>
  )
}

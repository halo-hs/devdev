import { useState } from "react"
import { ColorPicker } from "@/components/platform/ColorPicker"
import { PageHeading, SettingsSection } from "@share/settings/views/SettingsSection"
import { Badge } from "@/components/ui/Badge"
import { SettingRow } from "@share/settings/views/SettingRow"
import { Input } from "@/components/ui/Input"
import { BrandLogoInput } from "@share/settings/CompanyProfileAssetUploadField"
import { SaveRow } from "@share/settings/views/SettingsSaveRow"
import { Button } from "@/components/ui/Button"
import { type SettingsRole } from "@share/settings/SettingsRoutePage"

export function TradeDefaultsPage({ role }: { role: SettingsRole }) {
  const editable = role !== "member"
  const [brandingRevision, setBrandingRevision] = useState(0)
  return (
    <div>
      <PageHeading
        title="업무 기본 설정"
        description="Trade OS 문서와 업무에 적용되는 승인된 기본값입니다."
        action={<Badge variant="secondary">Trade OS</Badge>}
      />
      <div className="space-y-7">
        <SettingsSection
          title="문서 브랜딩"
          description="Organization 원본 정보와 별도로 저장됩니다."
        >
          <div>
            <SettingRow label="문서 표시 이름"><Input aria-label="문서 표시 이름" defaultValue="ECOYA Demo Co." readOnly={!editable} /></SettingRow>
            <SettingRow label="승인 색상"><BrandColorPicker label="승인 색상" initialColor="#0B3971" disabled={!editable} /></SettingRow>
            <SettingRow label="법적 footer"><Input aria-label="법적 footer" defaultValue="ECOYA Trade OS generated document" readOnly={!editable} /></SettingRow>
            <SettingRow label="승인 로고"><BrandLogoInput disabled={!editable} onChange={() => setBrandingRevision((value) => value + 1)} /></SettingRow>
          </div>
          {editable ? <SaveRow key={brandingRevision} label="브랜딩 저장" /> : null}
        </SettingsSection>
        <SettingsSection
          title="업무용 지급 정보"
          description="계좌 원문은 표시하지 않으며 변경에는 재인증이 필요합니다."
        >
          <div>
            <SettingRow label="은행·계좌 명의"><p className="text-sm font-medium md:text-right">DBS Bank · ECOYA Demo Co.</p></SettingRow>
            <SettingRow label="통화·계좌"><p className="text-sm font-medium md:text-right">USD · •••• 0708</p></SettingRow>
            <SettingRow label="지급 정보 변경" description="변경하려면 다시 인증해야 합니다." inlineControl>
              <div className="flex justify-end"><Button variant="outline" disabled={!editable}>재인증 후 변경</Button></div>
            </SettingRow>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

export function BrandColorPicker({
  label,
  initialColor,
  disabled = false,
}: {
  label: string
  initialColor: string
  disabled?: boolean
}) {
  const [color, setColor] = useState(initialColor)
  const pickerColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : initialColor
  return (
    <div className="flex items-center gap-2">
        <ColorPicker
          label={`${label} 선택`}
          value={pickerColor}
          disabled={disabled}
          onChange={setColor}
        />
        <Input
          aria-label={`${label} 코드`}
          value={color}
          readOnly={disabled}
          onChange={(event) => setColor(event.target.value)}
        />
    </div>
  )
}

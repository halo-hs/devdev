import { type EmailLimitsLoader } from "@share/settings/emailLimitsData"
import { useState } from "react"
import { PageHeading, SettingsSection } from "@share/settings/views/SettingsSection"
import { SettingRow } from "@share/settings/views/SettingRow"
import { Button } from "@/components/ui/Button"
import { Copy } from "lucide-react"
import { EmailLimits } from "@share/settings/EmailLimits"

export function EmailPage({ loadLimits }: { loadLimits: EmailLimitsLoader }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <PageHeading
        title="이메일로 문서 받기"
        description="현재 Organization 전용 주소로 전달된 문서는 문서 올리기 대기열에 들어옵니다."
      />
      <SettingsSection
        title="전용 수신 주소"
        description="주소 복사는 문서 수신·분석 성공을 의미하지 않습니다."
      >
        <SettingRow label="수신 주소" description="실제 주소는 로그와 캡처에서 마스킹됩니다.">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <code className="min-w-0 truncate text-sm">hanbit-••••@inbound.ecoya.app</code>
            <Button variant="outline" onClick={() => setCopied(true)}><Copy /> 주소 복사</Button>
          </div>
        </SettingRow>
        <EmailLimits loadLimits={loadLimits} />
        {copied ? (
          <p className="mt-3 text-right text-xs text-emerald-700">주소를 복사했습니다.</p>
        ) : null}
      </SettingsSection>
    </div>
  )
}

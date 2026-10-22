import { useState } from "react"
import { PageHeading, SettingsSection } from "@share/settings/views/SettingsSection"
import { SettingRow } from "@share/settings/views/SettingRow"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Button } from "@shared/components/ui/button"

export function AlertsPage() {
  const [saved, setSaved] = useState(false)
  const [channels, setChannels] = useState({ app: true, email: true })
  const [rules, setRules] = useState({
    approval: true,
    document: true,
    risk: false,
    settlement: true,
  })
  return (
    <div>
      <PageHeading
        title="Trade OS 알림 설정"
        description="Trade OS 업무 알림의 종류와 수신 채널을 설정합니다. SNAP 알림에는 적용되지 않습니다."
      />
      <div className="space-y-7">
        <SettingsSection
          title="수신 채널"
          description="채널 설정은 실제 알림 생성·전달·읽음 상태와 별개입니다."
        >
          <div>
            {[
              ["app", "앱 알림"],
              ["email", "이메일"],
            ].map(([id, label]) => (
              <SettingRow key={id} label={label} inlineControl>
                <div className="flex justify-end">
                <Checkbox
                  aria-label={label}
                  checked={channels[id as keyof typeof channels]}
                  onCheckedChange={(checked) =>
                    setChannels((value) => ({
                      ...value,
                      [id]: checked === true,
                    }))
                  }
                />
                </div>
              </SettingRow>
            ))}
          </div>
        </SettingsSection>
        <SettingsSection
          title="알림 종류"
          description="현재 Organization · Trade OS · Asia/Seoul 기준"
        >
          <div>
            {[
              ["approval", "승인 요청·반려"],
              ["document", "문서 분석·처리 실패"],
              ["risk", "거래 위험·불일치"],
              ["settlement", "정산 기한·입출금"],
            ].map(([id, label]) => (
              <SettingRow key={id} label={label} inlineControl>
                <div className="flex justify-end">
                <Checkbox
                  aria-label={label}
                  checked={rules[id as keyof typeof rules]}
                  onCheckedChange={(checked) =>
                    setRules((value) => ({ ...value, [id]: checked === true }))
                  }
                />
                </div>
              </SettingRow>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t pt-5">
            <Button onClick={() => setSaved(true)}>알림 설정 저장</Button>
            {saved ? (
              <span className="text-xs text-emerald-700">저장했습니다.</span>
            ) : null}
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

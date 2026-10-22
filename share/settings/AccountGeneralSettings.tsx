import { type WithdrawalGateway, type WithdrawalResult } from "@share/settings/withdrawalData"
import { useState } from "react"
import { AccountWithdrawal } from "@share/settings/AccountWithdrawalPanel"
import { PageHeading, SettingsSection } from "@share/settings/views/SettingsSection"
import { SettingRow } from "@share/settings/views/SettingRow"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { appLocation } from "@/app/appLocation"

export function AccountPage({ withdrawal, onOrganizations, onResult }: {
  withdrawal: WithdrawalGateway
  onOrganizations: () => void
  onResult: (result: WithdrawalResult) => void
}) {
  const [withdrawing, setWithdrawing] = useState(false)
  if (withdrawing) return <AccountWithdrawal gateway={withdrawal} onCancel={() => setWithdrawing(false)} onOrganizations={onOrganizations} onResult={onResult} />
  return (
    <div>
      <PageHeading
        title="내 계정"
        description="내 계정 정보와 로그인 보안을 확인합니다."
      />
      <div className="space-y-7">
        <SettingsSection title="내 계정">
          <div>
            <SettingRow label="이름"><Input aria-label="이름" defaultValue={withdrawal.identity.name} readOnly /></SettingRow>
            <SettingRow label="로그인 이메일"><Input aria-label="로그인 이메일" defaultValue={withdrawal.identity.email} readOnly /></SettingRow>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            업무 시간대와 기본 언어는 각 제품의 조직 설정에서 관리합니다.
          </p>
        </SettingsSection>
        <SettingsSection title="로그인 보안">
          <SettingRow label="비밀번호" description="로그인 비밀번호를 변경합니다." inlineControl>
            <div className="flex justify-end"><Button
              variant="outline"
              onClick={() => appLocation.assign("/password-recovery")}
            >비밀번호 변경</Button></div>
          </SettingRow>
        </SettingsSection>
        <SettingsSection title="계정 탈퇴">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">소속 조직을 확인한 뒤 계정 탈퇴를 진행합니다.<br />완료 후에는 계정을 복구할 수 없습니다.</p>
            <Button variant="outline" className="ml-auto text-destructive" onClick={() => setWithdrawing(true)}>계정 탈퇴</Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

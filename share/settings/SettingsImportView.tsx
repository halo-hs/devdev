import { PageHeading, SettingsSection } from "@share/settings/views/SettingsSection"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ImportPage({ kind }: { kind: "counterparty" | "deal" }) {
  const title = kind === "counterparty" ? "거래처 일괄 등록" : "거래 일괄 등록"
  return (
    <div>
      <PageHeading
        title={title}
        description="CSV 파일의 형식과 행을 검사한 뒤 현재 Organization 원장에 반영합니다."
      />
      <div className="space-y-7">
        <SettingsSection
          title="파일 선택"
          description="자료 종류를 바꾸면 선택 파일과 열 매핑을 재사용하지 않습니다."
        >
          <button
            type="button"
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center"
          >
            <Upload className="size-5 text-primary" />
            <span className="mt-3 text-sm font-medium">
              CSV 파일을 선택하거나 끌어놓으세요
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              필수 열과 형식을 먼저 확인합니다.
            </span>
          </button>
          <div className="mt-4 flex justify-end">
            <Button>
              <Upload /> 가져오기
            </Button>
          </div>
        </SettingsSection>
        <SettingsSection title="최근 가져오기 결과">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["전체", "120"],
              ["생성", "108"],
              ["중복", "8"],
              ["오류", "4"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted/35 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

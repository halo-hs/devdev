import { FileText, FileUp, MessageSquare, FolderOpen, Send } from "lucide-react"

export const tradeFunctions = [
  {
    title: "문서 만들기",
    short: "한 줄 → 송장·계약서",
    pain: "한 줄로 송장·계약서",
    description: "AI에게 한 줄 — 송장·계약서 초안. 엑셀 복붙은 끝.",
    icon: FileText,
  },
  {
    title: "문서 읽기",
    short: "PDF 업로드 → 필드 추출",
    pain: "PDF에서 필드 추출",
    description: "PDF 업로드 → AI 필드 추출·신뢰도. 다시 타이핑하지 않습니다.",
    icon: FileUp,
  },
  {
    title: "AI에게 묻기",
    short: "사내 거래 데이터 질문",
    pain: "질문으로 거래 조회",
    description:
      "사내 거래 데이터로 질문 — ‘이번 분기 ACME 받을 돈?’ 한 줄이면 숫자로.",
    icon: MessageSquare,
  },
  {
    title: "거래 정산",
    short: "받을·줄 돈·일정",
    pain: "거래별 수금·지급 일정",
    description: "거래 방향에 따라 받을 돈·줄 돈·자금 일정.",
    icon: FolderOpen,
  },
  {
    title: "고객에게 전달",
    short: "Magic Link 전달",
    pain: "링크 전달·열람 확인",
    description: "확정 문서를 Magic Link로. 열람 기록까지 남습니다.",
    icon: Send,
  },
]

import { Wand2, LayoutDashboard, ClipboardList, FileText, Camera, Users, CalendarDays, Workflow, Building2, ShieldCheck } from "lucide-react"

export const snapNavGroups = [
  {
    label: "",
    items: [["처음 시작하기", Wand2, "SC-10"]],
  },
  {
    label: "현장 업무",
    items: [
      ["대시보드", LayoutDashboard, "SC-17"],
      ["업무", ClipboardList, "SC-18"],
      ["보고서", FileText, "SC-22"],
    ],
  },
  {
    label: "증거·고객",
    items: [
      ["증빙 보관함", Camera, "SC-23"],
      ["고객", Users, "SC-24"],
    ],
  },
  {
    label: "연결·운영",
    items: [
      ["캘린더", CalendarDays, "SC-25"],
      ["워크플로우", Workflow, "SC-26"],
      ["내보내기·연동", Building2, "SC-27"],
      ["작업자 · 작업 매니저", Users, "SC-28"],
      ["시정조치", ShieldCheck, "SC-29"],
    ],
  },
] as const

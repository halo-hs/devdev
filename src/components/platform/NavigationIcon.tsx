import usageIcon from "@/assets/navigation/usage.svg?url"
import billingIcon from "@/assets/navigation/billing.svg?url"
import languageIcon from "@/assets/navigation/language.svg?url"
import logoutIcon from "@/assets/navigation/logout.svg?url"
import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import icon0 from "@/assets/navigation/start.svg?url"
import icon1 from "@/assets/navigation/home.svg?url"
import icon2 from "@/assets/navigation/upload.svg?url"
import icon3 from "@/assets/navigation/document.svg?url"
import icon4 from "@/assets/navigation/chat.svg?url"
import icon5 from "@/assets/navigation/deals.svg?url"
import icon6 from "@/assets/navigation/ship.svg?url"
import icon7 from "@/assets/navigation/settlement.svg?url"
import icon8 from "@/assets/navigation/monitoring.svg?url"
import icon9 from "@/assets/navigation/report.svg?url"
import icon10 from "@/assets/navigation/sales.svg?url"
import icon11 from "@/assets/navigation/settings.svg?url"
import icon12 from "@/assets/navigation/help.svg?url"
import icon13 from "@/assets/navigation/notification.svg?url"
import icon14 from "@/assets/navigation/slide.svg?url"
import icon15 from "@/assets/navigation/chevron-down.svg?url"

const icons = {
  usage: usageIcon, billing: billingIcon, language: languageIcon, logout: logoutIcon,
  "start": icon0,
  "home": icon1,
  "upload": icon2,
  "document": icon3,
  "chat": icon4,
  "deals": icon5,
  "ship": icon6,
  "settlement": icon7,
  "monitoring": icon8,
  "report": icon9,
  "sales": icon10,
  "settings": icon11,
  "help": icon12,
  "notification": icon13,
  "slide": icon14,
  "chevron-down": icon15,
} as const

/** Original Figma SVGs used as masks so menu states inherit their semantic color. */
export function NavigationIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  return <span aria-hidden="true" data-nav-icon={name} className={cn("navigation-icon", (name === "slide" || name === "chevron-down" || name === "usage") && "navigation-icon-24", (name === "language" || name === "logout") && "navigation-icon-16", className)} style={{ "--navigation-icon": `url("${icons[name]}")` } as CSSProperties} />
}

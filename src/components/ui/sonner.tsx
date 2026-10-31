"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import ErrorIcon from "@/assets/icons/icon-error-circle.svg"
import InfoIcon from "@/assets/icons/icon-info.svg"
import LoaderIcon from "@/assets/icons/icon-arrow-sync.svg"
import SuccessIcon from "@/assets/icons/icon-checkmark-circle.svg"
import WarningIcon from "@/assets/icons/icon-exclamation.svg"

const Toaster = ({ style, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <SuccessIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <WarningIcon className="size-4" />,
        error: <ErrorIcon className="size-4" />,
        loading: <LoaderIcon className="size-4 animate-spin" />,
      }}
      closeButton
      style={{ "--width": "380px", ...style } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import ErrorIcon from "@ecoya/design-system/assets/icons/icon-error-circle.svg"
import InfoIcon from "@ecoya/design-system/assets/icons/icon-info.svg"
import LoaderIcon from "@ecoya/design-system/assets/icons/icon-arrow-sync.svg"
import SuccessIcon from "@ecoya/design-system/assets/icons/icon-checkmark-circle.svg"
import WarningIcon from "@ecoya/design-system/assets/icons/icon-exclamation.svg"

const Toaster = ({ ...props }: ToasterProps) => {
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
      style={
        {
          "--normal-bg": "var(--surface-background)",
          "--normal-text": "var(--surface-foreground)",
          "--normal-border": "var(--surface-border)",
          "--border-radius": "var(--r-md)",
        } as React.CSSProperties
      }
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

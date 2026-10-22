import type { ComponentProps } from "react"
import { Toaster as DSToaster } from "@/components/ds2/ui/Sonner"

function Toaster({ style, ...props }: ComponentProps<typeof DSToaster>) {
  return <DSToaster closeButton {...props} style={{ "--width": "380px", ...style } as ComponentProps<typeof DSToaster>["style"]} />
}

export { Toaster }

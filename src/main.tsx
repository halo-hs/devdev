import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"

import "./index.css"
import App from "./App.tsx"
import { CommonEntry } from "@/common-entry"
import { Toaster } from "../packages/shared-ui/src/components/ui/sonner"
import { TooltipProvider } from "../packages/shared-ui/src/components/ui/tooltip"
import { configureSnapRuntime } from "@snap/lib/snap-runtime"

configureSnapRuntime()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <CommonEntry>
          <App />
        </CommonEntry>
        <Toaster
          position="top-center"
          offset={72}
          mobileOffset={72}
          duration={3500}
          closeButton
          richColors
        />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)

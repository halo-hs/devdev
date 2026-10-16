/* eslint react-refresh/only-export-components: off -- Vite entrypoint renders the app and is not a Fast Refresh module. */
import "./app/project-base"
import { lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"

import "./index.css"
import App from "./App.tsx"
import { CommonEntry } from "@/app/public-entry"
import { Toaster } from "../packages/shared-ui/src/components/ui/sonner"
import { TooltipProvider } from "../packages/shared-ui/src/components/ui/tooltip"
import { configureSnapRuntime } from "@snap/lib/snap-runtime"
import { appLocation } from "@/app/app-location"

const TrialDesignPreview = lazy(() => import("@auth/preview/trial-design-preview"))
const trialDesignPreview = (import.meta.env.DEV || import.meta.env.MODE === "design-preview") && appLocation.pathname === "/preview/trial-start"

configureSnapRuntime()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        {trialDesignPreview ? <Suspense fallback={<p className="p-8" role="status">화면을 준비하는 중…</p>}><TrialDesignPreview /></Suspense> : <CommonEntry>
          <App />
        </CommonEntry>}
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

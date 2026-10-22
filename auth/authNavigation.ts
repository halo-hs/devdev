import { appLocation } from "@/app/app-location"

// State inspection is opt-in locally and never exposed by a production build.
export function showPreviewControls() {
  return (
    import.meta.env.DEV &&
    new URLSearchParams(appLocation.search).get("preview") === "1"
  )
}

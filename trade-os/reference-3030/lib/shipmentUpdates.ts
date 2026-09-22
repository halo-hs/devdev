/** Notify mounted views/tabs to re-read their own authorized shipment data. */
type ShipmentChange = { shipmentId: string; dealId?: string | null }
const eventName = "ecoya:shipment-updated"
const channel = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
  ? new BroadcastChannel(eventName) : null
export function publishShipmentUpdate(change: ShipmentChange) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(eventName, { detail: change }))
  channel?.postMessage(change)
}
export function subscribeShipmentUpdates(listener: (change: ShipmentChange) => void) {
  const receive = (data: unknown) => {
    if (!data || typeof data !== "object" || !("shipmentId" in data) || typeof data.shipmentId !== "string") return
    listener(data as ShipmentChange)
  }
  const local = (event: Event) => receive((event as CustomEvent).detail)
  const remote = (event: MessageEvent) => receive(event.data)
  window.addEventListener(eventName, local)
  channel?.addEventListener("message", remote)
  return () => {
    window.removeEventListener(eventName, local)
    channel?.removeEventListener("message", remote)
  }
}

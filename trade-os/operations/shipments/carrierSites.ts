// Only exact, verified names and aliases are mapped. A container prefix or a
// partial carrier name is not enough evidence to choose a carrier site.
const supportedCarriers = new Set([
  "maersk", "maersk line", "maeu", "hapag lloyd", "hapaglloyd", "hlcu", "cma cgm", "cmacgm", "cmdu", "hmm", "hyundai merchant marine", "hdmu", "zim", "zimu", "one", "ocean network express", "oney",
].map(carrierKey));

const carrierSites = new Map<string, string>([
  ["kmtc", "https://www.ekmtc.com/"], ["korea marine transport", "https://www.ekmtc.com/"], ["고려해운", "https://www.ekmtc.com/"],
  ["sinokor", "https://ebiz.sinokor.co.kr/?lang=EN"], ["sinokor merchant marine", "https://ebiz.sinokor.co.kr/?lang=EN"], ["장금상선", "https://ebiz.sinokor.co.kr/?lang=EN"],
  ["heung a line", "https://ebiz.heungaline.com/?lang=EN"], ["heunga line", "https://ebiz.heungaline.com/?lang=EN"], ["흥아라인", "https://ebiz.heungaline.com/?lang=EN"],
  ["namsung", "https://namsung.co.kr/"], ["namsung shipping", "https://namsung.co.kr/"], ["남성해운", "https://namsung.co.kr/"],
  ["ck line", "https://es.ckline.co.kr/"], ["ckline", "https://es.ckline.co.kr/"], ["천경해운", "https://es.ckline.co.kr/"],
  ["pancon", "https://www.pancon.co.kr/"], ["pancon line", "https://www.pancon.co.kr/"], ["범주해운", "https://www.pancon.co.kr/"],
  ["dongjin", "https://www.djship.co.kr/"], ["dongjin shipping", "https://www.djship.co.kr/"], ["동진상선", "https://www.djship.co.kr/"],
  ["msc", "https://www.msc.com/en/track-a-shipment"], ["mediterranean shipping company", "https://www.msc.com/en/track-a-shipment"],
  ["cosco", "https://elines.coscoshipping.com/ebusiness/cargoTracking"], ["cosco shipping lines", "https://elines.coscoshipping.com/ebusiness/cargoTracking"],
  ["evergreen", "https://www.shipmentlink.com/"], ["evergreen line", "https://www.shipmentlink.com/"],
  ["yang ming", "https://www.yangming.com/"], ["yang ming marine transport", "https://www.yangming.com/"],
  ["pil", "https://www.pilship.com/digital-solutions/?id=track-trace&tab=customer"], ["pacific international lines", "https://www.pilship.com/digital-solutions/?id=track-trace&tab=customer"],
  ["oocl", "https://www.oocl.com/"], ["orient overseas container line", "https://www.oocl.com/"],
  ["wan hai", "https://shipper.wanhai.com/index.jsp"], ["wan hai lines", "https://shipper.wanhai.com/index.jsp"],
  ["sitc", "https://ebusiness.sitcline.com/"], ["sitc container lines", "https://ebusiness.sitcline.com/"],
  ["rcl", "https://eservice.rclgroup.com/CargoTracking/"], ["regional container lines", "https://eservice.rclgroup.com/CargoTracking/"],
  ["ts lines", "https://www.tslines.com/jp/tracking"], ["tslines", "https://www.tslines.com/jp/tracking"], ["t s lines", "https://www.tslines.com/jp/tracking"],
  ["emirates shipping line", "https://www.emiratesline.com/zh-hans/track/"],
].map(([name, href]) => [carrierKey(name), href] as const));

function carrierKey(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase().replace(/[.(),·\-]+/g, "").replace(/\s+/g, " ");
}

export function carrierTrackingAction(name: string | null | undefined): { kind: "refresh" } | { kind: "site"; href: string } | { kind: "unknown" } {
  const key = carrierKey(name);
  if (supportedCarriers.has(key)) return { kind: "refresh" };
  const href = carrierSites.get(key);
  return href ? { kind: "site", href } : { kind: "unknown" };
}

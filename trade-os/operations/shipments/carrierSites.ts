// Only exact, verified names and aliases are mapped. A container prefix or a
// partial carrier name is not enough evidence to choose a carrier site.
const supportedCarriers = new Set([
  "maersk", "maersk line", "maeu", "hapag lloyd", "hapaglloyd", "hlcu", "cma cgm", "cmacgm", "cmdu", "hmm", "hyundai merchant marine", "hdmu", "zim", "zimu", "one", "ocean network express", "oney",
].map(carrierKey));

const carrierSites = new Map<string, string>([
  ["고려해운", "https://www.ekmtc.com/"], ["Korea Marine Transport Co., Ltd.", "https://www.ekmtc.com/"], ["KMTC", "https://www.ekmtc.com/"],
  ["장금상선", "https://ebiz.sinokor.co.kr/?lang=EN"], ["SINOKOR", "https://ebiz.sinokor.co.kr/?lang=EN"],
  ["흥아라인", "https://ebiz.heungaline.com/?lang=EN"], ["Heung-A Line", "https://ebiz.heungaline.com/?lang=EN"], ["HEUNG A LINE", "https://ebiz.heungaline.com/?lang=EN"],
  ["남성해운", "https://namsung.co.kr/"], ["NAMSUNG SHIPPING", "https://namsung.co.kr/"],
  ["천경해운", "https://es.ckline.co.kr/"], ["CK LINE CO., LTD.", "https://es.ckline.co.kr/"], ["CK Line", "https://es.ckline.co.kr/"], ["천경해운 주식회사", "https://es.ckline.co.kr/"],
  ["범주해운", "https://www.pancon.co.kr/"], ["PANCON", "https://www.pancon.co.kr/"],
  ["동진상선", "https://www.djship.co.kr/"], ["DONGJIN SHIPPING", "https://www.djship.co.kr/"], ["DONGJIN", "https://www.djship.co.kr/"],
  ["MSC", "https://www.msc.com/en/track-a-shipment"], ["MSC Mediterranean Shipping Company", "https://www.msc.com/en/track-a-shipment"],
  ["COSCO SHIPPING Lines", "https://elines.coscoshipping.com/ebusiness/cargoTracking"],
  ["Evergreen", "https://www.shipmentlink.com/"], ["Evergreen Marine Corporation", "https://www.shipmentlink.com/"], ["Evergreen Marine Corp.", "https://www.shipmentlink.com/"], ["EMC", "https://www.shipmentlink.com/"], ["Evergreen Line", "https://www.shipmentlink.com/"],
  ["Yang Ming", "https://www.yangming.com/"], ["Yang Ming Marine Transport Corporation", "https://www.yangming.com/"],
  ["PIL", "https://www.pilship.com/digital-solutions/?id=track-trace&tab=customer"], ["Pacific International Lines", "https://www.pilship.com/digital-solutions/?id=track-trace&tab=customer"],
  ["OOCL", "https://www.oocl.com/"], ["OOLU", "https://www.oocl.com/"],
  ["Wan Hai", "https://shipper.wanhai.com/index.jsp"], ["WAN HAI LINES LTD.", "https://shipper.wanhai.com/index.jsp"],
  ["SITC", "https://ebusiness.sitcline.com/"], ["SITC SHIPPING Lines", "https://ebusiness.sitcline.com/"],
  ["RCL", "https://eservice.rclgroup.com/CargoTracking/"],
  ["T.S. Lines", "https://www.tslines.com/jp/tracking"], ["TS Lines", "https://www.tslines.com/jp/tracking"],
  ["Emirates Shipping Line", "https://www.emiratesline.com/zh-hans/track/"], ["ESL", "https://www.emiratesline.com/zh-hans/track/"],
].map(([name, href]) => [carrierKey(name), href] as const));

function carrierKey(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.(),-]/g, "");
}

export function carrierTrackingAction(name: string | null | undefined): { kind: "refresh" } | { kind: "site"; href: string } | { kind: "unknown" } {
  const key = carrierKey(name);
  if (supportedCarriers.has(key)) return { kind: "refresh" };
  const href = carrierSites.get(key);
  return href ? { kind: "site", href } : { kind: "unknown" };
}

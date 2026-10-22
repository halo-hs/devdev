import common from "./ko/common.json"
import erpReports from "./ko/erp-reports.json"
import erpSalesPerformance from "./ko/erp-sales-performance.json"
import erpMonitor from "./ko/erp-monitor.json"
import erpDeals from "./ko/erp-deals.json"
import auth from "./ko/auth.json"
import erpSettlement from "./ko/erp-settlement.json"
import erpCommon from "./ko/erp-common.json"
import erpShipments from "./ko/erp-shipments.json"
export const messages = {erpCommon, erpDeals, erpMonitor, erpReports, erpSalesPerformance, erpSettlement, erpShipments, auth, common} as const
export type AppMessages = typeof messages
export type AppLocaleTag = "ko-KR"
export function localeTag(_locale: string): AppLocaleTag { return "ko-KR" }

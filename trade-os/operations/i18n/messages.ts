import common from "../messages/ko/common.json"
import erpReports from "../messages/ko/erp-reports.json"
import erpSalesPerformance from "../messages/ko/erp-sales-performance.json"
import erpMonitor from "../messages/ko/erp-monitor.json"
import erpDeals from "../messages/ko/erp-deals.json"
import auth from "../messages/ko/auth.json"
import erpSettlement from "../messages/ko/erp-settlement.json"
import erpCommon from "../messages/ko/erp-common.json"
import erpShipments from "../messages/ko/erp-shipments.json"
export const messages = {erpCommon, erpDeals, erpMonitor, erpReports, erpSalesPerformance, erpSettlement, erpShipments, auth, common} as const
export type AppMessages = typeof messages
export type AppLocaleTag = "ko-KR"
export function localeTag(_locale: string): AppLocaleTag { return "ko-KR" }

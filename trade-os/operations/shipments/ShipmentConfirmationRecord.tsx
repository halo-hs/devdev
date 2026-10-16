import type { Shipment } from '../lib/api/shipments';
import { formatDateTime } from '../lib/orgDate';
import { useLocaleTag } from '../i18n/useLocaleTag';

export function ShipmentConfirmationRecord({ shipment }: { shipment: Shipment }) {
  const locale = useLocaleTag();
  return <p className="text-body-13 text-text-muted">운송 상태 최근 확인: {shipment.confirmed_status_by || '확인자 정보 없음'} · {shipment.confirmed_status_at ? formatDateTime(shipment.confirmed_status_at, locale) : '확인 시각 정보 없음'}</p>;
}

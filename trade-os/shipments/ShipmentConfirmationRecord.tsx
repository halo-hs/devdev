import type { Shipment } from '../lib/api/shipments';
import { formatDateTime } from '../lib/orgDate';
import { useLocaleTag } from '../lib/i18n/useLocaleTag';

export function ShipmentConfirmationRecord({ shipment }: { shipment: Shipment }) {
  const locale = useLocaleTag();
  return <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">운송 상태 최근 확인: {shipment.confirmed_status_by || '확인자 정보 없음'} · {shipment.confirmed_status_at ? formatDateTime(shipment.confirmed_status_at, locale) : '확인 시각 정보 없음'}</p>;
}

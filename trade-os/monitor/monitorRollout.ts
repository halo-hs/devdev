// FS-06 §4 운영 감시 기준시각과 부분 실패:
//
// > 혼합 배포에서 `data_as_of`나 `timezone`이 없는 구 응답은 현재 시각으로 합성하지 않고 그
// > 영역의 `invalid timestamp` 실패로 처리한다. backend additive DTO를 먼저 배포하고 영역별
// > UI flag를 연다.
// > rollback은 timestamp UI와 새 요청만 끄고 영역별 마지막 성공 cache를 read-only로 보존한다.
//
// 그 "영역별 UI flag" 가 이것이다. 기본값은 켜짐 — 이미 배포된 backend additive DTO 를 소비하는
// 현행 동작이 기본이고, 환경변수는 되돌릴 때만 명시적으로 끈다.
//
// 끈 상태(rollback)의 계약은 정확히 두 가지다.
//  1. timestamp UI 를 끈다 — 영역별 기준시각을 렌더하지 않는다.
//  2. 새 요청을 끈다 — 기준시각을 다시 계산하려는 주기 갱신을 걸지 않는다.
// 마지막 성공 cache 는 건드리지 않는다. 지우거나 0·빈 상태로 덮지 않고 read-only 로 남긴다.

const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

/**
 * 영역별 기준시각(`data_as_of`) UI 와 그 갱신 요청이 켜져 있는지.
 *
 * `NEXT_PUBLIC_MONITOR_AREA_TIMESTAMPS=0|false|no|off` 이면 rollback 상태다.
 * 미설정·그 외 값은 켜짐 — flag 오타로 화면이 조용히 반쪽이 되지 않게 한다.
 */
export function isMonitorAreaTimestampEnabled(): boolean {
  const flag = (undefined as string | undefined)?.trim().toLowerCase();
  if (flag === undefined || flag === "") return true;
  return !DISABLED_VALUES.has(flag);
}

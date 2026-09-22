import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// 커스텀 타이포 토큰(text-header-26, text-body-14 등)을 twMerge가 text-color
// 그룹으로 오분류해 색 클래스와 병합 시 font-size가 삭제되는 문제 교정.
// (docs/design/products-ds-parity.md RECONCILE #10)
const isEcoyaTypoSize = (value: string) =>
  /^(?:header|display|body|button|label|badge)-\d+$/.test(value);

const twMergeEcoya = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [isEcoyaTypoSize] }],
    },
  },
});

export function cn(...classes: Array<ClassValue>) {
  return twMergeEcoya(clsx(classes));
}

export const cx = cn;

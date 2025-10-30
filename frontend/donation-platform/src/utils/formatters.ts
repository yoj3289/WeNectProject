/**
 * 숫자를 금액 형식으로 포맷팅
 * @param amount - 포맷팅할 금액
 * @returns 천단위 쉼표가 포함된 금액 문자열
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('ko-KR');
};

/**
 * 달성률 계산
 * @param current - 현재 금액
 * @param target - 목표 금액
 * @returns 퍼센트 값 (0-100)
 */
export const calculatePercentage = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

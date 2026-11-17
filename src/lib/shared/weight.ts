/** 1온스(oz)의 그램 값(국제 상용 온스) */
export const GRAMS_PER_OZ = 28.3495;

/**
 * 무게 표기(U4, D-038): "7.9oz · 약 224g". 데이터는 oz이고 g은 환산값이라 "약"을 붙이고 정수로 반올림한다.
 * 결과 카드·비교 표·홈 띠·둘러보기 목록이 같이 쓴다. 눈금 막대(SpecScale)는 oz만 쓴다.
 */
export function formatWeight(oz: number): string {
  return `${oz}oz · 약 ${Math.round(oz * GRAMS_PER_OZ)}g`;
}

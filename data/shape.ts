export type Shape = "standard" | "hybrid" | "elongated" | "widebody";

/**
 * 형태 분류 규칙(docs/decisions.md D-018). 임계값은 일반적으로 알려진 구분에서 가져온 가설이며
 * 출처마다 기준이 다르다. 실제 제품 데이터를 본 뒤 조정하고, 바꾸면 D-018을 갱신한다.
 */
export const SHAPE_RULE = {
  widebodyMinWidthIn: 8.0,
  elongatedMinLengthIn: 16.5,
  hybridMinLengthIn: 16.1,
  /** 임계값과 이 거리 이내면 사람이 확인하도록 표시한다 */
  boundaryMarginIn: 0.1,
} as const;

// 부동소수점 오차(예: 16.4 vs 16.5의 차이가 0.0999..)로 경계 판정이 흔들리지 않게 한다
const EPS = 1e-9;

/**
 * 제조사가 형태를 직접 말하지 않을 때 길이·폭(인치)으로 분류한다.
 * 폭이 8.0 이상이면 widebody, 아니면 길이 16.5 이상 elongated, 16.1 이상 hybrid, 그 미만 standard.
 */
export function inferShape(lengthIn: number, widthIn: number): { shape: Shape; nearBoundary: boolean } {
  const r = SHAPE_RULE;
  const shape: Shape =
    widthIn >= r.widebodyMinWidthIn
      ? "widebody"
      : lengthIn >= r.elongatedMinLengthIn
        ? "elongated"
        : lengthIn >= r.hybridMinLengthIn
          ? "hybrid"
          : "standard";
  const near = (value: number, threshold: number) => Math.abs(value - threshold) <= r.boundaryMarginIn + EPS;
  const nearBoundary =
    near(widthIn, r.widebodyMinWidthIn) || near(lengthIn, r.elongatedMinLengthIn) || near(lengthIn, r.hybridMinLengthIn);
  return { shape, nearBoundary };
}

// 제조사가 패들의 형태를 말한 표현 → 우리 값. 핸들·그립 설명에 쓰인 단어에는 적용하지 않는다
const MANUFACTURER_TERMS: Record<string, Shape> = {
  standard: "standard",
  classic: "standard",
  traditional: "standard",
  hybrid: "hybrid",
  elongated: "elongated",
  widebody: "widebody",
  wide: "widebody",
};

/** 제조사가 패들 형태로 적은 표현을 매핑한다. 목록에 없으면 undefined(치수 규칙으로 판단) */
export function mapManufacturerShape(term: string): Shape | undefined {
  return MANUFACTURER_TERMS[term.trim().toLowerCase()];
}

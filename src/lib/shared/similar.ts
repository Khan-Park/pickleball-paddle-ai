import type { PaddleSpec } from "../../../data/schema";
import { SHAPE_LABEL } from "./shape-labels";

/**
 * 스펙이 비슷한 제품 고르기(T-024). 상세 시트의 "비슷한 제품"이 쓴다.
 * - 입력은 스펙(PaddleSpec)만 받는다. 구매 링크·수수료·가격 비교 검색어는 받지 않는다(규칙 1과 같은 원칙, purity 테스트)
 * - 가격도 쓰지 않는다. 비슷한 스펙을 보여 주는 기능이지 더 싼 제품을 찾는 기능이 아니다
 * - 추천 조건(예산·대회 승인)과 무관하다. 화면이 가격·승인을 함께 보여 사용자가 판단한다
 */

/** 거리 가중치(처음 제안값, 사용자 조사로 정한 값이 아니다). 무게 0.5oz 차이 = 코어 2mm 차이 = 거리 1 */
export const SIMILAR_WEIGHTS = { weightOz: 0.5, coreMm: 2, shape: 1.5, surface: 0.5 } as const;

export type SimilarMatch = { id: string; distance: number; reasons: string[] };

type SimilarSpec = Pick<PaddleSpec, "id" | "weight_oz" | "core_mm" | "shape" | "surface">;

export function similarDistance(a: SimilarSpec, b: SimilarSpec): number {
  return (
    Math.abs(a.weight_oz - b.weight_oz) / SIMILAR_WEIGHTS.weightOz +
    Math.abs(a.core_mm - b.core_mm) / SIMILAR_WEIGHTS.coreMm +
    (a.shape === b.shape ? 0 : SIMILAR_WEIGHTS.shape) +
    (a.surface === b.surface ? 0 : SIMILAR_WEIGHTS.surface)
  );
}

/** 0.1 단위로 반올림한 차이. 부동소수 오차(7.9 - 7.7 = 0.20000000000000018)를 없앤다 */
const diff = (a: number, b: number) => Math.round((a - b) * 10) / 10;
const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

/** 비슷한 이유를 글자로. 예: ["같은 넓은 형", "무게 +0.2oz", "코어 같음"] */
export function similarReasons(target: SimilarSpec, other: SimilarSpec): string[] {
  const weight = diff(other.weight_oz, target.weight_oz);
  const core = diff(other.core_mm, target.core_mm);
  return [
    other.shape === target.shape ? `같은 ${SHAPE_LABEL[other.shape]}` : SHAPE_LABEL[other.shape],
    weight === 0 ? "무게 같음" : `무게 ${signed(weight)}oz`,
    core === 0 ? "코어 같음" : `코어 ${signed(core)}mm`,
  ];
}

/**
 * target과 가장 비슷한 제품 count개. 자기 자신과 exclude의 id는 뺀다. 거리가 같으면 id 순으로 고정한다.
 */
export function similarPaddles(
  target: SimilarSpec,
  all: readonly SimilarSpec[],
  { exclude = [], count = 2 }: { exclude?: readonly string[]; count?: number } = {},
): SimilarMatch[] {
  const skip = new Set([target.id, ...exclude]);
  return all
    .filter((p) => !skip.has(p.id))
    .map((p) => ({ id: p.id, distance: similarDistance(target, p), reasons: similarReasons(target, p) }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
    .slice(0, count);
}

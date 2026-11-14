import type { PaddleSpec } from "../../../data/schema";
import type { BudgetRange, UserProfile } from "./profile";

/**
 * 예산 값은 0 이상의 유한한 숫자여야 한다. NaN·음수·무한대는 비교가 모두 거짓이 되어
 * 제한이 조용히 풀리므로 RangeError로 거부한다. (docs/decisions.md D-011)
 */
function assertValidBudget({ min_krw, max_krw }: BudgetRange): void {
  for (const [name, value] of [["min_krw", min_krw], ["max_krw", max_krw]] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new RangeError(`budget.${name}는 0 이상의 유한한 숫자여야 한다`);
    }
  }
  if (min_krw !== undefined && max_krw !== undefined && min_krw > max_krw) {
    throw new RangeError("budget.min_krw는 max_krw보다 클 수 없다");
  }
}

/** 실질적인 예산 제한이 있는가. min_krw가 0이면 하한 없음으로 본다. (D-012) */
function hasBudgetLimit({ min_krw, max_krw }: BudgetRange): boolean {
  return (min_krw !== undefined && min_krw > 0) || max_krw !== undefined;
}

/**
 * 예산 조건이 지정된 경우, 가격 정보가 없는 제품은 제외한다.
 * (예산 안인지 보장할 수 없기 때문. docs/decisions.md D-009)
 */
function passesBudget(paddle: PaddleSpec, budget: BudgetRange): boolean {
  if (!hasBudgetLimit(budget)) return true;
  const { min_krw, max_krw } = budget;
  if (paddle.price_krw === undefined) return false;
  if (min_krw !== undefined && paddle.price_krw < min_krw) return false;
  if (max_krw !== undefined && paddle.price_krw > max_krw) return false;
  return true;
}

/**
 * 대회 인증이 필요하면 승인(approved)된 제품만 통과시킨다.
 * unknown은 확인되지 않았으므로 제외한다. (docs/decisions.md D-010)
 */
function passesCertification(paddle: PaddleSpec, needsCertification: boolean): boolean {
  if (!needsCertification) return true;
  return paddle.certification.usa_pickleball === "approved";
}

/**
 * 하드 필터: 조건을 만족하지 못하면 점수와 무관하게 후보에서 제외한다.
 * 순수 함수이며 입력 배열을 바꾸지 않고, 원래 순서를 유지한다.
 * 구매 링크·수수료 정보는 읽지 않는다(PaddleSpec에는 해당 필드가 없다).
 */
export function hardFilter(paddles: readonly PaddleSpec[], profile: UserProfile): PaddleSpec[] {
  assertValidBudget(profile.budget);
  return paddles.filter(
    (p) => passesBudget(p, profile.budget) && passesCertification(p, profile.needs_certification),
  );
}
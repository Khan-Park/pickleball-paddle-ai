import type { PaddleSpec } from "../../../data/schema";
import type { BudgetRange, UserProfile } from "./types";

function assertValidBudget({ min_krw, max_krw }: BudgetRange): void {
  if (min_krw !== undefined && max_krw !== undefined && min_krw > max_krw) {
    throw new RangeError("budget.min_krw는 max_krw보다 클 수 없다");
  }
}

/**
 * 예산 조건이 지정된 경우, 가격 정보가 없는 제품은 제외한다.
 * (예산 안인지 보장할 수 없기 때문. docs/decisions.md D-009)
 */
function passesBudget(paddle: PaddleSpec, { min_krw, max_krw }: BudgetRange): boolean {
  if (min_krw === undefined && max_krw === undefined) return true;
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
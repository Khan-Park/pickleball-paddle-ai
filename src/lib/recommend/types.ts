/** 예산 범위(원). 두 값 모두 포함(경계 포함)이며, 생략하면 그쪽 제한이 없다. */
export type BudgetRange = {
  min_krw?: number;
  max_krw?: number;
};

/** 사용자 답변을 정규화한 추천 입력. 질문 플로우(UI)가 이 타입으로 변환해 엔진에 넘긴다. */
export type UserProfile = {
  budget: BudgetRange;
  /** 대회 인증(USA Pickleball 승인)이 필요한가 */
  needs_certification: boolean;
};
import { SHAPES, toPaddleSpec, type Paddle, type Shape } from "./schema.ts";
import { answersToProfile } from "../src/lib/quiz/answers.ts";
import type { QuizAnswers } from "../src/lib/quiz/questions.ts";
import { hardFilter } from "../src/lib/recommend/filter.ts";

/** 질문의 예산 답(값과 화면 이름). 질문 목록(src/lib/quiz/questions.ts)의 선택지와 같다 */
export const BUDGET_ANSWERS = [
  { value: "under_100k", label: "10만 이하" },
  { value: "100k_to_200k", label: "10~20만" },
  { value: "200k_to_300k", label: "20~30만" },
  { value: "any", label: "상관없음" },
] as const;
export type BudgetAnswer = (typeof BUDGET_ANSWERS)[number]["value"];

/** 조합마다 이 수보다 적으면 보강 대상으로 표시한다(D-028: 조합별 2개 이상) */
export const COVERAGE_MIN = 2;

export type CoverageCell = { shape: Shape; budget: BudgetAnswer; tournament: boolean; ids: string[] };

/**
 * 질문 조합(형태 4 × 예산 4 × 대회 여부 2)마다 "맞는 제품"을 센다.
 * 맞는 제품 = 추천 엔진의 하드 필터(예산·대회 승인)를 통과하고 형태가 선호 형태와 같은 제품.
 * 형태는 점수 축이라 하드 필터가 아니지만, 사용자가 고른 형태의 제품이 있는지가 보강 기준이라 따로 맞춘다.
 * 엔진의 답변 변환·필터를 그대로 써서 실제 화면과 같은 기준으로 센다. 순수 함수.
 */
export function coverage(paddles: readonly Paddle[], today: string): CoverageCell[] {
  const specs = paddles.map(toPaddleSpec);
  const cells: CoverageCell[] = [];
  for (const shape of SHAPES) {
    for (const { value: budget } of BUDGET_ANSWERS) {
      for (const tournament of [false, true]) {
        // 형태 질문이 보이는 경력(1~3년)으로 답을 만든다. 경력·성향·무게·팔 불편은 하드 필터에 쓰이지 않는다
        const answers: QuizAnswers = {
          experience: "1_to_3y",
          play_style: "balanced",
          weight: "any",
          arm: "no",
          shapes: [shape],
          budget,
          tournament: tournament ? "yes" : "no",
        };
        const result = answersToProfile(answers);
        if (!result.success) throw new Error(`조합 답변을 프로필로 바꾸지 못했다: ${JSON.stringify(answers)}`);
        const ids = hardFilter(specs, result.profile, { today })
          .filter((p) => p.shape === shape)
          .map((p) => p.id);
        cells.push({ shape, budget, tournament, ids });
      }
    }
  }
  return cells;
}

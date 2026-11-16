import { parseUserProfile, type ProfileParseResult } from "../recommend/profile";
import { nextQuestion, visibleQuestions, type QuestionId, type QuizAnswers } from "./questions";

const SKILL = { under_1y: "beginner", "1_to_3y": "intermediate", over_3y: "advanced" } as const;
const WEIGHT = { light: "light", medium: "medium", heavy: "heavy", any: "no_preference" } as const;
/** 예산 구간(원). 경계 금액은 양쪽 구간에 모두 포함된다(하드 필터가 양끝 포함이라 10만 원 제품은 두 구간에 다 나온다) */
const BUDGET = {
  under_100k: { max_krw: 100_000 },
  "100k_to_200k": { min_krw: 100_000, max_krw: 200_000 },
  "200k_to_300k": { min_krw: 200_000, max_krw: 300_000 },
  any: {},
} as const;

/** 값이 선택지 안에 있어야 하는 답. 경력·무게·성향은 변환 결과가 undefined가 되어 프로필 검증에서 걸린다 */
const INVALID_CHECKS: { id: "budget" | "arm" | "tournament"; allowed: string[] }[] = [
  { id: "budget", allowed: Object.keys(BUDGET) },
  { id: "arm", allowed: ["yes", "no"] },
  { id: "tournament", allowed: ["yes", "no"] },
];

/** missing: 아직 답하지 않은 질문, invalid: 답은 있지만 선택지에 없는 값인 질문 */
export type AnswersResult = ProfileParseResult | { success: false; missing: QuestionId[]; invalid: QuestionId[] };

/**
 * 질문 답변을 추천 엔진의 UserProfile로 바꾼다. 순수 함수.
 * - 아직 답하지 않은 질문이 있으면 missing으로 알려 준다.
 * - 화면에 보이지 않는 질문의 답은 쓰지 않는다(초보로 바꾼 뒤 남아 있는 선호 모양, "잘 모르겠어요" 등).
 * - 마지막에 parseUserProfile로 한 번 더 검증한다.
 */
export function answersToProfile(answers: QuizAnswers): AnswersResult {
  if (nextQuestion(answers) !== null) {
    const missing = visibleQuestions(answers)
      .filter((q) => answers[q.id] === undefined)
      .map((q) => q.id);
    return { success: false, missing, invalid: [] };
  }
  // 저장된 답이 손상됐거나 옛 값이면(선택지에 없는 값) 조용히 기본값으로 바꾸지 않고 다시 묻는다.
  // 예산·팔 불편·대회 답은 아래 변환에서 기본값으로 떨어질 수 있어 여기서 먼저 확인한다
  const invalid = INVALID_CHECKS.filter(({ id, allowed }) => !allowed.includes(String(answers[id]))).map(({ id }) => id);
  if (invalid.length > 0) return { success: false, missing: [], invalid };

  // "잘 모르겠어요"는 초보에게만 보이는 선택지다. 초보가 아닌데 남아 있으면 균형으로 본다(설계상 같은 뜻)
  const style = answers.play_style === "unsure" ? "balanced" : answers.play_style;
  // 선호 모양을 쓸지는 진행형 규칙(visibleQuestions) 한 곳에서만 정한다
  const shapes = visibleQuestions(answers).some((q) => q.id === "shapes") ? answers.shapes : undefined;

  return parseUserProfile({
    skill_level: SKILL[answers.experience!],
    play_style: style,
    weight_preference: WEIGHT[answers.weight!],
    arm_discomfort: answers.arm === "yes",
    ...(shapes && shapes.length > 0 ? { preferred_shapes: shapes } : {}),
    budget: { ...BUDGET[answers.budget!] },
    needs_certification: answers.tournament === "yes",
  });
}

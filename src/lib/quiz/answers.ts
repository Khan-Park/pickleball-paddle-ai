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

export type AnswersResult = ProfileParseResult | { success: false; missing: QuestionId[] };

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
    return { success: false, missing };
  }
  const visible = new Set(visibleQuestions(answers).map((q) => q.id));
  const beginner = answers.experience === "under_1y";
  // "잘 모르겠어요"는 초보에게만 보이는 선택지다. 초보가 아닌데 남아 있으면 균형으로 본다(설계상 같은 뜻)
  const style = answers.play_style === "unsure" ? "balanced" : answers.play_style;
  const shapes = visible.has("shapes") && !beginner ? answers.shapes : undefined;

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

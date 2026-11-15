/**
 * 질문 정의. 화면(T-010)은 이 정의를 그대로 그린다. 설계: docs/design/ui-flow.md 2장.
 * 문구는 한국어, 과장 표현과 의학적 단정을 쓰지 않는다.
 */

import { SHAPE_LABEL } from "../shared/shape-labels";

export type QuestionId = "experience" | "play_style" | "weight" | "arm" | "shapes" | "budget" | "tournament";

export type ShapeValue = "standard" | "hybrid" | "elongated" | "widebody";

/** 사용자가 고른 답. 아직 답하지 않은 질문은 키가 없다 */
export type QuizAnswers = {
  experience?: "under_1y" | "1_to_3y" | "over_3y";
  play_style?: "control" | "balanced" | "power" | "unsure";
  weight?: "light" | "medium" | "heavy" | "any";
  arm?: "yes" | "no";
  /** 빈 배열은 "건너뛰기" */
  shapes?: ShapeValue[];
  budget?: "under_100k" | "100k_to_200k" | "200k_to_300k" | "any";
  tournament?: "yes" | "no";
};

export type QuizOption = { value: string; label: string; hint?: string };

export type QuizQuestion = {
  id: QuestionId;
  title: string;
  /** 질문 아래 한 줄 안내 */
  note?: string;
  /** 여러 개를 고를 수 있는가(선호 모양만 해당) */
  multiple: boolean;
  options: QuizOption[];
};

const UNSURE_STYLE: QuizOption = { value: "unsure", label: "잘 모르겠어요", hint: "균형형으로 추천합니다" };

const QUESTIONS: Record<QuestionId, QuizQuestion> = {
  experience: {
    id: "experience",
    title: "피클볼이나 라켓 운동을 얼마나 해 보셨나요?",
    multiple: false,
    options: [
      { value: "under_1y", label: "처음이거나 1년 미만" },
      { value: "1_to_3y", label: "1~3년" },
      { value: "over_3y", label: "3년 이상" },
    ],
  },
  play_style: {
    id: "play_style",
    title: "어떤 플레이가 더 중요한가요?",
    multiple: false,
    options: [
      { value: "control", label: "정확한 컨트롤", hint: "원하는 곳에 부드럽게 보내기" },
      { value: "balanced", label: "균형", hint: "컨트롤과 파워를 고르게" },
      { value: "power", label: "강한 파워", hint: "빠르고 묵직한 타구" },
    ],
  },
  weight: {
    id: "weight",
    title: "패들 무게는 어떤 쪽이 좋나요?",
    multiple: false,
    options: [
      { value: "light", label: "가볍게", hint: "빠르게 다루기 쉬움" },
      { value: "medium", label: "중간" },
      { value: "heavy", label: "묵직하게", hint: "타구에 힘이 실림" },
      { value: "any", label: "상관없어요" },
    ],
  },
  arm: {
    id: "arm",
    title: "팔·손목·팔꿈치가 불편한 적이 있나요?",
    note: "부담을 줄이는 데 도움이 될 수 있는 사양을 고르는 데만 씁니다. 의학적 조언이 아닙니다.",
    multiple: false,
    options: [
      { value: "yes", label: "있어요" },
      { value: "no", label: "없어요" },
    ],
  },
  shapes: {
    id: "shapes",
    title: "선호하는 패들 모양이 있나요?",
    note: "여러 개를 골라도 됩니다. 잘 모르면 건너뛰세요.",
    multiple: true,
    options: [
      { value: "standard", label: SHAPE_LABEL.standard, hint: "가장 흔한 모양" },
      { value: "widebody", label: SHAPE_LABEL.widebody, hint: "면이 넓어 빗맞아도 안정적" },
      { value: "hybrid", label: SHAPE_LABEL.hybrid, hint: "표준형과 길쭉한 형의 중간" },
      { value: "elongated", label: SHAPE_LABEL.elongated, hint: "더 멀리 닿고 파워에 유리" },
    ],
  },
  budget: {
    id: "budget",
    title: "예산은 어느 정도인가요?",
    multiple: false,
    options: [
      { value: "under_100k", label: "10만 원 이하" },
      { value: "100k_to_200k", label: "10만~20만 원" },
      { value: "200k_to_300k", label: "20만~30만 원" },
      { value: "any", label: "상관없어요" },
    ],
  },
  tournament: {
    id: "tournament",
    title: "대회에 나갈 계획이 있나요?",
    note: "'네'를 고르면 USA Pickleball 승인이 확인된 제품만 추천합니다.",
    multiple: false,
    options: [
      { value: "yes", label: "네" },
      { value: "no", label: "아니요 / 아직 모르겠어요" },
    ],
  },
};

const ORDER: QuestionId[] = ["experience", "play_style", "weight", "arm", "shapes", "budget", "tournament"];

const isBeginner = (answers: QuizAnswers) => answers.experience === "under_1y";

/**
 * 지금까지의 답에 따라 보여 줄 질문 목록(순서대로).
 * 진행형 규칙은 두 가지뿐이다: 초보는 '선호 모양'을 건너뛰고, '플레이 성향'에 "잘 모르겠어요"가 추가된다.
 * 경력에 아직 답하지 않았으면 전체 7개를 돌려준다.
 */
export function visibleQuestions(answers: QuizAnswers): QuizQuestion[] {
  const beginner = isBeginner(answers);
  return ORDER.filter((id) => !(beginner && id === "shapes")).map((id) => {
    const q = QUESTIONS[id];
    return id === "play_style" && beginner ? { ...q, options: [...q.options, UNSURE_STYLE] } : q;
  });
}

const isAnswered = (answers: QuizAnswers, id: QuestionId) => answers[id] !== undefined;

/** 다음에 물을 질문. 모두 답했으면 null */
export function nextQuestion(answers: QuizAnswers): QuizQuestion | null {
  return visibleQuestions(answers).find((q) => !isAnswered(answers, q.id)) ?? null;
}

/** 진행 상황. total은 지금 답 기준으로 보여 줄 질문 수 */
export function progress(answers: QuizAnswers): { answered: number; total: number } {
  const visible = visibleQuestions(answers);
  return { answered: visible.filter((q) => isAnswered(answers, q.id)).length, total: visible.length };
}

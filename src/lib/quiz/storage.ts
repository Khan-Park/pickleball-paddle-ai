import type { QuizAnswers } from "./questions";

/**
 * 답변 보관. 브라우저의 sessionStorage에만 둔다(탭을 닫으면 사라진다).
 * 팔 불편 답변은 건강 관련 정보라서 URL이나 서버로 보내지 않는다. (docs/design/ui-flow.md 4장)
 */
const KEY = "pb.quiz.answers.v1";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null; // 사생활 보호 모드 등에서 접근이 막힌 경우
  }
}

export function saveAnswers(answers: QuizAnswers): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(answers));
  } catch {
    // 저장에 실패해도 화면은 계속 동작한다
  }
}

/** 저장된 답변. 없거나 형식이 깨졌으면 null. 값의 유효성은 answersToProfile이 다시 검증한다 */
export function loadAnswers(): QuizAnswers | null {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as QuizAnswers) : null;
  } catch {
    return null;
  }
}

export function clearAnswers(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // 무시
  }
}

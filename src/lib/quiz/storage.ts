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

/** 저장된 원문(JSON 문자열). 없으면 null. 같은 내용이면 같은 문자열이라 구독 스냅샷으로 쓸 수 있다 */
export function loadAnswersRaw(): string | null {
  try {
    return storage()?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

const TEXT_KEYS = ["experience", "play_style", "weight", "arm", "budget", "tournament"] as const;

/**
 * JSON 문자열을 답변으로 바꾼다. 모양이 맞지 않으면 통째로 버리고 null을 돌려준다
 * (화면이 문자열이나 배열이 아닌 값을 받아 깨지지 않게). 값이 선택지 안에 있는지는 answersToProfile이 검증한다.
 * - 한 가지를 고르는 답은 문자열, 선호 모양은 문자열 배열이어야 한다.
 */
export function parseAnswers(raw: string | null): QuizAnswers | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    for (const key of TEXT_KEYS) {
      if (record[key] !== undefined && typeof record[key] !== "string") return null;
    }
    const shapes = record.shapes;
    if (shapes !== undefined && !(Array.isArray(shapes) && shapes.every((s) => typeof s === "string"))) return null;
    return record as QuizAnswers;
  } catch {
    return null;
  }
}

/** 저장된 답변. 없거나 형식이 깨졌으면 null */
export function loadAnswers(): QuizAnswers | null {
  return parseAnswers(loadAnswersRaw());
}

export function clearAnswers(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // 무시
  }
}

/**
 * "분석 중" 화면을 언제 보여 줄지 정하는 탭 저장소 표시(docs/plan/phase2.md 6.3).
 * - 질문 화면이 제출 직전에 markSubmitted()로 표시를 남긴다
 * - 결과 화면은 peekAnalyzeMode()로 읽고, 보여 주기 시작하면 clearAnalyzeMode()로 지운다(새로고침에서 다시 나오지 않게)
 * - 이 탭에서 이미 한 번 보여 줬다면 다음 제출은 짧게 보여 준다("답변 고치기" 후 반복 대기를 줄인다)
 * 저장소를 쓸 수 없으면(사생활 보호 모드 등) 조용히 건너뛴다. 분석 중 화면은 없어도 되는 연출이다.
 */
const KEY = "pb.result.analyze.v1";
const SEEN_KEY = "pb.result.analyze.seen.v1";

export type AnalyzeMode = "full" | "short";

export function markSubmitted(): void {
  try {
    window.sessionStorage.setItem(KEY, window.sessionStorage.getItem(SEEN_KEY) ? "short" : "full");
  } catch {
    // 저장소를 쓸 수 없으면 분석 중 화면 없이 결과로 간다
  }
}

/** 지우지 않고 읽기만 한다(React 개발 모드에서 초기화 함수가 두 번 불려도 값이 사라지지 않게) */
export function peekAnalyzeMode(): AnalyzeMode | null {
  try {
    const value = window.sessionStorage.getItem(KEY);
    return value === "full" || value === "short" ? value : null;
  } catch {
    return null;
  }
}

/** 보여 주기 시작했으면 지우고, 이 탭에서 한 번 봤다고 기록한다 */
export function clearAnalyzeMode(): void {
  try {
    window.sessionStorage.removeItem(KEY);
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // 무시
  }
}

/** 단계 하나의 시간(ms). 단계는 3개다 */
export const STEP_MS: Record<AnalyzeMode, number> = { full: 320, short: 170 };

/** 분석 중 화면 전체 시간의 상한(docs/plan/phase2.md 6.3: 최대 1.2초) */
export const ANALYZE_MAX_MS = 1200;

/** 전체 시간 = 단계 3개 + 마지막 체크를 보여 주는 0.5단계. full 1,120ms, short 595ms */
export const analyzeTotalMs = (mode: AnalyzeMode): number => STEP_MS[mode] * 3 + STEP_MS[mode] / 2;

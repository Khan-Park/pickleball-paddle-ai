/**
 * 둘러보기 비교함(T-049, docs/plan/m2.5-redesign.md 5.3). 이 탭의 sessionStorage에 제품 id 배열만 둔다.
 * 구매·제휴 정보는 넣지 않는다. 탭을 닫으면 사라지고, 새로고침에는 남는다.
 */
export const TRAY_KEY = "pb.compare.tray.v1";
export const TRAY_MAX = 3;

export type ToggleResult = "added" | "removed" | "full";

/** 담기·빼기 판정. 이미 3개면 담지 않고 "full"(목록은 그대로) */
export function toggleTray(ids: readonly string[], id: string): { ids: string[]; result: ToggleResult } {
  if (ids.includes(id)) return { ids: ids.filter((x) => x !== id), result: "removed" };
  if (ids.length >= TRAY_MAX) return { ids: [...ids], result: "full" };
  return { ids: [...ids, id], result: "added" };
}

/** 저장된 값 정리: 문자열만, 지금 데이터에 있는 id만, 중복 없이, 3개까지 */
export function sanitizeTray(raw: unknown, validIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && validIds.has(x) && !out.includes(x)) out.push(x);
    if (out.length >= TRAY_MAX) break;
  }
  return out;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** 읽기. 저장소를 못 쓰거나 값이 깨져 있으면 빈 목록 */
export function loadTray(validIds: ReadonlySet<string>): string[] {
  try {
    const text = storage()?.getItem(TRAY_KEY);
    return text ? sanitizeTray(JSON.parse(text), validIds) : [];
  } catch {
    return [];
  }
}

/** 쓰기. 비면 키를 지운다. 저장소를 못 쓰면 조용히 넘어간다(화면 상태로만 동작) */
export function saveTray(ids: readonly string[]): void {
  try {
    const s = storage();
    if (!s) return;
    if (ids.length === 0) s.removeItem(TRAY_KEY);
    else s.setItem(TRAY_KEY, JSON.stringify(ids));
  } catch {
    // 저장 실패는 무시한다(사생활 보호 모드 등)
  }
}

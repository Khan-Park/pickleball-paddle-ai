import { z } from "zod";
import { daysBetween } from "./dates";

/**
 * 결과 저장(T-050, docs/plan/m2.5-redesign.md 5.1). 로그인 없이 이 기기 브라우저의 localStorage에만 둔다.
 * 한 건에는 아래 6개 키만 담는다. 팔 불편 답·질문 답 원문·점수·라벨·이유 문장·구매 정보는 넣지 않는다
 * (공용 기기에서 다른 사람이 볼 수 있고, 데이터·엔진이 바뀌면 틀린 말이 된다).
 */
export const SAVED_KEY = "pb.saved.v1";
export const SAVED_MAX = 10;
/** U2(D-038): 저장 후 이 일수가 지나면 읽을 때 지운다. 가격·인증 재확인 주기와 같다 */
export const SAVED_RETENTION_DAYS = 180;
export const SAVED_FIELDS = ["id", "saved_at", "paddle_ids", "conditions", "relaxed", "scoring_version"] as const;

const entrySchema = z.strictObject({
  id: z.string().min(1).max(64),
  saved_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paddle_ids: z.array(z.string().min(1)).min(1).max(3),
  conditions: z.array(z.string()).max(12),
  relaxed: z.boolean(),
  scoring_version: z.string(),
});

export type SavedEntry = z.infer<typeof entrySchema>;
/** 저장할 내용(id·날짜는 저장할 때 붙인다) */
export type SavedInput = Pick<SavedEntry, "paddle_ids" | "conditions" | "relaxed" | "scoring_version">;

function expired(entry: SavedEntry, today: string): boolean {
  const days = daysBetween(entry.saved_at, today);
  return Number.isNaN(days) || days > SAVED_RETENTION_DAYS;
}

/** 저장된 값 정리: 형식이 맞는 건만, 기간이 지나지 않은 것만, 같은 id는 하나만, 10건까지(앞이 최근) */
export function sanitizeSaved(raw: unknown, today: string): SavedEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedEntry[] = [];
  for (const item of raw) {
    const parsed = entrySchema.safeParse(item);
    if (!parsed.success || expired(parsed.data, today) || out.some((e) => e.id === parsed.data.id)) continue;
    out.push(parsed.data);
    if (out.length >= SAVED_MAX) break;
  }
  return out;
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * 새 결과를 맨 앞에 더한다. 같은 제품·조건이 이미 있으면 새로 만들지 않고 날짜만 오늘로 바꿔 맨 앞으로 올린다.
 * 10건을 넘으면 가장 오래된 것(맨 뒤)부터 지우고 지운 수를 돌려준다.
 */
export function addSaved(
  list: readonly SavedEntry[],
  input: SavedInput,
  today: string,
  makeId: () => string = newId,
): { list: SavedEntry[]; updated: boolean; evicted: number } {
  const existing = list.find((e) => sameList(e.paddle_ids, input.paddle_ids) && sameList(e.conditions, input.conditions));
  const entry: SavedEntry = {
    id: existing?.id ?? makeId(),
    saved_at: today,
    paddle_ids: input.paddle_ids.slice(0, 3),
    conditions: [...input.conditions],
    relaxed: input.relaxed,
    scoring_version: input.scoring_version,
  };
  const rest = list.filter((e) => e !== existing);
  const next = [entry, ...rest];
  const evicted = Math.max(0, next.length - SAVED_MAX);
  return { list: next.slice(0, SAVED_MAX), updated: existing !== undefined, evicted };
}

export function removeSaved(list: readonly SavedEntry[], id: string): SavedEntry[] {
  return list.filter((e) => e.id !== id);
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // 아래 대체 값을 쓴다
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** 읽기. 기간이 지났거나 깨진 건을 버렸으면 저장소도 정리한다. 못 읽으면 빈 목록 */
export function loadSaved(today: string): SavedEntry[] {
  try {
    const s = storage();
    const text = s?.getItem(SAVED_KEY);
    if (!s || !text) return [];
    const raw: unknown = JSON.parse(text);
    const list = sanitizeSaved(raw, today);
    if (!Array.isArray(raw) || raw.length !== list.length) writeSaved(list);
    return list;
  } catch {
    return [];
  }
}

/** 쓰기. 비면 키를 지운다. 저장소를 못 쓰면 false */
export function writeSaved(list: readonly SavedEntry[]): boolean {
  try {
    const s = storage();
    if (!s) return false;
    if (list.length === 0) s.removeItem(SAVED_KEY);
    else s.setItem(SAVED_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export type SaveStatus = { status: "saved" | "updated"; evicted: number } | { status: "unavailable" };

/** 결과 화면의 "결과 저장". 저장소를 못 쓰면(사생활 보호 모드 등) "unavailable" */
export function saveResult(input: SavedInput, today: string): SaveStatus {
  const { list, updated, evicted } = addSaved(loadSaved(today), input, today);
  if (!writeSaved(list)) return { status: "unavailable" };
  return { status: updated ? "updated" : "saved", evicted };
}

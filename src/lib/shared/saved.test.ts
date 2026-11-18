// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addSaved,
  loadSaved,
  removeSaved,
  sanitizeSaved,
  SAVED_FIELDS,
  SAVED_KEY,
  SAVED_MAX,
  saveResult,
  type SavedEntry,
  type SavedInput,
} from "./saved";

const TODAY = "2026-11-18";
const input = (ids: string[], conditions: string[] = ["입문(1년 미만)"]): SavedInput => ({
  paddle_ids: ids,
  conditions,
  relaxed: false,
  scoring_version: "0.2.0",
});
const entry = (id: string, saved_at: string, ids = ["a"]): SavedEntry => ({ id, saved_at, ...input(ids) });
let n = 0;
const makeId = () => `id-${++n}`;

beforeEach(() => {
  n = 0;
  window.localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("addSaved", () => {
  it("한 건의 키는 정해진 6개뿐이다(팔 불편·답 원문·점수·라벨·구매 정보 없음)", () => {
    const { list } = addSaved([], input(["a", "b", "c"]), TODAY, makeId);
    expect(Object.keys(list[0]!).sort()).toEqual([...SAVED_FIELDS].sort());
    const text = JSON.stringify(list);
    expect(text).not.toMatch(/arm|answers|score|label|reason|purchase|price|url/i);
  });

  it("11번째 저장에서 가장 오래된 1건을 지우고 알려 준다", () => {
    let list: SavedEntry[] = [];
    for (let i = 0; i < SAVED_MAX; i += 1) list = addSaved(list, input([`p${i}`]), TODAY, makeId).list;
    expect(list).toHaveLength(SAVED_MAX);
    const oldest = list[SAVED_MAX - 1]!;
    const result = addSaved(list, input(["new"]), TODAY, makeId);
    expect(result.evicted).toBe(1);
    expect(result.list).toHaveLength(SAVED_MAX);
    expect(result.list[0]!.paddle_ids).toEqual(["new"]);
    expect(result.list.some((e) => e.id === oldest.id)).toBe(false);
  });

  it("같은 제품·조건이면 새로 만들지 않고 날짜만 바꿔 맨 앞으로 올린다", () => {
    const list = [entry("x", "2026-11-01", ["b"]), entry("y", "2026-10-01", ["a", "c"])];
    const result = addSaved(list, input(["a", "c"]), TODAY, makeId);
    expect(result.updated).toBe(true);
    expect(result.evicted).toBe(0);
    expect(result.list.map((e) => e.id)).toEqual(["y", "x"]);
    expect(result.list[0]!.saved_at).toBe(TODAY);
    // 조건이 다르면 다른 결과다
    expect(addSaved(list, input(["a", "c"], ["대회용"]), TODAY, makeId).list).toHaveLength(3);
  });

  it("removeSaved는 그 건만 지운다", () => {
    expect(removeSaved([entry("x", TODAY), entry("y", TODAY)], "x").map((e) => e.id)).toEqual(["y"]);
  });
});

describe("sanitizeSaved", () => {
  it("180일은 남기고 181일은 버린다", () => {
    const list = sanitizeSaved([entry("keep", "2026-05-22"), entry("drop", "2026-05-21")], TODAY);
    expect(list.map((e) => e.id)).toEqual(["keep"]);
  });

  it("깨진 값·형식이 다른 건·키가 더 있는 건은 버린다", () => {
    expect(sanitizeSaved("x", TODAY)).toEqual([]);
    const list = sanitizeSaved(
      [
        entry("ok", TODAY),
        { ...entry("extra", TODAY), arm: "yes" },
        { ...entry("score", TODAY), score: 90 },
        { ...entry("bad-date", TODAY), saved_at: "어제" },
        { ...entry("too-many", TODAY), paddle_ids: ["a", "b", "c", "d"] },
        { id: "missing" },
        null,
      ],
      TODAY,
    );
    expect(list.map((e) => e.id)).toEqual(["ok"]);
  });
});

describe("저장소", () => {
  it("저장하면 키 하나에 배열로 들어가고, 다시 읽을 수 있다", () => {
    expect(saveResult(input(["a", "b"]), TODAY)).toEqual({ status: "saved", evicted: 0 });
    expect(Object.keys(window.localStorage)).toEqual([SAVED_KEY]);
    expect(loadSaved(TODAY)).toHaveLength(1);
    expect(saveResult(input(["a", "b"]), TODAY)).toEqual({ status: "updated", evicted: 0 });
    expect(loadSaved(TODAY)).toHaveLength(1);
  });

  it("읽을 때 기간이 지난 건을 지우고 저장소도 정리한다(날짜 주입)", () => {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify([entry("new", TODAY), entry("old", "2026-01-01")]));
    expect(loadSaved(TODAY).map((e) => e.id)).toEqual(["new"]);
    expect(JSON.parse(window.localStorage.getItem(SAVED_KEY)!)).toHaveLength(1);
    // 모두 지나면 키 자체를 지운다
    expect(loadSaved("2027-12-31")).toEqual([]);
    expect(window.localStorage.getItem(SAVED_KEY)).toBeNull();
  });

  it("깨진 JSON이면 빈 목록이다", () => {
    window.localStorage.setItem(SAVED_KEY, "{");
    expect(loadSaved(TODAY)).toEqual([]);
  });

  it("저장소 쓰기가 실패하면 unavailable이다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(saveResult(input(["a"]), TODAY)).toEqual({ status: "unavailable" });
  });

  it("구매·제휴 필드를 읽지 않는다(소스 검사)", () => {
    const text = readFileSync(join(process.cwd(), "src/lib/shared/saved.ts"), "utf-8");
    expect(text).not.toMatch(/purchase|affiliate|compare_query|price_krw/);
  });
});

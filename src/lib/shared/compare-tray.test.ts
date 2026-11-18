// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadTray, sanitizeTray, saveTray, toggleTray, TRAY_KEY, TRAY_MAX } from "./compare-tray";

afterEach(() => window.sessionStorage.clear());

const VALID = new Set(["a", "b", "c", "d"]);

describe("비교함(T-049)", () => {
  it("담기·빼기, 3개가 차면 'full'이고 목록은 그대로다", () => {
    expect(TRAY_MAX).toBe(3);
    expect(toggleTray([], "a")).toEqual({ ids: ["a"], result: "added" });
    expect(toggleTray(["a", "b"], "a")).toEqual({ ids: ["b"], result: "removed" });
    expect(toggleTray(["a", "b", "c"], "d")).toEqual({ ids: ["a", "b", "c"], result: "full" });
    expect(toggleTray(["a", "b", "c"], "b")).toEqual({ ids: ["a", "c"], result: "removed" });
  });

  it("불러올 때 없어진 id·중복·문자열 아닌 값을 버리고 3개까지만 남긴다", () => {
    expect(sanitizeTray(["a", "x", "a", 3, "b", "c", "d"], VALID)).toEqual(["a", "b", "c"]);
    expect(sanitizeTray({ a: 1 }, VALID)).toEqual([]);
    expect(sanitizeTray(null, VALID)).toEqual([]);
  });

  it("저장소에는 키 하나에 id 배열만 쓰고, 비면 키를 지운다", () => {
    saveTray(["b", "a"]);
    expect(Object.keys(window.sessionStorage)).toEqual([TRAY_KEY]);
    expect(JSON.parse(window.sessionStorage.getItem(TRAY_KEY)!)).toEqual(["b", "a"]);
    expect(loadTray(VALID)).toEqual(["b", "a"]);
    saveTray([]);
    expect(window.sessionStorage.getItem(TRAY_KEY)).toBeNull();
  });

  it("값이 깨져 있으면 빈 목록이다", () => {
    window.sessionStorage.setItem(TRAY_KEY, "{not json");
    expect(loadTray(VALID)).toEqual([]);
  });
});

describe("비교함 소스 검사(T-054, 완료 기준 9)", () => {
  it("구매·제휴·가격 비교 필드를 읽지 않는다", () => {
    const text = readFileSync(join(process.cwd(), "src/lib/shared/compare-tray.ts"), "utf8");
    expect(text).not.toMatch(/purchase|affiliate|compare_query|price_krw/);
  });
});

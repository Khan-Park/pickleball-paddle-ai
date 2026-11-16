import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMPTY_FILTER, filterAndSort, isApprovedNow, type BrowseItem } from "./browse";

const TODAY = "2026-06-01";
const ok = { usa_pickleball: "approved" as const, checked_at: "2026-05-01" };
const item = (id: string, o: Partial<BrowseItem> = {}): BrowseItem => ({ id, brand: "가짜", model: id, shape: "hybrid", price_krw: 150_000, certification: ok, ...o });
const ids = (list: BrowseItem[]) => list.map((p) => p.id);

describe("둘러보기 걸러 보기·정렬(T-026)", () => {
  it("가격 낮은 순, 가격 없는 제품은 끝, 같은 가격은 이름 순", () => {
    const list = [item("c", { price_krw: 200_000 }), item("none", { price_krw: undefined }), item("b", { price_krw: 90_000 }), item("a", { price_krw: 90_000 })];
    expect(ids(filterAndSort(list, EMPTY_FILTER, TODAY))).toEqual(["a", "b", "c", "none"]);
  });

  it("형태는 여러 개를 고를 수 있고, 비어 있으면 전체", () => {
    const list = [item("w", { shape: "widebody" }), item("e", { shape: "elongated" }), item("s", { shape: "standard" })];
    expect(ids(filterAndSort(list, { ...EMPTY_FILTER, shapes: ["widebody", "standard"] }, TODAY)).sort()).toEqual(["s", "w"]);
    expect(filterAndSort(list, EMPTY_FILTER, TODAY)).toHaveLength(3);
  });

  it("가격 구간은 퀴즈처럼 양끝을 포함하고, 30만 넘음과 가격 없는 제품을 처리한다", () => {
    const list = [item("100k", { price_krw: 100_000 }), item("200k", { price_krw: 200_000 }), item("300k", { price_krw: 300_000 }), item("301k", { price_krw: 300_001 }), item("none", { price_krw: undefined })];
    const by = (price: Parameters<typeof filterAndSort>[1]["price"]) => ids(filterAndSort(list, { ...EMPTY_FILTER, price }, TODAY));
    expect(by("under_100k")).toEqual(["100k"]);
    expect(by("100k_to_200k")).toEqual(["100k", "200k"]);
    expect(by("200k_to_300k")).toEqual(["200k", "300k"]);
    expect(by("over_300k")).toEqual(["301k"]);
    expect(by(null)).toContain("none");
  });

  it("승인 확인된 제품만: 카드와 같이 180일·미래 날짜 기준", () => {
    expect(isApprovedNow(ok, TODAY)).toBe(true);
    expect(isApprovedNow({ usa_pickleball: "approved", checked_at: "2025-11-01" }, TODAY)).toBe(false);
    expect(isApprovedNow({ usa_pickleball: "approved", checked_at: "2026-07-01" }, TODAY)).toBe(false);
    expect(isApprovedNow({ usa_pickleball: "unknown", checked_at: TODAY }, TODAY)).toBe(false);
    const list = [item("ok"), item("no", { certification: { usa_pickleball: "not_approved", checked_at: TODAY } })];
    expect(ids(filterAndSort(list, { ...EMPTY_FILTER, approvedOnly: true }, TODAY))).toEqual(["ok"]);
  });

  it("소스에 구매·제휴·가격 비교 검색어 참조가 없다(규칙 1과 같은 원칙)", () => {
    const text = readFileSync(new URL("./browse.ts", import.meta.url), "utf-8");
    expect(text).not.toMatch(/purchase|affiliate|compare_query/);
  });
});

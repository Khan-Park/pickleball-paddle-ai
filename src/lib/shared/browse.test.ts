import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brandOptions, EMPTY_FILTER, filterAndSort, isApprovedNow, isFilterEmpty, matchesQuery, normalizeSearch, WEIGHT_BANDS, type BrowseItem, type WeightBand } from "./browse";
import { weightBand } from "../recommend/axes";
import { WEIGHT_BAND } from "../recommend/scoring-config";

const TODAY = "2026-06-01";
const ok = { usa_pickleball: "approved" as const, checked_at: "2026-05-01" };
const item = (id: string, o: Partial<BrowseItem> = {}): BrowseItem => ({ id, brand: "가짜", model: id, shape: "hybrid", weight_oz: 7.9, price_krw: 150_000, certification: ok, ...o });
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

describe("검색·브랜드·무게 필터(T-048)", () => {
  it("검색은 브랜드+모델에서 대소문자·공백을 무시하고 부분 일치한다", () => {
    expect(matchesQuery({ brand: "JOOLA", model: "Perseus 3S 16mm" }, "joola per")).toBe(true);
    expect(matchesQuery({ brand: "JOOLA", model: "Perseus 3S 16mm" }, "JOOLAPerseus")).toBe(true);
    expect(matchesQuery({ brand: "JOOLA", model: "Perseus 3S 16mm" }, "  3s16  ")).toBe(true);
    expect(matchesQuery({ brand: "JOOLA", model: "Perseus 3S 16mm" }, "selkirk")).toBe(false);
    expect(matchesQuery({ brand: "JOOLA", model: "Perseus" }, "")).toBe(true);
    expect(matchesQuery({ brand: "JOOLA", model: "Perseus" }, "   ")).toBe(true);
    expect(normalizeSearch(" Six  Zero ")).toBe("sixzero");
  });

  it("무게 구간은 엔진 weightBand와 같다(경계 7.3·8.4는 중간)", () => {
    const list = [7.29, 7.3, 7.31, 8.39, 8.4, 8.41].map((w) => item(`w${w}`, { weight_oz: w }));
    const by = (weights: WeightBand[]) => ids(filterAndSort(list, { ...EMPTY_FILTER, weights }, TODAY)).sort();
    expect(by(["light"])).toEqual(["w7.29"]);
    expect(by(["medium"])).toEqual(["w7.3", "w7.31", "w8.39", "w8.4"].sort());
    expect(by(["heavy"])).toEqual(["w8.41"]);
    for (const w of [7.29, 7.3, 7.31, 8.39, 8.4, 8.41]) {
      const band = WEIGHT_BANDS.find((b) => by([b.value]).includes(`w${w}`))!.value;
      expect(band, String(w)).toBe(weightBand(w));
    }
    expect(WEIGHT_BANDS.map((b) => b.label)).toEqual([
      `가벼움(${WEIGHT_BAND.lightBelowOz}oz 미만)`,
      `중간(${WEIGHT_BAND.lightBelowOz}~${WEIGHT_BAND.heavyAboveOz}oz)`,
      `묵직함(${WEIGHT_BAND.heavyAboveOz}oz 초과)`,
    ]);
  });

  it("브랜드 목록은 데이터에서 중복 없이 이름 순으로 만든다", () => {
    expect(brandOptions([{ brand: "Selkirk" }, { brand: "JOOLA" }, { brand: "11SIX24" }, { brand: "JOOLA" }, { brand: "franklin" }])).toEqual([
      "11SIX24",
      "franklin",
      "JOOLA",
      "Selkirk",
    ]);
  });

  it("검색·브랜드·무게·기존 필터를 함께(그리고) 적용하고, 정렬은 가격 낮은 순 그대로다", () => {
    const list = [
      item("j1", { brand: "JOOLA", model: "Ben", weight_oz: 8.0, price_krw: 300_000 }),
      item("j2", { brand: "JOOLA", model: "Hyp", weight_oz: 7.0, price_krw: 200_000 }),
      item("j3", { brand: "JOOLA", model: "Ben Lite", weight_oz: 7.9, price_krw: 150_000 }),
      item("s1", { brand: "Selkirk", model: "Ben", weight_oz: 7.9, price_krw: 100_000 }),
    ];
    const f = { ...EMPTY_FILTER, query: "ben", brands: ["JOOLA"], weights: ["medium" as const] };
    expect(ids(filterAndSort(list, f, TODAY))).toEqual(["j3", "j1"]);
    expect(ids(filterAndSort(list, { ...f, shapes: ["widebody"] }, TODAY))).toEqual([]);
    expect(isFilterEmpty(EMPTY_FILTER)).toBe(true);
    expect(isFilterEmpty({ ...EMPTY_FILTER, query: "  " })).toBe(true);
    expect(isFilterEmpty({ ...EMPTY_FILTER, brands: ["JOOLA"] })).toBe(false);
  });
});

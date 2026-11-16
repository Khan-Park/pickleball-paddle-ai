import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { toPaddleSpec } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { similarDistance, similarPaddles, similarReasons } from "./similar";

const p = (id: string, o: Partial<Parameters<typeof fakePaddle>[0]> = {}) => toPaddleSpec(fakePaddle({ id, ...o }));
const target = p("target", { weight_oz: 7.8, core_mm: 16, shape: "widebody", surface: "carbon" });

describe("비슷한 제품(T-024)", () => {
  it("자기 자신과 제외 목록을 빼고 가까운 순으로 2개를 고른다", () => {
    const all = [
      target,
      p("near", { weight_oz: 7.9, core_mm: 16, shape: "widebody" }),
      p("shown", { weight_oz: 7.8, core_mm: 16, shape: "widebody" }),
      p("other-shape", { weight_oz: 7.8, core_mm: 16, shape: "elongated" }),
      p("far", { weight_oz: 8.8, core_mm: 13, shape: "elongated" }),
    ];
    expect(similarPaddles(target, all, { exclude: ["shown"] }).map((m) => m.id)).toEqual(["near", "other-shape"]);
  });

  it("형태가 같으면 무게가 조금 달라도 형태가 다른 같은 무게 제품보다 가깝다", () => {
    const sameShape = p("a", { weight_oz: 8.1, shape: "widebody" });
    const otherShape = p("b", { weight_oz: 7.8, shape: "hybrid" });
    expect(similarDistance(target, sameShape)).toBeLessThan(similarDistance(target, otherShape));
  });

  it("거리가 같으면 id 순으로 고정하고, 가격은 거리에 쓰지 않는다", () => {
    const all = [p("z", { weight_oz: 7.8, shape: "widebody", price_krw: 50000 }), p("a", { weight_oz: 7.8, shape: "widebody", price_krw: 400000 })];
    expect(similarPaddles(target, all).map((m) => m.id)).toEqual(["a", "z"]);
    expect(similarDistance(target, all[0]!)).toBe(similarDistance(target, all[1]!));
  });

  it("비슷한 이유를 글자로 만든다(부동소수 오차 없이)", () => {
    expect(similarReasons(target, p("x", { weight_oz: 8.0, core_mm: 16, shape: "widebody" }))).toEqual(["같은 넓은 형", "무게 +0.2oz", "코어 같음"]);
    expect(similarReasons(target, p("y", { weight_oz: 7.8, core_mm: 14, shape: "hybrid" }))).toEqual(["하이브리드형", "무게 같음", "코어 −2mm"]);
  });

  it("제품이 모자라면 있는 만큼만 돌려준다", () => {
    expect(similarPaddles(target, [target])).toEqual([]);
  });

  it("소스에 구매·제휴·가격 비교 검색어 참조가 없다(규칙 1과 같은 원칙)", () => {
    const text = readFileSync(new URL("./similar.ts", import.meta.url), "utf-8");
    expect(text).not.toMatch(/purchase|affiliate|compare_query|price_krw/);
  });
});

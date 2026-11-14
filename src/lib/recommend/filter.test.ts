import { describe, expect, it } from "vitest";
import type { PaddleSpec } from "../../../data/schema";
import { hardFilter } from "./filter";
import type { UserProfile } from "./types";

// 테스트 전용 가짜 샘플이다. 실제 제품 데이터가 아니다.
function paddle(overrides: Partial<PaddleSpec> = {}): PaddleSpec {
  return {
    id: "sample-1",
    brand: "SAMPLE",
    model: "Test",
    weight_oz: 7.8,
    core_mm: 16,
    shape: "hybrid",
    length_in: 16,
    width_in: 7.5,
    surface: "carbon",
    price_krw: 100000,
    certification: { usa_pickleball: "approved", checked_at: "2026-01-01" },
    sources: ["https://example.com/spec"],
    verified_at: "2026-01-01",
    ...overrides,
  };
}

const anyone: UserProfile = { budget: {}, needs_certification: false };
const ids = (list: PaddleSpec[]) => list.map((p) => p.id);

describe("hardFilter: 예산", () => {
  const list = [
    paddle({ id: "cheap", price_krw: 50000 }),
    paddle({ id: "mid", price_krw: 100000 }),
    paddle({ id: "pricey", price_krw: 200000 }),
  ];

  it("예산 범위 안의 제품만 통과시킨다", () => {
    const result = hardFilter(list, { ...anyone, budget: { min_krw: 60000, max_krw: 150000 } });
    expect(ids(result)).toEqual(["mid"]);
  });

  it("경계값(min, max)은 포함한다", () => {
    const result = hardFilter(list, { ...anyone, budget: { min_krw: 50000, max_krw: 100000 } });
    expect(ids(result)).toEqual(["cheap", "mid"]);
  });

  it("상한만 지정할 수 있다", () => {
    const result = hardFilter(list, { ...anyone, budget: { max_krw: 50000 } });
    expect(ids(result)).toEqual(["cheap"]);
  });

  it("예산 조건이 있으면 가격 정보가 없는 제품을 제외한다", () => {
    const noPrice = paddle({ id: "no-price", price_krw: undefined });
    const result = hardFilter([noPrice, ...list], { ...anyone, budget: { max_krw: 300000 } });
    expect(ids(result)).not.toContain("no-price");
  });

  it("예산 조건이 없으면 가격 정보가 없는 제품도 포함한다", () => {
    const noPrice = paddle({ id: "no-price", price_krw: undefined });
    expect(ids(hardFilter([noPrice], anyone))).toEqual(["no-price"]);
  });

  it("min이 max보다 크면 오류를 던진다", () => {
    expect(() => hardFilter(list, { ...anyone, budget: { min_krw: 2, max_krw: 1 } })).toThrow(RangeError);
  });
});

describe("hardFilter: 대회 인증", () => {
  const list = [
    paddle({ id: "ok", certification: { usa_pickleball: "approved", checked_at: "2026-01-01" } }),
    paddle({ id: "unknown", certification: { usa_pickleball: "unknown", checked_at: "2026-01-01" } }),
    paddle({ id: "no", certification: { usa_pickleball: "not_approved", checked_at: "2026-01-01" } }),
  ];

  it("인증이 필요하면 승인된 제품만 통과시킨다", () => {
    expect(ids(hardFilter(list, { budget: {}, needs_certification: true }))).toEqual(["ok"]);
  });

  it("인증이 필요 없으면 모두 통과시킨다", () => {
    expect(ids(hardFilter(list, anyone))).toEqual(["ok", "unknown", "no"]);
  });
});

describe("hardFilter: 공통 성질", () => {
  it("빈 목록은 빈 배열을 돌려준다", () => {
    expect(hardFilter([], anyone)).toEqual([]);
  });

  it("입력 배열을 바꾸지 않고 순서를 유지한다", () => {
    const list = [paddle({ id: "b", price_krw: 2 }), paddle({ id: "a", price_krw: 1 })];
    const snapshot = [...list];
    const result = hardFilter(list, { ...anyone, budget: { max_krw: 5 } });
    expect(list).toEqual(snapshot);
    expect(ids(result)).toEqual(["b", "a"]);
  });
});
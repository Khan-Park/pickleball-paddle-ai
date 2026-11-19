import { describe, expect, it } from "vitest";
import type { PaddleSpec } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { CERT_MAX_AGE_DAYS, hardFilter as hardFilterAt } from "./filter";
import type { UserProfile } from "./profile";
import { fakeProfile } from "./test-profiles";

const paddle = fakePaddle;

// 픽스처 인증 확인일(2026-01-01)에서 151일 뒤. 유효기간(180일) 안이다.
const TODAY = "2026-06-01";
const hardFilter = (list: readonly PaddleSpec[], profile: UserProfile) =>
  hardFilterAt(list, profile, { today: TODAY });

const anyone: UserProfile = fakeProfile({ budget: {}, needs_certification: false });
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
    expect(ids(hardFilter(list, fakeProfile({ budget: {}, needs_certification: true })))).toEqual(["ok"]);
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
    const snapshot = structuredClone(list); // 요소 객체까지 깊게 복사해 변경을 감지한다
    const result = hardFilter(list, { ...anyone, budget: { max_krw: 5 } });
    expect(list).toEqual(snapshot);
    expect(ids(result)).toEqual(["b", "a"]);
  });
});
describe("hardFilter: 예산 값 검증", () => {
  const list = [paddle({ id: "a", price_krw: 100000 })];

  it.each([
    ["min_krw NaN", { min_krw: Number.NaN }],
    ["max_krw NaN", { max_krw: Number.NaN }],
    ["min_krw 음수", { min_krw: -1 }],
    ["max_krw 음수", { max_krw: -1 }],
    ["max_krw 무한대", { max_krw: Number.POSITIVE_INFINITY }],
  ])("%s는 RangeError를 던진다", (_label, budget) => {
    expect(() => hardFilter(list, { ...anyone, budget })).toThrow(RangeError);
  });

  it("min_krw가 0이면 하한 없음으로 보고 가격 없는 제품도 포함한다", () => {
    const noPrice = paddle({ id: "no-price", price_krw: undefined });
    const result = hardFilter([noPrice, ...list], { ...anyone, budget: { min_krw: 0 } });
    expect(ids(result)).toEqual(["no-price", "a"]);
  });

  it("min_krw만 지정하면 하한 이상(경계 포함)만 통과하고 가격 없는 제품은 제외한다", () => {
    const noPrice = paddle({ id: "no-price", price_krw: undefined });
    const under = paddle({ id: "under", price_krw: 79999 });
    const edge = paddle({ id: "edge", price_krw: 80000 });
    const over = paddle({ id: "over", price_krw: 200000 });
    const result = hardFilter([noPrice, under, edge, over], { ...anyone, budget: { min_krw: 80000 } });
    expect(ids(result)).toEqual(["edge", "over"]);
  });

  it("min_krw 0과 max_krw를 함께 주면 상한은 적용되고 가격 없는 제품은 제외한다", () => {
    const noPrice = paddle({ id: "no-price", price_krw: undefined });
    const result = hardFilter([noPrice, ...list], { ...anyone, budget: { min_krw: 0, max_krw: 150000 } });
    expect(ids(result)).toEqual(["a"]);
  });
});

describe("hardFilter: 예산과 인증의 조합", () => {
  const cert = (status: "approved" | "unknown" | "not_approved") => ({
    usa_pickleball: status,
    checked_at: "2026-01-01",
  });
  const list = [
    paddle({ id: "in-approved", price_krw: 100000, certification: cert("approved") }),
    paddle({ id: "in-unknown", price_krw: 100000, certification: cert("unknown") }),
    paddle({ id: "out-approved", price_krw: 300000, certification: cert("approved") }),
    paddle({ id: "out-unknown", price_krw: 300000, certification: cert("unknown") }),
  ];

  it("두 조건을 모두 만족해야 통과한다", () => {
    const result = hardFilter(list, fakeProfile({ budget: { max_krw: 150000 }, needs_certification: true }));
    expect(ids(result)).toEqual(["in-approved"]);
  });

  it("인증이 필요 없으면 예산 조건만 적용한다", () => {
    const result = hardFilter(list, fakeProfile({ budget: { max_krw: 150000 }, needs_certification: false }));
    expect(ids(result)).toEqual(["in-approved", "in-unknown"]);
  });

  it("예산 제한이 없으면 인증 조건만 적용한다", () => {
    const result = hardFilter(list, fakeProfile({ budget: {}, needs_certification: true }));
    expect(ids(result)).toEqual(["in-approved", "out-approved"]);
  });
});

describe("hardFilter: 대회 인증 확인일 유효기간", () => {
  const verified = paddle({
    id: "v",
    certification: { usa_pickleball: "approved", checked_at: "2026-01-01" },
  });
  const needs: UserProfile = fakeProfile({ budget: {}, needs_certification: true });
  const at = (today: string, profile: UserProfile = needs, list: PaddleSpec[] = [verified]) =>
    ids(hardFilterAt(list, profile, { today }));

  it("유효기간 상수는 사용자가 확정한 180일이다", () => {
    expect(CERT_MAX_AGE_DAYS).toBe(180);
  });

  it("확인 후 180일째까지는 통과한다", () => {
    expect(at("2026-06-30")).toEqual(["v"]);
  });

  it("181일째부터는 제외한다", () => {
    expect(at("2026-07-01")).toEqual([]);
  });

  it("확인일이 기준일보다 미래이면 제외한다", () => {
    expect(at("2025-12-31")).toEqual([]);
  });

  it("확인일 형식이 올바르지 않으면 제외한다", () => {
    const broken = paddle({ id: "b", certification: { usa_pickleball: "approved", checked_at: "어제" } });
    expect(at("2026-06-01", needs, [broken])).toEqual([]);
  });

  it("확인일이 기준일과 같은 날(0일째)이면 통과한다", () => {
    expect(at("2026-01-01")).toEqual(["v"]);
  });

  it("달력에 없는 확인일은 제외한다", () => {
    const impossible = paddle({ id: "x", certification: { usa_pickleball: "approved", checked_at: "2026-02-30" } });
    expect(at("2026-06-01", needs, [impossible])).toEqual([]);
  });

  it("달력에 없는 기준일은 RangeError를 던진다", () => {
    expect(() => hardFilterAt([verified], needs, { today: "2026-02-30" })).toThrow(RangeError);
  });

  it("인증이 필요 없으면 오래된 확인일도 통과한다", () => {
    expect(at("2030-01-01", fakeProfile({ budget: {}, needs_certification: false }))).toEqual(["v"]);
  });

  it("기준일 형식이 올바르지 않으면 RangeError를 던진다", () => {
    expect(() => hardFilterAt([verified], needs, { today: "2026/06/30" })).toThrow(RangeError);
  });

  it("같은 입력과 기준일이면 항상 같은 결과를 낸다(현재 시각에 의존하지 않는다)", () => {
    expect(at("2026-06-30")).toEqual(at("2026-06-30"));
    expect(at("2099-01-01")).toEqual([]);
  });
});
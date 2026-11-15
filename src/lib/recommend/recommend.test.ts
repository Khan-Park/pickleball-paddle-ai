import { describe, expect, it } from "vitest";
import type { PaddleSpec } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { REASON_RULE_IDS } from "./reasons";
import { labelFor, recommend } from "./recommend";
import { SCORING_VERSION } from "./scoring-config";
import { fakeProfile } from "./test-profiles";

const ctx = { today: "2026-06-01" };
const top = (list: PaddleSpec[], profile = fakeProfile()) => recommend(list, profile, ctx, { limit: 1 }).items[0]?.paddle_id;

// 성향이 뚜렷한 가짜 제품 5종(실제 제품이 아니다)
const POWER = fakePaddle({ id: "power", core_mm: 13, weight_oz: 8.6, shape: "elongated", price_krw: 200000 });
const CONTROL = fakePaddle({ id: "control", core_mm: 17, weight_oz: 8.0, shape: "standard", price_krw: 150000 });
const LIGHT_THIN = fakePaddle({ id: "light-thin", core_mm: 13.5, weight_oz: 7.0, shape: "hybrid", price_krw: 120000 });
const WIDE = fakePaddle({ id: "wide", core_mm: 16, weight_oz: 7.9, shape: "widebody", price_krw: 100000 });
const HEAVY_THICK = fakePaddle({ id: "heavy-thick", core_mm: 16, weight_oz: 8.9, shape: "standard", price_krw: 180000 });
const ALL = [POWER, CONTROL, LIGHT_THIN, WIDE, HEAVY_THICK];

describe("골든 페르소나: 기대 1순위", () => {
  const personas: [string, Parameters<typeof fakeProfile>[0], string][] = [
    ["초보·컨트롤", { skill_level: "beginner", play_style: "control" }, "control"],
    ["상급·컨트롤", { skill_level: "advanced", play_style: "control" }, "control"],
    ["상급·파워", { skill_level: "advanced", play_style: "power" }, "power"],
    ["초보·균형·팔 불편", { skill_level: "beginner", play_style: "balanced", arm_discomfort: true }, "wide"],
    ["중급·균형·가벼운 무게 선호", { skill_level: "intermediate", play_style: "balanced", weight_preference: "light" }, "light-thin"],
    ["상급·파워·묵직한 무게 선호", { skill_level: "advanced", play_style: "power", weight_preference: "heavy" }, "power"],
    ["초보·균형·넓은 형 선호", { skill_level: "beginner", play_style: "balanced", preferred_shapes: ["widebody"] }, "wide"],
  ];
  it.each(personas)("%s → %s", (_name, overrides, expected) => {
    expect(top(ALL, fakeProfile(overrides))).toBe(expected);
  });

  it("팔 불편 사용자에게 무겁고 얇은 파워형이 나오면 주의 문구를 단다", () => {
    const result = recommend(ALL, fakeProfile({ play_style: "power", arm_discomfort: true }), ctx, { limit: 5 });
    const power = result.items.find((i) => i.paddle_id === "power");
    expect(power).toBeDefined();
    expect(power!.cautions.some((c) => c.includes("팔 불편"))).toBe(true);
  });
});

describe("recommend: 구조", () => {
  const profile = fakeProfile({ play_style: "control" });

  it("기본 3개, limit으로 조절하고 버전과 라벨을 담는다", () => {
    const r = recommend(ALL, profile, ctx);
    expect(r.items).toHaveLength(3);
    expect(r.scoring_version).toBe(SCORING_VERSION);
    expect(r.relaxation).toEqual([]);
    for (const i of r.items) {
      expect(["매우 잘 맞음", "잘 맞음", "보통"]).toContain(i.label);
      expect(i.score).toBeGreaterThanOrEqual(0);
      expect(i.score).toBeLessThanOrEqual(100);
      expect(i.axes.length).toBeGreaterThan(0);
    }
    expect(recommend(ALL, profile, ctx, { limit: 5 }).items).toHaveLength(5);
  });

  it("후보가 limit보다 적으면 있는 만큼만 돌려준다", () => {
    expect(recommend([CONTROL, WIDE], profile, ctx).items).toHaveLength(2);
  });

  it("점수 내림차순이고 동점은 id 오름차순이다(입력 순서와 무관)", () => {
    const twins = [fakePaddle({ id: "b-twin" }), fakePaddle({ id: "a-twin" }), fakePaddle({ id: "c-twin" })];
    const ids = recommend(twins, profile, ctx).items.map((i) => i.paddle_id);
    expect(ids).toEqual(["a-twin", "b-twin", "c-twin"]);
    expect(recommend([...twins].reverse(), profile, ctx).items.map((i) => i.paddle_id)).toEqual(ids);
    const scores = recommend(ALL, profile, ctx, { limit: 5 }).items.map((i) => i.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("같은 입력은 항상 같은 결과를 내고 입력을 바꾸지 않는다", () => {
    const before = JSON.stringify([ALL, profile]);
    expect(recommend(ALL, profile, ctx)).toEqual(recommend(ALL, profile, ctx));
    expect(JSON.stringify([ALL, profile])).toBe(before);
  });

  it("limit이 1 미만이거나 정수가 아니면 RangeError", () => {
    for (const limit of [0, -1, 1.5, Number.NaN]) expect(() => recommend(ALL, profile, ctx, { limit })).toThrow(RangeError);
  });

  it("하드 필터를 통과하지 못한 제품은 점수가 높아도 나오지 않는다", () => {
    const r = recommend(ALL, fakeProfile({ play_style: "power", budget: { max_krw: 150000 } }), ctx, { limit: 5 });
    expect(r.items.map((i) => i.paddle_id)).not.toContain("power");
  });

  it("구매 정보가 달라도 결과가 같고, 결과에 purchase가 담기지 않는다", () => {
    const withLink = ALL.map((p, i) => ({ ...p, purchase: { url: `https://example.com/${i}`, is_affiliate: i % 2 === 0 } }));
    const noLink = ALL.map((p, i) => ({ ...p, purchase: { url: `https://example.org/x${i}`, is_affiliate: i % 2 === 1 } }));
    const a = recommend(withLink, profile, ctx, { limit: 5 });
    expect(a).toEqual(recommend(noLink, profile, ctx, { limit: 5 }));
    expect(JSON.stringify(a)).not.toMatch(/purchase|affiliate|example\.(com|org)/);
  });
});

describe("라벨 경계", () => {
  it.each([
    [100, "매우 잘 맞음"],
    [80, "매우 잘 맞음"],
    [79.99, "잘 맞음"],
    [60, "잘 맞음"],
    [59.99, "보통"],
    [0, "보통"],
  ] as const)("총점 %f → %s", (score, label) => {
    expect(labelFor(score)).toBe(label);
  });
});

describe("이유와 주의 문구", () => {
  it("이유는 최대 3개이고, 점수가 낮은 축은 이유가 아니라 주의로 간다", () => {
    const r = recommend(ALL, fakeProfile({ play_style: "power", arm_discomfort: true }), ctx, { limit: 5 });
    for (const i of r.items) {
      expect(i.reasons.length).toBeLessThanOrEqual(3);
      const lowAxes = i.axes.filter((a) => a.score < 0.4).length;
      expect(i.cautions).toHaveLength(lowAxes);
    }
  });

  it("모든 문장은 한국어이고 템플릿 변수가 비어 있지 않다", () => {
    const profiles = [
      fakeProfile({ play_style: "control", weight_preference: "light", arm_discomfort: true, preferred_shapes: ["widebody"] }),
      fakeProfile({ play_style: "power", weight_preference: "heavy", skill_level: "advanced", preferred_shapes: ["elongated"] }),
      fakeProfile({ play_style: "balanced", weight_preference: "medium" }),
    ];
    for (const p of profiles)
      for (const i of recommend(ALL, p, ctx, { limit: 5 }).items)
        for (const s of [...i.reasons, ...i.cautions]) {
          expect(s).toMatch(/[가-힣]/);
          expect(s).not.toMatch(/undefined|NaN|\{|\}/);
        }
  });

  it("의학적 효과를 단정하는 표현을 쓰지 않는다", () => {
    const sore = fakeProfile({ arm_discomfort: true });
    const all = recommend(ALL, sore, ctx, { limit: 5 }).items.flatMap((i) => [...i.reasons, ...i.cautions]);
    expect(all.length).toBeGreaterThan(0);
    for (const s of all) expect(s).not.toMatch(/치료|예방|완화됩니다|낫|엘보를/);
    expect(all.some((s) => s.includes("도움이 될 수 있는"))).toBe(true);
  });

  it("점수에 쓰이는 모든 규칙 ID에 템플릿이 있다", () => {
    const profile = fakeProfile({ arm_discomfort: true, weight_preference: "medium", preferred_shapes: ["hybrid"] });
    const used = new Set(recommend(ALL, profile, ctx).items.flatMap((i) => i.axes.map((a) => a.reason.rule)));
    for (const rule of used) expect(REASON_RULE_IDS).toContain(rule);
    expect(used.size).toBe(5);
  });
});

describe("조건 완화 힌트", () => {
  const strict = fakeProfile({ budget: { max_krw: 50000 } });

  it("후보가 있으면 힌트는 비어 있다", () => {
    expect(recommend(ALL, fakeProfile(), ctx).relaxation).toEqual([]);
  });

  it("예산이 걸림돌이면 예산 힌트와 필요한 최소 상한을 알려 준다", () => {
    const r = recommend(ALL, strict, ctx);
    expect(r.items).toEqual([]);
    expect(r.relaxation).toEqual([
      expect.objectContaining({ kind: "budget", candidates_if_relaxed: 5, suggested_max_krw: 100000 }),
    ]);
    expect(r.relaxation[0]!.message).toContain("100,000원");
  });

  it("대회 인증이 걸림돌이면 인증 힌트를 준다", () => {
    const unknownCert = ALL.map((p) => ({ ...p, certification: { usa_pickleball: "unknown" as const, checked_at: "2026-05-01" } }));
    const r = recommend(unknownCert, fakeProfile({ needs_certification: true }), ctx);
    expect(r.relaxation).toEqual([expect.objectContaining({ kind: "certification", candidates_if_relaxed: 5 })]);
  });

  it("둘 중 하나만 풀어서는 안 될 때만 '둘 다' 힌트를 준다", () => {
    const pricey = [fakePaddle({ id: "x", price_krw: 300000, certification: { usa_pickleball: "unknown", checked_at: "2026-05-01" } })];
    const r = recommend(pricey, fakeProfile({ budget: { max_krw: 50000 }, needs_certification: true }), ctx);
    expect(r.relaxation.map((h) => h.kind)).toEqual(["both"]);
  });

  it("제품 목록이 비어 있으면 힌트도 없다", () => {
    expect(recommend([], fakeProfile({ budget: { max_krw: 50000 } }), ctx).relaxation).toEqual([]);
  });

  it("가격 정보가 없는 제품만 걸려 있으면 상한 제안 없이 예산 해제 힌트만 준다", () => {
    const noPrice = [fakePaddle({ id: "np", price_krw: undefined })];
    const r = recommend(noPrice, strict, ctx);
    expect(r.relaxation).toEqual([expect.objectContaining({ kind: "budget", candidates_if_relaxed: 1 })]);
    expect(r.relaxation[0]).not.toHaveProperty("suggested_max_krw");
  });
});

describe("경력별 무게 보정 (D-021)", () => {
  // 실제 데이터에서 본 사례를 가짜 제품으로 재현: 스펙은 같고 무게만 다른 넓은 형 16mm 두 개
  const heavy = fakePaddle({ id: "heavy-wide", core_mm: 16, weight_oz: 8.75, shape: "widebody" });
  const medium = fakePaddle({ id: "medium-wide", core_mm: 16, weight_oz: 8.1, shape: "widebody" });

  it("초보·균형 사용자에게는 중간 무게가 무거운 것보다 위에 온다", () => {
    expect(top([heavy, medium], fakeProfile({ skill_level: "beginner", play_style: "balanced" }))).toBe("medium-wide");
  });

  it("초보에게 무거운 패들이 나오면 주의 문구를 단다", () => {
    const r = recommend([heavy], fakeProfile({ skill_level: "beginner" }), ctx);
    expect(r.items[0]!.cautions.some((c) => c.includes("무거운 편"))).toBe(true);
  });

  it("상급자에게는 무게 보정이 적용되지 않는다", () => {
    const r = recommend([heavy], fakeProfile({ skill_level: "advanced" }), ctx);
    expect(r.items[0]!.axes.map((a) => a.axis)).not.toContain("skill_weight");
  });
});

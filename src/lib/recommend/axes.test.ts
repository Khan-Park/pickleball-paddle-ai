import { describe, expect, it } from "vitest";
import type { PaddleSpec } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import {
  armComfortAxis,
  computeAxes,
  forgivenessAxis,
  lean,
  powerControlAxis,
  shapePreferenceAxis,
  skillWeightAxis,
  weightBand,
  weightPreferenceAxis,
} from "./axes";
import type { UserProfile } from "./profile";
import { fakeProfile } from "./test-profiles";
import { SCORING_VERSION } from "./scoring-config";

const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe("lean: 경계값", () => {
  // hybrid는 형태 기여 0, 무게 7.9oz는 무게 기여 0
  it.each([
    [13, 0.45],
    [15, 0],
    [17, -0.45],
    [10, 0.45], // 포화
    [20, -0.45], // 포화
  ])("코어 %imm → lean %f", (core, expected) => {
    near(lean(fakePaddle({ core_mm: core, weight_oz: 7.9, shape: "hybrid" })), expected);
  });

  it.each([
    [7.1, -0.3],
    [7.9, 0],
    [8.7, 0.3],
    [6, -0.3], // 포화
    [9.5, 0.3], // 포화
  ])("무게 %foz → lean %f", (weight, expected) => {
    near(lean(fakePaddle({ core_mm: 15, weight_oz: weight, shape: "hybrid" })), expected);
  });

  it("형태는 elongated > hybrid > standard > widebody 순으로 파워 쪽이다", () => {
    const at = (shape: "elongated" | "hybrid" | "standard" | "widebody") =>
      lean(fakePaddle({ core_mm: 15, weight_oz: 7.9, shape }));
    expect(at("elongated")).toBeGreaterThan(at("hybrid"));
    expect(at("hybrid")).toBeGreaterThan(at("standard"));
    expect(at("standard")).toBeGreaterThan(at("widebody"));
  });
});

describe("weightBand: 경계는 medium에 포함", () => {
  it.each([
    [7.29, "light"],
    [7.3, "medium"],
    [8.4, "medium"],
    [8.41, "heavy"],
  ] as const)("%foz → %s", (w, band) => {
    expect(weightBand(w)).toBe(band);
  });
});

describe("power_control", () => {
  const control = fakeProfile({ play_style: "control" });
  const power = fakeProfile({ play_style: "power" });
  const thick = fakePaddle({ core_mm: 17, weight_oz: 7.9, shape: "standard" });
  const thin = fakePaddle({ core_mm: 13, weight_oz: 8.5, shape: "elongated" });

  it("컨트롤 성향은 두꺼운 코어를, 파워 성향은 얇은 코어를 더 잘 맞는다고 본다", () => {
    expect(powerControlAxis(thick, control).score).toBeGreaterThan(powerControlAxis(thin, control).score);
    expect(powerControlAxis(thin, power).score).toBeGreaterThan(powerControlAxis(thick, power).score);
  });

  it("lean이 목표와 같으면 1, 목표와 1.2 이상 멀면 0", () => {
    near(powerControlAxis(fakePaddle({ core_mm: 15, weight_oz: 7.9, shape: "hybrid" }), fakeProfile({ play_style: "balanced" })).score, 1);
    // lean +0.45+0.3+0.15=0.9, 컨트롤 목표 -0.6 → 거리 1.5
    expect(powerControlAxis(fakePaddle({ core_mm: 13, weight_oz: 8.7, shape: "elongated" }), control).score).toBe(0);
  });

  it("컨트롤 성향: lean이 목표 위에 있는 동안 코어가 두꺼울수록 적합도가 내려가지 않는다(단조성)", () => {
    // 무거운 길쭉한 형은 코어 13~17mm 전 구간에서 lean ≥ 0 > 목표(-0.6)
    let prevLean = Number.POSITIVE_INFINITY;
    let prevScore = -1;
    for (let core = 13; core <= 17; core += 0.5) {
      const p = fakePaddle({ core_mm: core, weight_oz: 8.7, shape: "elongated" });
      const l = lean(p);
      const s = powerControlAxis(p, control).score;
      expect(l).toBeLessThanOrEqual(prevLean);
      expect(s).toBeGreaterThanOrEqual(prevScore);
      prevLean = l;
      prevScore = s;
    }
  });

  it("이유에 규칙 ID와 값을 담는다", () => {
    const r = powerControlAxis(thick, control).reason;
    expect(r.rule).toBe("power_control.lean");
    expect(r.values).toMatchObject({ core_mm: 17, play_style: "control" });
  });
});

describe("forgiveness", () => {
  it("넓은 형·두꺼운 코어가 길쭉한 형·얇은 코어보다 높다", () => {
    const wide = forgivenessAxis(fakePaddle({ shape: "widebody", core_mm: 18 })).score;
    const long = forgivenessAxis(fakePaddle({ shape: "elongated", core_mm: 13 })).score;
    near(wide, 1);
    near(long, 0.18);
  });

  it("코어 13/15/17mm 경계", () => {
    const at = (core: number) => forgivenessAxis(fakePaddle({ shape: "hybrid", core_mm: core })).score;
    near(at(13), 0.36);
    near(at(15), 0.36 + 0.4 * 0.4);
    near(at(17), 0.36 + 0.4 * 0.8);
  });
});

describe("arm_comfort", () => {
  const sore = fakeProfile({ arm_discomfort: true });

  it("팔 불편이 아니면 축을 제외한다(null)", () => {
    expect(armComfortAxis(fakePaddle(), fakeProfile({ arm_discomfort: false }))).toBeNull();
    expect(computeAxes(fakePaddle(), fakeProfile({ arm_discomfort: false })).map((a) => a.axis)).not.toContain("arm_comfort");
    expect(computeAxes(fakePaddle(), sore).map((a) => a.axis)).toContain("arm_comfort");
  });

  it("중간 무게 + 두꺼운 코어가 가장 높고, 무겁고 얇으면 가장 낮다", () => {
    near(armComfortAxis(fakePaddle({ weight_oz: 7.9, core_mm: 16 }), sore)!.score, 1);
    near(armComfortAxis(fakePaddle({ weight_oz: 8.7, core_mm: 13 }), sore)!.score, 0.1);
  });

  it("코어 14/16mm 경계: 14 이하 0, 사이 0.5, 16 이상 1", () => {
    const at = (core: number) => armComfortAxis(fakePaddle({ weight_oz: 7.9, core_mm: core }), sore)!.score;
    near(at(14), 0.5);
    near(at(15), 0.75);
    near(at(16), 1);
  });

  it("무게대 경계 7.3/8.4oz는 medium", () => {
    const at = (w: number) => armComfortAxis(fakePaddle({ weight_oz: w, core_mm: 16 }), sore)!.score;
    near(at(7.3), 1);
    near(at(8.4), 1);
    near(at(7.29), 0.85);
    near(at(8.41), 0.6);
  });
});

describe("weight_preference", () => {
  it("no_preference면 축을 제외한다", () => {
    expect(weightPreferenceAxis(fakePaddle(), fakeProfile({ weight_preference: "no_preference" }))).toBeNull();
  });

  it("구간 안이면 1, 밖은 1oz당 1.0 감점(0.5oz당 0.5), 하한 0", () => {
    const at = (pref: "light" | "medium" | "heavy", w: number) =>
      weightPreferenceAxis(fakePaddle({ weight_oz: w }), fakeProfile({ weight_preference: pref }))!.score;
    near(at("medium", 7.3), 1);
    near(at("medium", 8.4), 1);
    near(at("medium", 6.8), 0.5);
    near(at("medium", 8.9), 0.5);
    near(at("light", 7.3), 1);
    near(at("light", 7.8), 0.5);
    expect(at("light", 8.7)).toBe(0);
    near(at("heavy", 8.4), 1);
    near(at("heavy", 7.9), 0.5);
    expect(at("heavy", 7.1)).toBe(0);
  });
});

describe("shape_preference", () => {
  it("선택하지 않았으면 제외한다", () => {
    expect(shapePreferenceAxis(fakePaddle(), fakeProfile())).toBeNull();
  });

  it("선호 형태면 1, 아니면 0.4(제외하지 않는다)", () => {
    const profile = fakeProfile({ preferred_shapes: ["widebody"] });
    expect(shapePreferenceAxis(fakePaddle({ shape: "widebody" }), profile)!.score).toBe(1);
    expect(shapePreferenceAxis(fakePaddle({ shape: "hybrid" }), profile)!.score).toBe(0.4);
  });
});

describe("속성: 범위·결정성", () => {
  const shapes = ["standard", "hybrid", "elongated", "widebody"] as const;
  const paddles: PaddleSpec[] = [];
  for (const core of [8, 11, 13, 14, 15, 16, 17, 20, 25])
    for (const weight of [5, 6.5, 7.1, 7.3, 7.9, 8.4, 8.7, 10])
      for (const shape of shapes) paddles.push(fakePaddle({ core_mm: core, weight_oz: weight, shape }));
  const profiles: UserProfile[] = [];
  for (const style of ["control", "balanced", "power"] as const)
    for (const skill of ["beginner", "advanced"] as const)
      for (const wp of ["light", "medium", "heavy", "no_preference"] as const)
        for (const arm of [true, false])
          profiles.push(fakeProfile({ play_style: style, skill_level: skill, weight_preference: wp, arm_discomfort: arm, preferred_shapes: arm ? ["standard"] : undefined }));

  it("모든 축 점수는 항상 0~1이다", () => {
    for (const p of paddles)
      for (const u of profiles)
        for (const a of computeAxes(p, u)) {
          expect(a.score).toBeGreaterThanOrEqual(0);
          expect(a.score).toBeLessThanOrEqual(1);
          expect(Number.isFinite(a.score)).toBe(true);
        }
  });

  it("같은 입력은 항상 같은 결과를 낸다", () => {
    for (const p of paddles.slice(0, 40)) for (const u of profiles) expect(computeAxes(p, u)).toEqual(computeAxes(p, u));
  });

  it("입력 객체를 바꾸지 않는다", () => {
    const p = fakePaddle();
    const u = fakeProfile({ preferred_shapes: ["hybrid"] });
    const before = JSON.stringify([p, u]);
    computeAxes(p, u);
    expect(JSON.stringify([p, u])).toBe(before);
  });
});

describe("SCORING_VERSION", () => {
  it("버전 문자열이 있다", () => {
    expect(SCORING_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("skill_weight (D-021)", () => {
  const at = (w: number, profile = fakeProfile({ skill_level: "beginner" })) => skillWeightAxis(fakePaddle({ weight_oz: w }), profile);

  it("상급자이거나 무게 선호를 직접 골랐으면 축을 제외한다", () => {
    expect(at(8.8, fakeProfile({ skill_level: "advanced" }))).toBeNull();
    expect(at(8.8, fakeProfile({ skill_level: "beginner", weight_preference: "heavy" }))).toBeNull();
    expect(at(8.8, fakeProfile({ skill_level: "intermediate" }))).not.toBeNull();
    // 무게 선호를 고르면 weight_preference 축만 남는다(중복 감점 없음)
    const axes = computeAxes(fakePaddle({ weight_oz: 8.8 }), fakeProfile({ weight_preference: "medium" })).map((a) => a.axis);
    expect(axes).toContain("weight_preference");
    expect(axes).not.toContain("skill_weight");
  });

  it("권장 무게대(7.3~8.4oz) 안이면 1, 벗어나면 1oz당 2.0 감점, 하한 0", () => {
    near(at(7.3)!.score, 1);
    near(at(8.4)!.score, 1);
    near(at(8.75)!.score, 0.3);
    near(at(7.0)!.score, 0.4);
    expect(at(9.5)!.score).toBe(0);
  });

  it("이유에 무게와 무게대를 담는다", () => {
    expect(at(8.75)!.reason).toEqual({ rule: "skill_weight.band", values: { weight_oz: 8.75, band: "heavy", skill_level: "beginner" } });
  });
});

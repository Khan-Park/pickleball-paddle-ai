import { describe, expect, it } from "vitest";
import { criteriaLines } from "./criteria";
import { AXIS_WEIGHTS, LABEL_THRESHOLDS, LEAN, WEIGHT_BAND } from "./scoring-config";
import { CERT_MAX_AGE_DAYS } from "../shared/limits";
import { fakeProfile } from "./test-profiles";

const text = (lines: { condition: string; rule: string }[]) => lines.map((l) => `${l.condition} ${l.rule}`).join("\n");

describe("추천 기준 문장(T-045)", () => {
  it("성향 문장의 수치는 LEAN 상수와 같다", () => {
    const control = text(criteriaLines(fakeProfile({ play_style: "control" })));
    expect(control).toContain(`코어가 ${LEAN.core.neutralMm}mm보다 두껍고`);
    expect(control).toContain(`무게가 ${LEAN.weight.neutralOz}oz보다 가볍고`);
    expect(text(criteriaLines(fakeProfile({ play_style: "power" })))).toContain(`${LEAN.core.neutralMm}mm보다 얇고`);
  });

  it("무게 선호·권장 무게대는 WEIGHT_BAND 경계와 같다", () => {
    expect(text(criteriaLines(fakeProfile({ weight_preference: "light" })))).toContain(`${WEIGHT_BAND.lightBelowOz}oz 미만`);
    expect(text(criteriaLines(fakeProfile({ weight_preference: "heavy" })))).toContain(`${WEIGHT_BAND.heavyAboveOz}oz 초과`);
    // 입문이고 무게를 고르지 않았으면 권장 무게대(skill_weight 축)
    expect(text(criteriaLines(fakeProfile()))).toContain(`권장 무게대 ${WEIGHT_BAND.lightBelowOz}~${WEIGHT_BAND.heavyAboveOz}oz`);
    // 무게를 직접 골랐거나 상급이면 권장 무게대 문장이 없다(엔진에서 그 축이 꺼진다)
    expect(text(criteriaLines(fakeProfile({ weight_preference: "medium" })))).not.toContain("권장 무게대");
    expect(text(criteriaLines(fakeProfile({ skill_level: "advanced" })))).not.toContain("권장 무게대");
  });

  it("대회용은 CERT_MAX_AGE_DAYS, 예산은 고른 범위를 쓴다", () => {
    const t = text(criteriaLines(fakeProfile({ needs_certification: true, budget: { min_krw: 100_000, max_krw: 200_000 } })));
    expect(t).toContain(`${CERT_MAX_AGE_DAYS}일 안`);
    expect(t).toContain("예산 100,000원~200,000원");
    expect(text(criteriaLines(fakeProfile({ budget: { max_krw: 100_000 } })))).toContain("예산 100,000원 이하");
    expect(text(criteriaLines(fakeProfile()))).not.toContain("예산");
  });

  it("선호 형태는 고른 형태 이름으로, 빼지 않는다고 적는다", () => {
    const t = text(criteriaLines(fakeProfile({ preferred_shapes: ["widebody", "hybrid"] })));
    expect(t).toContain("선호 형태: 넓은 형·하이브리드형");
    expect(t).toContain("빼지는 않았습니다");
  });

  it("팔 불편 답은 넣지 않는다", () => {
    const t = text(criteriaLines(fakeProfile({ arm_discomfort: true })));
    expect(t).not.toMatch(/팔|손목|어깨|불편/);
    expect(criteriaLines(fakeProfile({ arm_discomfort: true }))).toEqual(criteriaLines(fakeProfile({ arm_discomfort: false })));
  });

  it("가중치·라벨 기준 같은 점수 숫자는 넣지 않는다", () => {
    const t = text(criteriaLines(fakeProfile({ play_style: "power", weight_preference: "heavy", needs_certification: true, preferred_shapes: ["elongated"] })));
    const scoreNumbers = [AXIS_WEIGHTS.power_control, AXIS_WEIGHTS.weight_preference, AXIS_WEIGHTS.shape_preference, LABEL_THRESHOLDS.veryGood, LABEL_THRESHOLDS.good];
    for (const n of scoreNumbers) expect(t, String(n)).not.toMatch(new RegExp(`(^|[^\\d.])${String(n).replace(".", "\\.")}([^\\d]|$)`));
    expect(t).not.toMatch(/점|%/);
  });
});

import type { PaddleSpec } from "../../../data/schema";
import type { UserProfile } from "./profile";
import { ARM_COMFORT, FORGIVENESS, LEAN, SHAPE_PREFERENCE, SKILL_WEIGHT, WEIGHT_BAND, WEIGHT_PREFERENCE } from "./scoring-config";

export type AxisId = "power_control" | "forgiveness" | "arm_comfort" | "skill_weight" | "weight_preference" | "shape_preference";

/** 점수에 쓴 규칙. rule은 추천 이유 템플릿의 키, values는 문장에 채울 값이다 */
export type AxisReason = { rule: string; values: Record<string, number | string> };

/** score는 항상 0~1 */
export type AxisResult = { axis: AxisId; score: number; reason: AxisReason };

export type WeightBand = "light" | "medium" | "heavy";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** 무게대. 7.3oz와 8.4oz는 medium에 포함한다 */
export function weightBand(weightOz: number): WeightBand {
  if (weightOz < WEIGHT_BAND.lightBelowOz) return "light";
  if (weightOz > WEIGHT_BAND.heavyAboveOz) return "heavy";
  return "medium";
}

/** 스펙에서 추정한 파워 경향(-1 컨트롤 ~ +1 파워). 실측값이 아니다 */
export function lean(paddle: PaddleSpec): number {
  const core = clamp((LEAN.core.neutralMm - paddle.core_mm) / LEAN.core.spanMm, -1, 1);
  const weight = clamp((paddle.weight_oz - LEAN.weight.neutralOz) / LEAN.weight.spanOz, -1, 1);
  const shape = LEAN.shape.value[paddle.shape];
  return LEAN.core.weight * core + LEAN.weight.weight * weight + LEAN.shape.weight * shape;
}

export function powerControlAxis(paddle: PaddleSpec, profile: UserProfile): AxisResult {
  const value = lean(paddle);
  const target = LEAN.target[profile.play_style];
  const score = Math.max(0, 1 - Math.abs(value - target) / LEAN.maxDistance);
  return {
    axis: "power_control",
    score,
    reason: {
      rule: "power_control.lean",
      values: { lean: value, target, play_style: profile.play_style, core_mm: paddle.core_mm, weight_oz: paddle.weight_oz, shape: paddle.shape },
    },
  };
}

export function forgivenessAxis(paddle: PaddleSpec): AxisResult {
  const shape = FORGIVENESS.shape.value[paddle.shape];
  const core = clamp((paddle.core_mm - FORGIVENESS.core.minMm) / FORGIVENESS.core.spanMm, 0, 1);
  const score = FORGIVENESS.shape.weight * shape + FORGIVENESS.core.weight * core;
  return {
    axis: "forgiveness",
    score,
    reason: { rule: "forgiveness.shape_core", values: { shape: paddle.shape, core_mm: paddle.core_mm } },
  };
}

/** arm_discomfort가 아니면 null(축 제외) */
export function armComfortAxis(paddle: PaddleSpec, profile: UserProfile): AxisResult | null {
  if (!profile.arm_discomfort) return null;
  const band = weightBand(paddle.weight_oz);
  const { fullMm, zeroMm, mid } = ARM_COMFORT.core;
  const coreScore = paddle.core_mm >= fullMm ? 1 : paddle.core_mm <= zeroMm ? 0 : mid;
  const score = ARM_COMFORT.weights.band * ARM_COMFORT.weightBandScore[band] + ARM_COMFORT.weights.core * coreScore;
  return {
    axis: "arm_comfort",
    score,
    reason: { rule: "arm_comfort.weight_core", values: { band, weight_oz: paddle.weight_oz, core_mm: paddle.core_mm } },
  };
}

/** 권장 무게대(medium)에서 벗어난 정도(oz). 안이면 0 */
function outsideMediumBand(weightOz: number): number {
  return Math.max(0, WEIGHT_BAND.lightBelowOz - weightOz, weightOz - WEIGHT_BAND.heavyAboveOz);
}

/**
 * 경력별 무게 적합. 상급자이거나 사용자가 무게 선호를 직접 골랐으면 null(축 제외).
 * 초보·중급에게 권장 무게대를 벗어난 패들을 감점한다. (D-021)
 */
export function skillWeightAxis(paddle: PaddleSpec, profile: UserProfile): AxisResult | null {
  if (profile.skill_level === "advanced" || profile.weight_preference !== "no_preference") return null;
  const w = paddle.weight_oz;
  return {
    axis: "skill_weight",
    score: Math.max(0, 1 - outsideMediumBand(w) * SKILL_WEIGHT.penaltyPerOz),
    reason: { rule: "skill_weight.band", values: { weight_oz: w, band: weightBand(w), skill_level: profile.skill_level } },
  };
}

/** no_preference면 null */
export function weightPreferenceAxis(paddle: PaddleSpec, profile: UserProfile): AxisResult | null {
  const pref = profile.weight_preference;
  if (pref === "no_preference") return null;
  const w = paddle.weight_oz;
  const outside =
    pref === "light"
      ? Math.max(0, w - WEIGHT_BAND.lightBelowOz)
      : pref === "heavy"
        ? Math.max(0, WEIGHT_BAND.heavyAboveOz - w)
        : outsideMediumBand(w);
  return {
    axis: "weight_preference",
    score: Math.max(0, 1 - outside * WEIGHT_PREFERENCE.penaltyPerOz),
    reason: { rule: "weight_preference.band", values: { preference: pref, weight_oz: w, band: weightBand(w) } },
  };
}

/** preferred_shapes가 없으면 null */
export function shapePreferenceAxis(paddle: PaddleSpec, profile: UserProfile): AxisResult | null {
  if (!profile.preferred_shapes) return null;
  const matched = profile.preferred_shapes.includes(paddle.shape);
  return {
    axis: "shape_preference",
    score: matched ? 1 : SHAPE_PREFERENCE.nonPreferredScore,
    reason: { rule: "shape_preference.match", values: { shape: paddle.shape, matched: matched ? "yes" : "no" } },
  };
}

/** 이 사용자에게 켜진 축의 결과만 모은다(고정 순서) */
export function computeAxes(paddle: PaddleSpec, profile: UserProfile): AxisResult[] {
  return [
    powerControlAxis(paddle, profile),
    forgivenessAxis(paddle),
    armComfortAxis(paddle, profile),
    skillWeightAxis(paddle, profile),
    weightPreferenceAxis(paddle, profile),
    shapePreferenceAxis(paddle, profile),
  ].filter((r): r is AxisResult => r !== null);
}

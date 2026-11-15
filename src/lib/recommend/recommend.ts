import type { PaddleSpec } from "../../../data/schema";
import { computeAxes, type AxisId, type AxisResult } from "./axes";
import { type FilterContext, hardFilter } from "./filter";
import type { UserProfile } from "./profile";
import { cautionText, reasonText } from "./reasons";
import { AXIS_WEIGHTS, DEFAULT_LIMIT, EXPLANATION, LABEL_THRESHOLDS, SCORING_VERSION } from "./scoring-config";

export type MatchLabel = "매우 잘 맞음" | "잘 맞음" | "보통";

export type Recommendation = {
  /** 구매 링크 등은 담지 않는다. 화면은 id로 제품 데이터를 찾는다 */
  paddle_id: string;
  /** 내부 값(0~100). 화면에는 label만 보여 준다 */
  score: number;
  label: MatchLabel;
  axes: AxisResult[];
  reasons: string[];
  cautions: string[];
};

export type RelaxationHint = {
  kind: "budget" | "certification" | "both";
  /** 이 조건을 풀면 후보가 몇 개가 되는지 */
  candidates_if_relaxed: number;
  /** budget 힌트에서, 후보가 1개 이상 생기는 가장 낮은 예산 상한(원) */
  suggested_max_krw?: number;
  message: string;
};

export type RecommendResult = {
  scoring_version: string;
  items: Recommendation[];
  /** items가 비었을 때만 채운다. 어떤 조건이 걸림돌인지 알려 준다 */
  relaxation: RelaxationHint[];
};

export type RecommendOptions = { limit?: number };

function axisWeight(axis: AxisId, profile: UserProfile): number {
  if (axis === "forgiveness") return AXIS_WEIGHTS.forgiveness[profile.skill_level];
  // skill_weight 축은 상급자에게 만들어지지 않는다(axes.ts). 방어적으로 0을 돌려준다
  if (axis === "skill_weight") return profile.skill_level === "advanced" ? 0 : AXIS_WEIGHTS.skill_weight[profile.skill_level];
  return AXIS_WEIGHTS[axis];
}

export function labelFor(score: number): MatchLabel {
  if (score >= LABEL_THRESHOLDS.veryGood) return "매우 잘 맞음";
  if (score >= LABEL_THRESHOLDS.good) return "잘 맞음";
  return "보통";
}

/** 부동소수점 잡음으로 동점이 갈리지 않도록 소수 6자리로 맞춘다 */
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

function scorePaddle(paddle: PaddleSpec, profile: UserProfile): Recommendation {
  const axes = computeAxes(paddle, profile);
  const weights = axes.map((a) => axisWeight(a.axis, profile));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const contributions = axes.map((a, i) => (weights[i]! * a.score) / totalWeight);
  const score = round6(contributions.reduce((s, c) => s + c, 0) * 100);

  const indexed = axes.map((axis, i) => ({ axis, contribution: contributions[i]!, order: i }));
  const reasons = indexed
    .filter((x) => x.axis.score >= EXPLANATION.reasonMinScore)
    .sort((a, b) => b.contribution - a.contribution || a.order - b.order)
    .slice(0, EXPLANATION.maxReasons)
    .map((x) => reasonText(x.axis.reason));
  const cautions = indexed
    .filter((x) => x.axis.score < EXPLANATION.cautionBelowScore)
    .sort((a, b) => a.axis.score - b.axis.score || a.order - b.order)
    .map((x) => cautionText(x.axis.reason));

  return { paddle_id: paddle.id, score, label: labelFor(score), axes, reasons, cautions };
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function relaxationHints(paddles: readonly PaddleSpec[], profile: UserProfile, context: FilterContext): RelaxationHint[] {
  const hints: RelaxationHint[] = [];
  const hasBudget = profile.budget.min_krw !== undefined || profile.budget.max_krw !== undefined;
  const noBudget: UserProfile = { ...profile, budget: {} };
  const noCert: UserProfile = { ...profile, needs_certification: false };

  if (hasBudget) {
    const pool = hardFilter(paddles, noBudget, context);
    if (pool.length > 0) {
      const { min_krw, max_krw } = profile.budget;
      const above = pool
        .map((p) => p.price_krw)
        .filter((p): p is number => p !== undefined && (min_krw === undefined || p >= min_krw) && (max_krw === undefined || p > max_krw));
      const suggested = above.length > 0 ? Math.min(...above) : undefined;
      hints.push({
        kind: "budget",
        candidates_if_relaxed: pool.length,
        ...(suggested !== undefined && { suggested_max_krw: suggested }),
        message:
          suggested !== undefined
            ? `예산 상한을 ${won(suggested)}으로 올리면 추천할 패들이 생깁니다 (예산 조건을 빼면 ${pool.length}개)`
            : `예산 조건을 빼면 ${pool.length}개의 패들을 볼 수 있습니다`,
      });
    }
  }
  if (profile.needs_certification) {
    const n = hardFilter(paddles, noCert, context).length;
    if (n > 0) hints.push({ kind: "certification", candidates_if_relaxed: n, message: `대회 인증 조건을 빼면 ${n}개의 패들을 볼 수 있습니다` });
  }
  if (hasBudget && profile.needs_certification && hints.length === 0) {
    const n = hardFilter(paddles, { ...noBudget, needs_certification: false }, context).length;
    if (n > 0) hints.push({ kind: "both", candidates_if_relaxed: n, message: `예산과 대회 인증 조건을 모두 빼면 ${n}개의 패들을 볼 수 있습니다` });
  }
  return hints;
}

/**
 * 하드 필터 → 점수 → 정렬(동점은 id 오름차순) → 상위 N개.
 * 순수 함수. 현재 시각·난수를 읽지 않고, 구매 링크·수수료 정보는 PaddleSpec에 없어 읽을 수 없다.
 */
export function recommend(
  paddles: readonly PaddleSpec[],
  profile: UserProfile,
  context: FilterContext,
  options: RecommendOptions = {},
): RecommendResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit은 1 이상의 정수여야 한다");

  const candidates = hardFilter(paddles, profile, context);
  const items = candidates
    .map((p) => scorePaddle(p, profile))
    .sort((a, b) => b.score - a.score || (a.paddle_id < b.paddle_id ? -1 : a.paddle_id > b.paddle_id ? 1 : 0))
    .slice(0, limit);

  return {
    scoring_version: SCORING_VERSION,
    items,
    relaxation: items.length === 0 ? relaxationHints(paddles, profile, context) : [],
  };
}

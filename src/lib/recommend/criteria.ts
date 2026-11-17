import type { UserProfile } from "./profile";
import { LEAN, WEIGHT_BAND } from "./scoring-config";
import { CERT_MAX_AGE_DAYS } from "../shared/limits";
import { SHAPE_LABEL } from "../shared/shape-labels";

/** "추천 기준 보기" 시트의 한 줄: 답한 조건 → 그 조건이 된 스펙 기준 */
export type CriterionLine = { condition: string; rule: string };

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/**
 * 답변이 어떤 스펙 기준이 됐는지 문장으로 만든다(T-045, docs/plan/m2.5-redesign.md 3.4).
 * - 수치는 엔진 상수(scoring-config.ts·limits.ts)에서만 읽는다. 새 수치를 만들지 않는다
 * - 가중치·점수 숫자는 넣지 않는다(거짓 정밀도 방지)
 * - 팔 불편 답은 건강 관련 정보라 넣지 않는다(화면에는 따로 안내 문구가 있다)
 */
export function criteriaLines(profile: UserProfile): CriterionLine[] {
  const lines: CriterionLine[] = [];
  const { min_krw, max_krw } = profile.budget;
  if ((min_krw !== undefined && min_krw > 0) || max_krw !== undefined) {
    const range = min_krw && max_krw !== undefined ? `${won(min_krw)}~${won(max_krw)}` : max_krw !== undefined ? `${won(max_krw)} 이하` : `${won(min_krw!)} 이상`;
    lines.push({ condition: `예산 ${range}`, rule: "이 범위 밖이거나 가격 정보가 없는 제품은 뺐습니다." });
  }

  if (profile.needs_certification) {
    lines.push({ condition: "대회용", rule: `USA Pickleball 승인을 확인한 지 ${CERT_MAX_AGE_DAYS}일 안인 제품만 남겼습니다.` });
  }

  const core = LEAN.core.neutralMm;
  const oz = LEAN.weight.neutralOz;
  const style = {
    control: { condition: "컨트롤 성향", rule: `코어가 ${core}mm보다 두껍고, 무게가 ${oz}oz보다 가볍고, 넓은 형·표준형일수록 우선했습니다.` },
    power: { condition: "파워 성향", rule: `코어가 ${core}mm보다 얇고, 무게가 ${oz}oz보다 무겁고, 길쭉한 형일수록 우선했습니다.` },
    balanced: { condition: "균형 성향", rule: `코어 ${core}mm·무게 ${oz}oz 안팎의 중간 사양일수록 우선했습니다.` },
  }[profile.play_style];
  lines.push(style);

  const light = WEIGHT_BAND.lightBelowOz;
  const heavy = WEIGHT_BAND.heavyAboveOz;
  if (profile.weight_preference !== "no_preference") {
    const band = { light: `${light}oz 미만`, medium: `${light}~${heavy}oz`, heavy: `${heavy}oz 초과` }[profile.weight_preference];
    const name = { light: "가벼운 무게", medium: "중간 무게", heavy: "무거운 무게" }[profile.weight_preference];
    lines.push({ condition: name, rule: `${band} 제품을 우선하고, 벗어난 만큼 낮게 봤습니다.` });
  }

  const skill = { beginner: "입문", intermediate: "중급", advanced: "상급" }[profile.skill_level];
  const skillRules: string[] = [];
  if (profile.skill_level !== "advanced" && profile.weight_preference === "no_preference") {
    skillRules.push(`권장 무게대 ${light}~${heavy}oz를 우선했습니다.`);
  }
  skillRules.push(
    profile.skill_level === "advanced"
      ? "빗맞았을 때의 안정성(넓은 형·두꺼운 코어)은 조금만 반영했습니다."
      : "빗맞아도 덜 흔들리는 사양(넓은 형·표준형, 두꺼운 코어)을 중요하게 봤습니다.",
  );
  lines.push({ condition: `${skill} 경력`, rule: skillRules.join(" ") });

  if (profile.preferred_shapes && profile.preferred_shapes.length > 0) {
    lines.push({
      condition: `선호 형태: ${profile.preferred_shapes.map((s) => SHAPE_LABEL[s]).join("·")}`,
      rule: "고른 형태를 우선했고, 다른 형태를 빼지는 않았습니다.",
    });
  }
  return lines;
}

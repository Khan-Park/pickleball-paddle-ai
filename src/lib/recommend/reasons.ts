import type { AxisReason } from "./axes";

/**
 * 규칙 ID별 문장 템플릿. LLM을 쓰지 않는다(D-003).
 * 팔 불편 관련 문구는 '도움이 될 수 있는 사양'까지만 말하고 의학적 효과를 단정하지 않는다(CLAUDE.md 규칙 5).
 * 스펙에서 추정한 경향이므로 단정형("~합니다")보다 "편입니다"를 쓴다.
 */
const SHAPE_KO: Record<string, string> = {
  standard: "표준형",
  hybrid: "하이브리드형",
  elongated: "길쭉한 형",
  widebody: "넓은 형",
};
const STYLE_KO: Record<string, string> = { control: "컨트롤", balanced: "균형", power: "파워" };
const WEIGHT_PREF_KO: Record<string, string> = { light: "가벼운", medium: "중간", heavy: "묵직한" };

const shape = (v: string | number | undefined) => SHAPE_KO[String(v)] ?? String(v);

type Template = { reason: (v: AxisReason["values"]) => string; caution: (v: AxisReason["values"]) => string };

const TEMPLATES: Record<string, Template> = {
  "power_control.lean": {
    reason: (v) => {
      const spec = `코어 ${v.core_mm}mm, ${v.weight_oz}oz, ${shape(v.shape)}`;
      if (v.play_style === "control") return `${spec} 구성이라 컨트롤과 안정감 쪽 스펙입니다`;
      if (v.play_style === "power") return `${spec} 구성이라 파워를 내기 좋은 쪽 스펙입니다`;
      return `${spec} 구성이라 파워와 컨트롤의 균형이 잡힌 스펙입니다`;
    },
    caution: (v) =>
      `선택하신 ${STYLE_KO[String(v.play_style)] ?? ""} 성향과 이 패들의 스펙 경향(코어 ${v.core_mm}mm, ${v.weight_oz}oz, ${shape(v.shape)})이 다소 다릅니다`,
  },
  "forgiveness.shape_core": {
    reason: (v) => `${shape(v.shape)}에 코어 ${v.core_mm}mm라 빗맞아도 덜 흔들리는 편입니다`,
    caution: (v) => `${shape(v.shape)}에 코어 ${v.core_mm}mm라 스위트스팟이 좁은 편이어서 빗맞을 때 부담이 클 수 있습니다`,
  },
  "arm_comfort.weight_core": {
    reason: (v) => `무게 ${v.weight_oz}oz와 코어 ${v.core_mm}mm 조합이 팔 부담을 줄이는 데 도움이 될 수 있는 사양입니다`,
    caution: (v) =>
      `팔 불편이 있다면 무게 ${v.weight_oz}oz, 코어 ${v.core_mm}mm 사양은 부담이 될 수 있으니 신중히 골라 주세요`,
  },
  "skill_weight.band": {
    reason: (v) => `무게 ${v.weight_oz}oz로 다루기 쉬운 중간 무게대입니다`,
    caution: (v) =>
      v.band === "heavy"
        ? `무게 ${v.weight_oz}oz로 무거운 편이라 경력이 짧다면 다루기 부담스러울 수 있습니다`
        : `무게 ${v.weight_oz}oz로 가벼운 편이라 타구가 가볍게 느껴질 수 있습니다`,
  },
  "weight_preference.band": {
    reason: (v) => `원하시는 ${WEIGHT_PREF_KO[String(v.preference)] ?? ""} 무게대(${v.weight_oz}oz)에 맞습니다`,
    caution: (v) => `원하시는 ${WEIGHT_PREF_KO[String(v.preference)] ?? ""} 무게대와 차이가 있습니다(${v.weight_oz}oz)`,
  },
  "shape_preference.match": {
    reason: (v) => `선호하신 ${shape(v.shape)}입니다`,
    caution: (v) => `선호하신 형태가 아닌 ${shape(v.shape)}입니다`,
  },
};

function template(rule: string): Template {
  const t = TEMPLATES[rule];
  if (!t) throw new Error(`이유 템플릿이 없는 규칙 ID: ${rule}`);
  return t;
}

export const REASON_RULE_IDS = Object.keys(TEMPLATES);
export const reasonText = (r: AxisReason): string => template(r.rule).reason(r.values);
export const cautionText = (r: AxisReason): string => template(r.rule).caution(r.values);

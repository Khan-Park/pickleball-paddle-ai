import type { Shape } from "../../../data/schema";

/**
 * 소프트 점수화의 모든 숫자. 설계: docs/design/scoring.md
 *
 * 근거 표기: "가설" = 소매점·브랜드 가이드의 일반적 설명에서 가져온 초기값(출처마다 범위가 다르고
 * 판매처 자료라 편향 가능). 실제 제품 데이터와 사용자 피드백으로 보정하고, 바꿀 때 SCORING_VERSION을 올린다.
 */
export const SCORING_VERSION = "0.2.0";

/** 스키마의 형태 타입과 같다 */
export type ShapeKey = Shape;

/** 파워/컨트롤 경향 lean(-1 컨트롤 ~ +1 파워) 계산 */
export const LEAN = {
  /** 가설: 얇은 코어(~14mm)는 파워, 두꺼운 코어(16mm~)는 컨트롤. 15mm를 중립으로 둔다 */
  core: { neutralMm: 15, spanMm: 2, weight: 0.45 },
  /** 가설: 7.9oz 중립, ±0.8oz에서 포화 */
  weight: { neutralOz: 7.9, spanOz: 0.8, weight: 0.3 },
  /** 가설: 길쭉한 형은 파워·리치, 넓은 형은 컨트롤·안정 쪽 */
  shape: {
    weight: 0.25,
    value: { elongated: 0.6, hybrid: 0, standard: -0.3, widebody: -0.5 } satisfies Record<ShapeKey, number>,
  },
  /** 사용자 성향이 목표로 하는 lean */
  target: { control: -0.6, balanced: 0, power: 0.6 },
  /** |lean - 목표|가 이 값 이상이면 적합도 0 */
  maxDistance: 1.2,
} as const;

/** 관용성: 빗맞아도 덜 흔들리는 정도 */
export const FORGIVENESS = {
  /** 가설: 표준·넓은 형은 스위트스팟이 넓고, 길쭉한 형은 줄어든다 */
  shape: { value: { widebody: 1, standard: 0.85, hybrid: 0.6, elongated: 0.3 } satisfies Record<ShapeKey, number>, weight: 0.6 },
  /** 가설: 코어 13mm 이하 0 ~ 18mm 이상 1 */
  core: { minMm: 13, spanMm: 5, weight: 0.4 },
} as const;

/** 무게대(oz). 가설: 초보 권장 중간대 7.3~8.4oz. 경계값은 medium에 포함 */
export const WEIGHT_BAND = { lightBelowOz: 7.3, heavyAboveOz: 8.4 } as const;

/** 팔 부담: arm_discomfort일 때만. 진동 흡수 데이터가 없어 무게대와 코어만 본다 */
export const ARM_COMFORT = {
  weightBandScore: { medium: 1, light: 0.7, heavy: 0.2 },
  /** 코어 16mm 이상 1, 14mm 이하 0, 사이는 mid */
  core: { fullMm: 16, zeroMm: 14, mid: 0.5 },
  weights: { band: 0.5, core: 0.5 },
} as const;

/** 무게 선호: 구간 밖으로 벗어난 만큼 감점(0.5oz당 0.5 = 1oz당 1.0), 하한 0 */
export const WEIGHT_PREFERENCE = { penaltyPerOz: 1 } as const;

/**
 * 경력별 무게 적합(skill_weight): 초보·중급에게만 켜진다. 권장 무게대(WEIGHT_BAND의 medium) 안이면 1,
 * 벗어난 만큼 감점한다. 가설: 초보는 중간 무게대가 다루기 쉽다(docs/spec.md). 실제 데이터에서 초보·균형
 * 사용자에게 8.75oz 패들이 1순위로 나온 사례를 보고 추가했다(D-021).
 * 사용자가 무게 선호를 직접 골랐으면 weight_preference 축이 대신하므로 이 축은 끈다.
 */
export const SKILL_WEIGHT = { penaltyPerOz: 2 } as const;

/** 형태 선호: 선호 형태면 1, 아니면 이 값(강제 제외 아님) */
export const SHAPE_PREFERENCE = { nonPreferredScore: 0.4 } as const;

/** 화면 라벨 기준(총점 0~100). 가설. 숫자는 화면에 보이지 않는다(거짓 정밀도 방지) */
export const LABEL_THRESHOLDS = { veryGood: 80, good: 60 } as const;

/** 이유·주의 문구 선택 기준(축 점수 0~1). 가설 */
export const EXPLANATION = {
  /** 이 점수 이상인 축만 '추천 이유' 후보 */
  reasonMinScore: 0.6,
  /** 이 점수 미만인 축은 '주의' 문구로 따로 보여 준다 */
  cautionBelowScore: 0.4,
  /** 추천 이유로 보여 줄 최대 개수(기여가 큰 순) */
  maxReasons: 3,
} as const;

/** 기본 추천 개수 */
export const DEFAULT_LIMIT = 3;

/** 합산 가중치. 비활성 축은 합산에서 제외한다 */
export const AXIS_WEIGHTS = {
  power_control: 0.35,
  forgiveness: { beginner: 0.3, intermediate: 0.15, advanced: 0.05 },
  arm_comfort: 0.35,
  /** 상급자는 제외(가중치 없음) */
  skill_weight: { beginner: 0.2, intermediate: 0.1 },
  weight_preference: 0.15,
  shape_preference: 0.15,
} as const;

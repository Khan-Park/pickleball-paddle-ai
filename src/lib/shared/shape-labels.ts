/** 패들 형태의 한국어 이름. 질문 선택지, 추천 이유 문장, 결과 화면이 같은 이름을 쓴다 */
export const SHAPE_LABEL = {
  standard: "표준형",
  hybrid: "하이브리드형",
  elongated: "길쭉한 형",
  widebody: "넓은 형",
} as const;

export type ShapeKey = keyof typeof SHAPE_LABEL;

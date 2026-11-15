/** 화면에 쓰는 한국어 이름과 문구. 과장 표현과 의학적 단정을 쓰지 않는다 */

export const SHAPE_LABEL: Record<string, string> = {
  standard: "표준형",
  hybrid: "하이브리드형",
  elongated: "길쭉한 형",
  widebody: "넓은 형",
};

export const SURFACE_LABEL: Record<string, string> = {
  carbon: "카본",
  fiberglass: "파이버글라스",
  composite: "복합 소재",
  other: "기타",
};

export const NOTICE = {
  spec: "제조사와 판매처가 공개한 스펙을 기준으로 한 추천입니다. 실제 타구감은 사람마다 다를 수 있습니다.",
  ranking: "구매 링크나 수수료는 추천 순위에 영향을 주지 않습니다.",
  arm: "팔 부담을 줄이는 데 도움이 될 수 있는 사양을 우선했습니다. 의학적 조언이 아니며, 통증이 계속되면 전문가와 상담하세요.",
  /**
   * 대가 표시. "받을 수 있습니다" 같은 조건부 표현은 경제적 이해관계 표시로 적합하지 않다는 안내가 있어 단정형으로 쓴다.
   * 문구와 위치는 공정위 심사지침 원문과 제휴 프로그램 약관으로 최종 확인해야 한다(docs/tasks/T-012 참조).
   */
  affiliate: "광고 · 제휴 링크입니다. 이 링크로 구매가 이루어지면 운영자가 판매처로부터 수수료를 받습니다.",
  affiliatePage: "이 페이지에는 광고(제휴 링크)가 포함되어 있습니다. 제휴 링크로 구매가 이루어지면 운영자가 판매처로부터 수수료를 받습니다.",
  price: "가격은 확인한 날의 참고가이며 판매처와 옵션에 따라 다릅니다.",
} as const;

/** 가격 확인 후 이 일수를 넘으면 "가격 변동 가능"을 붙인다(data/check.ts의 기준과 같다) */
export const PRICE_STALE_DAYS = 30;

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 이 기기의 오늘 날짜(YYYY-MM-DD). 엔진은 현재 시각을 읽지 않으므로 화면이 넘긴다 */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

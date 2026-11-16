/** 화면에 쓰는 한국어 이름과 문구. 과장 표현과 의학적 단정을 쓰지 않는다 */

export { SHAPE_LABEL } from "@/lib/shared/shape-labels";
export { todayLocal } from "@/lib/shared/dates";
/** 가격 확인 후 이 일수를 넘으면 "가격 변동 가능"을 붙인다. 데이터 점검(data/check.ts)과 같은 값을 쓴다 */
export { PRICE_MAX_AGE_DAYS as PRICE_STALE_DAYS } from "@/lib/shared/limits";

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
  price: "가격은 확인한 날의 참고가이며 판매처와 옵션에 따라 다릅니다.",
} as const;

/**
 * 경제적 이해관계 표시(대가성 문구). 근거(2026-11-15 원문 확인, docs/decisions.md D-022):
 * - 공정위 「추천·보증 등에 관한 표시·광고 심사지침」(예규 제499호, 2026-06-01 시행) Ⅴ.6:
 *   표시문구는 게재물의 제목 또는 첫 부분에, 본문과 구분되게(글자 크기·색), 추천 내용과 근접한 위치에,
 *   추가 행위('더보기'·링크) 없이 보이게, 명확한 내용으로, 같은 언어(한국어)로 표시한다.
 * - 쿠팡 파트너스 공식 도움말 "대가성 문구 가이드": 파트너스 활동으로 게재한 모든 게시물에 표시하고,
 *   링크와 표시를 분리하지 않으며, 별도 페이지에서 확인하게 하지 않는다. 권장 문구는 아래 coupang과 같다.
 */
export const DISCLOSURE = {
  /** 쿠팡 파트너스 권장 문구 그대로 */
  coupang: "이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
  /** 그 밖의 제휴 프로그램. 지침의 명확한 표시 예시('…로부터 경제적 대가(수수료)를 받았음') 형식을 따른다 */
  other: "이 게시물은 제휴 마케팅 활동의 일환으로, 판매처로부터 일정액의 수수료를 제공받습니다.",
} as const;

export type AffiliateProgram = keyof typeof DISCLOSURE;

/**
 * 대가 표시 문구를 고른다. 데이터에 적힌 program을 따른다(주소로 추정하지 않는다).
 * 쿠팡 주소인데 program이 빠진 경우는 데이터 점검(data/check.ts)이 오류로 막는다.
 */
export function affiliateProgram(purchase: { program?: "coupang_partners" | "other" }): AffiliateProgram {
  return purchase.program === "coupang_partners" ? "coupang" : "other";
}

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

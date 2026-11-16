/**
 * 가격 비교 링크(T-019, D-028). 네이버 쇼핑 검색 결과로 보낸다. 제휴가 아니므로 대가 표시 대상이 아니다.
 * 검색 주소 형식(search/all?query=)은 흔히 알려진 형식이며 2026-11-16 기준 직접 확인하지 못했다(이 환경의 브라우저에서 열리지 않음).
 */
const NAVER_SHOPPING_SEARCH = "https://search.shopping.naver.com/search/all";

/** 검색어. 데이터에 compare_query가 있으면 그것을, 없으면 "브랜드 모델 피클볼" */
export function compareQuery(paddle: { brand: string; model: string; compare_query?: string }): string {
  return paddle.compare_query ?? `${paddle.brand} ${paddle.model} 피클볼`;
}

export function compareUrl(paddle: { brand: string; model: string; compare_query?: string }): string {
  const url = new URL(NAVER_SHOPPING_SEARCH);
  url.searchParams.set("query", compareQuery(paddle));
  return url.toString();
}

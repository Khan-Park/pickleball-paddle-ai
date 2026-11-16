/**
 * 사이트 정보(T-027). 주소는 여기 한 곳에만 둔다. 미리보기(Open Graph)·sitemap·robots가 같이 쓴다.
 * 주소: Cloudflare 계정의 workers.dev 하위 도메인을 이메일 아이디가 아닌 이름으로 바꾼 것(D-030, 2026-11-16).
 * 도메인을 사면(M3 전 재판단) 이 값만 바꾼다.
 */
export const SITE_URL = "https://pickleball-paddle-ai.paddlefit.workers.dev";

/** 서비스 이름(D7, 사용자 확정 2026-11-16). 상표 여부는 확인하지 않았다 */
export const SITE_NAME = "패들핏";

/** 탭 제목 기본값과 공유 미리보기 제목 */
export const SITE_TITLE = `${SITE_NAME} · 나에게 맞는 피클볼 패들`;

export const SITE_DESCRIPTION = "질문 몇 개에 답하면 스펙을 근거로 나에게 맞는 피클볼 패들 3개를 이유와 함께 보여 드립니다.";

/** 공유 미리보기 그림(src/app/og.png/route.tsx가 만든다) */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${SITE_NAME}: 피클볼 패들 형태 4가지(표준형·넓은 형·하이브리드형·길쭉한 형)를 그린 그림`,
} as const;

/**
 * 공유 미리보기(Open Graph) 공통 값(T-038). 하위 페이지의 openGraph는 부모 값을 통째로 바꾸므로 공통 값을 여기서 만든다.
 * path를 주면 og:url을 그 주소로 적는다. 주소가 정해지지 않는 페이지(공유받은 화면의 ?p= 등)는 path 없이 쓴다.
 */
export function openGraphFor(path?: string) {
  return {
    type: "website" as const,
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    ...(path ? { url: path } : {}),
  };
}

/** 검색 엔진에 알릴 페이지. 질문·결과는 탭에 저장된 답변이 있어야 의미가 있어 넣지 않는다 */
export const SITEMAP_PATHS = ["/", "/browse"] as const;

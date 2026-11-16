import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/shared/site";

/** robots.txt(T-027). 전체 허용 + sitemap 주소. 결과 화면은 페이지 안의 noindex로 뺀다 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

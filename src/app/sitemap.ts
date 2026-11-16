import type { MetadataRoute } from "next";
import { SITE_URL, SITEMAP_PATHS } from "@/lib/shared/site";

/** sitemap.xml(T-027). 시작 화면과 둘러보기만 알린다. 마지막 수정일은 적지 않는다(빌드 시각을 넣으면 매번 바뀐다) */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}

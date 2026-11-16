import { describe, expect, it } from "vitest";
import { compareQuery, compareUrl } from "./compare";

describe("가격 비교 링크", () => {
  it("검색어가 없으면 '브랜드 모델 피클볼'로 만들고, 있으면 그대로 쓴다", () => {
    expect(compareQuery({ brand: "JOOLA", model: "Essentials 12mm" })).toBe("JOOLA Essentials 12mm 피클볼");
    expect(compareQuery({ brand: "JOOLA", model: "Essentials 12mm", compare_query: "율라 에센셜 피클볼" })).toBe("율라 에센셜 피클볼");
  });

  it("네이버 쇼핑 검색 주소에 검색어를 인코딩해 넣는다", () => {
    const url = new URL(compareUrl({ brand: "Selkirk", model: "Boomstik ST & 16mm" }));
    expect(url.origin + url.pathname).toBe("https://search.shopping.naver.com/search/all");
    expect(url.searchParams.get("query")).toBe("Selkirk Boomstik ST & 16mm 피클볼");
  });
});

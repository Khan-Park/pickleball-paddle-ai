import { describe, expect, it } from "vitest";
import { isCoupangUrl } from "./affiliate";

describe("isCoupangUrl", () => {
  it("쿠팡 도메인과 그 하위 도메인, 단축 주소를 알아본다", () => {
    expect(isCoupangUrl("https://link.coupang.com/a/abc")).toBe(true);
    expect(isCoupangUrl("https://www.coupang.com/vp/products/1")).toBe(true);
    expect(isCoupangUrl("https://COUPANG.com/x")).toBe(true);
    expect(isCoupangUrl("https://coupa.ng/abc")).toBe(true);
  });

  it("비슷해 보이는 다른 도메인과 주소가 아닌 값은 아니다", () => {
    expect(isCoupangUrl("https://notcoupang.com/x")).toBe(false);
    expect(isCoupangUrl("https://coupang.com.evil.example/x")).toBe(false);
    expect(isCoupangUrl("https://example.com/?to=coupang.com")).toBe(false);
    expect(isCoupangUrl("주소 아님")).toBe(false);
  });
});

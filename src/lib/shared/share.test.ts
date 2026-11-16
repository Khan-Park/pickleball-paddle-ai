import { describe, expect, it } from "vitest";
import { buildShareUrl, parseSharedIds, SHARE_TEXT } from "./share";
import { SITE_URL } from "./site";

const known = new Set(["a-1", "b-2", "c-3", "d-4"]);

describe("공유 주소(T-025)", () => {
  it("제품 id만 순위 순서로 담는다", () => {
    expect(buildShareUrl(["b-2", "a-1", "c-3"])).toBe(`${SITE_URL}/shared?p=b-2,a-1,c-3`);
  });

  it("형식이 틀린 id는 빼고 최대 3개, 남는 것이 없으면 오류", () => {
    expect(buildShareUrl(["a-1", "BAD ID", "b-2", "c-3", "d-4"])).toBe(`${SITE_URL}/shared?p=a-1,b-2,c-3`);
    expect(() => buildShareUrl([])).toThrow(RangeError);
  });

  it("주소와 공유 글에 답변 키·값이 들어가지 않는다(팔 불편 답 포함)", () => {
    const url = buildShareUrl(["a-1", "b-2", "c-3"]);
    const query = new URL(url).searchParams;
    expect([...query.keys()]).toEqual(["p"]);
    for (const word of ["experience", "play_style", "weight", "arm", "shapes", "budget", "tournament", "팔", "불편"]) {
      expect(url).not.toContain(word);
      expect(SHARE_TEXT.title + SHARE_TEXT.text).not.toContain(word);
    }
  });

  it("읽기: 순서 유지, 형식이 틀린 값·중복 제거, 최대 3개, 목록에 없는 제품 수", () => {
    expect(parseSharedIds("b-2,a-1", known)).toEqual({ found: ["b-2", "a-1"], missing: 0 });
    expect(parseSharedIds("a-1,a-1,<script>,c-3", known)).toEqual({ found: ["a-1", "c-3"], missing: 0 });
    expect(parseSharedIds("a-1,gone-9,b-2,c-3", known)).toEqual({ found: ["a-1", "b-2"], missing: 1 });
    expect(parseSharedIds(null, known)).toEqual({ found: [], missing: 0 });
    expect(parseSharedIds("", known)).toEqual({ found: [], missing: 0 });
  });
});

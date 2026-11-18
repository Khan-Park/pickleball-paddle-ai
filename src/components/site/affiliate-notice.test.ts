import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 대가 표시(D-022, 완료 기준 5) 소스 검사(T-054). DOM 순서·접힌 영역 검사는 SiteHeader.test.tsx에 있다.
 * 표시가 있는 네 화면 + 표시 부품에서, 보이는 순서를 DOM 순서와 다르게 만드는 클래스를 막는다.
 */
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const NOTICE_FILE = "src/components/result/AffiliatePageNotice.tsx";
const SCREENS = [
  "src/components/result/Result.tsx",
  "src/components/browse/Browse.tsx",
  "src/components/share/Shared.tsx",
  "src/components/saved/Saved.tsx",
];
const PAGES = ["src/app/result/page.tsx", "src/app/browse/page.tsx", "src/app/shared/page.tsx", "src/app/saved/page.tsx"];

/** 화면 파일 전체에서 금지: 순서를 바꾸는 클래스 */
const REORDER = /\b(order-|flex-row-reverse|flex-col-reverse|col-start-|row-start-)/;
/** 표시 부품과 표시를 감싼 줄에서 금지: 위치를 빼거나 폭에 따라 숨기는 클래스 */
const DISPLACE = /\b(absolute|fixed|sticky|hidden|order-|translate-|-mt-)/;

const remOf = (css: string, token: string) => {
  const m = new RegExp(`--${token}:\\s*([\\d.]+)rem`).exec(css);
  if (!m) throw new Error(`토큰 없음: ${token}`);
  return Number(m[1]);
};

describe("대가 표시 소스 검사(T-054)", () => {
  it.each([...SCREENS, ...PAGES, NOTICE_FILE])("%s에 순서를 바꾸는 클래스가 없다", (path) => {
    expect(read(path)).not.toMatch(REORDER);
  });

  it("표시 부품에 위치를 빼거나 숨기는 클래스가 없다", () => {
    expect(read(NOTICE_FILE)).not.toMatch(DISPLACE);
  });

  it.each(SCREENS)("%s: 표시를 감싼 section 줄에 위치를 빼거나 숨기는 클래스가 없다", (path) => {
    const lines = read(path).split(/\r?\n/);
    const at = lines.findIndex((line) => line.includes("<AffiliatePageNotice"));
    expect(at, "표시 부품을 쓰는 줄").toBeGreaterThan(0);
    // 바로 앞의 여는 <section 줄이 표시의 부모다
    const parent = lines.slice(0, at).reverse().find((line) => line.includes("<section"));
    expect(parent, "부모 section").toBeDefined();
    expect(parent!).not.toMatch(DISPLACE);
  });

  it("'광고'와 표시 문구는 본문보다 큰 글자 토큰이다(D-022 (1))", () => {
    const css = read("src/app/globals.css");
    expect(remOf(css, "text-heading")).toBeGreaterThan(remOf(css, "text-body"));
    const src = read(NOTICE_FILE);
    for (const id of ["affiliate-page-notice-label", "affiliate-page-notice-text"]) {
      const line = src.split(/\r?\n/).find((l) => l.includes(`data-testid="${id}"`));
      expect(line, id).toBeDefined();
      expect(line!).toMatch(/\btext-heading\b/);
      expect(line!).not.toMatch(/\btext-(sm|base|xs|small|caption|body)\b/);
    }
  });
});

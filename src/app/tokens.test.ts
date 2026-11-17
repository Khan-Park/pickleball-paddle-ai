import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// 색 토큰의 글자 대비를 계산해 확인한다(WCAG 2.x 상대 휘도 공식, 본문 글자 기준 4.5:1). 밝은·어두운 화면 모두(T-028)
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** 블록 안의 `--이름: #rrggbb` 값을 읽는다 */
function tokensIn(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

const lightBlock = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
// 주석에도 같은 글자가 있으므로 여는 괄호까지 붙여 실제 블록을 찾는다(T-038에서 바로잡음)
const darkStart = css.indexOf("@media (prefers-color-scheme: dark) {");
const darkBlock = css.slice(darkStart, css.indexOf("@theme inline", darkStart));
const LIGHT = tokensIn(lightBlock);
// 어두운 화면은 밝은 값 위에 덮어쓴다(정의하지 않은 토큰은 밝은 값 그대로)
const DARK = { ...LIGHT, ...tokensIn(darkBlock) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** 화면에서 실제로 겹쳐 쓰는 글자/바탕 조합 */
const PAIRS: [string, string][] = [
  ["ink", "card"],
  ["ink", "surface"],
  ["muted", "card"],
  ["muted", "surface"],
  ["navy", "card"],
  ["navy", "surface"],
  ["accent", "card"],
  ["accent", "surface"],
  ["on-accent", "accent"],
  ["accent", "accent-soft"],
  ["accent-ink", "accent-soft"],
  ["caution", "card"],
  ["caution", "caution-soft"],
  ["confirm", "card"],
  ["confirm", "confirm-soft"],
  // 리디자인 토큰(T-039, docs/plan/m2.5-redesign.md 4.2)
  ["on-lime", "lime"],
  ["ink", "lime-soft"],
  ["navy", "lime-soft"],
  ["on-hero", "hero"],
  ["on-hero-muted", "hero"],
  ["on-accent-on-hero", "accent-on-hero"],
];

/** 글자가 아닌 요소(버튼 경계·포커스 링·선택 테두리)는 3:1 이상(WCAG 1.4.11) */
const NON_TEXT_PAIRS: [string, string][] = [
  ["accent-on-hero", "hero"],
  ["focus-on-hero", "hero"],
  ["accent", "card"],
  ["accent", "surface"],
];

/** 사진 덮개 불투명도(%). `--hero-scrim: color-mix(in srgb, var(--hero) N%, transparent)`에서 읽는다 */
const SCRIM_PERCENT = Number(/--hero-scrim:\s*color-mix\(in srgb, var\(--hero\) (\d+)%, transparent\)/.exec(lightBlock)?.[1]);

/** 바탕 위에 앞 색을 비율 t(0~1)로 덮은 색 */
function mix(top: string, base: string, t: number): string {
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(parseInt(top.slice(i, i + 2), 16) * t + parseInt(base.slice(i, i + 2), 16) * (1 - t)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

describe("색 대비(T-033, T-028)", () => {
  it("공식이 알려진 값과 맞는다(검은 글자/흰 바탕 21:1)", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("어두운 화면 블록이 있고, 밝은 화면의 색 토큰을 모두 다시 정한다", () => {
    expect(darkStart).toBeGreaterThan(0);
    const dark = tokensIn(darkBlock);
    // 장식용·그림자 외의 색 토큰은 어두운 값이 있어야 한다(빠뜨리면 어두운 바탕에 밝은 화면 색이 남는다)
    // 상표 색(--brand)은 일부러 밝은·어두운 화면에서 같은 값이다(T-038)
    // 라임·히어로 위 글자와 히어로 위 버튼도 모드와 무관한 고정값이다(T-039)
    const SAME_IN_BOTH = new Set(["brand", "on-lime", "on-hero", "on-hero-muted", "accent-on-hero", "on-accent-on-hero"]);
    for (const name of Object.keys(LIGHT).filter((n) => !SAME_IN_BOTH.has(n))) expect(dark, `--${name}의 어두운 값`).toHaveProperty(name);
    expect(dark).not.toHaveProperty("brand");
  });

  for (const [mode, tokens] of [
    ["밝은 화면", LIGHT],
    ["어두운 화면", DARK],
  ] as const) {
    it.each(PAIRS)(`${mode}: --%s 글자가 --%s 바탕에서 4.5:1 이상`, (fg, bg) => {
      expect(tokens[fg], `--${fg}`).toBeDefined();
      expect(tokens[bg], `--${bg}`).toBeDefined();
      expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(NON_TEXT_PAIRS)(`${mode}: --%s 경계가 --%s 바탕에서 3:1 이상`, (fg, bg) => {
      expect(tokens[fg], `--${fg}`).toBeDefined();
      expect(tokens[bg], `--${bg}`).toBeDefined();
      expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(3);
    });

    it.each(["on-hero", "on-hero-muted"])(`${mode}: --%s 글자가 card 위 사진 덮개에서 4.5:1 이상(사진 없는 최악의 경우 근사)`, (fg) => {
      const scrim = mix(tokens.hero!, tokens.card!, SCRIM_PERCENT / 100);
      expect(contrast(tokens[fg]!, scrim)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("사진 덮개 불투명도를 읽을 수 있고 0~100 사이다", () => {
    expect(SCRIM_PERCENT).toBeGreaterThan(0);
    expect(SCRIM_PERCENT).toBeLessThanOrEqual(100);
  });

  it("라임은 밝은 화면 바탕에서 글자로 쓸 수 없는 대비다(그래서 글자색 금지, copy.test.ts)", () => {
    expect(contrast(LIGHT.lime!, LIGHT.card!)).toBeLessThan(3);
  });
});

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("동작 줄이기(T-038)", () => {
  it("동작 줄이기 규칙이 시간·반복·지연을 모두 없앤다", () => {
    const start = css.indexOf("@media (prefers-reduced-motion: reduce) {");
    const block = css.slice(start, css.indexOf("}", css.indexOf("{", css.indexOf("{", start) + 1)));
    expect(block).toMatch(/animation-duration:\s*1ms !important/);
    expect(block).toMatch(/animation-delay:\s*0s !important/);
  });

  it("로고 바탕은 어두운 화면에서도 남색인 상표 색(--brand)을 쓴다", () => {
    // 로고는 T-040에서 공통 헤더로 옮겼다
    const page = readFileSync(join(process.cwd(), "src/components/site/SiteHeader.tsx"), "utf8");
    expect(page).toContain('fill="var(--brand)"');
    expect(LIGHT.brand).toBe(DARK.brand);
    expect(contrast("#ffffff", DARK.brand!)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("고정 색 점검(T-028)", () => {
  it("화면 코드에 text-white·bg-white·bg-navy 같은 고정 색이 없다(토큰만 쓴다)", () => {
    const files = filesUnder(join(process.cwd(), "src")).filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
    const hits = files.filter((f) => /\b(text|bg|border)-(white|black)\b|\bbg-navy\b/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});

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
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
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
];

describe("색 대비(T-033, T-028)", () => {
  it("공식이 알려진 값과 맞는다(검은 글자/흰 바탕 21:1)", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("어두운 화면 블록이 있고, 밝은 화면의 색 토큰을 모두 다시 정한다", () => {
    expect(darkStart).toBeGreaterThan(0);
    const dark = tokensIn(darkBlock);
    // 장식용·그림자 외의 색 토큰은 어두운 값이 있어야 한다(빠뜨리면 어두운 바탕에 밝은 화면 색이 남는다)
    for (const name of Object.keys(LIGHT)) expect(dark, `--${name}의 어두운 값`).toHaveProperty(name);
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
  }
});

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("고정 색 점검(T-028)", () => {
  it("화면 코드에 text-white·bg-white·bg-navy 같은 고정 색이 없다(토큰만 쓴다)", () => {
    const files = filesUnder(join(process.cwd(), "src")).filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
    const hits = files.filter((f) => /\b(text|bg|border)-(white|black)\b|\bbg-navy\b/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});

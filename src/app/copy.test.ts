import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// 문구·색 규칙 소스 검사(T-039, docs/plan/m2.5-redesign.md 1장 2·4번, 3.7)
// LLM을 부르지 않으므로 "AI 추천" 같은 표현을 쓰지 않는다(D-035). 라임은 글자색으로 쓰지 않는다

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const root = process.cwd();
const SOURCES = filesUnder(join(root, "src"))
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
  .map((f) => ({ path: relative(root, f), text: readFileSync(f, "utf8") }));

/** 규칙에 걸린 줄을 "파일:줄 내용"으로 모은다 */
function hitsOf(pattern: RegExp): string[] {
  return SOURCES.flatMap(({ path, text }) =>
    text.split(/\r?\n/).flatMap((line, i) => (pattern.test(line) ? [`${path}:${i + 1} ${line.trim()}`] : [])),
  );
}

describe("문구 규칙(T-039)", () => {
  it("검사할 소스 파일을 찾았다", () => {
    expect(SOURCES.length).toBeGreaterThan(10);
  });

  it("화면 소스에 'AI'·'인공지능' 표현이 없다", () => {
    expect(hitsOf(/(?<![A-Za-z])AI(?![A-Za-z])|인공지능/)).toEqual([]);
  });
});

describe("라임 색 규칙(T-039)", () => {
  it("라임을 글자색으로 쓰지 않는다(text-lime 계열 0건)", () => {
    expect(hitsOf(/\btext-lime/)).toEqual([]);
  });

  it("라임 바탕에 밝은 글자(text-on-accent·text-on-hero)를 함께 쓰지 않는다", () => {
    // 같은 class 문자열 안에서 본다. 라임 위 글자는 text-on-lime만 쓴다
    const classStrings = SOURCES.flatMap(({ path, text }) => [...text.matchAll(/["'`]([^"'`]*\bbg-lime\b[^"'`]*)["'`]/g)].map((m) => `${path}: ${m[1]}`));
    expect(classStrings.filter((s) => /\btext-on-(accent|hero)\b/.test(s))).toEqual([]);
  });
});

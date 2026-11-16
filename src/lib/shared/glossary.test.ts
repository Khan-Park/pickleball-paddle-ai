import { describe, expect, it } from "vitest";
import { GLOSSARY, GLOSSARY_TERMS } from "./glossary";

describe("용어 도움말 문구", () => {
  it("용어 5개 모두 제목·요약·본문이 비어 있지 않다", () => {
    expect(GLOSSARY_TERMS).toHaveLength(5);
    for (const term of GLOSSARY_TERMS) {
      const e = GLOSSARY[term];
      expect(e.title.trim()).not.toBe("");
      expect(e.summary.trim()).not.toBe("");
      expect(e.body.length).toBeGreaterThan(0);
      for (const line of e.body) expect(line.trim()).not.toBe("");
    }
  });

  it("의학적 효과를 단정하는 표현이 없다(CLAUDE.md 규칙 5)", () => {
    const all = GLOSSARY_TERMS.flatMap((t) => [GLOSSARY[t].summary, ...GLOSSARY[t].body, GLOSSARY[t].note ?? ""]).join(" ");
    expect(all).not.toMatch(/치료|예방|낫는|낫게|완화합니다|통증이 사라|부상을 막/);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import type { Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { hardFilter } from "./filter";
import type { UserProfile } from "./profile";

// D-004, CLAUDE.md 핵심 규칙 1: 추천 엔진은 구매 링크·수수료 정보를 읽지 않는다.
// 타입(PaddleSpec)만으로는 purchase가 달린 객체를 막지 못하므로 테스트로 보장한다.

describe("추천 엔진은 구매 링크·수수료와 무관하다", () => {
  it("엔진 소스에 purchase·affiliate 참조가 없다", () => {
    const dir = new URL(".", import.meta.url);
    const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const text = readFileSync(new URL(file, dir), "utf-8");
      expect(text, `${file}가 purchase/affiliate를 참조한다`).not.toMatch(/purchase|affiliate/i);
    }
  });

  it("purchase 정보만 다른 입력은 같은 결과를 낸다", () => {
    const link = (affiliate: boolean | undefined): Pick<Paddle, "purchase"> =>
      affiliate === undefined ? {} : { purchase: { url: "https://example.com/p", is_affiliate: affiliate } };
    const make = (affiliate: boolean | undefined): Paddle[] => [
      fakePaddle({ id: "cheap", price_krw: 50000, ...link(affiliate) }),
      fakePaddle({ id: "pricey", price_krw: 300000, ...link(affiliate) }),
    ];
    const profile: UserProfile = { budget: { max_krw: 100000 }, needs_certification: false };
    const results = [undefined, false, true].map((a) => hardFilter(make(a), profile).map((p) => p.id));
    expect(results).toEqual([["cheap"], ["cheap"], ["cheap"]]);
  });
});
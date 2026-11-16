import { describe, expect, it } from "vitest";
import { DISPLAY_EXTRA_FIELDS, SPEC_FIELDS, toPaddleDisplay, toPaddleSpec } from "./schema";
import { fakePaddle } from "./test-fixtures";

const full = fakePaddle({
  notes: "내부 메모",
  compare_query: "샘플 테스트 피클볼",
  purchase: { url: "https://shop.example.com/p/1", is_affiliate: true, program: "other" },
});

describe("toPaddleDisplay: 브라우저로 보내는 필드", () => {
  it("출처·스펙 확인일은 넣고(D-030), 내부 메모와 공식 출처 없음 기록은 넣지 않는다", () => {
    const withRecord = { ...full, official_source_unavailable: { reason: "없음", checked_at: "2026-01-01" } };
    const display = toPaddleDisplay(withRecord) as Record<string, unknown>;
    expect(display.sources).toEqual(full.sources);
    expect(display.verified_at).toBe(full.verified_at);
    expect(display).not.toHaveProperty("notes");
    expect(display).not.toHaveProperty("official_source_unavailable");
  });

  it("목록에 있는 필드만, 원래 값 그대로 담는다", () => {
    const display = toPaddleDisplay(full) as Record<string, unknown>;
    const allowed: readonly string[] = [...SPEC_FIELDS, ...DISPLAY_EXTRA_FIELDS];
    for (const key of Object.keys(display)) expect(allowed).toContain(key);
    expect(display.brand).toBe(full.brand);
    expect(display.purchase).toEqual(full.purchase);
    expect(display.price_krw).toBe(full.price_krw);
    expect(display.compare_query).toBe(full.compare_query);
  });

  it("가격 비교 검색어는 화면용 필드에만 있다(T-033)", () => {
    expect(DISPLAY_EXTRA_FIELDS).toContain("compare_query");
    expect(SPEC_FIELDS as readonly string[]).not.toContain("compare_query");
  });
});

describe("toPaddleSpec: 엔진에 넘기는 필드", () => {
  it("구매 링크와 화면용 필드를 넣지 않는다(추천 순위가 링크를 볼 수 없게)", () => {
    const spec = toPaddleSpec(full) as Record<string, unknown>;
    expect(Object.keys(spec).sort()).toEqual([...SPEC_FIELDS].filter((k) => (full as Record<string, unknown>)[k] !== undefined).sort());
    expect(spec).not.toHaveProperty("purchase");
    expect(spec).not.toHaveProperty("compare_query");
    expect(spec).not.toHaveProperty("sources");
    expect(spec).not.toHaveProperty("brand");
    expect(spec).not.toHaveProperty("notes");
  });
});

import { describe, expect, it } from "vitest";
import { BUDGET_ANSWERS, coverage } from "./coverage";
import { SHAPES } from "./schema";
import { fakePaddle } from "./test-fixtures";

const TODAY = "2026-06-01";
const approved = { usa_pickleball: "approved" as const, checked_at: TODAY };
const unknown = { usa_pickleball: "unknown" as const, checked_at: TODAY };

const cell = (cells: ReturnType<typeof coverage>, shape: string, budget: string, tournament: boolean) =>
  cells.find((c) => c.shape === shape && c.budget === budget && c.tournament === tournament)!;

describe("coverage: 질문 조합별 맞는 제품", () => {
  const paddles = [
    fakePaddle({ id: "std-cheap-ok", shape: "standard", price_krw: 90_000, price_checked_at: TODAY, certification: approved }),
    fakePaddle({ id: "std-mid-unk", shape: "standard", price_krw: 150_000, price_checked_at: TODAY, certification: unknown }),
    fakePaddle({ id: "wide-mid-ok", shape: "widebody", price_krw: 150_000, price_checked_at: TODAY, certification: approved }),
  ];
  const cells = coverage(paddles, TODAY);

  it("형태 4 × 예산 4 × 대회 여부 2 = 32개 조합을 만든다", () => {
    expect(cells).toHaveLength(SHAPES.length * BUDGET_ANSWERS.length * 2);
  });

  it("형태가 같고 예산 안에 드는 제품만 센다", () => {
    expect(cell(cells, "standard", "under_100k", false).ids).toEqual(["std-cheap-ok"]);
    expect(cell(cells, "standard", "100k_to_200k", false).ids).toEqual(["std-mid-unk"]);
    expect(cell(cells, "standard", "any", false).ids).toEqual(["std-cheap-ok", "std-mid-unk"]);
    expect(cell(cells, "widebody", "under_100k", false).ids).toEqual([]);
    expect(cell(cells, "hybrid", "any", false).ids).toEqual([]);
  });

  it("대회 조합은 승인이 확인된 제품만 센다", () => {
    expect(cell(cells, "standard", "any", true).ids).toEqual(["std-cheap-ok"]);
    expect(cell(cells, "standard", "100k_to_200k", true).ids).toEqual([]);
  });

  it("실제 data/paddles.json으로도 오류 없이 집계된다", async () => {
    const { paddlesSchema } = await import("./schema");
    const json = (await import("./paddles.json")).default;
    expect(coverage(paddlesSchema.parse(json), "2026-11-16")).toHaveLength(32);
  });
});

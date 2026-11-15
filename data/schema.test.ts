import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { paddleSchema, paddlesSchema } from "./schema";
import { fakePaddle } from "./test-fixtures";

const sample = fakePaddle();

describe("paddleSchema", () => {
  it("올바른 샘플을 통과시킨다", () => {
    expect(paddleSchema.safeParse(sample).success).toBe(true);
  });

  it("출처가 없으면 거부한다", () => {
    expect(paddleSchema.safeParse({ ...sample, sources: [] }).success).toBe(false);
  });

  it("길이+폭이 24인치를 넘으면 거부한다", () => {
    expect(paddleSchema.safeParse({ ...sample, length_in: 17, width_in: 8 }).success).toBe(false);
  });

  it("길이+폭은 표기 반올림 허용 오차 0.05인치까지 통과한다(D-020)", () => {
    const ok = (length_in: number, width_in: number) => paddleSchema.safeParse({ ...sample, length_in, width_in }).success;
    expect(ok(16.5, 7.5)).toBe(true); // 24.00
    expect(ok(16.34, 7.68)).toBe(true); // 24.02: 판매처 표기 반올림 사례
    expect(ok(16.5, 7.55)).toBe(true); // 24.05: 경계 포함
    expect(ok(16.5, 7.56)).toBe(false); // 24.06
    expect(ok(16.5, 7.6)).toBe(false); // 24.10
  });

  it("알 수 없는 형태를 거부한다", () => {
    expect(paddleSchema.safeParse({ ...sample, shape: "round" }).success).toBe(false);
  });

  it("검증일이 날짜 형식이 아니면 거부한다", () => {
    expect(paddleSchema.safeParse({ ...sample, verified_at: "어제" }).success).toBe(false);
  });
});

describe("paddlesSchema", () => {
  it("중복 id를 거부한다", () => {
    expect(paddlesSchema.safeParse([sample, sample]).success).toBe(false);
  });
});

describe("data/paddles.json", () => {
  const raw = JSON.parse(readFileSync(new URL("./paddles.json", import.meta.url), "utf-8"));

  it("스키마를 통과한다", () => {
    const result = paddlesSchema.safeParse(raw);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it("검증일이 180일을 넘은 제품이 있으면 경고한다(실패시키지는 않음)", () => {
    const limit = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const stale = (raw as { id: string; verified_at: string }[]).filter(
      (p) => new Date(p.verified_at).getTime() < limit,
    );
    if (stale.length > 0) console.warn("재확인 필요:", stale.map((p) => p.id).join(", "));
    expect(Array.isArray(raw)).toBe(true);
  });
});
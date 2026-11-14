import type { Paddle } from "./schema";

/** 테스트 전용 가짜 제품. 실제 제품 데이터가 아니다. 스키마가 바뀌면 이 파일만 고친다. */
export function fakePaddle(overrides: Partial<Paddle> = {}): Paddle {
  return {
    id: "sample-1",
    brand: "SAMPLE",
    model: "Test",
    weight_oz: 7.8,
    core_mm: 16,
    shape: "hybrid",
    length_in: 16,
    width_in: 7.5,
    surface: "carbon",
    price_krw: 100000,
    certification: { usa_pickleball: "approved", checked_at: "2026-01-01" },
    sources: ["https://example.com/spec"],
    verified_at: "2026-01-01",
    ...overrides,
  };
}
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
    price_checked_at: "2026-01-01",
    certification: { usa_pickleball: "approved", checked_at: "2026-01-01" },
    sources: ["https://example.com/spec"],
    verified_at: "2026-01-01",
    ...overrides,
  };
}

/**
 * 점검(data:check)에서 오류도 경고도 나지 않는 정상 샘플. 기준일 2026-06-01 기준이다.
 * 출처 호스트에 브랜드명(SAMPLE)이 들어 있고 확인일이 모두 최근이다. 판매처 링크는 출처에 있는 주소다(구매 링크 필수, T-033).
 */
export function goodPaddle(overrides: Partial<Paddle> = {}): Paddle {
  return fakePaddle({
    sources: ["https://www.sample.com/spec"],
    purchase: { url: "https://www.sample.com/spec", is_affiliate: false },
    verified_at: "2026-05-22",
    price_checked_at: "2026-05-27",
    certification: { usa_pickleball: "approved", checked_at: "2026-05-22" },
    ...overrides,
  });
}
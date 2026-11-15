import { z } from "zod";

/** 규정상 패들의 길이+폭 한도(인치) */
export const MAX_LENGTH_PLUS_WIDTH_IN = 24;
/**
 * 표기 반올림 허용 오차(인치). 제조사·판매처가 치수를 0.1cm나 0.01in 단위로 반올림해 적으면
 * 규정 안의 패들도 합이 24.02in처럼 보인다(예: 41.5 + 19.5cm, 16.34 + 7.68in). (docs/decisions.md D-020)
 */
export const SIZE_ROUNDING_TOLERANCE_IN = 0.05;

/** 제품 1개의 스키마. 모든 값은 사람이 출처를 확인한 것이어야 한다(추정 금지). */
export const paddleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id는 소문자와 하이픈만 사용"),
    brand: z.string().min(1),
    model: z.string().min(1),
    weight_oz: z.number().min(5).max(10),
    core_mm: z.number().min(8).max(25),
    shape: z.enum(["standard", "hybrid", "elongated", "widebody"]),
    length_in: z.number().positive(),
    width_in: z.number().positive(),
    surface: z.enum(["carbon", "fiberglass", "composite", "other"]),
    /** 확인 시점의 참고가. 판매처마다 편차가 크므로 price_checked_at과 함께 기록한다 */
    price_krw: z.number().int().positive().optional(),
    price_checked_at: z.iso.date().optional(),
    certification: z.object({
      usa_pickleball: z.enum(["approved", "not_approved", "unknown"]),
      checked_at: z.iso.date(),
    }),
    /** 스펙을 확인한 출처 URL (제조사 공식 페이지 우선). 최소 1개 */
    sources: z.array(z.url()).min(1),
    verified_at: z.iso.date(),
    /** 구매 링크. 추천 엔진은 이 필드를 읽지 않는다 (PaddleSpec 타입 사용) */
    purchase: z.object({ url: z.url(), is_affiliate: z.boolean() }).optional(),
    notes: z.string().optional(),
  })
  .refine((p) => p.length_in + p.width_in <= MAX_LENGTH_PLUS_WIDTH_IN + SIZE_ROUNDING_TOLERANCE_IN + 1e-9, {
    message: "길이+폭은 24인치 이하여야 한다(표기 반올림 허용 오차 0.05인치)",
    path: ["length_in"],
  })
  .refine((p) => p.price_krw === undefined || p.price_checked_at !== undefined, {
    message: "가격(price_krw)을 넣으면 가격 확인일(price_checked_at)도 필요하다",
    path: ["price_checked_at"],
  });

export const paddlesSchema = z.array(paddleSchema).refine(
  (list) => new Set(list.map((p) => p.id)).size === list.length,
  { message: "id가 중복되었다" },
);

export type Paddle = z.infer<typeof paddleSchema>;
/** 추천 엔진이 사용하는 타입: 구매 링크·수수료 정보를 제외한다 */
export type PaddleSpec = Omit<Paddle, "purchase">;
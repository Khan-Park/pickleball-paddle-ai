import { z } from "zod";

/** 규정상 패들의 길이+폭 한도(인치) */
export const MAX_LENGTH_PLUS_WIDTH_IN = 24;
/**
 * 표기 반올림 허용 오차(인치). 제조사·판매처가 치수를 0.1cm나 0.01in 단위로 반올림해 적으면
 * 규정 안의 패들도 합이 24.02in처럼 보인다(예: 41.5 + 19.5cm, 16.34 + 7.68in). (docs/decisions.md D-020)
 */
export const SIZE_ROUNDING_TOLERANCE_IN = 0.05;

/** 패들 형태. 이 목록이 유일한 정의다. 질문 선택지, 점수 설정, 라벨, 그림이 모두 여기서 타입을 가져온다 */
export const SHAPES = ["standard", "hybrid", "elongated", "widebody"] as const;
export type Shape = (typeof SHAPES)[number];

/** 제품 1개의 스키마. 모든 값은 사람이 출처를 확인한 것이어야 한다(추정 금지). */
export const paddleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id는 소문자와 하이픈만 사용"),
    brand: z.string().min(1),
    model: z.string().min(1),
    weight_oz: z.number().min(5).max(10),
    core_mm: z.number().min(8).max(25),
    shape: z.enum(SHAPES),
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
    /**
     * 제조사 공식 페이지를 찾았지만 이 모델이 없을 때 사람이 남기는 기록(D-024). 있으면 '공식 도메인 아님' 경고 대신 이 사유를 쓴다.
     * 출처를 꾸며 넣지 않기 위한 필드다. 공식 페이지가 생기면 sources에 넣고 이 필드를 지운다.
     */
    official_source_unavailable: z
      .object({
        reason: z.string().min(1),
        checked_at: z.iso.date(),
      })
      .optional(),
    verified_at: z.iso.date(),
    /** 구매 링크. 추천 엔진은 이 필드를 읽지 않는다 (PaddleSpec 타입 사용) */
    purchase: z
      .object({
        url: z.url(),
        is_affiliate: z.boolean(),
        /** 제휴 프로그램. 화면의 대가 표시 문구를 정한다. 주소로 추정하지 않고 사람이 적는다(D-023) */
        program: z.enum(["coupang_partners", "other"]).optional(),
      })
      .refine((p) => !p.is_affiliate || p.program !== undefined, {
        message: "제휴 링크(is_affiliate: true)에는 program(coupang_partners 또는 other)을 적어야 한다",
        path: ["program"],
      })
      .refine((p) => p.is_affiliate || p.program === undefined, {
        message: "program은 제휴 링크에만 적는다(is_affiliate가 false인데 program이 있다)",
        path: ["program"],
      })
      .optional(),
    /** 가격 비교 사이트 검색어(선택). 없으면 "브랜드 모델 피클볼"로 만든다(T-019). 추천 엔진은 읽지 않는다 */
    compare_query: z.string().min(1).optional(),
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
/** 추천 엔진이 쓰는 필드. 점수와 필터에 필요한 스펙만 있다. 구매 링크(purchase)·출처·메모는 없다 */
export const SPEC_FIELDS = ["id", "weight_oz", "core_mm", "shape", "length_in", "width_in", "surface", "price_krw", "certification"] as const;
/** 결과 화면이 추가로 보여 주는 필드. 출처 URL, 확인일, 내부 메모(notes)는 브라우저로 보내지 않는다 */
export const DISPLAY_EXTRA_FIELDS = ["brand", "model", "price_checked_at", "purchase", "compare_query"] as const;

/** 추천 엔진이 사용하는 타입. SPEC_FIELDS에 있는 필드만 담는다 */
export type PaddleSpec = Pick<Paddle, (typeof SPEC_FIELDS)[number]>;
/** 결과 화면에 보여 줄 정보 */
export type PaddleDisplay = Pick<Paddle, (typeof SPEC_FIELDS)[number] | (typeof DISPLAY_EXTRA_FIELDS)[number]>;

function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
}

/** 엔진에 넘길 스펙만 고른다. 필드 목록(SPEC_FIELDS)에 추가하면 타입과 복사가 함께 바뀐다 */
export function toPaddleSpec(paddle: PaddleSpec): PaddleSpec {
  return pick(paddle, SPEC_FIELDS);
}

/** 브라우저로 보낼 화면용 정보만 고른다 */
export function toPaddleDisplay(paddle: Paddle): PaddleDisplay {
  return pick(paddle, [...SPEC_FIELDS, ...DISPLAY_EXTRA_FIELDS]);
}

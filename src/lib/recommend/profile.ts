import { z } from "zod";

const krw = (label: string) =>
  z
    .int(`${label}은(는) 원 단위 정수로 입력해 주세요`)
    .min(0, `${label}은(는) 0원 이상이어야 합니다`);

/**
 * 추천 엔진의 입력. 질문 플로우(UI)는 사용자 답변을 이 스키마로 검증한 뒤 엔진에 넘긴다.
 * 검증은 이 경계에서 하고, hardFilter의 RangeError는 최후 방어선으로만 남긴다. (D-015)
 */
export const userProfileSchema = z.object(
  {
    /** 예산 범위(원). 두 값 모두 포함이며, 생략하면 그쪽 제한이 없다. */
    budget: z
      .object(
        {
          min_krw: krw("최소 예산").optional(),
          max_krw: krw("최대 예산").optional(),
        },
        "예산 정보가 올바르지 않습니다",
      )
      .refine(
        (b) => b.min_krw === undefined || b.max_krw === undefined || b.min_krw <= b.max_krw,
        { message: "최소 예산이 최대 예산보다 클 수 없습니다", path: ["min_krw"] },
      ),
    /** 대회 인증(USA Pickleball 승인)이 필요한가 */
    needs_certification: z.boolean("대회 인증 필요 여부를 선택해 주세요"),
  },
  "프로필 형식이 올바르지 않습니다",
);

export type UserProfile = z.infer<typeof userProfileSchema>;
export type BudgetRange = UserProfile["budget"];

export type ProfileFieldError = { field: string; message: string };
export type ProfileParseResult =
  | { success: true; profile: UserProfile }
  | { success: false; errors: ProfileFieldError[] };

/** 사용자 입력을 검증한다. 실패하면 화면에 그대로 보여줄 수 있는 한국어 메시지를 필드별로 돌려준다. */
export function parseUserProfile(input: unknown): ProfileParseResult {
  const result = userProfileSchema.safeParse(input);
  if (result.success) return { success: true, profile: result.data };
  return {
    success: false,
    errors: result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  };
}
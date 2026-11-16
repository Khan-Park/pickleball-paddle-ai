import { SITE_NAME, SITE_URL } from "./site";

/**
 * 결과 공유 주소(T-025). 결과만 공유한다(phase2 결정 5).
 * - 주소에는 제품 id만 순위 순서로 담는다. 답변·프로필·점수는 받지 않는다(인자가 id 배열뿐이다)
 *   팔 불편 답은 건강 관련 정보라 주소에 넣지 않는다(docs/design/ui-flow.md 4장)
 * - 공유 글에도 제품 이름·답변·조건을 넣지 않는다
 */

export const SHARE_PATH = "/shared";
export const SHARE_PARAM = "p";
export const SHARE_MAX = 3;

/** 제품 id 형식(data/schema.ts의 id 규칙과 같다) */
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SHARE_TEXT = {
  title: `${SITE_NAME}에서 추천받은 피클볼 패들`,
  text: "추천받은 패들 3개를 확인해 보세요.",
} as const;

/** 공유 주소. 제품 id 1~3개(앞에서부터 순위 순서) */
export function buildShareUrl(paddleIds: readonly string[]): string {
  const ids = paddleIds.filter((id) => ID_PATTERN.test(id)).slice(0, SHARE_MAX);
  if (ids.length === 0) throw new RangeError("공유할 제품 id가 없다");
  // 쉼표는 그대로 두어 주소를 짧고 읽기 쉽게 한다(id에는 쉼표가 들어갈 수 없다)
  return `${SITE_URL}${SHARE_PATH}?${SHARE_PARAM}=${ids.join(",")}`;
}

export type SharedIds = {
  /** 지금 목록에 있는 제품 id(공유한 순서) */
  found: string[];
  /** 형식은 맞지만 지금 목록에 없는 제품 수(데이터에서 빠진 제품) */
  missing: number;
};

/** 주소의 p 값을 읽는다. 형식이 틀린 값은 버리고, 중복은 하나로, 최대 3개 */
export function parseSharedIds(value: string | null, knownIds: ReadonlySet<string>): SharedIds {
  const ids = [...new Set((value ?? "").split(",").map((s) => s.trim()))].filter((id) => ID_PATTERN.test(id)).slice(0, SHARE_MAX);
  const found = ids.filter((id) => knownIds.has(id));
  return { found, missing: ids.length - found.length };
}

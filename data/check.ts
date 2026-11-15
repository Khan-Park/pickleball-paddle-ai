import { daysBetween } from "../src/lib/recommend/dates.ts";
import { paddlesSchema } from "./schema.ts";

/** 스펙·대회 인증 확인일이 이 일수를 넘으면 재확인을 권한다(docs/spec.md) */
export const DATA_MAX_AGE_DAYS = 180;
/** 가격 확인일 기준. 가설: 가격은 자주 바뀌고 직구는 편차가 커서 30일로 둔다 */
export const PRICE_MAX_AGE_DAYS = 30;

export type CheckReport = {
  count: number;
  /** 있으면 데이터를 쓰면 안 된다 */
  errors: string[];
  /** 재확인 권고. 데이터는 쓸 수 있다 */
  warnings: string[];
};

const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/**
 * 제품 데이터를 점검한다. 현재 시각을 읽지 않고 기준일(today, YYYY-MM-DD)을 받는다.
 * 스키마를 통과하지 못하면 errors만 돌려준다(통과 못 한 데이터로 날짜 점검을 하지 않는다).
 */
export function checkPaddles(raw: unknown, today: string): CheckReport {
  if (Number.isNaN(daysBetween(today, today))) {
    throw new RangeError("today는 YYYY-MM-DD 형식의 유효한 날짜여야 한다");
  }
  const parsed = paddlesSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${i.path.join(".") || "(전체)"}: ${i.message}`);
    return { count: Array.isArray(raw) ? raw.length : 0, errors, warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  for (const p of parsed.data) {
    const dated: [string, string | undefined][] = [
      ["verified_at", p.verified_at],
      ["certification.checked_at", p.certification.checked_at],
      ["price_checked_at", p.price_checked_at],
    ];
    for (const [name, date] of dated) {
      if (date !== undefined && daysBetween(date, today) < 0) {
        errors.push(`${p.id}: ${name}(${date})가 기준일(${today})보다 미래이다`);
      }
    }

    const age = (d: string) => daysBetween(d, today);
    if (age(p.verified_at) > DATA_MAX_AGE_DAYS) {
      warnings.push(`${p.id}: 스펙 확인 후 ${age(p.verified_at)}일 지났다. 재확인이 필요하다(기준 ${DATA_MAX_AGE_DAYS}일)`);
    }
    if (p.certification.usa_pickleball === "approved" && age(p.certification.checked_at) > DATA_MAX_AGE_DAYS) {
      warnings.push(`${p.id}: 대회 인증 확인 후 ${age(p.certification.checked_at)}일 지났다. 이 제품은 대회용 추천에서 제외된다`);
    }
    if (p.price_checked_at !== undefined && age(p.price_checked_at) > PRICE_MAX_AGE_DAYS) {
      warnings.push(`${p.id}: 가격 확인 후 ${age(p.price_checked_at)}일 지났다. 가격 재확인이 필요하다(기준 ${PRICE_MAX_AGE_DAYS}일)`);
    }

    // 제조사 공식 페이지인지 알 수는 없다. 브랜드명이 호스트에 없으면 확인을 권한다.
    const brand = alnum(p.brand);
    if (brand !== "" && !p.sources.some((u) => alnum(hostOf(u)).includes(brand))) {
      warnings.push(`${p.id}: 출처 URL 호스트에 브랜드명(${p.brand})이 없다. 제조사 공식 페이지인지 확인해 달라`);
    }
  }
  return { count: parsed.data.length, errors, warnings };
}

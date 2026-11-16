import { isCoupangUrl } from "../src/lib/shared/affiliate.ts";
import { daysBetween, todayLocal } from "../src/lib/shared/dates.ts";
import { CERT_MAX_AGE_DAYS, PRICE_MAX_AGE_DAYS } from "../src/lib/shared/limits.ts";
import { paddleSchema, paddlesSchema } from "./schema.ts";

/** 스펙 확인일이 이 일수를 넘으면 재확인을 권한다(docs/spec.md). 대회 인증은 엔진과 같은 CERT_MAX_AGE_DAYS를 쓴다 */
export const DATA_MAX_AGE_DAYS = 180;
// 가격 확인일 기준과 오늘 날짜 함수는 화면과 같이 쓰도록 src/lib/shared에 둔다
export { PRICE_MAX_AGE_DAYS, todayLocal };

export type CheckReport = {
  count: number;
  /** 있으면 데이터를 쓰면 안 된다 */
  errors: string[];
  /** 재확인 권고. 데이터는 쓸 수 있다 */
  warnings: string[];
};

/** paddles.json 텍스트를 읽는다. Windows PowerShell이 붙이는 UTF-8 BOM은 제거한다 */
export function parsePaddlesJson(text: string): unknown {
  return JSON.parse(text.replace(/^﻿/, ""));
}

// 공식 사이트 도메인에 흔히 붙는 꼬리말(예: sixzeropickleball.com). 이 밖의 도메인은 경고한다
const OFFICIAL_SUFFIXES = ["pickleball", "pickleballs", "sports", "sport", "paddles", "paddle", "official", "usa", "global", "korea"];
// co.kr, com.au처럼 등록 도메인이 한 라벨 더 앞에 있는 2단 TLD의 앞부분
const SECOND_LEVEL = new Set(["co", "com", "or", "ne", "go", "ac", "org", "net"]);

/**
 * 출처 URL의 등록 도메인 이름(TLD 제외, 하이픈 제거)이 브랜드명이거나 브랜드명+흔한 꼬리말이면 공식 사이트로 본다.
 * 하위 라벨은 보지 않는다. joola.com.shop-deals.net 같은 위장 주소와 headphones-shop.com 같은 부분 일치를 막기 위해서다.
 * 제조사 도메인이 브랜드명과 다르면(모회사 도메인 등) 계속 경고가 나며, 사람이 확인하면 된다(경고일 뿐이다).
 */
function looksOfficial(brand: string, url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  const labels = host.split(".");
  const twoLevelTld = labels.length >= 3 && SECOND_LEVEL.has(labels[labels.length - 2]!) && labels[labels.length - 1]!.length === 2;
  const name = labels[labels.length - (twoLevelTld ? 3 : 2)]?.replace(/-/g, "");
  return name !== undefined && (name === brand || OFFICIAL_SUFFIXES.some((s) => name === brand + s));
}

const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

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
    if (p.certification.usa_pickleball === "approved" && age(p.certification.checked_at) > CERT_MAX_AGE_DAYS) {
      warnings.push(`${p.id}: 대회 인증 확인 후 ${age(p.certification.checked_at)}일 지났다. 이 제품은 대회용 추천에서 제외된다`);
    }
    if (p.price_checked_at !== undefined && age(p.price_checked_at) > PRICE_MAX_AGE_DAYS) {
      warnings.push(`${p.id}: 가격 확인 후 ${age(p.price_checked_at)}일 지났다. 가격 재확인이 필요하다(기준 ${PRICE_MAX_AGE_DAYS}일)`);
    }

    // 쿠팡 파트너스 링크는 경제적 이해관계 표시 대상이다. is_affiliate가 false면 화면에 대가 표시가 빠진다
    if (p.purchase && isCoupangUrl(p.purchase.url) && p.purchase.program !== "coupang_partners") {
      errors.push(
        `${p.id}: 구매 링크가 쿠팡 주소인데 쿠팡 파트너스 링크로 적혀 있지 않다. 파트너스 링크면 is_affiliate: true, program: "coupang_partners"로 적어 권장 문구가 나오게 해야 한다`,
      );
    }

    const brand = alnum(p.brand);
    if (brand !== "" && !p.sources.some((u) => looksOfficial(brand, u))) {
      warnings.push(`${p.id}: 출처 URL이 브랜드(${p.brand}) 공식 도메인으로 보이지 않는다. 제조사 공식 페이지인지 확인해 달라`);
    }
  }
  return { count: parsed.data.length, errors, warnings };
}

export type DraftReport = {
  /** 아직 채워지지 않은 필드(null 또는 "TODO..."). 보류 상태이며 오류가 아니다 */
  pending: string[];
  /** 채워진 필드 중 스키마에 어긋난 것 */
  errors: string[];
};

const isPending = (v: unknown) => v === null || (typeof v === "string" && v.startsWith("TODO"));

/**
 * data/staging의 초안 1개를 점검한다. null·"TODO" 필드는 보류로 모아 보고하고,
 * 나머지 필드가 paddleSchema(id 형식, 길이+폭 24in, 인증·출처 형식 등)에 맞는지 검사한다.
 */
export function checkDraft(draft: unknown): DraftReport {
  const paddle = (draft as { paddle?: unknown } | null)?.paddle;
  if (typeof paddle !== "object" || paddle === null || Array.isArray(paddle)) {
    return { pending: [], errors: ["paddle 객체가 없다"] };
  }
  const pending = Object.entries(paddle as Record<string, unknown>)
    .filter(([, v]) => isPending(v))
    .map(([k]) => k);
  const result = paddleSchema.safeParse(paddle);
  const errors = result.success
    ? []
    : result.error.issues
        .filter((i) => !pending.includes(String(i.path[0])))
        .map((i) => `${i.path.join(".") || "(전체)"}: ${i.message}`);
  return { pending, errors };
}

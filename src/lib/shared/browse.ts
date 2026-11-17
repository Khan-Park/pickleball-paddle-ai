import type { PaddleSpec, Shape } from "../../../data/schema";
import { daysBetween } from "./dates";
import { CERT_MAX_AGE_DAYS } from "./limits";
import { weightBand, type WeightBand } from "../recommend/axes";
import { WEIGHT_BAND } from "../recommend/scoring-config";

/**
 * 둘러보기의 걸러 보기와 정렬(T-026).
 * - 스펙(PaddleSpec)과 이름만 받는다. 구매 링크·제휴 여부·가격 비교 검색어는 받지 않는다(규칙 1과 같은 원칙, 소스 검사 테스트)
 * - 정렬은 가격 낮은 순(D-030). 가격이 없는 제품은 끝, 같으면 브랜드·모델 이름 순
 */

/** 가격 구간. 경계는 퀴즈 예산과 같고 양끝을 포함한다. 퀴즈에 없는 "30만 넘음"을 더해 모든 제품에 닿게 한다 */
export const PRICE_BANDS = [
  { value: "under_100k", label: "10만 이하", max: 100_000 },
  { value: "100k_to_200k", label: "10~20만", min: 100_000, max: 200_000 },
  { value: "200k_to_300k", label: "20~30만", min: 200_000, max: 300_000 },
  { value: "over_300k", label: "30만 넘음", min: 300_001 },
] as const satisfies readonly { value: string; label: string; min?: number; max?: number }[];
export type PriceBand = (typeof PRICE_BANDS)[number]["value"];

/**
 * 무게 구간(T-048). 판정은 엔진의 weightBand를 그대로 써서 경계(7.3·8.4oz는 중간)가 퀴즈·추천과 같다. 새 수치를 만들지 않는다
 */
export const WEIGHT_BANDS = [
  { value: "light", label: `가벼움(${WEIGHT_BAND.lightBelowOz}oz 미만)` },
  { value: "medium", label: `중간(${WEIGHT_BAND.lightBelowOz}~${WEIGHT_BAND.heavyAboveOz}oz)` },
  { value: "heavy", label: `묵직함(${WEIGHT_BAND.heavyAboveOz}oz 초과)` },
] as const satisfies readonly { value: WeightBand; label: string }[];
export type { WeightBand };

export type BrowseFilter = {
  /** 브랜드·모델 이름 검색어. 대소문자·공백 무시, 부분 일치. 빈 문자열이면 거르지 않는다(T-048) */
  query: string;
  /** 비어 있으면 모든 형태 */
  shapes: readonly Shape[];
  /** 비어 있으면 모든 브랜드(T-048) */
  brands: readonly string[];
  /** 비어 있으면 모든 무게(T-048) */
  weights: readonly WeightBand[];
  /** null이면 모든 가격(가격 없는 제품 포함) */
  price: PriceBand | null;
  /** true면 승인 확인된 제품만(승인 + 확인 180일 이내 + 미래 날짜 아님) */
  approvedOnly: boolean;
};

export const EMPTY_FILTER: BrowseFilter = { query: "", shapes: [], brands: [], weights: [], price: null, approvedOnly: false };

export type BrowseItem = Pick<PaddleSpec, "id" | "shape" | "weight_oz" | "price_krw" | "certification"> & { brand: string; model: string };

/** 검색용으로 소문자로 바꾸고 공백을 모두 뺀다 */
export function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

/** 브랜드 + 모델 이름에서 부분 일치(대소문자·공백 무시). 빈 검색어는 모두 통과 */
export function matchesQuery(item: { brand: string; model: string }, query: string): boolean {
  const q = normalizeSearch(query);
  return q === "" || normalizeSearch(`${item.brand}${item.model}`).includes(q);
}

/** 데이터에 있는 브랜드 목록(중복 없이 이름 순). 브랜드 칩을 만든다 */
export function brandOptions(items: readonly { brand: string }[]): string[] {
  return [...new Set(items.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/** 아무 조건도 없는지(필터 지우기 버튼·요약 줄에 쓴다) */
export function isFilterEmpty(filter: BrowseFilter): boolean {
  return (
    normalizeSearch(filter.query) === "" &&
    filter.shapes.length === 0 &&
    filter.brands.length === 0 &&
    filter.weights.length === 0 &&
    filter.price === null &&
    !filter.approvedOnly
  );
}

/** 카드·비교표의 "✓ 승인"과 같은 판정(CertBadge·certShort) */
export function isApprovedNow(certification: PaddleSpec["certification"], today: string): boolean {
  if (certification.usa_pickleball !== "approved") return false;
  const age = daysBetween(certification.checked_at, today);
  return Number.isFinite(age) && age >= 0 && age <= CERT_MAX_AGE_DAYS;
}

function inBand(price: number | undefined, band: PriceBand | null): boolean {
  if (band === null) return true;
  if (price === undefined) return false;
  const range: { min?: number; max?: number } = PRICE_BANDS.find((b) => b.value === band)!;
  return (range.min === undefined || price >= range.min) && (range.max === undefined || price <= range.max);
}

export function filterAndSort<T extends BrowseItem>(items: readonly T[], filter: BrowseFilter, today: string): T[] {
  return items
    .filter((p) => matchesQuery(p, filter.query))
    .filter((p) => filter.shapes.length === 0 || filter.shapes.includes(p.shape))
    .filter((p) => filter.brands.length === 0 || filter.brands.includes(p.brand))
    .filter((p) => filter.weights.length === 0 || filter.weights.includes(weightBand(p.weight_oz)))
    .filter((p) => inBand(p.price_krw, filter.price))
    .filter((p) => !filter.approvedOnly || isApprovedNow(p.certification, today))
    .sort((a, b) => {
      if (a.price_krw !== b.price_krw) {
        if (a.price_krw === undefined) return 1;
        if (b.price_krw === undefined) return -1;
        return a.price_krw - b.price_krw;
      }
      return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "ko");
    });
}

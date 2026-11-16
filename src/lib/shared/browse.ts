import type { PaddleSpec, Shape } from "../../../data/schema";
import { daysBetween } from "./dates";
import { CERT_MAX_AGE_DAYS } from "./limits";

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

export type BrowseFilter = {
  /** 비어 있으면 모든 형태 */
  shapes: readonly Shape[];
  /** null이면 모든 가격(가격 없는 제품 포함) */
  price: PriceBand | null;
  /** true면 승인 확인된 제품만(승인 + 확인 180일 이내 + 미래 날짜 아님) */
  approvedOnly: boolean;
};

export const EMPTY_FILTER: BrowseFilter = { shapes: [], price: null, approvedOnly: false };

export type BrowseItem = Pick<PaddleSpec, "id" | "shape" | "price_krw" | "certification"> & { brand: string; model: string };

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
    .filter((p) => filter.shapes.length === 0 || filter.shapes.includes(p.shape))
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

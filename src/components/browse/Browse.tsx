"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { SHAPES, type PaddleDisplay, type Shape } from "../../../data/schema";
import {
  brandOptions,
  EMPTY_FILTER,
  filterAndSort,
  isFilterEmpty,
  PRICE_BANDS,
  WEIGHT_BANDS,
  type BrowseFilter,
  type PriceBand,
  type WeightBand,
} from "@/lib/shared/browse";
import { DESKTOP_QUERY, useMediaQuery } from "@/components/ui/useMediaQuery";
import { SHAPE_LABEL } from "@/lib/shared/shape-labels";
import { ProductRow } from "@/components/product/ProductRow";
import { ProductCatalogContext, type ProductCatalog } from "@/components/product/catalog";
import { ProductSheet } from "@/components/product/ProductSheet";
import { AffiliatePageNotice, affiliatePrograms } from "@/components/result/AffiliatePageNotice";
import { NOTICE, todayLocal } from "@/components/result/labels";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";

const subscribe = () => () => {};
const readToday = () => todayLocal();

/** 둘러보기 순서 안내. 결과 화면의 순위 안내(NOTICE.ranking)와 같은 원칙 */
export const BROWSE_ORDER_NOTE = "목록은 가격 낮은 순이며, 구매 링크나 수수료는 순서에 영향을 주지 않습니다.";

/** 요약 줄에 쓰는 무게 구간 짧은 이름 */
const WEIGHT_SHORT: Record<WeightBand, string> = { light: "가벼움", medium: "중간 무게", heavy: "묵직함" };

/** 고른 조건을 한 줄로. 아무것도 안 골랐으면 null */
export function filterSummary(filter: BrowseFilter): string | null {
  const query = filter.query.trim();
  const parts = [
    ...(query ? [`"${query}" 검색`] : []),
    ...filter.shapes.map((shape) => SHAPE_LABEL[shape]),
    ...filter.brands,
    ...filter.weights.map((w) => WEIGHT_SHORT[w]),
    ...(filter.price ? [PRICE_BANDS.find((b) => b.value === filter.price)!.label] : []),
    ...(filter.approvedOnly ? ["승인 확인"] : []),
  ];
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** 켜고 끄는 칩. 상태는 aria-pressed로 알린다 */
function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3.5 text-small font-bold outline-offset-2 transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-accent ${
        pressed ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-card text-ink hover:border-accent"
      }`}
    >
      {pressed ? <span aria-hidden="true">✓ </span> : null}
      {children}
    </button>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <p aria-hidden="true" className="text-caption font-bold text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * 둘러보기(T-026). 퀴즈 없이 전체 제품을 형태·가격·대회 승인으로 걸러 본다.
 * 순서는 가격 낮은 순이고 구매 링크·제휴 여부는 쓰지 않는다(D-030). 필터는 화면 안에서만 기억한다(주소·저장소에 남기지 않음).
 */
export function Browse({ paddles }: { paddles: PaddleDisplay[] }) {
  const [filter, setFilter] = useState<BrowseFilter>(EMPTY_FILTER);
  // 필터는 처음에 접어 목록이 바로 보이게 한다(T-037, 사용자 결정 B)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const [productStack, setProductStack] = useState<string[]>([]);
  // 오늘 날짜는 브라우저에서만 읽는다(결과 화면과 같다)
  const today = useSyncExternalStore<string | null>(subscribe, readToday, () => null);
  const byId = useMemo(() => new Map(paddles.map((p) => [p.id, p])), [paddles]);
  const brands = useMemo(() => brandOptions(paddles), [paddles]);
  const list = useMemo(() => (today ? filterAndSort(paddles, filter, today) : []), [paddles, filter, today]);
  // 1024px 이상은 왼쪽 열에 필터를 늘 펼치고 목록을 2열 격자로(T-048). 모바일은 필터를 접는다
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  // 헤더 검색 아이콘(/browse#search)으로 오면 검색칸에 포커스한다. 이미 이 화면에 있을 때 다시 눌러도(해시 변경) 옮긴다(T-048)
  const searchRef = useRef<HTMLInputElement>(null);
  const ready = today !== null;
  useEffect(() => {
    if (!ready) return;
    const focusIfSearch = () => {
      if (window.location.hash === "#search") searchRef.current?.focus();
    };
    focusIfSearch();
    window.addEventListener("hashchange", focusIfSearch);
    return () => window.removeEventListener("hashchange", focusIfSearch);
  }, [ready]);

  if (!today) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-5 py-8" aria-busy="true">
        <p className="sr-only" role="status">
          제품 목록을 불러오고 있습니다.
        </p>
        <CardSkeleton />
        <CardSkeleton />
      </section>
    );
  }

  const toggleShape = (shape: Shape) =>
    setFilter((f) => ({ ...f, shapes: f.shapes.includes(shape) ? f.shapes.filter((s) => s !== shape) : [...f.shapes, shape] }));
  const setPrice = (price: PriceBand | null) => setFilter((f) => ({ ...f, price: f.price === price ? null : price }));
  const toggleBrand = (brand: string) =>
    setFilter((f) => ({ ...f, brands: f.brands.includes(brand) ? f.brands.filter((b) => b !== brand) : [...f.brands, brand] }));
  const toggleWeight = (w: WeightBand) =>
    setFilter((f) => ({ ...f, weights: f.weights.includes(w) ? f.weights.filter((x) => x !== w) : [...f.weights, w] }));
  const filtered = !isFilterEmpty(filter);
  const summary = filterSummary(filter);
  const programs = affiliatePrograms(list);

  const catalog: ProductCatalog = {
    paddles,
    // 둘러보기에서는 목록 전체가 화면에 있으므로 자기 자신만 뺀다(similarPaddles가 자기 자신을 뺀다)
    exclude: [],
    today,
    openProduct: (id) => setProductStack((stack) => [...stack, id]),
  };

  return (
    <ProductCatalogContext.Provider value={catalog}>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-6 pb-8 lg:max-w-6xl lg:px-8">
        {/* 제휴 링크가 목록에 있으면 제목보다 앞에서 먼저 알린다(D-022) */}
        <AffiliatePageNotice programs={programs} note={BROWSE_ORDER_NOTE} />

        <header className="flex flex-col gap-1">
          <h1 className="text-title font-bold text-navy">패들 둘러보기</h1>
          <p className="text-small text-muted" role="status" data-testid="browse-count">
            {paddles.length}개 중 {list.length}개
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* 필터 묶음. 모바일은 접힘(T-037), 데스크톱은 왼쪽 3칸에 늘 펼침(T-048) */}
        <div className="flex flex-col gap-3 lg:col-span-3" data-testid="browse-filter-column">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {isDesktop ? (
              <p className="text-small font-bold text-ink">필터</p>
            ) : (
              <Button
                variant="secondary"
                size="md"
                aria-expanded={filtersOpen}
                aria-controls={filtersId}
                onClick={() => setFiltersOpen((v) => !v)}
                data-testid="browse-filter-toggle"
              >
                필터 {filtersOpen ? "접기 ▴" : "펼치기 ▾"}
              </Button>
            )}
            <p className="min-w-0 flex-1 text-small text-muted" data-testid="browse-filter-summary">
              {summary ?? "모든 제품"}
            </p>
            {filtered ? (
              <Button variant="text" size="md" onClick={() => setFilter(EMPTY_FILTER)}>
                필터 지우기
              </Button>
            ) : null}
          </div>
          <div id={filtersId} hidden={!isDesktop && !filtersOpen} className="flex flex-col gap-4 animate-reveal" data-testid="browse-filters">
            <ChipGroup label="형태(여러 개 선택)">
              {SHAPES.map((shape) => (
                <Chip key={shape} pressed={filter.shapes.includes(shape)} onClick={() => toggleShape(shape)}>
                  {SHAPE_LABEL[shape]}
                </Chip>
              ))}
            </ChipGroup>
            <ChipGroup label="브랜드(여러 개 선택)">
              {brands.map((brand) => (
                <Chip key={brand} pressed={filter.brands.includes(brand)} onClick={() => toggleBrand(brand)}>
                  {brand}
                </Chip>
              ))}
            </ChipGroup>
            <ChipGroup label="무게(여러 개 선택)">
              {WEIGHT_BANDS.map((band) => (
                <Chip key={band.value} pressed={filter.weights.includes(band.value)} onClick={() => toggleWeight(band.value)}>
                  {band.label}
                </Chip>
              ))}
            </ChipGroup>
            <ChipGroup label="가격">
              {PRICE_BANDS.map((band) => (
                <Chip key={band.value} pressed={filter.price === band.value} onClick={() => setPrice(band.value)}>
                  {band.label}
                </Chip>
              ))}
            </ChipGroup>
            <ChipGroup label="대회 승인">
              <Chip pressed={filter.approvedOnly} onClick={() => setFilter((f) => ({ ...f, approvedOnly: !f.approvedOnly }))}>
                승인 확인된 제품만
              </Chip>
            </ChipGroup>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-9">
        {/* 검색칸은 접히는 필터 밖에 둔다. 헤더 검색 아이콘으로 와도 바로 보인다(T-048) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-caption font-bold text-muted">
            브랜드·모델 검색
          </label>
          <input
            ref={searchRef}
            id="search"
            type="search"
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="예: JOOLA, Perseus"
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-11 w-full rounded-control border border-line bg-card px-3 text-body text-ink outline-offset-2 placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
            data-testid="browse-search"
          />
        </div>

        {list.length > 0 ? (
          <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3" data-testid="browse-list">
            {list.map((paddle, i) => (
              <li key={paddle.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                <ProductRow paddle={paddle} today={today} onOpen={() => setProductStack([paddle.id])} testId="browse-row" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-card p-5" data-testid="browse-empty">
            <p className="text-body text-ink">조건에 맞는 제품이 없습니다.</p>
            {filter.query.trim() ? <p className="text-small text-muted">영문 브랜드·모델 이름으로 찾아 주세요. 한글 브랜드 이름은 아직 찾을 수 없습니다.</p> : null}
            <Button variant="secondary" size="md" onClick={() => setFilter(EMPTY_FILTER)}>
              필터 지우기
            </Button>
          </div>
        )}
        </div>
        </div>

        <footer className="flex flex-col gap-1 text-xs leading-relaxed text-muted">
          <p>{NOTICE.spec}</p>
          {programs.size > 0 ? null : <p>{BROWSE_ORDER_NOTE}</p>}
          <p>{NOTICE.price}</p>
        </footer>

        <Link href="/quiz" className="text-base font-semibold text-accent underline underline-offset-4">
          질문에 답하고 추천받기
        </Link>

        <ProductSheet
          stack={productStack}
          byId={byId}
          today={today}
          onBack={() => setProductStack((stack) => stack.slice(0, -1))}
          onClose={() => setProductStack([])}
        />
      </section>
    </ProductCatalogContext.Provider>
  );
}

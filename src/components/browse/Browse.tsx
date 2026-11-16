"use client";

import { useId, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { SHAPES, type PaddleDisplay, type Shape } from "../../../data/schema";
import { EMPTY_FILTER, filterAndSort, PRICE_BANDS, type BrowseFilter, type PriceBand } from "@/lib/shared/browse";
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

/** 고른 조건을 한 줄로. 아무것도 안 골랐으면 null */
export function filterSummary(filter: BrowseFilter): string | null {
  const parts = [
    ...filter.shapes.map((shape) => SHAPE_LABEL[shape]),
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
  const list = useMemo(() => (today ? filterAndSort(paddles, filter, today) : []), [paddles, filter, today]);

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
  const filtered = filter.shapes.length > 0 || filter.price !== null || filter.approvedOnly;
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
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-4 pb-8">
        <Link href="/" className="-ml-1 self-start rounded-control px-1 py-2 text-small font-bold text-muted outline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent">
          ← 처음으로
        </Link>

        {/* 제휴 링크가 목록에 있으면 제목보다 앞에서 먼저 알린다(D-022) */}
        <AffiliatePageNotice programs={programs} note={BROWSE_ORDER_NOTE} />

        <header className="flex flex-col gap-1">
          <h1 className="text-title font-bold text-navy">패들 둘러보기</h1>
          <p className="text-small text-muted" role="status" data-testid="browse-count">
            {paddles.length}개 중 {list.length}개
          </p>
        </header>

        {/* 접힌 줄: 필터 버튼 + 고른 조건 요약 + 필터 지우기. 접어도 고른 조건은 보인다 */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
            <p className="min-w-0 flex-1 text-small text-muted" data-testid="browse-filter-summary">
              {summary ?? "모든 제품"}
            </p>
            {filtered ? (
              <Button variant="text" size="md" onClick={() => setFilter(EMPTY_FILTER)}>
                필터 지우기
              </Button>
            ) : null}
          </div>
        <div id={filtersId} hidden={!filtersOpen} className="flex flex-col gap-4 animate-reveal" data-testid="browse-filters">
          <ChipGroup label="형태(여러 개 선택)">
            {SHAPES.map((shape) => (
              <Chip key={shape} pressed={filter.shapes.includes(shape)} onClick={() => toggleShape(shape)}>
                {SHAPE_LABEL[shape]}
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

        {list.length > 0 ? (
          <ul className="flex flex-col gap-2" data-testid="browse-list">
            {list.map((paddle, i) => (
              <li key={paddle.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                <ProductRow paddle={paddle} today={today} onOpen={() => setProductStack([paddle.id])} testId="browse-row" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-card p-5" data-testid="browse-empty">
            <p className="text-body text-ink">조건에 맞는 제품이 없습니다.</p>
            <Button variant="secondary" size="md" onClick={() => setFilter(EMPTY_FILTER)}>
              필터 지우기
            </Button>
          </div>
        )}

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

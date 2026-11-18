"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { PaddleDisplay } from "../../../data/schema";
import { parseSharedIds, SHARE_PARAM } from "@/lib/shared/share";
import { ProductCatalogContext, type ProductCatalog } from "@/components/product/catalog";
import { ProductRow } from "@/components/product/ProductRow";
import { ProductSheet } from "@/components/product/ProductSheet";
import { AffiliatePageNotice, affiliatePrograms } from "@/components/result/AffiliatePageNotice";
import { NOTICE, todayLocal } from "@/components/result/labels";
import { StartButton } from "@/components/StartButton";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { HeroMedia } from "@/components/site/HeroMedia";
import { CompareSheet, toCompareColumns } from "@/components/compare/CompareSheet";

const subscribe = () => () => {};
const readToday = () => todayLocal();

/** 받은 사람 화면을 읽는 동안(주소의 p는 브라우저에서만 읽는다) */
export function SharedSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-5 py-8" aria-busy="true">
      <p className="sr-only" role="status">
        공유받은 추천을 불러오고 있습니다.
      </p>
      <CardSkeleton />
      <CardSkeleton />
    </section>
  );
}

/**
 * 공유받은 추천(T-025). 주소에는 제품 id만 있고 답변은 없다(phase2 결정 5).
 * 공유된 제품을 순서대로 보여 주고, 누르면 "제품 자세히" 시트(T-024). 받은 사람이 직접 질문에 답하도록 이끈다.
 * 2~3개면 스펙 비교 표를 연다(T-051, 둘러보기 비교함과 같은 담은 제품 모드).
 */
export function Shared({ paddles }: { paddles: PaddleDisplay[] }) {
  const params = useSearchParams();
  const today = useSyncExternalStore<string | null>(subscribe, readToday, () => null);
  const [productStack, setProductStack] = useState<string[]>([]);
  // 비교(T-051). 표에서 고른 제품은 비교 시트가 닫힌 뒤(close 이벤트) 상세 시트로 연다(시트를 겹치지 않는다)
  const [compareOpen, setCompareOpen] = useState(false);
  const pendingPick = useRef<string | null>(null);
  const byId = useMemo(() => new Map(paddles.map((p) => [p.id, p])), [paddles]);
  const shared = useMemo(() => parseSharedIds(params.get(SHARE_PARAM), new Set(byId.keys())), [params, byId]);

  if (!today) return <SharedSkeleton />;

  const items = shared.found.map((id) => byId.get(id)!);
  const programs = affiliatePrograms(items);
  // 2~3개일 때만 비교한다. 공유 링크에는 답변이 없어 적합도 없이 스펙만 비교한다(담은 제품 모드)
  const columns = toCompareColumns(items.map((paddle) => ({ paddle })));
  const afterCompareClosed = () => {
    setCompareOpen(false);
    const id = pendingPick.current;
    pendingPick.current = null;
    if (id) setProductStack([id]);
  };
  const catalog: ProductCatalog = {
    paddles,
    // 비슷한 제품에서는 공유된 제품들을 뺀다(이미 화면에 있다)
    exclude: shared.found,
    today,
    openProduct: (id) => setProductStack((stack) => [...stack, id]),
  };

  return (
    <ProductCatalogContext.Provider value={catalog}>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-6 pb-8 lg:max-w-6xl lg:px-8">
        {/* 제휴 링크가 있으면 제목보다 앞에서 먼저 알린다(D-022) */}
        <AffiliatePageNotice programs={programs} />

        {/* 결과 화면과 같은 히어로 띠(T-051). 대가 표시는 이 띠(h1)보다 앞이다 */}
        <HeroMedia slot="result" className="rounded-card">
          <header className="flex flex-col items-start gap-3 px-5 py-8 lg:px-8 lg:py-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-title font-bold lg:text-display" data-testid="shared-title">
                {items.length > 0 ? (
                  <>
                    공유받은 추천 <span className="underline decoration-lime decoration-4 underline-offset-8">패들 {items.length}개</span>
                  </>
                ) : (
                  "공유받은 추천 패들"
                )}
              </h1>
              <p className="text-small text-on-hero-muted">공유한 사람의 답변은 담겨 있지 않습니다. 내 조건으로 받아 보려면 질문에 답해 주세요.</p>
            </div>
            {columns ? (
              <Button variant="heroSecondary" size="md" onClick={() => setCompareOpen(true)} className="shrink-0">
                비교하기
              </Button>
            ) : null}
          </header>
        </HeroMedia>

        {items.length > 0 ? (
          <ol className="flex flex-col gap-2 lg:grid lg:grid-cols-3 lg:gap-4" data-testid="shared-list">
            {items.map((paddle, i) => (
              <li key={paddle.id} className="animate-rise-in" style={{ animationDelay: `${i * 80}ms` }}>
                <ProductRow paddle={paddle} today={today} rank={i + 1} testId="shared-row" onOpen={() => setProductStack([paddle.id])} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-card border border-line bg-card p-5 text-body text-ink" data-testid="shared-empty">
            공유된 제품을 찾을 수 없습니다. 주소가 잘렸거나 지금은 목록에 없는 제품일 수 있습니다.
          </p>
        )}

        {shared.missing > 0 && items.length > 0 ? (
          <p className="text-small text-caution" data-testid="shared-missing">
            {shared.missing}개는 지금 목록에 없는 제품입니다.
          </p>
        ) : null}

        <div className="flex flex-col items-start gap-3">
          {/* 모바일은 전체 폭, 데스크톱은 넓은 본문에서 버튼이 띠처럼 늘어나지 않게 폭을 둔다 */}
          <div className="w-full lg:w-96">
            <StartButton label="나도 질문에 답하고 추천받기" />
          </div>
          <Link href="/browse" className="text-base font-semibold text-accent underline underline-offset-4">
            전체 둘러보기
          </Link>
        </div>

        <footer className="flex flex-col gap-1 text-xs leading-relaxed text-muted">
          <p>{NOTICE.spec}</p>
          {programs.size > 0 ? null : <p>{NOTICE.ranking}</p>}
          <p>{NOTICE.price}</p>
        </footer>

        {columns ? (
          <CompareSheet
            mode="picked"
            open={compareOpen}
            onClose={afterCompareClosed}
            columns={columns}
            today={today}
            onPick={(paddleId) => {
              pendingPick.current = paddleId;
              setCompareOpen(false);
            }}
          />
        ) : null}

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

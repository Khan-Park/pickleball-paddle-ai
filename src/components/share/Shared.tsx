"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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
 */
export function Shared({ paddles }: { paddles: PaddleDisplay[] }) {
  const params = useSearchParams();
  const today = useSyncExternalStore<string | null>(subscribe, readToday, () => null);
  const [productStack, setProductStack] = useState<string[]>([]);
  const byId = useMemo(() => new Map(paddles.map((p) => [p.id, p])), [paddles]);
  const shared = useMemo(() => parseSharedIds(params.get(SHARE_PARAM), new Set(byId.keys())), [params, byId]);

  if (!today) return <SharedSkeleton />;

  const items = shared.found.map((id) => byId.get(id)!);
  const programs = affiliatePrograms(items);
  const catalog: ProductCatalog = {
    paddles,
    // 비슷한 제품에서는 공유된 제품들을 뺀다(이미 화면에 있다)
    exclude: shared.found,
    today,
    openProduct: (id) => setProductStack((stack) => [...stack, id]),
  };

  return (
    <ProductCatalogContext.Provider value={catalog}>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-6 pb-8">
        {/* 제휴 링크가 있으면 제목보다 앞에서 먼저 알린다(D-022) */}
        <AffiliatePageNotice programs={programs} />

        <header className="flex flex-col gap-2">
          <h1 className="text-title font-bold text-navy">공유받은 추천 패들</h1>
          <p className="text-small text-muted">공유한 사람의 답변은 담겨 있지 않습니다. 내 조건으로 받아 보려면 질문에 답해 주세요.</p>
        </header>

        {items.length > 0 ? (
          <ol className="flex flex-col gap-2" data-testid="shared-list">
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
          <StartButton label="나도 질문에 답하고 추천받기" />
          <Link href="/browse" className="text-base font-semibold text-accent underline underline-offset-4">
            전체 둘러보기
          </Link>
        </div>

        <footer className="flex flex-col gap-1 text-xs leading-relaxed text-muted">
          <p>{NOTICE.spec}</p>
          {programs.size > 0 ? null : <p>{NOTICE.ranking}</p>}
          <p>{NOTICE.price}</p>
        </footer>

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

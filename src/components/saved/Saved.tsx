"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { PaddleDisplay } from "../../../data/schema";
import { loadSaved, removeSaved, SAVED_RETENTION_DAYS, writeSaved, type SavedEntry } from "@/lib/shared/saved";
import { ProductCatalogContext, type ProductCatalog } from "@/components/product/catalog";
import { ProductRow } from "@/components/product/ProductRow";
import { ProductSheet } from "@/components/product/ProductSheet";
import { AffiliatePageNotice, affiliatePrograms } from "@/components/result/AffiliatePageNotice";
import { NOTICE, todayLocal } from "@/components/result/labels";
import { StartButton } from "@/components/StartButton";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";

const subscribe = () => () => {};
const readToday = () => todayLocal();

/** "2026-11-18" → "2026년 11월 18일" */
export function savedDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

export const SAVED_NOTICE = {
  basis: "저장 당시 추천된 제품입니다. 가격·승인은 지금 기준입니다.",
  device: `이 기기 브라우저에만 저장되며, 브라우저 데이터를 지우면 사라집니다. 저장 후 ${SAVED_RETENTION_DAYS}일이 지나면 자동으로 지워집니다.`,
} as const;

/**
 * 저장한 추천(T-050, docs/plan/m2.5-redesign.md 5.1). 저장된 것은 제품 id·조건 칩 문구뿐이라
 * 제품은 지금 데이터로 공유받은 화면과 같은 모양으로 보여 준다. 적합도 라벨·점수·이유는 보여 주지 않는다(답을 저장하지 않음).
 */
export function Saved({ paddles }: { paddles: PaddleDisplay[] }) {
  const today = useSyncExternalStore<string | null>(subscribe, readToday, () => null);
  const [list, setList] = useState<SavedEntry[] | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [status, setStatus] = useState("");
  const [productStack, setProductStack] = useState<string[]>([]);
  const byId = useMemo(() => new Map(paddles.map((p) => [p.id, p])), [paddles]);

  useEffect(() => {
    if (!today || list !== null) return;
    // localStorage는 브라우저에서만 읽을 수 있어 화면이 준비된 뒤 한 번 불러온다(외부 저장소와 맞추는 일)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(loadSaved(today));
  }, [today, list]);

  if (!today || list === null) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-5 py-8" aria-busy="true">
        <p className="sr-only" role="status">
          저장한 추천을 불러오고 있습니다.
        </p>
        <CardSkeleton />
      </section>
    );
  }

  const update = (next: SavedEntry[], message: string) => {
    writeSaved(next);
    setList(next);
    setStatus(message);
  };

  const shown = list.flatMap((entry) => entry.paddle_ids.flatMap((id) => byId.get(id) ?? []));
  const programs = affiliatePrograms(shown);
  const catalog: ProductCatalog = {
    paddles,
    exclude: [],
    today,
    openProduct: (id) => setProductStack((stack) => [...stack, id]),
  };

  return (
    <ProductCatalogContext.Provider value={catalog}>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-6 pb-8">
        {/* 제휴 링크가 있으면 제목보다 앞에서 먼저 알린다(D-022) */}
        <AffiliatePageNotice programs={programs} />

        <header className="flex flex-col gap-2">
          <h1 className="text-title font-bold text-navy">저장한 추천</h1>
          <p className="text-small text-muted">{SAVED_NOTICE.basis}</p>
          <p className="text-small text-muted">{SAVED_NOTICE.device}</p>
        </header>

        {list.length === 0 ? (
          <p className="rounded-card border border-line bg-card p-5 text-body text-ink" data-testid="saved-empty">
            저장한 추천이 없습니다. 질문에 답한 뒤 결과 화면에서 &ldquo;결과 저장&rdquo;을 누르면 여기에 모입니다.
          </p>
        ) : (
          <ol className="flex flex-col gap-4" data-testid="saved-list">
            {list.map((entry) => {
              const items = entry.paddle_ids.flatMap((id) => byId.get(id) ?? []);
              const missing = entry.paddle_ids.length - items.length;
              const date = savedDateLabel(entry.saved_at);
              return (
                <li key={entry.id} className="flex flex-col gap-3 rounded-card border border-line bg-card p-4 shadow-card" data-testid="saved-entry">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="text-small font-bold text-ink">{date} 저장</p>
                      {entry.conditions.length > 0 ? (
                        <p className="flex flex-wrap gap-1.5" aria-label={`조건: ${entry.conditions.join(", ")}`}>
                          {entry.conditions.map((chip) => (
                            <span key={chip} aria-hidden="true" className="rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-bold text-accent-ink">
                              {chip}
                            </span>
                          ))}
                        </p>
                      ) : null}
                      {entry.relaxed ? <p className="text-caption font-bold text-caution">조건을 바꿔서 다시 찾은 결과</p> : null}
                    </div>
                    <Button
                      variant="text"
                      size="md"
                      aria-label={`${date} 저장 지우기`}
                      className="shrink-0 whitespace-nowrap"
                      onClick={() => update(removeSaved(list, entry.id), `${date} 저장을 지웠습니다`)}
                    >
                      지우기
                    </Button>
                  </div>
                  {items.length > 0 ? (
                    <ol className="flex flex-col gap-2">
                      {items.map((paddle, i) => (
                        <li key={paddle.id}>
                          <ProductRow paddle={paddle} today={today} rank={i + 1} testId="saved-row" onOpen={() => setProductStack([paddle.id])} />
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {missing > 0 ? (
                    <p className="text-small text-caution" data-testid="saved-missing">
                      지금은 목록에 없는 제품 {missing}개
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex flex-col items-start gap-3">
          <StartButton label="지금 조건으로 다시 받기" />
          <Link href="/browse" className="text-base font-semibold text-accent underline underline-offset-4">
            전체 둘러보기
          </Link>
        </div>

        {list.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4" data-testid="saved-clear">
            {confirmAll ? (
              <>
                <p className="text-small font-bold text-ink">저장한 추천 {list.length}건을 모두 지울까요?</p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setConfirmAll(false);
                    update([], "저장한 추천을 모두 지웠습니다");
                  }}
                >
                  모두 지우기
                </Button>
                <Button variant="text" size="md" onClick={() => setConfirmAll(false)}>
                  취소
                </Button>
              </>
            ) : (
              <Button variant="text" size="md" onClick={() => setConfirmAll(true)}>
                모두 지우기
              </Button>
            )}
          </div>
        ) : null}

        <p role="status" className="sr-only" data-testid="saved-status">
          {status}
        </p>

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

"use client";

import { useEffect, useState } from "react";
import type { PaddleDisplay } from "../../../data/schema";
import { AdBadge, PurchaseLink } from "./ResultCard";

/**
 * 하단 고정 구매 버튼(docs/plan/phase2.md 7.2). 1순위 카드의 구매 묶음(anchorId)이 화면 밖으로 나가면 화면 아래에 1순위 "판매처에서 보기"를 띄운다.
 * 같은 버튼이 두 번 보이지 않도록, 구매 묶음이 보이는 동안은 숨긴다.
 * 제휴 링크라면 PurchaseLink가 링크 바로 위에 대가 표시를 함께 그린다(D-022: 링크와 표시를 분리하지 않음).
 * 화면 크기 감지(IntersectionObserver)를 쓸 수 없는 환경에서는 띄우지 않는다(카드 안 버튼으로 충분).
 */
export function StickyBuy({ paddle, anchorId }: { paddle: PaddleDisplay; anchorId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById(anchorId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry!.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [anchorId]);

  if (!paddle.purchase || !show) return null;
  const name = `${paddle.brand} ${paddle.model}`;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card shadow-sheet animate-sheet-in"
      data-testid="sticky-buy"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-1 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* 바가 뜰 때 페이지 위 안내는 화면 밖이므로 제휴 링크면 여기에도 "광고"를 붙인다(T-033 A) */}
        <p className="flex min-w-0 items-center gap-1.5 text-caption text-muted">
          {paddle.purchase.is_affiliate ? <AdBadge className="shrink-0" /> : null}
          <span className="truncate">1순위 · {name}</span>
        </p>
        <PurchaseLink purchase={paddle.purchase} name={name} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { Shape } from "../../../data/schema";
import { ShapeIcon } from "@/components/ShapeIcon";
import { SHAPE_LABEL } from "@/lib/shared/shape-labels";
import { useReducedMotion } from "@/components/ui/useReducedMotion";

/** 띠에 보여 주는 값만. 가격·구매 링크·적합도는 받지 않는다(D-040) */
export type MarqueeItem = { id: string; brand: string; model: string; shape: Shape; weight_oz: number; core_mm: number };

function Item({ item }: { item: MarqueeItem }) {
  return (
    <li className="flex w-60 shrink-0 items-center gap-3 rounded-card border border-line bg-card px-3 py-3 shadow-card" data-testid="marquee-item">
      <ShapeIcon shape={item.shape} size="sm" className="shrink-0 text-navy" />
      <span className="min-w-0">
        <span className="block truncate text-caption text-muted">{item.brand}</span>
        <span className="block truncate text-small font-bold text-ink">{item.model}</span>
        <span className="mt-1 block text-caption text-muted">
          {SHAPE_LABEL[item.shape]} · {item.weight_oz}oz · {item.core_mm}mm
        </span>
      </span>
    </li>
  );
}

/**
 * 등록 제품 띠(D-040, T-043). 데이터 전체를 가격 낮은 순(둘러보기와 같은 정렬)으로 흘려보낸다. 순서는 수수료와 무관하다.
 * - 항목은 링크가 아니다. 제목 옆 "전체 둘러보기" 링크 하나로 연결한다(같은 링크 23개는 소음)
 * - 목록을 두 번 이어 붙여 왼쪽으로 민다(transform만). 복사본은 화면 낭독기에서 숨기고 포커스도 받지 않는다
 * - 멈춤 버튼, 마우스 올림·포커스 시 멈춤(WCAG 2.2.2). 동작 줄이기면 움직이지 않는 가로 목록(손으로 밀기)
 */
export function ProductMarquee({ items }: { items: readonly MarqueeItem[] }) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const titleId = "product-marquee-title";

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3" data-testid="product-marquee">
      <div className="flex items-center gap-2">
        <h2 id={titleId} className="text-heading font-bold text-navy">
          등록된 패들 {items.length}개
        </h2>
        {reducedMotion ? null : (
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className="inline-flex min-h-11 items-center rounded-control px-2 text-small font-bold text-muted outline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            {paused ? "다시 움직이기" : "멈추기"}
          </button>
        )}
        <Link
          href="/browse"
          className="ml-auto inline-flex min-h-11 items-center rounded-control px-2 text-small font-bold text-accent underline underline-offset-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          전체 둘러보기
        </Link>
      </div>
      <p className="-mt-2 text-caption text-muted">가격 낮은 순으로 보여 드립니다. 추천 순위가 아닙니다.</p>

      {reducedMotion ? (
        // 움직이지 않는 가로 목록. 손으로 밀어 넘긴다
        <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0" data-testid="marquee-static">
          {items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <div className="group -mx-5 overflow-hidden lg:mx-0" data-testid="marquee-viewport">
          <div
            data-paused={paused}
            className={`flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] ${
              paused ? "[animation-play-state:paused]" : ""
            }`}
            data-testid="marquee-track"
          >
            <ul className="flex gap-3 pr-3 pb-2">
              {items.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </ul>
            {/* 끊김 없이 돌게 하는 복사본. 읽히지도 포커스되지도 않는다 */}
            <ul aria-hidden="true" inert className="flex gap-3 pr-3 pb-2" data-testid="marquee-copy">
              {items.map((item) => (
                <Item key={`copy-${item.id}`} item={item} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

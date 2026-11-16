"use client";

import type { PaddleDisplay } from "../../../data/schema";
import { SHAPE_LABEL } from "@/lib/shared/shape-labels";
import { certShort } from "@/components/result/CompareSheet";
import { AdBadge } from "@/components/result/ResultCard";
import { won } from "@/components/result/labels";

/**
 * 제품 한 줄(둘러보기 T-026, 공유받은 화면 T-025). 2·3순위 행(RankRow)과 같은 모양이고, 누르면 "제품 자세히" 시트를 연다.
 * rank를 주면 앞에 순위 숫자를 보인다.
 */
export function ProductRow({
  paddle,
  today,
  onOpen,
  rank,
  testId = "product-row",
}: {
  paddle: PaddleDisplay;
  today: string;
  onOpen: () => void;
  rank?: number;
  testId?: string;
}) {
  const name = `${paddle.brand} ${paddle.model}`;
  const ad = paddle.purchase?.is_affiliate === true;
  const short = certShort(paddle.certification, today);
  const cert = short === "미확인" ? "승인 미확인" : short;
  const spec = `${SHAPE_LABEL[paddle.shape]} · ${paddle.weight_oz}oz · 코어 ${paddle.core_mm}mm`;
  const price = paddle.price_krw !== undefined ? `약 ${won(paddle.price_krw)}` : "가격 정보 없음";
  const label = [rank !== undefined ? `${rank}순위 ${name}` : name, ad ? "광고" : null, spec, price, cert.replace("✓ ", "")].filter(Boolean).join(", ");
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={testId}
      data-paddle-id={paddle.id}
      aria-label={`${label}. 자세히 보기`}
      className="flex min-h-16 w-full items-center gap-3 rounded-card border border-line bg-card px-4 py-3 text-left shadow-card outline-offset-2 transition-transform duration-[var(--duration-fast)] hover:border-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
    >
      {rank !== undefined ? (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-small font-bold text-navy">
          {rank}
        </span>
      ) : null}
      <span className="min-w-0 flex-1" aria-hidden="true">
        {/* "광고"는 말줄임 영역 밖, 이름 앞(D-022, T-033) */}
        <span className="flex min-w-0 items-center gap-1.5">
          {ad ? <AdBadge className="shrink-0" /> : null}
          <span className="truncate text-body font-bold text-ink">{name}</span>
        </span>
        <span className="mt-0.5 block text-small text-muted">{spec}</span>
        <span className="mt-0.5 block text-small text-ink">
          <span className="font-bold">{price}</span> · {cert}
        </span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-muted">
        ›
      </span>
    </button>
  );
}

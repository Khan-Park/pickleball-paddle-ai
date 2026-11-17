"use client";

import type { PaddleDisplay } from "../../../data/schema";
import type { Recommendation } from "@/lib/recommend/recommend";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { won } from "./labels";
import { AdBadge, ResultCard } from "./ResultCard";
import { certShort } from "@/lib/shared/cert";

/**
 * 2·3순위 한 줄 행(docs/plan/phase2.md 7.2). 누르면 바텀시트로 1순위와 같은 전체 정보를 펼친 상태로 보여 준다.
 * 제휴 링크가 있는 제품은 행에도 "광고"를 붙인다(D-022: 제목 근처 표시). 대가 표시 문구와 링크는 시트 안 카드에 함께 있다.
 */
export function RankRow({
  rank,
  item,
  paddle,
  today,
  open,
  onOpen,
  onClose,
}: {
  rank: number;
  item: Recommendation;
  paddle: PaddleDisplay;
  today: string;
  /** 열림 여부는 결과 화면이 정한다(비교표의 열 머리에서도 이 시트를 열 수 있게, T-020) */
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const name = `${paddle.brand} ${paddle.model}`;
  // 카드·비교표와 같은 기준(180일, 미래 날짜는 재확인 필요)
  // 행에서는 "미확인"만으로는 무엇을 모르는지 알기 어려워 "승인 미확인"으로 쓴다
  const short = certShort(paddle.certification, today);
  const cert = short === "미확인" ? "승인 미확인" : short;
  const price = paddle.price_krw !== undefined ? `약 ${won(paddle.price_krw)}` : null;
  const ad = paddle.purchase?.is_affiliate === true;
  const spoken = [`${rank}순위 ${name}`, ad ? "광고" : null, item.label, price, cert.replace("✓ ", "")].filter(Boolean).join(", ");
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${spoken}. 자세히 보기`}
        data-testid="rank-row"
        className="flex min-h-16 w-full items-center gap-3 rounded-card border border-line bg-card px-4 py-3 text-left shadow-card outline-offset-2 transition-transform duration-[var(--duration-fast)] hover:border-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-small font-bold text-navy">
          {rank}
        </span>
        <span className="min-w-0 flex-1" aria-hidden="true">
          {/* "광고"는 말줄임 영역 밖, 이름 앞에 둔다. 이름이 길어도 잘리지 않는다(D-022) */}
          <span className="flex min-w-0 items-center gap-1.5">
            {ad ? <AdBadge className="shrink-0" /> : null}
            <span className="truncate text-body font-bold text-ink" data-testid="rank-row-name">
              {name}
            </span>
          </span>
          <span className="mt-0.5 block text-small text-muted">
            <span className="font-bold text-accent">{item.label}</span>
            {price ? ` · ${price}` : ""}
            {` · ${cert}`}
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-muted">
          ›
        </span>
      </button>
      <BottomSheet open={open} onClose={onClose} title={`${rank}순위 자세히`}>
        <ResultCard rank={rank} item={item} paddle={paddle} today={today} mode="full" />
      </BottomSheet>
    </>
  );
}

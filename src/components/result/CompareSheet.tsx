"use client";

import type { Paddle, PaddleDisplay } from "../../../data/schema";
import type { Recommendation } from "@/lib/recommend/recommend";
import { isApprovedNow } from "@/lib/shared/browse";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SHAPE_LABEL, SURFACE_LABEL, won } from "./labels";

export type CompareColumn = { rank: number; item: Recommendation; paddle: PaddleDisplay };

/** 대회 승인을 짧게. 확인 배지(CertBadge)와 같은 기준(180일, 미래 날짜는 재확인 필요) */
export function certShort(certification: Paddle["certification"], today: string): string {
  if (certification.usa_pickleball === "approved") return isApprovedNow(certification, today) ? "✓ 승인" : "재확인 필요";
  return certification.usa_pickleball === "not_approved" ? "미승인" : "미확인";
}

type Row = { label: string; value: (c: CompareColumn, today: string) => string; text?: boolean };

/** 비교 줄(docs/tasks/T-020). 점수 숫자는 넣지 않는다(적합도는 라벨로) */
export const COMPARE_ROWS: Row[] = [
  { label: "적합도", value: (c) => c.item.label },
  { label: "무게", value: (c) => `${c.paddle.weight_oz}oz` },
  { label: "코어 두께", value: (c) => `${c.paddle.core_mm}mm` },
  { label: "형태", value: (c) => SHAPE_LABEL[c.paddle.shape] },
  { label: "길이 × 폭", value: (c) => `${c.paddle.length_in} × ${c.paddle.width_in}in` },
  { label: "표면", value: (c) => SURFACE_LABEL[c.paddle.surface] ?? "기타" },
  { label: "가격", value: (c) => (c.paddle.price_krw !== undefined ? won(c.paddle.price_krw) : "정보 없음") },
  { label: "대회 승인", value: (c, today) => certShort(c.paddle.certification, today) },
  { label: "핵심 이유", value: (c) => c.item.reasons[0] ?? "—", text: true },
];

/**
 * 추천 2~3개 비교표(docs/plan/phase2.md 4장). 좁은 화면에서 3열을 넓게 쓰려고 줄 이름을 각 줄 위에 한 줄로 둔다.
 * 표 의미는 ARIA(table·row·columnheader·rowheader·cell)로 지켜 화면 낭독기가 칸을 읽을 수 있게 한다.
 * 제품끼리 값이 다른 줄은 굵게, 모두 같은 줄은 흐리게 하고 "모두 같음"을 글자로 붙인다(색만으로 구분하지 않음).
 * 열 머리를 누르면 onPick(순위). 결과 화면이 이 시트를 닫은 뒤 그 제품의 상세를 연다(시트를 겹치지 않는다).
 */
export function CompareSheet({
  open,
  onClose,
  columns,
  today,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  columns: CompareColumn[];
  today: string;
  onPick: (rank: number) => void;
}) {
  const grid = columns.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <BottomSheet open={open} onClose={onClose} title={`추천 ${columns.length}개 비교`}>
      <div role="table" aria-label={`추천 ${columns.length}개 비교`} className="flex flex-col" data-testid="compare-table">
        <div role="row" className={`grid ${grid} gap-2 border-b border-line pb-3`}>
          {columns.map((c) => (
            <div role="columnheader" key={c.paddle.id}>
              <button
                type="button"
                onClick={() => onPick(c.rank)}
                className="flex w-full flex-col items-start gap-1 rounded-control p-1 text-left outline-offset-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
                aria-label={`${c.rank}순위 ${c.paddle.brand} ${c.paddle.model}${c.paddle.purchase?.is_affiliate ? ", 광고" : ""}. 자세히 보기`}
              >
                <span aria-hidden="true" className="flex items-center gap-1">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent text-caption font-bold text-white">{c.rank}</span>
                  {c.paddle.purchase?.is_affiliate ? (
                    <span className="rounded-control border border-ink px-1 text-caption font-bold text-ink" data-testid="compare-ad">
                      광고
                    </span>
                  ) : null}
                </span>
                <span aria-hidden="true" className="line-clamp-2 text-small font-bold text-navy">
                  {c.paddle.brand} {c.paddle.model}
                </span>
              </button>
            </div>
          ))}
        </div>

        {COMPARE_ROWS.map((row) => {
          const values = columns.map((c) => row.value(c, today));
          const same = new Set(values).size === 1;
          return (
            <div role="row" key={row.label} data-row={row.label} data-same={same} className={`grid ${grid} gap-x-2 gap-y-1 border-b border-line py-3`}>
              <div role="rowheader" className={`col-span-full flex items-baseline gap-2 text-caption ${same ? "text-muted" : "font-bold text-ink"}`}>
                {row.label}
                {same ? <span className="font-normal">· 모두 같음</span> : null}
              </div>
              {values.map((v, i) => (
                <div
                  role="cell"
                  key={columns[i]!.paddle.id}
                  className={`${row.text ? "text-caption" : "text-small"} ${same ? "text-muted" : "font-bold text-ink"} break-words`}
                >
                  {v}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p className="pt-3 text-caption text-muted">제품 이름을 누르면 자세한 정보와 구매 버튼을 볼 수 있습니다.</p>
    </BottomSheet>
  );
}

"use client";

import type { PaddleDisplay } from "../../../data/schema";
import type { Recommendation } from "@/lib/recommend/recommend";
import { certShort } from "@/lib/shared/cert";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SHAPE_LABEL, SURFACE_LABEL, won } from "@/components/result/labels";
import { formatWeight } from "@/lib/shared/weight";

/** 결과 화면의 추천 열: 순위·적합도·핵심 이유가 있다 */
export type RecommendedColumn = { rank: number; item: Recommendation; paddle: PaddleDisplay };
/** 둘러보기에서 담은 열(T-049): 스펙만 있다 */
export type PickedColumn = { paddle: PaddleDisplay };

/** 비교는 2개 또는 3개만(T-047). 1개·4개는 타입 오류다 */
export type CompareColumns<T> = readonly [T, T] | readonly [T, T, T];

/** 배열을 비교 열로 바꾼다. 2~3개가 아니면 null(비교하기를 보여 주지 않는다) */
export function toCompareColumns<T>(list: readonly T[]): CompareColumns<T> | null {
  return list.length === 2 || list.length === 3 ? (list as unknown as CompareColumns<T>) : null;
}

type Row<C> = { label: string; value: (c: C, today: string) => string; text?: boolean };

/** 두 쓰임이 같이 쓰는 스펙 7줄. 점수 숫자는 넣지 않는다. 구매 링크 주소는 읽지 않는다 */
export const SPEC_ROWS: Row<{ paddle: PaddleDisplay }>[] = [
  { label: "무게", value: (c) => formatWeight(c.paddle.weight_oz) },
  { label: "코어 두께", value: (c) => `${c.paddle.core_mm}mm` },
  { label: "형태", value: (c) => SHAPE_LABEL[c.paddle.shape] },
  { label: "길이 × 폭", value: (c) => `${c.paddle.length_in} × ${c.paddle.width_in}in` },
  { label: "표면", value: (c) => SURFACE_LABEL[c.paddle.surface] ?? "기타" },
  { label: "가격", value: (c) => (c.paddle.price_krw !== undefined ? won(c.paddle.price_krw) : "정보 없음") },
  { label: "대회 승인", value: (c, today) => certShort(c.paddle.certification, today) },
];

/** 추천 비교 9줄(docs/tasks/T-020): 적합도(라벨) + 스펙 7줄 + 핵심 이유 */
export const RECOMMENDED_ROWS: Row<RecommendedColumn>[] = [
  { label: "적합도", value: (c) => c.item.label },
  ...SPEC_ROWS,
  { label: "핵심 이유", value: (c) => c.item.reasons[0] ?? "—", text: true },
];

type TableProps = {
  today: string;
  /** 열 머리를 누르면 그 제품 id. 부르는 쪽이 이 시트를 닫은 뒤 상세를 연다(시트를 겹치지 않는다) */
  onPick: (paddleId: string) => void;
};

export type CompareTableProps = TableProps &
  ({ mode: "recommended"; columns: CompareColumns<RecommendedColumn> } | { mode: "picked"; columns: CompareColumns<PickedColumn> });

export type CompareSheetProps = CompareTableProps & { open: boolean; onClose: () => void };

/** 표 그리기용으로 맞춘 열 */
type Col = { paddle: PaddleDisplay; rank?: number; values: string[] };

/**
 * 비교표 시트(T-020 → T-047 공용). 결과 화면(추천)과 둘러보기(담은 제품)가 같이 쓴다. 두 쓰임을 한 표에 섞지 않는다.
 * 좁은 화면에서 3열을 넓게 쓰려고 줄 이름을 각 줄 위에 한 줄로 둔다. 표 의미는 ARIA(table·row·columnheader·rowheader·cell)로 지킨다.
 * 제품끼리 값이 다른 줄은 굵게, 모두 같은 줄은 흐리게 하고 "모두 같음"을 글자로 붙인다(색만으로 구분하지 않음).
 * 제휴 링크가 있는 제품은 열 머리에 "광고"를 붙인다(대가 표시, 핵심 규칙 3).
 */
export function CompareSheet({ open, onClose, ...table }: CompareSheetProps) {
  // 실행 중에 개수가 잘못 들어와도(타입을 우회한 경우) 표를 그리지 않는다
  if (table.columns.length !== 2 && table.columns.length !== 3) return null;
  return (
    <BottomSheet open={open} onClose={onClose} title={compareTitle(table)}>
      <CompareTable {...table} />
    </BottomSheet>
  );
}

function compareTitle(props: CompareTableProps): string {
  return props.mode === "recommended" ? `추천 ${props.columns.length}개 비교` : `담은 ${props.columns.length}개 비교`;
}

/**
 * 비교 표만(T-046). 시트 안(모바일·둘러보기)과 결과 화면 데스크톱 카드 아래(펼쳐 둔 표)가 같이 쓴다.
 * 2~3열이 아니면 그리지 않는다.
 */
export function CompareTable(props: CompareTableProps) {
  const { today, onPick } = props;
  if (props.columns.length !== 2 && props.columns.length !== 3) return null;

  const rows: { label: string; text?: boolean }[] = props.mode === "recommended" ? RECOMMENDED_ROWS : SPEC_ROWS;
  const cols: Col[] =
    props.mode === "recommended"
      ? props.columns.map((c) => ({ paddle: c.paddle, rank: c.rank, values: RECOMMENDED_ROWS.map((r) => r.value(c, today)) }))
      : props.columns.map((c) => ({ paddle: c.paddle, values: SPEC_ROWS.map((r) => r.value(c, today)) }));
  const title = compareTitle(props);
  const grid = cols.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <>
      <div role="table" aria-label={title} className="flex flex-col" data-testid="compare-table" data-mode={props.mode}>
        <div role="row" className={`grid ${grid} gap-2 border-b border-line pb-3`}>
          {cols.map((c) => {
            const ad = c.paddle.purchase?.is_affiliate ? ", 광고" : "";
            const name = `${c.paddle.brand} ${c.paddle.model}`;
            return (
              <div role="columnheader" key={c.paddle.id}>
                <button
                  type="button"
                  onClick={() => onPick(c.paddle.id)}
                  className="flex w-full flex-col items-start gap-1 rounded-control p-1 text-left outline-offset-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
                  aria-label={`${c.rank !== undefined ? `${c.rank}순위 ` : ""}${name}${ad}. 자세히 보기`}
                >
                  <span aria-hidden="true" className="flex items-center gap-1">
                    {c.rank !== undefined ? (
                      <span className="flex size-6 items-center justify-center rounded-full bg-accent text-caption font-bold text-on-accent">{c.rank}</span>
                    ) : null}
                    {c.paddle.purchase?.is_affiliate ? (
                      <span className="rounded-control border border-ink px-1 text-caption font-bold text-ink" data-testid="compare-ad">
                        광고
                      </span>
                    ) : null}
                  </span>
                  <span aria-hidden="true" className="line-clamp-2 text-small font-bold text-navy">
                    {name}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {rows.map((row, r) => {
          const values = cols.map((c) => c.values[r]!);
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
                  key={cols[i]!.paddle.id}
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
    </>
  );
}

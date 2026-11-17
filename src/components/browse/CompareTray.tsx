"use client";

import type { PaddleDisplay } from "../../../data/schema";
import { TRAY_MAX } from "@/lib/shared/compare-tray";
import { ShapeIcon } from "@/components/ShapeIcon";
import { Button } from "@/components/ui/Button";

/**
 * 둘러보기 비교함(T-049). 1개 이상 담으면 화면 아래에 고정한다. "비교하기"는 2개 이상일 때만.
 * 모바일·데스크톱 같은 띠이고 폭은 본문과 같다(최대 72rem). 목록이 가려지지 않게 Browse가 아래 여백을 둔다.
 */
export function CompareTray({ items, onCompare, onClear }: { items: readonly PaddleDisplay[]; onCompare: () => void; onClear: () => void }) {
  if (items.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card shadow-sheet" data-testid="compare-tray">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-2 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:max-w-6xl lg:flex-row lg:items-center lg:gap-4 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-small font-bold text-ink" data-testid="compare-tray-count">
            담은 패들 {items.length}/{TRAY_MAX}
          </p>
          <ul className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
            {items.map((p) => (
              <li key={p.id} className="flex min-w-0 items-center gap-1 text-caption text-muted">
                <ShapeIcon shape={p.shape} size="sm" className="shrink-0 text-navy" />
                <span className="truncate">
                  {p.brand} {p.model}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="text" size="md" onClick={onClear}>
            비우기
          </Button>
          {items.length >= 2 ? (
            <Button size="md" onClick={onCompare} className="flex-1 lg:flex-none">
              비교하기
            </Button>
          ) : (
            <p className="text-caption text-muted">1개 더 담으면 비교할 수 있어요</p>
          )}
        </div>
      </div>
    </div>
  );
}

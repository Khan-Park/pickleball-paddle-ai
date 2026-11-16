"use client";

import { useEffect, useRef } from "react";
import type { PaddleDisplay } from "../../../data/schema";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ProductDetail } from "./ProductDetail";

/**
 * "제품 자세히" 시트(T-024). 연 제품들의 기록(stack)을 부모가 갖고, 맨 뒤 제품을 보여 준다.
 * 시트 안에서 비슷한 제품을 다시 누르면 새 시트를 겹치지 않고 기록에 더해 내용만 바꾼다. "← 이전 제품"으로 되돌아간다.
 * 내용이 바뀌면 제품 이름으로 포커스를 옮겨 화면 낭독기가 새 제품을 읽게 한다.
 */
export function ProductSheet({
  stack,
  byId,
  today,
  onBack,
  onClose,
}: {
  stack: readonly string[];
  byId: ReadonlyMap<string, PaddleDisplay>;
  today: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const currentId = stack.at(-1);
  const paddle = currentId ? byId.get(currentId) : undefined;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const depth = stack.length;
  const previousDepth = useRef(0);

  useEffect(() => {
    // 처음 열 때는 시트가 포커스를 맡는다. 이미 열린 시트에서 내용이 바뀔 때만 제품 이름으로 옮긴다
    if (previousDepth.current > 0 && depth > 0) headingRef.current?.focus();
    previousDepth.current = depth;
  }, [depth, currentId]);

  return (
    <BottomSheet open={paddle !== undefined} onClose={onClose} title="제품 자세히">
      {paddle ? (
        <div className="flex flex-col gap-3">
          {depth > 1 ? (
            <Button variant="text" size="md" onClick={onBack} className="-ml-2 self-start">
              ← 이전 제품
            </Button>
          ) : null}
          <ProductDetail key={paddle.id} paddle={paddle} today={today} headingRef={headingRef} />
        </div>
      ) : null}
    </BottomSheet>
  );
}

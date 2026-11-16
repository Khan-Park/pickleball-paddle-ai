"use client";

import { useEffect, useState } from "react";
import { SHAPES } from "../../../data/schema";
import { ShapeIcon } from "@/components/ShapeIcon";
import { SHAPE_LABEL } from "@/lib/shared/shape-labels";
import { useReducedMotion } from "@/components/ui/useReducedMotion";

/** 시작 화면에서 보여 주는 순서(표준 → 넓은 → 하이브리드 → 길쭉한) */
const ORDER = ["standard", "widebody", "hybrid", "elongated"] as const satisfies readonly (typeof SHAPES)[number][];

/** 강조가 다음 형태로 넘어가는 간격(docs/plan/phase2.md 5.1-a) */
export const SHOWCASE_INTERVAL_MS = 2000;

/**
 * 형태 4가지 그림. 2초마다 하나씩 강조한다(테두리와 이름 굵게). 동작 줄이기면 강조를 멈추고 첫 그림만 강조한 채 둔다.
 * 그림은 장식이라 화면 낭독기에는 숨기고 한 문장으로만 알린다.
 */
export function ShapeShowcase() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % ORDER.length), SHOWCASE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const current = reducedMotion ? 0 : active;
  return (
    <div data-testid="shape-showcase">
      <p className="sr-only">패들 형태 4가지를 비교해 추천합니다.</p>
      <ul aria-hidden="true" className="grid grid-cols-4 gap-2">
        {ORDER.map((shape, i) => {
          const on = i === current;
          return (
            <li
              key={shape}
              data-active={on}
              className={`flex flex-col items-center gap-2 rounded-card border px-1 py-3 transition-colors duration-[var(--duration-base)] ${
                on ? "border-accent bg-accent-soft" : "border-line bg-card"
              }`}
            >
              <ShapeIcon shape={shape} size="lg" className={on ? "text-accent" : "text-navy"} />
              <span className={`text-caption ${on ? "font-bold text-accent-ink" : "text-muted"}`}>{SHAPE_LABEL[shape]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

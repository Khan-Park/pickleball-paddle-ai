"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { STEP_MS, type AnalyzeMode } from "./analyzing-flag";

/** 패들이 공을 치는 단순한 선 그림. 직접 그린 장식이라 화면 낭독기에는 숨긴다 */
function PaddleSwing() {
  return (
    // 시작 화면·질문 화면의 형태 그림(ShapeIcon)과 같은 선 두께 비율·모서리로 그린다(T-023)
    <svg viewBox="0 0 160 128" width="160" height="128" aria-hidden="true" focusable="false" className="text-navy">
      <g className="origin-[58px_112px] animate-paddle-swing">
        <rect x="38" y="16" width="40" height="58" rx="13" fill="none" stroke="currentColor" strokeWidth="5" />
        <rect x="52" y="74" width="12" height="38" rx="3" fill="currentColor" />
      </g>
      <circle cx="122" cy="52" r="10" className="animate-ball-bounce fill-accent-bright" />
      <circle cx="122" cy="52" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-ball-bounce" />
    </svg>
  );
}

/**
 * 분석 중 화면(docs/plan/phase2.md 5.3). 단계 문구 3개를 차례로 체크한 뒤 onDone을 부른다.
 * 화면 아무 곳이나 누르거나 "건너뛰기"를 누르면 바로 onDone. 실제 계산은 이미 끝나 있다(일부러 보여 주는 연출, D-028).
 */
export function Analyzing({ count, mode, onDone }: { count: number; mode: AnalyzeMode; onDone: () => void }) {
  const steps = ["조건 확인", `${count}개 패들 스펙 비교`, "추천 정리"];
  const [done, setDone] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const ms = STEP_MS[mode];
    const timers = steps.map((_, i) => setTimeout(() => setDone(i + 1), ms * (i + 1)));
    // 마지막 체크가 보인 뒤 잠깐 두고 결과로
    timers.push(setTimeout(() => onDoneRef.current(), ms * steps.length + ms / 2));
    return () => timers.forEach(clearTimeout);
    // 단계 수는 고정(3)이라 mode만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <section
      className="mx-auto flex w-full max-w-xl flex-1 cursor-pointer flex-col items-center justify-center gap-8 px-5 py-16"
      onClick={() => onDoneRef.current()}
      data-testid="analyzing"
    >
      <PaddleSwing />
      <ol className="flex w-full max-w-64 flex-col gap-3" role="status" aria-live="polite">
        {steps.map((label, i) => {
          const state = i < done ? "done" : i === done ? "active" : "waiting";
          return (
            <li key={label} data-state={state} className={`flex items-center gap-3 text-body ${state === "waiting" ? "text-muted" : "text-ink"}`}>
              <span
                aria-hidden="true"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-small font-bold transition-colors duration-[var(--duration-fast)] ${
                  state === "done" ? "border-accent bg-accent text-white" : state === "active" ? "border-accent text-accent" : "border-line text-transparent"
                }`}
              >
                {state === "done" ? "✓" : "•"}
              </span>
              <span className={state === "active" ? "font-bold" : ""}>
                {label}
                {state === "done" ? <span className="sr-only"> 완료</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <Button variant="text" onClick={() => onDoneRef.current()}>
        건너뛰기 →
      </Button>
    </section>
  );
}

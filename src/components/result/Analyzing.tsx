"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShapeIcon } from "@/components/ShapeIcon";
import { BallIcon } from "@/components/BallIcon";
import { analyzeTotalMs, STEP_MS, type AnalyzeMode } from "./analyzing-flag";

/**
 * 패들이 공을 치는 그림. 질문·홈과 같은 패들 그림(ShapeIcon, T-041)과 공 그림(BallIcon)을 움직인다(T-051).
 * 장식이라 화면 낭독기에는 숨긴다(두 그림 부품이 aria-hidden)
 */
function PaddleSwing() {
  return (
    <div className="flex h-32 w-40 items-end justify-center gap-6 text-navy" data-testid="analyzing-art">
      {/* 손잡이 끝을 축으로 흔든다 */}
      <div className="origin-bottom animate-paddle-swing">
        <ShapeIcon shape="standard" size="lg" />
      </div>
      <div className="mb-14 animate-ball-bounce">
        <BallIcon size="md" />
      </div>
    </div>
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
    timers.push(setTimeout(() => onDoneRef.current(), analyzeTotalMs(mode)));
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
                  state === "done" ? "border-accent bg-accent text-on-accent" : state === "active" ? "border-accent text-accent" : "border-line text-transparent"
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

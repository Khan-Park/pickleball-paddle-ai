"use client";

import { useState } from "react";
import Link from "next/link";
import { saveResult, type SavedInput } from "@/lib/shared/saved";
import { showToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

type State = { kind: "idle" } | { kind: "saved"; message: string } | { kind: "unavailable" };

const UNAVAILABLE = "이 브라우저에서는 저장할 수 없습니다";

/**
 * 결과 화면의 "결과 저장"(T-050, docs/plan/m2.5-redesign.md 5.1). 이 기기 브라우저에만 저장한다.
 * 저장하면 짧은 안내와 함께 저장 화면 링크를 보이고, 저장소를 못 쓰면 그 사실을 알린다(화면은 계속 동작).
 * 보여 주는 추천이 바뀌면(조건 완화) 부모가 key를 바꿔 이 상태를 처음으로 돌린다.
 */
export function SaveResultButton({ input, today }: { input: SavedInput; today: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const message = state.kind === "saved" ? state.message : state.kind === "unavailable" ? UNAVAILABLE : "";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="save-result">
      <Button
        variant="secondary"
        size="md"
        onClick={() => {
          const saved = saveResult(input, today);
          if (saved.status === "unavailable") {
            setState({ kind: "unavailable" });
            return;
          }
          const text = saved.evicted > 0 ? "결과를 저장했습니다. 가장 오래된 저장 1건을 지웠습니다" : "결과를 저장했습니다";
          showToast(text);
          setState({ kind: "saved", message: text });
        }}
      >
        결과 저장
      </Button>
      {state.kind === "saved" ? (
        <Link href="/saved" className="text-base font-semibold text-accent underline underline-offset-4" data-testid="saved-link">
          저장한 결과 보기
        </Link>
      ) : null}
      {state.kind === "unavailable" ? (
        <p className="text-small text-caution" aria-hidden="true">
          {UNAVAILABLE}
        </p>
      ) : null}
      {/* 안내를 화면 낭독기에도 알린다 */}
      <p role="status" className="sr-only" data-testid="save-result-status">
        {message}
      </p>
    </div>
  );
}

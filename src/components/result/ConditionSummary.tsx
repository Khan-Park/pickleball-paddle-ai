"use client";

import { useState } from "react";
import type { QuizAnswers } from "@/lib/quiz/questions";
import type { UserProfile } from "@/lib/recommend/profile";
import { criteriaLines } from "@/lib/recommend/criteria";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { buttonClass } from "@/components/ui/Button";
import { ConditionChips } from "./parts";

/**
 * 가로 조건 요약 줄(D-037, T-045). 답변 칩 + "고치기"(질문으로) + "추천 기준 보기"(시트).
 * 시트는 답변이 어떤 스펙 기준이 됐는지 한 줄씩 보여 준다(criteria.ts). 팔 불편 답은 칩·시트 모두에 없다.
 */
export function ConditionSummary({ answers, profile }: { answers: QuizAnswers | null; profile: UserProfile }) {
  const [open, setOpen] = useState(false);
  const lines = criteriaLines(profile);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border border-line bg-card px-4 py-3" data-testid="condition-summary">
      {answers ? <ConditionChips answers={answers} /> : <span className="text-small text-muted">내 조건</span>}
      <button type="button" onClick={() => setOpen(true)} className={buttonClass({ variant: "text", size: "md", className: "shrink-0" })}>
        추천 기준 보기
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="추천에 반영한 조건">
        <ul className="flex flex-col divide-y divide-line" data-testid="criteria-list">
          {lines.map((line) => (
            <li key={line.condition} className="flex flex-col gap-1 py-3">
              <span className="text-small font-bold text-ink">{line.condition}</span>
              <span className="text-small text-muted">{line.rule}</span>
            </li>
          ))}
        </ul>
        <p className="pt-3 text-caption text-muted">
          조건들을 함께 따져 맞는 정도를 정합니다. 구매 링크나 수수료는 반영하지 않습니다. 기준은 일반적으로 알려진 설명에서 가져온 것이라 실제 타구감과 다를 수 있습니다.
        </p>
      </BottomSheet>
    </div>
  );
}

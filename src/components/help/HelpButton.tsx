"use client";

import { useState } from "react";
import { GLOSSARY, GLOSSARY_TERMS, type GlossaryTerm } from "@/lib/shared/glossary";
import { BottomSheet } from "@/components/ui/BottomSheet";

/** 도움말 시트 안의 내용. 아래 "다른 용어" 줄로 같은 시트 안에서 용어를 바꾼다 */
export function GlossaryContent({ term, onChange }: { term: GlossaryTerm; onChange: (term: GlossaryTerm) => void }) {
  const entry = GLOSSARY[term];
  return (
    <div className="flex flex-col gap-4" data-testid="glossary" data-term={term}>
      <p className="text-body font-bold text-ink">{entry.summary}</p>
      {entry.body.map((line) => (
        <p key={line} className="text-small text-ink">
          {line}
        </p>
      ))}
      {entry.note ? <p className="text-caption text-muted">{entry.note}</p> : null}
      <div className="border-t border-line pt-3">
        <p className="text-caption text-muted">다른 용어</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GLOSSARY_TERMS.filter((t) => t !== term).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className="min-h-11 rounded-full border border-line px-3 text-small font-bold text-ink outline-offset-2 hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              {GLOSSARY[t].title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 용어 옆 ⓘ 버튼(T-021). 누르면 바텀시트에 그 용어 설명을 연다.
 * label을 주면 "ⓘ 무게란?"처럼 글자를 함께 보이고 이름은 "무게란? 설명 보기", 주지 않으면 ⓘ만 보이고 이름은 "무게 설명 보기".
 */
export function HelpButton({ term, label, className = "" }: { term: GlossaryTerm; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<GlossaryTerm>(term);
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          // 선택지나 카드 안에 있어도 그 동작(답 선택 등)으로 번지지 않게 한다
          event.stopPropagation();
          setCurrent(term);
          setOpen(true);
        }}
        // 글자가 보이면 이름도 그 글자로 시작한다(WCAG 2.5.3 보이는 이름 포함). 음성으로 "무게란?"이라고 불러도 눌린다
        aria-label={`${label ?? GLOSSARY[term].title} 설명 보기`}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-small font-bold text-accent outline-offset-2 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent ${className}`.trim()}
      >
        <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full border border-accent text-caption">
          i
        </span>
        {label ? <span aria-hidden="true">{label}</span> : null}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={GLOSSARY[current].title}>
        <GlossaryContent term={current} onChange={setCurrent} />
      </BottomSheet>
    </>
  );
}

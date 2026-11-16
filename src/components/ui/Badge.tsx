import type { ReactNode } from "react";

export type BadgeTone = "confirm" | "caution" | "neutral" | "ad";

const TONE: Record<BadgeTone, string> = {
  confirm: "bg-confirm-soft text-confirm",
  caution: "bg-caution-soft text-caution",
  neutral: "bg-surface text-muted border border-line",
  // 광고 표시는 본문과 구분되게 굵고 테두리가 있다(D-022)
  ad: "bg-card text-ink border border-ink",
};

/** 상태마다 기본 아이콘. 색만으로 구분하지 않도록 늘 글자 앞에 둔다(확인 초록과 강조 청록이 비슷하다) */
const ICON: Record<BadgeTone, string> = {
  confirm: "✓",
  caution: "⚠",
  neutral: "",
  ad: "",
};

/**
 * 작은 상태 표시. 대회 승인(확인·재확인 필요), 주의, 광고 등에 쓴다.
 * icon을 주지 않으면 tone의 기본 아이콘을 쓴다. 아이콘은 장식이라 화면 낭독기에는 숨기고 글자만 읽힌다.
 */
export function Badge({ tone, icon, children, className = "" }: { tone: BadgeTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  const mark = icon ?? ICON[tone];
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-caption font-bold ${TONE[tone]} ${className}`.trim()}
    >
      {mark ? <span aria-hidden="true">{mark}</span> : null}
      <span>{children}</span>
    </span>
  );
}

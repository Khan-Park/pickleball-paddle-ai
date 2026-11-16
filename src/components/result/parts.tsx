import Link from "next/link";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { visibleQuestions } from "@/lib/quiz/questions";
import type { MatchLabel } from "@/lib/recommend/recommend";
import { SHAPE_LABEL } from "./labels";
import { HelpButton } from "@/components/help/HelpButton";
import type { GlossaryTerm } from "@/lib/shared/glossary";

/**
 * 적합도 막대. 엔진 점수(0~100)를 막대 길이로 보여 주고 숫자는 보여 주지 않는다(점수 숫자는 화면에 내지 않는 원칙).
 * 막대는 장식이라 화면 낭독기에는 숨기고, 뜻은 옆의 라벨 글자가 전한다.
 */
export function FitBar({ score, label }: { score: number; label: MatchLabel }) {
  const width = Math.max(4, Math.min(100, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        {/* 0에서 채워지는 연출은 폭이 아니라 scaleX로(레이아웃을 다시 계산하지 않게, T-037) */}
        <div className="h-2 origin-left animate-bar-fill rounded-full bg-accent" style={{ width: `${width}%` }} data-testid="fit-bar" />
      </div>
      <span className="shrink-0 text-small font-bold text-accent">{label}</span>
    </div>
  );
}

/**
 * 스펙 하나를 범위 위의 점으로 보여 준다(예: 무게 가벼움 ↔ 묵직함). 값 숫자를 함께 적어 색·위치만으로 뜻을 전하지 않는다.
 * 범위 밖 값은 양 끝에 붙인다.
 */
export function SpecScale({
  label,
  value,
  unit,
  min,
  max,
  left,
  right,
  help,
}: {
  help?: GlossaryTerm;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  left: string;
  right: string;
}) {
  const position = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="flex flex-col gap-1.5" data-testid="spec-scale">
      <div className="flex items-baseline justify-between text-small">
        <span className="flex items-center text-muted">
          {label}
          {help ? <HelpButton term={help} className="-my-3" /> : null}
        </span>
        <span className="font-bold text-ink">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-line" aria-hidden="true">
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-accent"
          style={{ left: `${position}%` }}
          data-position={Math.round(position)}
        />
      </div>
      <div className="flex justify-between text-caption text-muted" aria-hidden="true">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <span className="sr-only">
        {label} {value}
        {unit}, {left}부터 {right}까지의 범위에서 {position < 34 ? left : position > 66 ? right : "가운데"} 쪽
      </span>
    </div>
  );
}

const EXPERIENCE: Record<string, string> = { under_1y: "입문(1년 미만)", "1_to_3y": "1~3년", over_3y: "3년 이상" };
const STYLE: Record<string, string> = { control: "컨트롤", balanced: "균형", power: "파워", unsure: "성향 미정" };
const WEIGHT: Record<string, string> = { light: "가벼운 무게", medium: "중간 무게", heavy: "묵직한 무게" };
const BUDGET: Record<string, string> = { under_100k: "10만 원 이하", "100k_to_200k": "10~20만 원", "200k_to_300k": "20~30만 원" };

/**
 * 결과 화면 위의 "내 조건" 칩. 누르면 질문 화면으로 가서 답을 고칠 수 있다.
 * 팔 불편 답은 넣지 않는다(건강 관련 정보라 화면 캡처·공유로 새지 않게. 팔 불편 안내 문구는 결과 화면에 따로 있다).
 * "상관없어요" 같은 조건 없는 답은 칩을 만들지 않는다.
 */
export function conditionChips(answers: QuizAnswers): string[] {
  const chips: string[] = [];
  if (answers.experience && EXPERIENCE[answers.experience]) chips.push(EXPERIENCE[answers.experience]!);
  if (answers.play_style && STYLE[answers.play_style]) chips.push(STYLE[answers.play_style]!);
  if (answers.weight && WEIGHT[answers.weight]) chips.push(WEIGHT[answers.weight]!);
  // 선호 모양은 그 질문이 보였을 때만(초보는 묻지 않는다)
  if (visibleQuestions(answers).some((q) => q.id === "shapes")) {
    for (const s of answers.shapes ?? []) if (s in SHAPE_LABEL) chips.push(SHAPE_LABEL[s]);
  }
  if (answers.budget && BUDGET[answers.budget]) chips.push(BUDGET[answers.budget]!);
  if (answers.tournament === "yes") chips.push("대회용");
  return chips;
}

export function ConditionChips({ answers }: { answers: QuizAnswers }) {
  const chips = conditionChips(answers);
  if (chips.length === 0) return null;
  return (
    <Link
      href="/quiz"
      className="flex flex-wrap items-center gap-1.5 rounded-card outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
      aria-label={`내 조건: ${chips.join(", ")}. 답변 고치기`}
    >
      <span className="text-small text-muted" aria-hidden="true">
        내 조건
      </span>
      {chips.map((chip) => (
        <span key={chip} aria-hidden="true" className="rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-bold text-accent-ink">
          {chip}
        </span>
      ))}
      <span className="text-caption text-muted underline underline-offset-2" aria-hidden="true">
        고치기
      </span>
    </Link>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { answersToProfile } from "@/lib/quiz/answers";
import { visibleQuestions, type QuizAnswers, type QuizQuestion, type ShapeValue } from "@/lib/quiz/questions";
import { clearAnswers, loadAnswersRaw, parseAnswers, saveAnswers } from "@/lib/quiz/storage";
import { ShapeIcon } from "@/components/ShapeIcon";
import { Button } from "@/components/ui/Button";
import { markSubmitted } from "@/components/result/analyzing-flag";
import { useReducedMotion } from "@/components/ui/useReducedMotion";

const subscribe = () => () => {};

/** 선택지를 누른 뒤 선택 표시를 보여 주고 다음 질문으로 넘어가기까지의 시간(docs/plan/phase2.md 6.2) */
export const SELECT_DELAY_MS = 150;

type Direction = "forward" | "back";

/** 질문 화면. 한 번에 질문 하나를 보여 주고, 다 답하면 답변을 저장한 뒤 결과 화면으로 간다 */
export function Quiz() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  // 전에 답한 내용이 이 탭에 남아 있으면 이어서 보여 준다(결과 화면에서 돌아와 한 가지만 바꿀 수 있게).
  // 미리 그리는 단계(서버)에서는 저장소를 읽지 않는다
  const savedRaw = useSyncExternalStore<string | null | undefined>(subscribe, loadAnswersRaw, () => undefined);
  const saved = useMemo(() => parseAnswers(savedRaw ?? null), [savedRaw]);
  const [edited, setEdited] = useState<QuizAnswers | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("forward");
  const [error, setError] = useState<string | null>(null);

  const answers: QuizAnswers = edited ?? saved ?? {};
  const questions = visibleQuestions(answers);
  // 사용자가 아직 움직이지 않았으면 답하지 않은 첫 질문(다 답했으면 마지막 질문)을 보여 준다
  const firstOpen = questions.findIndex((q) => answers[q.id] === undefined);
  const index = Math.min(step ?? (firstOpen === -1 ? questions.length - 1 : firstOpen), questions.length - 1);
  const question = questions[index]!;

  // 질문이 바뀌면 새 질문 제목으로 포커스를 옮긴다. 눌렀던 버튼이 사라져도 키보드·화면 낭독기 사용자가 길을 잃지 않는다.
  // 화면을 처음 열었을 때는 포커스를 가져가지 않는다
  const legendRef = useRef<HTMLLegendElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) legendRef.current?.focus();
  }, [question.id]);

  // 선택 후 다음 질문으로 넘어가기를 기다리는 중이면 타이머가 있다. 그동안 들어온 선택은 무시한다(연타로 두 번 넘어가지 않게)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPending = () => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
  };
  // 화면을 떠나면 기다리던 이동을 취소한다
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  function goTo(nextStep: number) {
    cancelPending();
    moved.current = true;
    setDirection(nextStep < index ? "back" : "forward");
    setStep(nextStep);
  }

  function advance(next: QuizAnswers, from: QuizQuestion) {
    // "다음" 버튼 등으로 먼저 넘어가면 기다리던 이동은 취소한다(두 번 넘어가거나 결과로 두 번 가지 않게)
    cancelPending();
    setEdited(next);
    const list = visibleQuestions(next);
    const at = list.findIndex((q) => q.id === from.id);
    if (at + 1 < list.length) {
      goTo(at + 1);
      return;
    }
    const result = answersToProfile(next);
    if (!result.success) {
      // 정상 흐름에서는 일어나지 않는다(저장된 답이 손상된 경우 등). 문제가 된 첫 질문으로 돌려보낸다
      const invalid = "invalid" in result ? result.invalid : [];
      const target = "missing" in result ? (result.missing[0] ?? invalid[0]) : undefined;
      goTo(Math.max(0, list.findIndex((q) => q.id === target)));
      setError(invalid.length > 0 ? "저장된 답 중에 읽을 수 없는 값이 있습니다. 이 질문을 다시 골라 주세요." : "답하지 않은 질문이 있습니다. 다시 확인해 주세요.");
      return;
    }
    saveAnswers(next);
    // 결과 화면이 이 표시를 보고 분석 중 화면을 한 번 보여 준다(T-017)
    markSubmitted();
    router.push("/result");
  }

  function choose(value: string) {
    if (pending.current) return;
    setError(null);
    const next = { ...answers, [question.id]: value } as QuizAnswers;
    // 아직 이동한 적이 없으면 화면은 "답하지 않은 첫 질문"을 보여 준다. 답을 넣는 순간 그 기준이 다음 질문으로 바뀌므로
    // 지금 질문에 위치를 고정해 둔다(선택 표시를 보여 주는 동안 화면이 먼저 넘어가지 않게)
    if (step === null) setStep(index);
    // 선택 표시를 먼저 보여 준 뒤 넘어간다. 동작 줄이기를 켠 사용자는 기다리지 않는다
    setEdited(next);
    if (reducedMotion) {
      advance(next, question);
      return;
    }
    const from = question;
    pending.current = setTimeout(() => {
      pending.current = null;
      advance(next, from);
    }, SELECT_DELAY_MS);
  }

  function toggleShape(value: ShapeValue) {
    const current = answers.shapes ?? [];
    const shapes = current.includes(value) ? current.filter((s) => s !== value) : [...current, value];
    // 저장된 답변으로 바로 이 질문에서 시작한 경우에도 하나를 고르는 순간 화면이 넘어가지 않게 위치를 고정한다(choose와 같은 이유)
    if (step === null) setStep(index);
    setEdited({ ...answers, shapes });
  }

  function restart() {
    cancelPending();
    clearAnswers();
    setError(null);
    setEdited({});
    goTo(0);
  }

  const selectedShapes = answers.shapes ?? [];
  // 이미 답한 질문(지금 선택지 안에 있는 답)은 다시 누르지 않아도 '다음'으로 넘어갈 수 있다
  const currentAnswer = answers[question.id];
  const canGoNext = !question.multiple && question.options.some((o) => o.value === currentAnswer);
  const hasAnyAnswer = Object.keys(answers).length > 0;
  // 아직 아무것도 건드리지 않았고 저장된 답변으로 화면을 채운 상태
  const restored = edited === null && saved !== null && hasAnyAnswer;
  const percent = ((index + 1) / questions.length) * 100;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-4 pb-8">
      <div className="flex items-center gap-3">
        <Button variant="text" size="md" onClick={() => goTo(index - 1)} className={index === 0 ? "invisible" : ""} disabled={index === 0}>
          ← 이전
        </Button>
        <div className="h-2 flex-1 rounded-full bg-line" aria-hidden="true">
          <div
            className="h-2 rounded-full bg-accent transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-enter)]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="min-w-10 text-right text-small text-muted" aria-label={`전체 ${questions.length}개 중 ${index + 1}번째 질문`}>
          {index + 1} / {questions.length}
        </p>
      </div>

      {restored ? (
        <p role="status" className="rounded-card border border-line bg-card p-3 text-small text-ink">
          이 탭에서 전에 답한 내용을 불러왔습니다. 바꾸고 싶은 질문으로 돌아가 고칠 수 있습니다.
        </p>
      ) : null}

      {/* 질문이 바뀔 때마다 새로 그려져 들어오는 연출이 다시 재생된다. 방향은 앞으로·뒤로에 따라 다르다 */}
      <fieldset
        key={question.id}
        data-direction={direction}
        className={`flex flex-col gap-4 ${direction === "back" ? "animate-slide-in-back" : "animate-slide-in-forward"}`}
      >
        <legend ref={legendRef} tabIndex={-1} className="mb-2 text-title font-bold text-navy outline-none">
          {question.title}
        </legend>
        {question.note ? <p className="text-small text-muted">{question.note}</p> : null}

        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const selected = question.multiple ? selectedShapes.includes(option.value as ShapeValue) : currentAnswer === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => (question.multiple ? toggleShape(option.value as ShapeValue) : choose(option.value))}
                className={`min-h-16 rounded-card border px-4 py-3 text-left outline-offset-2 transition-[transform,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-enter)] focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98] ${
                  selected ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-accent"
                }`}
              >
                <span className="flex items-center gap-4">
                  {question.id === "shapes" ? <ShapeIcon shape={option.value} className="shrink-0 text-navy" /> : null}
                  <span className="flex-1">
                    <span className={`block text-body font-bold ${selected ? "text-accent-ink" : "text-ink"}`}>{option.label}</span>
                    {option.hint ? <span className="mt-0.5 block text-small text-muted">{option.hint}</span> : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-small font-bold ${
                      selected ? "border-accent bg-accent text-white" : "border-line text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {question.multiple ? (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => advance({ ...answers, shapes: [] }, question)} className="flex-1">
            건너뛰기
          </Button>
          <Button disabled={selectedShapes.length === 0} onClick={() => advance({ ...answers, shapes: selectedShapes }, question)} className="flex-1">
            다음
          </Button>
        </div>
      ) : null}

      {canGoNext ? (
        <Button fullWidth onClick={() => advance(answers, question)}>
          {index + 1 < questions.length ? "다음" : "결과 보기"}
        </Button>
      ) : null}

      {error ? (
        <p role="alert" className="text-small font-bold text-caution">
          {error}
        </p>
      ) : null}

      {hasAnyAnswer ? (
        <Button variant="text" size="md" onClick={restart} className="self-start">
          처음부터 다시 답하기
        </Button>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { answersToProfile } from "@/lib/quiz/answers";
import { visibleQuestions, type QuizAnswers, type QuizQuestion, type ShapeValue } from "@/lib/quiz/questions";
import { clearAnswers, loadAnswersRaw, parseAnswers, saveAnswers } from "@/lib/quiz/storage";
import { ShapeIcon } from "@/components/ShapeIcon";

const subscribe = () => () => {};

/** 질문 화면. 한 번에 질문 하나를 보여 주고, 다 답하면 답변을 저장한 뒤 결과 화면으로 간다 */
export function Quiz() {
  const router = useRouter();
  // 전에 답한 내용이 이 탭에 남아 있으면 이어서 보여 준다(결과 화면에서 돌아와 한 가지만 바꿀 수 있게).
  // 미리 그리는 단계(서버)에서는 저장소를 읽지 않는다
  const savedRaw = useSyncExternalStore<string | null | undefined>(subscribe, loadAnswersRaw, () => undefined);
  const saved = useMemo(() => parseAnswers(savedRaw ?? null), [savedRaw]);
  const [edited, setEdited] = useState<QuizAnswers | null>(null);
  const [step, setStep] = useState<number | null>(null);
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

  function goTo(nextStep: number) {
    moved.current = true;
    setStep(nextStep);
  }

  function advance(next: QuizAnswers, from: QuizQuestion) {
    setEdited(next);
    const list = visibleQuestions(next);
    const at = list.findIndex((q) => q.id === from.id);
    if (at + 1 < list.length) {
      goTo(at + 1);
      return;
    }
    const result = answersToProfile(next);
    if (!result.success) {
      // 정상 흐름에서는 일어나지 않는다. 일어나면 문제가 된 첫 질문으로 돌려보낸다
      const missing = "missing" in result ? result.missing[0] : undefined;
      goTo(Math.max(0, list.findIndex((q) => q.id === missing)));
      setError("답하지 않았거나 다시 확인이 필요한 질문이 있습니다.");
      return;
    }
    saveAnswers(next);
    router.push("/result");
  }

  function choose(value: string) {
    setError(null);
    advance({ ...answers, [question.id]: value } as QuizAnswers, question);
  }

  function toggleShape(value: ShapeValue) {
    const current = answers.shapes ?? [];
    const shapes = current.includes(value) ? current.filter((s) => s !== value) : [...current, value];
    setEdited({ ...answers, shapes });
  }

  function restart() {
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

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="rounded px-2 py-1 font-medium text-navy outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent disabled:invisible"
        >
          ← 이전
        </button>
        <p aria-label={`전체 ${questions.length}개 중 ${index + 1}번째 질문`}>
          {index + 1} / {questions.length}
        </p>
      </div>
      <div className="h-1 w-full rounded bg-line" aria-hidden="true">
        <div className="h-1 rounded bg-accent" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend ref={legendRef} tabIndex={-1} className="mb-4 text-2xl font-bold leading-snug text-navy outline-none">
          {question.title}
        </legend>
        {question.note ? <p className="text-sm leading-relaxed text-muted">{question.note}</p> : null}

        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const selected = question.multiple ? selectedShapes.includes(option.value as ShapeValue) : currentAnswer === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => (question.multiple ? toggleShape(option.value as ShapeValue) : choose(option.value))}
                className={`rounded-lg border px-4 py-4 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent ${
                  selected ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-accent"
                }`}
              >
                <span className="flex items-center gap-4">
                  {question.id === "shapes" ? <ShapeIcon shape={option.value} className="shrink-0 text-navy" /> : null}
                  <span>
                    <span className="block text-base font-semibold text-ink">
                      {selected ? "✓ " : ""}
                      {option.label}
                    </span>
                    {option.hint ? <span className="mt-1 block text-sm text-muted">{option.hint}</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {question.multiple ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => advance({ ...answers, shapes: [] }, question)}
            className="flex-1 rounded-lg border border-line bg-card px-4 py-3 text-base font-medium text-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            건너뛰기
          </button>
          <button
            type="button"
            disabled={selectedShapes.length === 0}
            onClick={() => advance({ ...answers, shapes: selectedShapes }, question)}
            className="flex-1 rounded-lg bg-navy px-4 py-3 text-base font-semibold text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}

      {canGoNext ? (
        <button
          type="button"
          onClick={() => advance(answers, question)}
          className="rounded-lg bg-navy px-4 py-3 text-base font-semibold text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {index + 1 < questions.length ? "다음" : "결과 보기"}
        </button>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-caution">
          {error}
        </p>
      ) : null}

      {hasAnyAnswer ? (
        <button
          type="button"
          onClick={restart}
          className="self-start rounded px-2 py-1 text-sm font-medium text-muted underline underline-offset-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          처음부터 다시 답하기
        </button>
      ) : null}
    </section>
  );
}

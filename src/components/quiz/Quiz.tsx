"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { answersToProfile } from "@/lib/quiz/answers";
import { visibleQuestions, type QuizAnswers, type QuizQuestion, type ShapeValue } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { ShapeIcon } from "@/components/ShapeIcon";

/** 질문 화면. 한 번에 질문 하나를 보여 주고, 다 답하면 답변을 저장한 뒤 결과 화면으로 간다 */
export function Quiz() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const questions = visibleQuestions(answers);
  const index = Math.min(step, questions.length - 1);
  const question = questions[index]!;

  function advance(next: QuizAnswers, from: QuizQuestion) {
    setAnswers(next);
    const list = visibleQuestions(next);
    const at = list.findIndex((q) => q.id === from.id);
    if (at + 1 < list.length) {
      setStep(at + 1);
      return;
    }
    const result = answersToProfile(next);
    if (!result.success) {
      // 정상 흐름에서는 일어나지 않는다. 일어나면 첫 미답 질문으로 돌려보낸다
      const missing = "missing" in result ? result.missing[0] : undefined;
      setStep(Math.max(0, list.findIndex((q) => q.id === missing)));
      setError("답하지 않은 질문이 있습니다. 다시 확인해 주세요.");
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
    setAnswers({ ...answers, shapes });
  }

  const selectedShapes = answers.shapes ?? [];

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8" aria-live="polite">
      <div className="flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={() => setStep(index - 1)}
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
        <legend className="mb-4 text-2xl font-bold leading-snug text-navy">{question.title}</legend>
        {question.note ? <p className="text-sm leading-relaxed text-muted">{question.note}</p> : null}

        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const selected = question.multiple
              ? selectedShapes.includes(option.value as ShapeValue)
              : answers[question.id] === option.value;
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
                  {question.id === "shapes" ? <ShapeIcon shape={option.value as ShapeValue} className="shrink-0 text-navy" /> : null}
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

      {error ? (
        <p role="alert" className="text-sm font-medium text-caution">
          {error}
        </p>
      ) : null}
    </section>
  );
}

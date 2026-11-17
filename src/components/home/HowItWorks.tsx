/** "이렇게 찾아요" 3단계(T-043). 과장 없이 실제로 하는 일만 적는다(docs/plan/m2.5-redesign.md 3.1) */
const STEPS = [
  { title: "질문에 답하기", body: "경력·성향·예산 등 6~7개 질문에 1분이면 답할 수 있습니다." },
  { title: "스펙 비교", body: "답변 조건과 제품 스펙을 맞춰 봅니다." },
  { title: "이유와 함께 3개", body: "맞는 이유와 주의할 점, 판매처를 함께 보여 드립니다." },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className="flex flex-col gap-4" data-testid="how-it-works">
      <h2 id="how-it-works-title" className="text-heading font-bold text-navy">
        이렇게 찾아요
      </h2>
      <ol className="grid gap-3 lg:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-card border border-line bg-card p-4 shadow-card">
            {/* 단계 번호 바탕은 꾸밈용 라임, 위 글자는 고정 짙은 색(--on-lime) */}
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime text-small font-bold text-on-lime">
              {i + 1}
            </span>
            <span>
              <span className="block text-body font-bold text-ink">
                <span className="sr-only">{i + 1}단계. </span>
                {step.title}
              </span>
              <span className="mt-1 block text-small text-muted">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Paddle, PaddleSpec } from "../../../data/schema";
import { answersToProfile } from "@/lib/quiz/answers";
import { loadAnswersRaw, parseAnswers } from "@/lib/quiz/storage";
import type { UserProfile } from "@/lib/recommend/profile";
import { recommend, type RelaxationHint } from "@/lib/recommend/recommend";
import { NOTICE, todayLocal, won } from "./labels";
import { ResultCard } from "./ResultCard";

const subscribe = () => () => {};
const readToday = () => todayLocal();

/** 엔진에는 구매 링크가 없는 스펙만 넘긴다. 링크는 결과가 나온 뒤 paddle_id로 붙인다(핵심 규칙 1) */
function toSpec(paddle: Paddle): PaddleSpec {
  const { purchase: _purchase, ...spec } = paddle;
  void _purchase;
  return spec;
}

/** 조건 완화 힌트를 눌렀을 때의 프로필. 저장된 답변은 바꾸지 않는다 */
function relax(profile: UserProfile, hint: RelaxationHint): UserProfile {
  if (hint.kind === "certification") return { ...profile, needs_certification: false };
  if (hint.kind === "both") return { ...profile, budget: {}, needs_certification: false };
  return { ...profile, budget: hint.suggested_max_krw !== undefined ? { max_krw: hint.suggested_max_krw } : {} };
}

function hintLabel(hint: RelaxationHint): string {
  if (hint.kind === "certification") return "대회 승인 조건을 빼고 다시 보기";
  if (hint.kind === "both") return "예산과 대회 승인 조건을 빼고 다시 보기";
  return hint.suggested_max_krw !== undefined ? `예산을 ${won(hint.suggested_max_krw)}까지 올려서 다시 보기` : "예산 조건을 빼고 다시 보기";
}

export function Result({ paddles }: { paddles: Paddle[] }) {
  const router = useRouter();
  // 서버와 첫 렌더에서는 undefined(아직 모름), 브라우저에서는 저장된 문자열 또는 null
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, loadAnswersRaw, () => undefined);
  const [relaxed, setRelaxed] = useState<UserProfile | null>(null);

  const base = useMemo(() => {
    const answers = parseAnswers(raw ?? null);
    const result = answers ? answersToProfile(answers) : null;
    return result && result.success ? result.profile : null;
  }, [raw]);

  const missing = raw !== undefined && base === null;
  useEffect(() => {
    if (missing) router.replace("/quiz");
  }, [missing, router]);

  const profile = relaxed ?? base;
  // 오늘 날짜는 브라우저에서만 읽는다. 미리 그리는 단계(서버)에서는 현재 시각을 읽지 않는다
  const today = useSyncExternalStore<string | null>(subscribe, readToday, () => null);
  const result = useMemo(
    () => (profile && today ? recommend(paddles.map(toSpec), profile, { today }) : null),
    [paddles, profile, today],
  );
  const byId = useMemo(() => new Map(paddles.map((p) => [p.id, p])), [paddles]);

  if (!profile || !result || !today) {
    return (
      <p className="mx-auto w-full max-w-xl px-5 py-12 text-base text-muted" role="status">
        답변을 확인하고 있습니다.
      </p>
    );
  }

  // 화면에 제휴 링크가 하나라도 있으면 추천 카드보다 먼저 알린다
  const hasAffiliate = result.items.some((item) => byId.get(item.paddle_id)?.purchase?.is_affiliate);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold leading-snug text-navy">
          {result.items.length > 0 ? "답변에 맞는 패들입니다" : "조건에 맞는 패들을 찾지 못했습니다"}
        </h1>
        {relaxed ? <p className="text-sm font-medium text-caution">조건을 바꿔서 다시 찾은 결과입니다.</p> : null}
        {result.items.length > 0 && result.items.length < 3 ? (
          <p className="text-sm text-muted">조건에 맞는 제품이 {result.items.length}개뿐이라 있는 만큼만 보여 드립니다.</p>
        ) : null}
      </header>

      {/* 화면에 제휴 링크가 하나라도 있으면 추천 카드보다 먼저 알린다 */}
      {hasAffiliate ? (
        <div className="rounded-lg border border-line bg-card p-4 text-sm font-medium leading-relaxed text-ink" data-testid="affiliate-page-notice">
          <p>{NOTICE.affiliatePage}</p>
          <p>{NOTICE.ranking}</p>
        </div>
      ) : null}

      {profile.arm_discomfort ? <p className="rounded-lg border border-line bg-card p-4 text-sm leading-relaxed text-ink">{NOTICE.arm}</p> : null}

      {result.items.map((item, i) => {
        const paddle = byId.get(item.paddle_id);
        return paddle ? <ResultCard key={item.paddle_id} rank={i + 1} item={item} paddle={paddle} today={today} /> : null;
      })}

      {result.relaxation.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">조건을 조금 바꾸면 추천할 수 있습니다.</p>
          {result.relaxation.map((hint) => (
            <button
              key={hint.kind}
              type="button"
              onClick={() => setRelaxed(relax(profile, hint))}
              className="rounded-lg border border-accent bg-accent-soft px-4 py-3 text-left text-base font-semibold text-navy outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              {hintLabel(hint)}
              <span className="mt-1 block text-sm font-normal text-muted">{hint.message}</span>
            </button>
          ))}
        </div>
      ) : null}

      {result.items.length === 0 && result.relaxation.length === 0 ? (
        <p className="text-sm text-muted">지금 등록된 제품 중에는 조건에 맞는 것이 없습니다. 질문을 다시 해 보세요.</p>
      ) : null}

      <details className="rounded-lg border border-line bg-card p-4 text-sm leading-relaxed text-ink">
        <summary className="cursor-pointer font-semibold">그립 굵기는 어떻게 고르나요?</summary>
        <p className="mt-2 text-muted">
          그립 굵기는 손 크기에 맞춥니다. 두 굵기 사이에서 고민된다면 가는 쪽을 고르고 오버그립으로 굵기를 맞추는 방법이 일반적입니다. 같은 모델도
          그립 굵기가 여러 가지로 나오는 경우가 있으니 구매 전에 확인해 주세요.
        </p>
      </details>

      <footer className="flex flex-col gap-1 text-xs leading-relaxed text-muted">
        <p>{NOTICE.spec}</p>
        {/* 제휴 안내가 위에 있으면 같은 문장을 거기서 이미 보여 줬다 */}
        {hasAffiliate ? null : <p>{NOTICE.ranking}</p>}
        <p>{NOTICE.price}</p>
      </footer>

      <Link href="/quiz" className="text-base font-semibold text-accent underline underline-offset-4">
        질문 다시 하기
      </Link>
    </section>
  );
}

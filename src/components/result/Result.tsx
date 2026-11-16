"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toPaddleSpec, type PaddleDisplay } from "../../../data/schema";
import { answersToProfile } from "@/lib/quiz/answers";
import { loadAnswersRaw, parseAnswers } from "@/lib/quiz/storage";
import type { UserProfile } from "@/lib/recommend/profile";
import { recommend, type RelaxationHint } from "@/lib/recommend/recommend";
import { affiliateProgram, DISCLOSURE, NOTICE, todayLocal, won, type AffiliateProgram } from "./labels";
import { ResultCard } from "./ResultCard";
import { RankRow } from "./RankRow";
import { StickyBuy } from "./StickyBuy";
import { CompareSheet, type CompareColumn } from "./CompareSheet";
import { Button } from "@/components/ui/Button";
import { ConditionChips } from "./parts";
import { Analyzing } from "./Analyzing";
import { clearAnalyzeMode, peekAnalyzeMode, type AnalyzeMode } from "./analyzing-flag";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useReducedMotion } from "@/components/ui/useReducedMotion";

const subscribe = () => () => {};
/** 1순위 카드의 구매 묶음 id. 하단 고정 버튼이 이 요소가 보이는지 본다 */
const TOP_BUY_ID = "top-buy";
const readToday = () => todayLocal();

/** 조건 완화 힌트를 눌렀을 때의 프로필. 저장된 답변은 바꾸지 않는다 */
function relax(profile: UserProfile, hint: RelaxationHint): UserProfile {
  if (hint.kind === "certification") return { ...profile, needs_certification: false };
  if (hint.kind === "both") return { ...profile, budget: {}, needs_certification: false };
  // 상한만 올린다. 사용자가 정한 하한(최소 예산)은 그대로 둔다
  if (hint.suggested_max_krw !== undefined) return { ...profile, budget: { ...profile.budget, max_krw: hint.suggested_max_krw } };
  return { ...profile, budget: {} };
}

function hintLabel(hint: RelaxationHint): string {
  if (hint.kind === "certification") return "대회 승인 조건을 빼고 다시 보기";
  if (hint.kind === "both") return "예산과 대회 승인 조건을 빼고 다시 보기";
  return hint.suggested_max_krw !== undefined ? `예산을 ${won(hint.suggested_max_krw)}까지 올려서 다시 보기` : "예산 조건을 빼고 다시 보기";
}

export function Result({ paddles }: { paddles: PaddleDisplay[] }) {
  const router = useRouter();
  // 서버와 첫 렌더에서는 undefined(아직 모름), 브라우저에서는 저장된 문자열 또는 null
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, loadAnswersRaw, () => undefined);
  const [relaxed, setRelaxed] = useState<UserProfile | null>(null);
  // 비교 시트와 2·3순위 상세 시트. 비교표에서 제품을 고르면 비교 시트를 먼저 닫고(close 이벤트 뒤) 그 제품을 연다(시트를 겹치지 않게)
  const [compareOpen, setCompareOpen] = useState(false);
  const [openRank, setOpenRank] = useState<number | null>(null);
  const pendingPick = useRef<number | null>(null);
  // 질문을 막 끝내고 왔을 때만 분석 중 화면을 보여 준다(docs/plan/phase2.md 6.3). 서버에서는 읽지 않는다.
  // 첫 렌더(하이드레이션)에서는 답변을 아직 모르므로 스켈레톤이 나와 서버 결과와 같다
  const [analyze, setAnalyze] = useState<AnalyzeMode | null>(() => (typeof window === "undefined" ? null : peekAnalyzeMode()));
  const reducedMotion = useReducedMotion();
  // 한 번 보여 주기 시작하면 표시를 지운다(새로고침에서 다시 나오지 않게)
  useEffect(() => {
    if (analyze) clearAnalyzeMode();
  }, [analyze]);

  const answers = useMemo(() => parseAnswers(raw ?? null), [raw]);
  const base = useMemo(() => {
    const result = answers ? answersToProfile(answers) : null;
    return result && result.success ? result.profile : null;
  }, [answers]);

  const missing = raw !== undefined && base === null;
  useEffect(() => {
    if (missing) router.replace("/quiz");
  }, [missing, router]);

  const profile = relaxed ?? base;
  // 오늘 날짜는 브라우저에서만 읽는다. 미리 그리는 단계(서버)에서는 현재 시각을 읽지 않는다
  const today = useSyncExternalStore<string | null>(subscribe, readToday, () => null);
  const result = useMemo(
    () => (profile && today ? recommend(paddles.map(toPaddleSpec), profile, { today }) : null),
    [paddles, profile, today],
  );
  const byId = useMemo(() => new Map(paddles.map((p) => [p.id, p])), [paddles]);

  if (!profile || !result || !today) {
    // 저장된 답변을 읽기 전 잠깐. 카드 모양 자리 표시를 보여 주고 화면 낭독기에는 문구로 알린다
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-5 py-8" aria-busy="true">
        <p className="sr-only" role="status">
          답변을 확인하고 있습니다.
        </p>
        <CardSkeleton />
        <CardSkeleton />
      </section>
    );
  }

  // 동작 줄이기를 켠 사용자는 기다리지 않는다
  if (analyze && !reducedMotion) {
    return <Analyzing count={paddles.length} mode={analyze} onDone={() => setAnalyze(null)} />;
  }

  // 화면에 제휴 링크가 하나라도 있으면 게시물의 첫 부분에서 먼저 알린다(심사지침 Ⅴ.6, 쿠팡 파트너스 가이드)
  const programs = new Set<AffiliateProgram>();
  for (const item of result.items) {
    const purchase = byId.get(item.paddle_id)?.purchase;
    if (purchase?.is_affiliate) programs.add(affiliateProgram(purchase));
  }
  const hasAffiliate = programs.size > 0;
  const topPaddle = result.items[0] ? byId.get(result.items[0].paddle_id) : undefined;
  const columns: CompareColumn[] = result.items.flatMap((item, i) => {
    const paddle = byId.get(item.paddle_id);
    return paddle ? [{ rank: i + 1, item, paddle }] : [];
  });

  function afterCompareClosed() {
    setCompareOpen(false);
    const rank = pendingPick.current;
    pendingPick.current = null;
    if (rank === null) return;
    if (rank === 1) {
      // 1순위는 화면에 있는 카드로 보낸다
      const title = document.querySelector<HTMLElement>("[data-testid='result-card-wrap'] article h2");
      if (title) {
        title.tabIndex = -1;
        title.scrollIntoView({ block: "start" });
        title.focus();
      }
      return;
    }
    setOpenRank(rank);
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      {/* 경제적 이해관계 표시: 제목보다 앞, 본문보다 큰 글자와 다른 색, 접히지 않는 위치 */}
      {hasAffiliate ? (
        <div className="rounded-lg border-2 border-navy bg-card p-4" data-testid="affiliate-page-notice">
          <p className="text-sm font-bold text-navy">광고</p>
          {(["coupang", "other"] as const)
            .filter((program) => programs.has(program))
            .map((program) => (
              <p key={program} className="mt-1 text-base font-semibold leading-relaxed text-navy">
                {DISCLOSURE[program]}
              </p>
            ))}
          <p className="mt-2 text-sm leading-relaxed text-ink">{NOTICE.ranking}</p>
        </div>
      ) : null}

      <header className="flex flex-col gap-3">
        {answers ? <ConditionChips answers={answers} /> : null}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-snug text-navy">
            {result.items.length > 0 ? "답변에 맞는 패들입니다" : "조건에 맞는 패들을 찾지 못했습니다"}
          </h1>
          {columns.length >= 2 ? (
            <Button variant="secondary" size="md" onClick={() => setCompareOpen(true)} className="shrink-0">
              비교하기
            </Button>
          ) : null}
        </div>
        {relaxed ? <p className="text-sm font-medium text-caution">조건을 바꿔서 다시 찾은 결과입니다.</p> : null}
        {result.items.length > 0 && result.items.length < 3 ? (
          <p className="text-sm text-muted">조건에 맞는 제품이 {result.items.length}개뿐이라 있는 만큼만 보여 드립니다.</p>
        ) : null}
      </header>

      {profile.arm_discomfort ? <p className="rounded-lg border border-line bg-card p-4 text-sm leading-relaxed text-ink">{NOTICE.arm}</p> : null}

      {/* 1→2→3순위 순서로 떠오르며 나타난다(카드마다 80ms 늦게) */}
      {/* 1순위는 크게, 2·3순위는 한 줄 행(누르면 시트). 순위 순서로 떠오르며 나타난다(카드마다 80ms 늦게) */}
      {result.items.map((item, i) => {
        const paddle = byId.get(item.paddle_id);
        return paddle ? (
          <div key={item.paddle_id} className="animate-rise-in" style={{ animationDelay: `${i * 80}ms` }} data-testid="result-card-wrap">
            {i === 0 ? (
              <ResultCard rank={1} item={item} paddle={paddle} today={today} buyAnchorId={TOP_BUY_ID} />
            ) : (
              <RankRow
                rank={i + 1}
                item={item}
                paddle={paddle}
                today={today}
                open={openRank === i + 1}
                onOpen={() => setOpenRank(i + 1)}
                onClose={() => setOpenRank(null)}
              />
            )}
          </div>
        ) : null;
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
        답변 고치기
      </Link>

      {columns.length >= 2 ? (
        <CompareSheet
          open={compareOpen}
          onClose={afterCompareClosed}
          columns={columns}
          today={today}
          onPick={(rank) => {
            pendingPick.current = rank;
            setCompareOpen(false);
          }}
        />
      ) : null}

      {/* 스크롤해서 1순위 구매 버튼이 화면 밖으로 나가면 아래에 고정 버튼을 띄운다. 가리지 않도록 아래 여백을 둔다 */}
      {topPaddle?.purchase ? (
        <>
          <div aria-hidden="true" className="h-32" />
          <StickyBuy paddle={topPaddle} anchorId={TOP_BUY_ID} />
        </>
      ) : null}
    </section>
  );
}

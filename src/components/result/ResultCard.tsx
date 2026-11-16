import { useId } from "react";
import type { Paddle, PaddleDisplay } from "../../../data/schema";
import type { Recommendation } from "@/lib/recommend/recommend";
import { daysBetween } from "@/lib/shared/dates";
import { CERT_MAX_AGE_DAYS } from "@/lib/shared/limits";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { compareUrl } from "@/lib/shared/compare";
import { affiliateProgram, DISCLOSURE, PRICE_STALE_DAYS, SHAPE_LABEL, SURFACE_LABEL, won } from "./labels";
import { FitBar, SpecScale } from "./parts";
import { HelpButton } from "@/components/help/HelpButton";

/**
 * 대회 승인 표시. 미확인도 숨기지 않고 적는다.
 * 엔진은 확인한 지 CERT_MAX_AGE_DAYS일이 넘은 승인을 대회용 추천에서 제외한다. 배지도 같은 기준을 써서,
 * 오래된(또는 날짜가 이상한) 승인은 "확인"이 아니라 "재확인 필요"로 보여 준다.
 * 확인 초록과 강조 청록이 비슷하므로 아이콘과 글자를 함께 쓴다(Badge).
 */
export function CertBadge({ certification, today }: { certification: Paddle["certification"]; today: string }) {
  if (certification.usa_pickleball === "approved") {
    const age = daysBetween(certification.checked_at, today);
    // 확인일이 미래이거나 날짜로 읽을 수 없으면 얼마나 지났는지 말할 수 없다(데이터 오류이거나 기기 시계가 틀린 경우)
    if (!Number.isFinite(age) || age < 0) {
      return (
        <Badge tone="caution">
          USA Pickleball 승인 재확인 필요 <span className="font-normal">(확인일 {certification.checked_at}을 확인할 수 없음)</span>
        </Badge>
      );
    }
    if (age > CERT_MAX_AGE_DAYS) {
      return (
        <Badge tone="caution">
          USA Pickleball 승인 재확인 필요 <span className="font-normal">({certification.checked_at} 확인, 오래됨)</span>
        </Badge>
      );
    }
    return (
      <Badge tone="confirm">
        USA Pickleball 승인 확인 <span className="font-normal">({certification.checked_at} 확인)</span>
      </Badge>
    );
  }
  if (certification.usa_pickleball === "not_approved") {
    return <Badge tone="caution">USA Pickleball 승인 제품이 아닙니다</Badge>;
  }
  return <Badge tone="neutral">대회 승인 여부 미확인</Badge>;
}

/**
 * 구매 버튼. 제휴 링크는 대가 표시와 한 묶음으로만 그린다(CLAUDE.md 핵심 규칙 3).
 * 쿠팡 파트너스 가이드: 링크와 경제적 이해관계 표시를 분리하지 않는다. 그래서 링크 바로 위에 같은 묶음으로 둔다.
 * 제휴가 아닌 링크는 경제적 이해관계가 없으므로 표시하지 않는다(심사지침 Ⅴ.6.가).
 * 링크가 없으면 아무것도 그리지 않는다. 접히는 영역(details) 안에 두지 않는다(D-022).
 */
export function PurchaseLink({ purchase, name }: { purchase: Paddle["purchase"]; name: string }) {
  const disclosureId = useId();
  if (!purchase) return null;
  const affiliate = purchase.is_affiliate;
  return (
    <div className="flex flex-col gap-2">
      {affiliate ? (
        <p id={disclosureId} className="text-small font-bold text-navy" data-testid="affiliate-disclosure">
          {DISCLOSURE[affiliateProgram(purchase)]}
        </p>
      ) : null}
      {/*
        제휴 링크: 화면 낭독기가 링크만 읽어도 광고임을 알 수 있게 이름에 "광고"를 넣고 대가 표시와 연결한다.
        rel에 noreferrer를 넣지 않는다. 제휴 프로그램이 유입 경로를 확인하는지 알 수 없어서다(쿠팡 도움말에 관련 안내 없음).
      */}
      <a
        href={purchase.url}
        target="_blank"
        rel={affiliate ? "sponsored noopener" : "noopener noreferrer"}
        aria-describedby={affiliate ? disclosureId : undefined}
        className="inline-flex min-h-13 items-center justify-center rounded-control bg-accent px-4 text-center text-body font-bold text-white outline-offset-2 transition-transform duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        {affiliate ? <span className="sr-only">광고 · </span> : null}
        판매처에서 보기 ↗<span className="sr-only"> ({name}, 새 창)</span>
      </a>
    </div>
  );
}

/**
 * 가격 비교 링크(T-019). 네이버 쇼핑 검색 결과로 보낸다. 제휴가 아니므로 대가 표시를 붙이지 않는다.
 * 판매처 링크가 있을 때만 보여 준다(사러 갈 곳이 없는 제품에 비교만 두지 않는다).
 */
export function CompareLink({ paddle, name }: { paddle: PaddleDisplay; name: string }) {
  return (
    <a href={compareUrl(paddle)} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "secondary", size: "md", fullWidth: true })}>
      다른 곳 가격 비교 ↗<span className="sr-only"> (네이버 쇼핑에서 {name} 검색, 새 창)</span>
    </a>
  );
}

/** 구매 묶음: 판매처 링크(제휴면 대가 표시 포함) + 가격 비교. 접히는 영역 밖에 둔다(D-022) */
export function BuyButtons({ paddle, name, anchorId }: { paddle: PaddleDisplay; name: string; anchorId?: string }) {
  if (!paddle.purchase) return null;
  return (
    <div id={anchorId} className="flex flex-col gap-2" data-testid="buy-buttons">
      <PurchaseLink purchase={paddle.purchase} name={name} />
      <CompareLink paddle={paddle} name={name} />
    </div>
  );
}

export function AdBadge() {
  return (
    <Badge tone="ad" className="ml-2 align-middle">
      <span data-testid="affiliate-badge">광고</span>
    </Badge>
  );
}

/** 스펙 막대의 범위(T-018). 지금 데이터(7.41~8.82oz, 12~16mm)가 모두 들어간다. 범위 밖 제품이 생기면 다시 정한다 */
export const SPEC_RANGE = { weight: { min: 7.0, max: 9.0 }, core: { min: 11, max: 17 } } as const;

function Price({ paddle, today }: { paddle: PaddleDisplay; today: string }) {
  const priceAge = paddle.price_checked_at ? daysBetween(paddle.price_checked_at, today) : Number.NaN;
  return (
    <p className="text-body font-bold text-ink">
      {paddle.price_krw !== undefined ? `약 ${won(paddle.price_krw)}` : "가격 정보 없음"}
      {paddle.price_checked_at ? <span className="ml-2 text-caption font-normal text-muted">{paddle.price_checked_at} 기준 · 판매처 가격과 다를 수 있음</span> : null}
      {priceAge > PRICE_STALE_DAYS ? <span className="ml-2 text-caption font-normal text-caution">가격 변동 가능</span> : null}
    </p>
  );
}

function Details({ item, paddle }: { item: Recommendation; paddle: PaddleDisplay }) {
  return (
    <div className="flex flex-col gap-4">
      {item.reasons.length > 0 ? (
        <section>
          <h3 className="text-small font-bold text-ink">추천 이유</h3>
          <ul className="mt-1 list-disc pl-5 text-small text-ink">
            {item.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {item.cautions.length > 0 ? (
        <section>
          <h3 className="text-small font-bold text-caution">⚠ 알아 둘 점</h3>
          <ul className="mt-1 list-disc pl-5 text-small text-caution">
            {item.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <SpecScale label="무게" value={paddle.weight_oz} unit="oz" {...SPEC_RANGE.weight} left="가벼움" right="묵직함" help="weight" />
      {/* 엔진 해석과 같은 방향: 코어가 얇을수록 파워, 두꺼울수록 컨트롤 */}
      <SpecScale label="코어 두께" value={paddle.core_mm} unit="mm" {...SPEC_RANGE.core} left="파워" right="컨트롤" help="core" />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-small">
        <div>
          <dt className="text-muted">형태</dt>
          <dd className="font-bold text-ink">{SHAPE_LABEL[paddle.shape]}</dd>
        </div>
        <div>
          <dt className="text-muted">길이 × 폭</dt>
          <dd className="font-bold text-ink">
            {paddle.length_in} × {paddle.width_in}in
          </dd>
        </div>
        <div>
          <dt className="text-muted">표면</dt>
          <dd className="font-bold text-ink">{SURFACE_LABEL[paddle.surface]}</dd>
        </div>
      </dl>
    </div>
  );
}

type Props = {
  rank: number;
  item: Recommendation;
  paddle: PaddleDisplay;
  today: string;
  /** top: 1순위 요약 + "자세히" 펼치기. full: 시트 안에서 모두 펼친 상태 */
  mode?: "top" | "full";
  /** 구매 묶음의 id. 결과 화면이 이 요소가 보이는지 보고 하단 고정 버튼을 띄운다(T-019) */
  buyAnchorId?: string;
};

/**
 * 추천 1개(docs/plan/phase2.md 5.4). 근거가 먼저 보이도록 적합도 → 핵심 이유 → 알아 둘 점 → 스펙 → 가격·승인 순서.
 * 점수 숫자는 보여 주지 않는다. 알아 둘 점은 접지 않고 개수와 첫 문장을 요약에 보인다.
 */
export function ResultCard({ rank, item, paddle, today, mode = "top", buyAnchorId }: Props) {
  const name = `${paddle.brand} ${paddle.model}`;
  const affiliate = paddle.purchase?.is_affiliate === true;
  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-card p-5 shadow-card" aria-label={`${rank}순위 ${name}`}>
      <header className="flex flex-col gap-2">
        <p className="text-small font-bold text-accent">
          {rank}순위 · {item.label}
          {/* 제휴 링크가 있는 카드는 제목 근처에서 먼저 광고임을 알린다 */}
          {affiliate ? <AdBadge /> : null}
        </p>
        <h2 className={`${mode === "top" ? "text-title" : "text-heading"} font-bold text-navy`}>{name}</h2>
        <FitBar score={item.score} label={item.label} />
      </header>

      {mode === "top" ? (
        <>
          {item.reasons[0] ? <p className="text-body text-ink" data-testid="key-reason">{item.reasons[0]}</p> : null}
          {item.cautions.length > 0 ? (
            <p className="rounded-control bg-caution-soft px-3 py-2 text-small text-caution" data-testid="caution-summary">
              <span className="font-bold">⚠ 알아 둘 점 {item.cautions.length}개</span> · {item.cautions[0]}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5" data-testid="spec-chips">
            {[`${paddle.weight_oz}oz`, `코어 ${paddle.core_mm}mm`, SHAPE_LABEL[paddle.shape]].map((chip) => (
              <span key={chip} className="rounded-full border border-line px-2.5 py-0.5 text-caption font-bold text-ink">
                {chip}
              </span>
            ))}
            <HelpButton term="core" label="용어 설명" className="-my-2" />
          </div>
        </>
      ) : null}

      <div className="flex flex-col gap-2">
        <Price paddle={paddle} today={today} />
        <div className="flex flex-wrap items-center gap-1">
          <CertBadge certification={paddle.certification} today={today} />
          <HelpButton term="certification" className="-my-3" />
        </div>
      </div>

      <BuyButtons paddle={paddle} name={name} anchorId={buyAnchorId} />

      {mode === "top" ? (
        <details className="group border-t border-line pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between text-small font-bold text-ink">
            자세히 보기
            <span aria-hidden="true" className="transition-transform duration-[var(--duration-base)] group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="pt-3">
            <Details item={item} paddle={paddle} />
          </div>
        </details>
      ) : (
        <Details item={item} paddle={paddle} />
      )}
    </article>
  );
}

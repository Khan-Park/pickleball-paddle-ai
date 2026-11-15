import type { Paddle } from "../../../data/schema";
import type { Recommendation } from "@/lib/recommend/recommend";
import { daysBetween } from "@/lib/shared/dates";
import { NOTICE, PRICE_STALE_DAYS, SHAPE_LABEL, SURFACE_LABEL, won } from "./labels";

/** 대회 승인 표시. 미확인도 숨기지 않고 적는다 */
export function CertBadge({ certification }: { certification: Paddle["certification"] }) {
  if (certification.usa_pickleball === "approved") {
    return (
      <p className="text-sm font-medium text-confirm">
        ✓ USA Pickleball 승인 확인 <span className="font-normal text-muted">({certification.checked_at} 확인)</span>
      </p>
    );
  }
  if (certification.usa_pickleball === "not_approved") {
    return <p className="text-sm font-medium text-caution">USA Pickleball 승인 제품이 아닙니다</p>;
  }
  return <p className="text-sm text-muted">대회 승인 여부 미확인</p>;
}

/** 구매 버튼과 대가 표시는 항상 한 묶음이다(CLAUDE.md 핵심 규칙 3). 링크가 없으면 아무것도 그리지 않는다 */
export function PurchaseLink({ purchase, name }: { purchase: Paddle["purchase"]; name: string }) {
  if (!purchase) return null;
  return (
    <div className="flex flex-col gap-1">
      <a
        href={purchase.url}
        target="_blank"
        rel={purchase.is_affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        className="rounded-lg bg-navy px-4 py-3 text-center text-base font-semibold text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        판매처에서 보기<span className="sr-only"> ({name}, 새 창)</span>
      </a>
      {purchase.is_affiliate ? <p className="text-xs text-muted">{NOTICE.affiliate}</p> : null}
    </div>
  );
}

type Props = { rank: number; item: Recommendation; paddle: Paddle; today: string };

/** 추천 1개. 근거가 먼저 보이도록 이유 → 주의 → 스펙 → 가격·승인 순서로 그린다. 점수 숫자는 보여 주지 않는다 */
export function ResultCard({ rank, item, paddle, today }: Props) {
  const name = `${paddle.brand} ${paddle.model}`;
  const priceAge = paddle.price_checked_at ? daysBetween(paddle.price_checked_at, today) : Number.NaN;
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-line bg-card p-5" aria-label={`${rank}순위 ${name}`}>
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-accent">
          {rank}순위 · {item.label}
        </p>
        <h2 className="text-xl font-bold leading-snug text-navy">{name}</h2>
      </header>

      {item.reasons.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-ink">추천 이유</h3>
          <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-ink">
            {item.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {item.cautions.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-caution">⚠ 알아 둘 점</h3>
          <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-caution">
            {item.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-muted">무게</dt>
          <dd className="font-medium text-ink">{paddle.weight_oz}oz</dd>
        </div>
        <div>
          <dt className="text-muted">코어 두께</dt>
          <dd className="font-medium text-ink">{paddle.core_mm}mm</dd>
        </div>
        <div>
          <dt className="text-muted">형태</dt>
          <dd className="font-medium text-ink">{SHAPE_LABEL[paddle.shape]}</dd>
        </div>
        <div>
          <dt className="text-muted">길이 × 폭</dt>
          <dd className="font-medium text-ink">
            {paddle.length_in} × {paddle.width_in}in
          </dd>
        </div>
        <div>
          <dt className="text-muted">표면</dt>
          <dd className="font-medium text-ink">{SURFACE_LABEL[paddle.surface]}</dd>
        </div>
        <div>
          <dt className="text-muted">가격</dt>
          <dd className="font-medium text-ink">
            {paddle.price_krw !== undefined ? `약 ${won(paddle.price_krw)}` : "가격 정보 없음"}
            {paddle.price_checked_at ? <span className="block text-xs font-normal text-muted">{paddle.price_checked_at} 기준</span> : null}
            {priceAge > PRICE_STALE_DAYS ? <span className="block text-xs font-normal text-caution">가격 변동 가능</span> : null}
          </dd>
        </div>
      </dl>

      <CertBadge certification={paddle.certification} />
      <PurchaseLink purchase={paddle.purchase} name={name} />
    </article>
  );
}

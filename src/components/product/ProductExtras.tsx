"use client";

import { useMemo } from "react";
import type { PaddleDisplay } from "../../../data/schema";
import { similarPaddles } from "@/lib/shared/similar";
import { certShort } from "@/lib/shared/cert";
import { won } from "@/components/result/labels";
import { useProductCatalog } from "./catalog";

const USAP_HOST = "equipment.usapickleball.org";

/** 출처의 종류. "공식"이라고 단정하지 않는다(제조사 공식 여부는 사람이 따로 확인한다, D-024) */
export function sourceKind(url: string, purchaseUrl?: string): string {
  const host = new URL(url).hostname;
  if (host === USAP_HOST) return "USA Pickleball 승인 목록";
  if (purchaseUrl && url === purchaseUrl) return "판매처";
  return host.replace(/^www\./, "");
}

/** 스펙 근거: 스펙 확인일과 출처 링크(D-030). 제휴 링크가 아니므로 대가 표시는 없다 */
export function SpecSources({ paddle }: { paddle: PaddleDisplay }) {
  if (!paddle.sources?.length) return null;
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-3" data-testid="spec-sources">
      <h3 className="text-small font-bold text-ink">스펙 근거</h3>
      {paddle.verified_at ? <p className="text-caption text-muted">스펙 확인 {paddle.verified_at}</p> : null}
      <ul className="flex flex-col gap-1">
        {paddle.sources.map((url) => {
          const kind = sourceKind(url, paddle.purchase?.url);
          return (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-small font-bold text-accent underline underline-offset-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
              >
                {kind} ↗<span className="sr-only"> (출처 페이지, 새 창)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 비슷한 제품 2개(T-024). 추천 조건과 무관하게 스펙으로 고르므로 가격·승인을 함께 보여 사용자가 판단하게 한다 */
export function SimilarProducts({ paddle }: { paddle: PaddleDisplay }) {
  const catalog = useProductCatalog();
  const matches = useMemo(
    () => (catalog ? similarPaddles(paddle, catalog.paddles, { exclude: catalog.exclude }) : []),
    [catalog, paddle],
  );
  if (!catalog || matches.length === 0) return null;
  const byId = new Map(catalog.paddles.map((p) => [p.id, p]));
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-3" data-testid="similar-products">
      <h3 className="text-small font-bold text-ink">비슷한 제품</h3>
      <p className="text-caption text-muted">추천 조건과 상관없이 스펙이 비슷한 제품입니다. 가격과 대회 승인을 확인해 주세요.</p>
      <ul className="flex flex-col gap-2">
        {matches.map((m) => {
          const other = byId.get(m.id);
          if (!other) return null;
          const name = `${other.brand} ${other.model}`;
          const cert = certShort(other.certification, catalog.today);
          const facts = [other.price_krw !== undefined ? `약 ${won(other.price_krw)}` : "가격 정보 없음", cert === "미확인" ? "승인 미확인" : cert].join(" · ");
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => catalog.openProduct(m.id)}
                data-testid="similar-item"
                data-paddle-id={m.id}
                aria-label={`${name}, ${m.reasons.join(", ")}, ${facts.replace("✓ ", "")}. 자세히 보기`}
                className="flex min-h-16 w-full items-center gap-3 rounded-card border border-line bg-card px-4 py-3 text-left outline-offset-2 transition-transform duration-[var(--duration-fast)] hover:border-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
              >
                <span className="min-w-0 flex-1" aria-hidden="true">
                  <span className="block truncate text-small font-bold text-ink">{name}</span>
                  <span className="mt-0.5 block text-caption text-accent-ink">{m.reasons.join(" · ")}</span>
                  <span className="mt-0.5 block text-caption text-muted">{facts}</span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-muted">
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 상세 끝에 붙는 영역: 스펙 근거 → 비슷한 제품 */
export function ProductExtras({ paddle }: { paddle: PaddleDisplay }) {
  return (
    <>
      <SpecSources paddle={paddle} />
      <SimilarProducts paddle={paddle} />
    </>
  );
}

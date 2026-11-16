"use client";

import type { Ref } from "react";
import type { PaddleDisplay } from "../../../data/schema";
import { HelpButton } from "@/components/help/HelpButton";
import { AdBadge, BuyButtons, CertBadge, Price, SpecDetails } from "@/components/result/ResultCard";
import { ProductExtras } from "./ProductExtras";

/**
 * 추천 정보 없이 그리는 제품 상세(T-024). 비슷한 제품을 눌렀을 때와 둘러보기(T-026)가 쓴다.
 * 적합도·추천 이유는 없고, 스펙·가격·승인·구매 버튼·스펙 근거·비슷한 제품 순서다.
 * 제휴 링크면 제목 근처에 "광고"를 붙이고, 대가 표시는 구매 버튼 묶음이 함께 그린다(D-022).
 */
export function ProductDetail({ paddle, today, headingRef }: { paddle: PaddleDisplay; today: string; headingRef?: Ref<HTMLHeadingElement> }) {
  const name = `${paddle.brand} ${paddle.model}`;
  return (
    <article className="flex flex-col gap-4" aria-label={name} data-testid="product-detail" data-paddle-id={paddle.id}>
      <header className="flex flex-col gap-1">
        {paddle.purchase?.is_affiliate ? (
          <p>
            <AdBadge className="" />
          </p>
        ) : null}
        <h3 ref={headingRef} tabIndex={-1} className="text-heading font-bold text-navy outline-none">
          {name}
        </h3>
      </header>
      <div className="flex flex-col gap-2">
        <Price paddle={paddle} today={today} />
        <div className="flex flex-wrap items-center gap-1">
          <CertBadge certification={paddle.certification} today={today} />
          <HelpButton term="certification" className="-my-3" />
        </div>
      </div>
      <BuyButtons paddle={paddle} name={name} />
      <SpecDetails paddle={paddle} />
      <ProductExtras paddle={paddle} />
    </article>
  );
}

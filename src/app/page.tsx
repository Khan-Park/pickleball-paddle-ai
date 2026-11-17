import type { Metadata } from "next";
import paddlesJson from "../../data/paddles.json";
import { paddlesSchema } from "../../data/schema";
import { openGraphFor } from "@/lib/shared/site";
import { EMPTY_FILTER, filterAndSort } from "@/lib/shared/browse";
import { StartButton } from "@/components/StartButton";
import { ShapeShowcase } from "@/components/home/ShapeShowcase";
import { ProductMarquee, type MarqueeItem } from "@/components/home/ProductMarquee";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ExamplePreview } from "@/components/home/ExamplePreview";
import { SiteHeader } from "@/components/site/SiteHeader";
import { HeroMedia } from "@/components/site/HeroMedia";
import { buttonClass } from "@/components/ui/Button";
import Link from "next/link";

/** 시작 화면만 og:url을 사이트 주소로 적는다(T-038) */
export const metadata: Metadata = { openGraph: openGraphFor("/") };

/** 신뢰 요소 3개(docs/plan/phase2.md 5.1). 과장 문구와 느낌표를 쓰지 않는다 */
const TRUST_POINTS = [
  { title: "스펙 근거", body: "무게·코어 두께·형태 같은 공개된 스펙으로 맞는 정도를 계산하고, 이유와 주의점을 함께 보여 드립니다." },
  { title: "수수료와 무관한 순위", body: "구매 링크나 수수료는 추천 순위에 영향을 주지 않습니다." },
  { title: "대회 승인 확인", body: "USA Pickleball 승인 여부를 확인한 날짜와 함께 보여 드립니다." },
] as const;

/**
 * 등록 제품 띠 항목(D-040). 빌드할 때 한 번 검증하고, 둘러보기와 같은 정렬(가격 낮은 순)로 보낸다.
 * 띠에 필요한 값만 골라 보낸다(가격·구매 링크는 브라우저로 보내지 않는다).
 * 필터가 비어 있으면 날짜는 정렬에 쓰이지 않는다.
 */
const MARQUEE_ITEMS: MarqueeItem[] = filterAndSort(paddlesSchema.parse(paddlesJson), EMPTY_FILTER, "2000-01-01").map((p) => ({
  id: p.id,
  brand: p.brand,
  model: p.model,
  shape: p.shape,
  weight_oz: p.weight_oz,
  core_mm: p.core_mm,
}));

/** 위에서부터 차례로 떠오르며 나타난다(80ms 간격, 동작 줄이기면 전역 규칙으로 꺼짐) */
const rise = (i: number, className = "") => ({ className: `animate-rise-in ${className}`.trim(), style: { animationDelay: `${i * 80}ms` } });

export default function Home() {
  return (
    <>
      <SiteHeader current="home" />
      <main className="flex flex-1 flex-col pb-8">
        {/* 히어로(T-043). 사진이 없으면 직접 그린 대체 배경(T-042) */}
        <HeroMedia slot="home-wide">
          <div className="mx-auto grid w-full max-w-xl gap-6 px-5 pt-8 pb-10 lg:max-w-6xl lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-8 lg:py-16">
            <header {...rise(0, "flex flex-col gap-3 lg:col-span-6")}>
              <h1 className="text-display font-bold lg:text-hero-title">
                질문 1분,{" "}
                {/* 데스크톱에서 "3개"만 다음 줄로 떨어지지 않게 강조 부분을 한 줄로 둔다 */}
                <br className="hidden lg:block" />
                {/* 라임은 글자 아래 꾸밈선으로만 쓴다. 글자색은 히어로 흰색 그대로(3.7) */}
                <span className="underline decoration-lime decoration-4 underline-offset-8">나에게 맞는 패들 3개</span>
              </h1>
              <p className="text-body text-on-hero-muted">경력·성향·예산을 알려 주시면 스펙 근거로 이유와 함께 보여 드립니다.</p>
              {/* 데스크톱 버튼. 모바일은 아래 고정 버튼을 쓴다 */}
              <div className="mt-3 hidden gap-3 lg:flex">
                <StartButton variant="hero" fullWidth={false} />
                <Link href="/browse" className={buttonClass({ variant: "heroSecondary" })}>
                  패들 둘러보기
                </Link>
              </div>
            </header>
            <div {...rise(1, "lg:col-span-6")}>
              <ShapeShowcase />
            </div>
          </div>
        </HeroMedia>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-10 px-5 pt-8 lg:max-w-6xl lg:px-8">
          <ul data-testid="trust-points" {...rise(2, "grid gap-3 lg:grid-cols-3 lg:gap-6")}>
            {TRUST_POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-bold text-on-accent">
                  ✓
                </span>
                <span>
                  <span className="block text-small font-bold text-ink">{p.title}</span>
                  <span className="block text-caption text-muted">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>

          <ProductMarquee items={MARQUEE_ITEMS} />
          <HowItWorks />
          <ExamplePreview />

          <p className="text-caption text-muted">제조사와 판매처가 공개한 스펙을 기준으로 한 추천입니다. 실제 타구감은 사람마다 다를 수 있습니다.</p>
        </div>

        {/* 모바일 하단 고정 시작 버튼(엄지 영역). 가리지 않도록 아래 여백을 둔다. 1024px 이상은 히어로 버튼을 쓴다 */}
        <div aria-hidden="true" className="h-20 lg:hidden" />
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur-sm lg:hidden" data-testid="sticky-start">
          <div {...rise(3, "mx-auto w-full max-w-xl px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]")}>
            <StartButton />
          </div>
        </div>
      </main>
    </>
  );
}

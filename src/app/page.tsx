import type { Metadata } from "next";
import { openGraphFor } from "@/lib/shared/site";
import { StartButton } from "@/components/StartButton";
import { ShapeShowcase } from "@/components/home/ShapeShowcase";
import { SiteHeader } from "@/components/site/SiteHeader";

/** 시작 화면만 og:url을 사이트 주소로 적는다(T-038) */
export const metadata: Metadata = { openGraph: openGraphFor("/") };

/** 신뢰 요소 3개(docs/plan/phase2.md 5.1). 과장 문구와 느낌표를 쓰지 않는다 */
const TRUST_POINTS = [
  { title: "스펙 근거", body: "무게·코어 두께·형태 같은 공개된 스펙으로 맞는 정도를 계산하고, 이유와 주의점을 함께 보여 드립니다." },
  { title: "수수료와 무관한 순위", body: "구매 링크나 수수료는 추천 순위에 영향을 주지 않습니다." },
  { title: "대회 승인 확인", body: "USA Pickleball 승인 여부를 확인한 날짜와 함께 보여 드립니다." },
] as const;

/** 위에서부터 차례로 떠오르며 나타난다(80ms 간격, 동작 줄이기면 전역 규칙으로 꺼짐) */
const rise = (i: number, className = "") => ({ className: `animate-rise-in ${className}`.trim(), style: { animationDelay: `${i * 80}ms` } });

export default function Home() {
  return (
    <>
      {/* 로고와 "패들 둘러보기"는 공통 헤더로 옮겼다(T-040. 전에는 이 화면 위쪽 바에 있었다) */}
      <SiteHeader current="home" />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-5 pt-6 pb-8">
        <header {...rise(0, "flex flex-col gap-2")}>
          <h1 className="text-display font-bold text-navy">질문 1분, 나에게 맞는 패들 3개</h1>
          <p className="text-body text-muted">경력·성향·예산을 알려 주시면 스펙 근거로 이유와 함께 보여 드립니다.</p>
        </header>

        <div {...rise(1)}>
          <ShapeShowcase />
        </div>

        <ul data-testid="trust-points" {...rise(2, "flex flex-col gap-3")}>
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

        <p className="text-caption text-muted">제조사와 판매처가 공개한 스펙을 기준으로 한 추천입니다. 실제 타구감은 사람마다 다를 수 있습니다.</p>

        {/* 하단 고정 시작 버튼(엄지 영역). 가리지 않도록 아래 여백을 둔다 */}
        <div aria-hidden="true" className="h-20" />
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur-sm">
          <div {...rise(3, "mx-auto w-full max-w-xl px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]")}>
            <StartButton />
          </div>
        </div>
      </main>
    </>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import paddlesJson from "../../../data/paddles.json";
import { paddlesSchema, toPaddleDisplay } from "../../../data/schema";
import { Shared, SharedSkeleton } from "@/components/share/Shared";
import { SiteHeader } from "@/components/site/SiteHeader";

/** 공유 주소마다 같은 빈 페이지가 검색에 잡히지 않게 색인하지 않는다(T-025). 미리보기는 사이트 공통 */
export const metadata: Metadata = { title: "공유받은 추천", robots: { index: false, follow: true } };

const paddles = paddlesSchema.parse(paddlesJson).map(toPaddleDisplay);

export default function SharedPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        {/* 주소의 ?p=는 빌드 때 알 수 없어 브라우저에서 읽는다(useSearchParams는 Suspense 안에서) */}
        <Suspense fallback={<SharedSkeleton />}>
          <Shared paddles={paddles} />
        </Suspense>
      </main>
    </>
  );
}

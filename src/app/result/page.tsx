import type { Metadata } from "next";
import paddlesJson from "../../../data/paddles.json";
import { paddlesSchema, toPaddleDisplay } from "../../../data/schema";
import { Result } from "@/components/result/Result";
import { SiteHeader } from "@/components/site/SiteHeader";

// 결과는 탭에 저장된 답변으로 그린다. 검색 결과에 빈 결과 화면이 나오지 않게 색인하지 않는다(T-027)
export const metadata: Metadata = { title: "추천 결과", robots: { index: false, follow: true } };

/**
 * 제품 데이터는 빌드할 때 한 번 검증한다. 형식이 틀리면 빌드가 실패한다.
 * 화면에 쓰는 필드만 골라 브라우저로 보낸다(toPaddleDisplay). 출처 URL·스펙 확인일은 보내고(D-030), 내부 메모는 보내지 않는다.
 */
const paddles = paddlesSchema.parse(paddlesJson).map(toPaddleDisplay);

export default function ResultPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Result paddles={paddles} />
      </main>
    </>
  );
}

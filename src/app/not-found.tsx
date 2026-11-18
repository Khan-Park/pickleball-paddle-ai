import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ShapeIcon } from "@/components/ShapeIcon";
import { BallIcon } from "@/components/BallIcon";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };

/** 없는 주소로 들어왔을 때. 정적 내보내기에서는 out/404.html이 된다 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-12">
        {/* 패들 그림 하나(T-051). 장식이라 화면 낭독기에는 숨긴다(그림 부품이 aria-hidden) */}
        <div className="flex items-end gap-2 text-navy" data-testid="not-found-art">
          <ShapeIcon shape="standard" size="lg" className="-rotate-12" />
          <BallIcon size="md" className="mb-1" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-title font-bold text-navy">페이지를 찾을 수 없습니다</h1>
          <p className="text-body text-muted">주소가 바뀌었거나 없는 페이지입니다. 처음 화면에서 다시 시작해 주세요.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* 주 버튼과 같은 모양(T-028: 제목색 navy를 바탕으로 쓰지 않는다) */}
          <Link href="/" className={buttonClass({ size: "md" })}>
            처음 화면으로
          </Link>
          <Link href="/browse" className={buttonClass({ variant: "secondary", size: "md" })}>
            패들 둘러보기
          </Link>
        </div>
      </main>
    </>
  );
}

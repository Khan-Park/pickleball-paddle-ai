import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };

/** 없는 주소로 들어왔을 때. 정적 내보내기에서는 out/404.html이 된다 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-12">
        <h1 className="text-2xl font-bold leading-snug text-navy">페이지를 찾을 수 없습니다</h1>
        <p className="text-base leading-relaxed text-muted">주소가 바뀌었거나 없는 페이지입니다. 처음 화면에서 다시 시작해 주세요.</p>
        <Link
          href="/"
          // 주 버튼과 같은 모양(T-028: 제목색 navy를 바탕으로 쓰지 않는다)
          className={buttonClass({ size: "md", className: "self-start" })}
        >
          처음 화면으로
        </Link>
      </main>
    </>
  );
}

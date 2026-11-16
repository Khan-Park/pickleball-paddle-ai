import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };

/** 없는 주소로 들어왔을 때. 정적 내보내기에서는 out/404.html이 된다 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-12">
      <h1 className="text-2xl font-bold leading-snug text-navy">페이지를 찾을 수 없습니다</h1>
      <p className="text-base leading-relaxed text-muted">주소가 바뀌었거나 없는 페이지입니다. 처음 화면에서 다시 시작해 주세요.</p>
      <Link
        href="/"
        className="self-start rounded-lg bg-navy px-5 py-3 text-base font-semibold text-white outline-offset-4 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
      >
        처음 화면으로
      </Link>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "추천 결과 | 피클볼 패들 추천" };

/** 임시 화면. 추천 카드와 안내 문구는 T-011에서 만든다 */
export default function ResultPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-5 py-12">
      <h1 className="text-2xl font-bold text-navy">추천 결과 화면을 준비하고 있습니다</h1>
      <p className="text-base leading-relaxed text-muted">답변은 이 브라우저 탭에만 보관되어 있습니다. 결과 화면이 완성되면 여기에서 추천을 볼 수 있습니다.</p>
      <Link href="/quiz" className="text-base font-semibold text-accent underline underline-offset-4">
        질문 다시 하기
      </Link>
    </main>
  );
}

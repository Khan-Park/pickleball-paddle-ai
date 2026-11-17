"use client";

import Link from "next/link";
import { clearAnswers } from "@/lib/quiz/storage";

/** 지금 보고 있는 화면. 헤더에서 해당 링크에 aria-current="page"를 단다 */
export type SiteSection = "home" | "browse" | "other";

const LINK = "inline-flex min-h-11 items-center rounded-control px-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent";
const MENU = `${LINK} text-small font-bold text-ink hover:text-accent aria-[current=page]:text-accent aria-[current=page]:underline aria-[current=page]:underline-offset-4`;

/**
 * 공통 헤더(T-040, docs/plan/m2.5-redesign.md 2장 헤더 행). 질문 화면을 뺀 모든 화면의 <main> 앞에 둔다.
 * <main> 밖에 있으므로 본문 첫 부분의 대가 표시는 헤더 다음·제목 앞이 된다(3.6, D-022).
 * 저장 아이콘은 T-050에서, "추천 가이드"는 넣지 않는다(U3). 로고는 한글 "패들핏"만(U6).
 */
export function SiteHeader({ current = "other" }: { current?: SiteSection }) {
  const page = (section: SiteSection) => (current === section ? ("page" as const) : undefined);
  return (
    <header className="border-b border-line bg-surface" data-testid="site-header">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-5 py-1 lg:gap-4 lg:px-8">
        <Link href="/" aria-current={page("home")} className={`${LINK} -ml-2 gap-2`}>
          {/* 앱 아이콘(src/app/icon.svg)과 같은 그림. 바탕은 어두운 화면에서도 남색인 상표 색(T-038) */}
          <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="var(--brand)" />
            <rect x="18" y="8" width="28" height="34" rx="9" fill="none" stroke="#ffffff" strokeWidth="4" />
            <rect x="28.5" y="42" width="7" height="15" rx="2" fill="#ffffff" />
            <circle cx="45" cy="47" r="5" fill="var(--accent-bright)" />
          </svg>
          <span className="text-body font-bold text-navy">패들핏</span>
        </Link>

        <nav aria-label="주요 메뉴" className="ml-auto">
          <ul className="flex items-center lg:gap-2">
            <li>
              {/* 시작 버튼과 같이 이 탭의 이전 답을 지우고 질문 화면으로 간다(StartButton) */}
              <Link href="/quiz" onClick={clearAnswers} className={MENU}>
                {/* 링크가 flex라 글자 조각이 따로 나뉘지 않게 한 span으로 묶는다. 좁은 화면에서는 "패들 찾기"로 줄인다 */}
                <span>
                  <span className="hidden sm:inline">내 </span>패들 찾기
                </span>
              </Link>
            </li>
            <li>
              <Link href="/browse" aria-current={page("browse")} className={MENU}>
                <span>
                  <span className="hidden sm:inline">패들 </span>둘러보기
                </span>
              </Link>
            </li>
            <li>
              {/* 검색칸 포커스는 T-048에서. 해시만 쓰고 쿼리 문자열은 쓰지 않는다(기획 5.2) */}
              <Link href="/browse#search" aria-label="패들 검색" className={`${LINK} min-w-11 justify-center text-ink hover:text-accent`}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

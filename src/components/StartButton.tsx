"use client";

import Link from "next/link";
import { clearAnswers } from "@/lib/quiz/storage";

/**
 * 시작 화면의 버튼. 누르면 이 탭에 남아 있던 답변을 지우고 질문 화면으로 간다.
 * 처음부터 다시 하려는 사람이나 같은 기기를 이어 쓰는 다른 사람에게 앞사람의 답이 보이지 않게 한다.
 * (결과 화면의 "답변 고치기"로 돌아갈 때는 지우지 않아 이어서 고칠 수 있다.)
 */
export function StartButton() {
  return (
    <Link
      href="/quiz"
      onClick={clearAnswers}
      className="rounded-lg bg-navy px-5 py-4 text-center text-base font-semibold text-white outline-offset-4 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
    >
      질문 시작하기
    </Link>
  );
}

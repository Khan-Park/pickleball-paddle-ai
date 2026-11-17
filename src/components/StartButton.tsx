"use client";

import Link from "next/link";
import { clearAnswers } from "@/lib/quiz/storage";
import { buttonClass, type ButtonVariant } from "@/components/ui/Button";

/**
 * 시작 화면의 버튼. 누르면 이 탭에 남아 있던 답변을 지우고 질문 화면으로 간다.
 * 처음부터 다시 하려는 사람이나 같은 기기를 이어 쓰는 다른 사람에게 앞사람의 답이 보이지 않게 한다.
 * (결과 화면의 "답변 고치기"로 돌아갈 때는 지우지 않아 이어서 고칠 수 있다.)
 */
export function StartButton({
  label = "질문 시작하기",
  variant = "primary",
  fullWidth = true,
}: { label?: string; variant?: ButtonVariant; fullWidth?: boolean } = {}) {
  return (
    <Link
      href="/quiz"
      onClick={clearAnswers}
      className={buttonClass({ variant, fullWidth })}
    >
      {label}
    </Link>
  );
}

import type { Metadata } from "next";
import { Quiz } from "@/components/quiz/Quiz";

export const metadata: Metadata = { title: "질문" };

export default function QuizPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Quiz />
    </main>
  );
}

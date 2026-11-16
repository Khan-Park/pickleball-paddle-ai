// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { Quiz } from "./Quiz";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const beginner: QuizAnswers = { experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" };

beforeEach(() => {
  push.mockClear();
  window.sessionStorage.clear();
});
afterEach(cleanup);

describe("질문 화면: 저장된 답변을 불러온 경우", () => {
  it("불러왔다는 안내를 보여 주고, 답을 건드리면 안내가 사라진다", () => {
    saveAnswers({ experience: "under_1y" });
    render(<Quiz />);
    expect(screen.getByRole("status").textContent).toContain("전에 답한 내용을 불러왔습니다");
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("저장된 답변이 없으면 안내가 없다", () => {
    render(<Quiz />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("저장된 답에 선택지에 없는 값이 있으면 그 질문으로 돌려보내고, 답하지 않았다는 말 대신 읽을 수 없다고 알린다", () => {
    saveAnswers({ ...beginner, budget: "under100" } as unknown as QuizAnswers);
    render(<Quiz />);
    fireEvent.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(push).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert").textContent ?? "";
    expect(alert).toContain("읽을 수 없는 값");
    expect(alert).not.toContain("답하지 않은");
  });
});

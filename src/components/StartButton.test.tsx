// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { loadAnswers, saveAnswers } from "@/lib/quiz/storage";
import { StartButton } from "./StartButton";

// 화면 이동은 하지 않고 눌렀을 때의 동작만 본다
vi.mock("next/link", () => ({
  default: ({ href, onClick, ...rest }: ComponentProps<"a">) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...rest}
    />
  ),
}));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("시작 버튼", () => {
  it("누르면 이 탭에 남아 있던 답변을 지우고 질문 화면으로 간다", () => {
    saveAnswers({ experience: "under_1y", arm: "no" });
    render(<StartButton />);
    const link = screen.getByRole("link", { name: "질문 시작하기" });
    expect(link.getAttribute("href")).toBe("/quiz");
    expect(loadAnswers()).not.toBeNull();
    fireEvent.click(link);
    expect(loadAnswers()).toBeNull();
  });
});

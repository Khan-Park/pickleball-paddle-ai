// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { saveAnswers } from "@/lib/quiz/storage";
import { Quiz } from "@/components/quiz/Quiz";
import { HelpButton } from "./HelpButton";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function")
    proto.close = function (this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
});
beforeEach(() => window.sessionStorage.clear());
afterEach(cleanup);

const openDialog = () => document.querySelector("dialog[open]") as HTMLElement | null;

describe("HelpButton", () => {
  it("누르면 그 용어의 시트가 열리고, 시트 안에서 다른 용어로 바꿀 수 있다", () => {
    render(<HelpButton term="weight" label="무게란?" />);
    fireEvent.click(screen.getByRole("button", { name: "무게 설명 보기" }));
    expect(openDialog()).not.toBeNull();
    expect(within(openDialog()!).getByRole("heading").textContent).toBe("무게");
    fireEvent.click(within(openDialog()!).getByRole("button", { name: "코어 두께" }));
    expect(within(openDialog()!).getByRole("heading").textContent).toBe("코어 두께");
    expect(openDialog()!.querySelector("[data-term]")!.getAttribute("data-term")).toBe("core");
  });

  it("다시 열면 처음 용어로 돌아온다", () => {
    render(<HelpButton term="shape" />);
    fireEvent.click(screen.getByRole("button", { name: "형태 설명 보기" }));
    fireEvent.click(within(openDialog()!).getByRole("button", { name: "무게" }));
    fireEvent.click(within(openDialog()!).getByRole("button", { name: "닫기" }));
    fireEvent.click(screen.getByRole("button", { name: "형태 설명 보기" }));
    expect(within(openDialog()!).getByRole("heading").textContent).toBe("형태");
  });
});

describe("질문 화면의 용어 도움말", () => {
  it("무게·선호 모양·대회 질문에만 있고, 눌러도 답이 선택되거나 넘어가지 않는다", () => {
    saveAnswers({ experience: "1_to_3y", play_style: "balanced" });
    render(<Quiz />);
    const legend = () => screen.getByRole("group").querySelector("legend")!.textContent;
    expect(legend()).toContain("무게");
    fireEvent.click(screen.getByRole("button", { name: "무게 설명 보기" }));
    expect(openDialog()).not.toBeNull();
    expect(legend()).toContain("무게");
    expect(screen.queryAllByRole("button", { pressed: true, hidden: true })).toHaveLength(0);
  });

  it("경력 질문에는 도움말 버튼이 없다", () => {
    render(<Quiz />);
    expect(screen.queryByRole("button", { name: /설명 보기/ })).toBeNull();
  });
});

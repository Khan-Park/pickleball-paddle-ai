// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { toPaddleDisplay, type Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { loadAnswersRaw, saveAnswers } from "@/lib/quiz/storage";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { SITE_URL } from "@/lib/shared/site";
import { todayLocal } from "@/components/result/labels";
import { Result } from "@/components/result/Result";
import { Shared } from "./Shared";

let search = new URLSearchParams();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => search }));

// jsdom 31에는 <dialog>의 showModal·close가 없다(ui.test.tsx와 같은 최소 대체)
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
afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
});

const today = todayLocal();
const p = (id: string, o: Partial<Paddle> = {}) =>
  toPaddleDisplay(fakePaddle({ id, brand: "가짜", model: id, price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today }, ...o }));
const PADDLES = [p("a-1", { weight_oz: 7.6 }), p("b-2", { weight_oz: 7.8 }), p("c-3", { weight_oz: 8.0 }), p("d-4", { weight_oz: 8.4 }), p("e-5", { weight_oz: 8.6 })];
/** 팔 불편 답을 포함한 답변. 공유 주소·글에 새지 않아야 한다 */
const answers: QuizAnswers = { experience: "under_1y", play_style: "unsure", weight: "any", arm: "yes", budget: "any", tournament: "no" };

describe("결과 화면 공유(T-025)", () => {
  it("기본 공유 창이 있으면 '공유하기'로 제품 id만 담은 주소와 공유 글을 넘기고, 답변은 넘기지 않는다", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    saveAnswers(answers);
    render(<Result paddles={PADDLES} />);
    const box = screen.getByTestId("share");
    await act(async () => {
      fireEvent.click(within(box).getByRole("button", { name: "공유하기" }));
    });
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0]![0] as { title: string; text: string; url: string };
    const url = new URL(arg.url);
    expect(`${url.origin}${url.pathname}`).toBe(`${SITE_URL}/shared`);
    expect([...url.searchParams.keys()]).toEqual(["p"]);
    expect(url.searchParams.get("p")!.split(",")).toHaveLength(3);
    const all = JSON.stringify(arg);
    for (const word of ["arm", "yes", "under_1y", "팔", "불편", "가짜"]) expect(all).not.toContain(word);
  });

  it("공유 창을 닫아도(취소) 오류를 보이지 않는다", async () => {
    Object.defineProperty(navigator, "share", { value: vi.fn().mockRejectedValue(new DOMException("cancel", "AbortError")), configurable: true });
    saveAnswers(answers);
    render(<Result paddles={PADDLES} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "공유하기" }));
    });
    expect(screen.getByTestId("share").textContent).not.toMatch(/오류|실패/);
  });

  it("기본 공유 창이 없으면 '공유하기'를 숨기고, '링크 복사'는 복사 후 안내를 보인다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    saveAnswers(answers);
    render(<Result paddles={PADDLES} />);
    const box = screen.getByTestId("share");
    expect(within(box).queryByRole("button", { name: "공유하기" })).toBeNull();
    await act(async () => {
      fireEvent.click(within(box).getByRole("button", { name: "링크 복사" }));
    });
    expect(writeText.mock.calls[0]![0]).toMatch(new RegExp(`^${SITE_URL}/shared\\?p=`));
    expect(within(box).getByRole("status").textContent).toBe("링크를 복사했습니다.");
  });

  it("복사 기능을 쓸 수 없으면 주소를 읽기 전용 칸에 보인다", async () => {
    saveAnswers(answers);
    render(<Result paddles={PADDLES} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "링크 복사" }));
    });
    const input = screen.getByTestId("share-url") as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.value).toMatch(/\/shared\?p=/);
  });
});

describe("공유받은 화면(T-025)", () => {
  it("공유된 순서대로 순위와 함께 보이고, 답변이 담겨 있지 않다고 안내한다", () => {
    search = new URLSearchParams("p=c-3,a-1,b-2");
    render(<Shared paddles={PADDLES} />);
    expect(screen.getAllByTestId("shared-row").map((r) => r.dataset.paddleId)).toEqual(["c-3", "a-1", "b-2"]);
    expect(screen.getAllByTestId("shared-row")[0]!.getAttribute("aria-label")).toMatch(/^1순위 가짜 c-3/);
    expect(document.body.textContent).toContain("공유한 사람의 답변은 담겨 있지 않습니다");
  });

  it("목록에 없는 제품 수를 알리고, 읽을 수 있는 제품이 없으면 안내한다", () => {
    search = new URLSearchParams("p=a-1,gone-9");
    render(<Shared paddles={PADDLES} />);
    expect(screen.getByTestId("shared-missing").textContent).toBe("1개는 지금 목록에 없는 제품입니다.");
    cleanup();
    search = new URLSearchParams("p=<script>");
    render(<Shared paddles={PADDLES} />);
    expect(screen.getByTestId("shared-empty")).toBeDefined();
  });

  it("행을 누르면 '제품 자세히' 시트가 열리고, 비슷한 제품에서 공유된 제품을 뺀다", () => {
    search = new URLSearchParams("p=a-1,b-2,c-3");
    render(<Shared paddles={PADDLES} />);
    fireEvent.click(screen.getAllByTestId("shared-row")[0]!);
    const sheet = document.querySelector("dialog[open]") as HTMLElement;
    expect(within(sheet).getByTestId("product-detail").dataset.paddleId).toBe("a-1");
    const similar = within(sheet).getAllByTestId("similar-item").map((s) => s.dataset.paddleId);
    for (const id of ["a-1", "b-2", "c-3"]) expect(similar).not.toContain(id);
  });

  it("'나도 질문에 답하고 추천받기'는 탭에 남은 답변을 지운다", () => {
    search = new URLSearchParams("p=a-1");
    saveAnswers(answers);
    render(<Shared paddles={PADDLES} />);
    const link = screen.getByRole("link", { name: "나도 질문에 답하고 추천받기" });
    expect(link.getAttribute("href")).toBe("/quiz");
    fireEvent.click(link);
    expect(loadAnswersRaw()).toBeNull();
  });
});

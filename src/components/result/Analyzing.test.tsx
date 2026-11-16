// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { saveAnswers } from "@/lib/quiz/storage";
import { markSubmitted, peekAnalyzeMode, STEP_MS } from "./analyzing-flag";
import { todayLocal } from "./labels";
import { Result } from "./Result";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const today = todayLocal();
const PADDLES: Paddle[] = [
  fakePaddle({ id: "a", brand: "가짜", model: "에이", price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today } }),
  fakePaddle({ id: "b", brand: "가짜", model: "비", core_mm: 14, price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today } }),
  fakePaddle({ id: "c", brand: "가짜", model: "씨", weight_oz: 7.6, price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today } }),
];
const answers = { experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" } as const;
const FULL = STEP_MS.full * 3 + STEP_MS.full / 2;

const analyzing = () => screen.queryByTestId("analyzing");
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  saveAnswers(answers);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("분석 중 화면", () => {
  it("질문을 막 끝냈을 때만 보이고, 단계 문구에 실제 제품 수를 쓴 뒤 결과로 넘어간다", () => {
    markSubmitted();
    render(<Result paddles={PADDLES} />);
    expect(analyzing()).not.toBeNull();
    expect(screen.getByText(`${PADDLES.length}개 패들 스펙 비교`)).toBeDefined();
    advance(STEP_MS.full);
    expect(screen.getByText("조건 확인").closest("li")!.dataset.state).toBe("done");
    advance(FULL);
    expect(analyzing()).toBeNull();
    expect(screen.getAllByTestId("result-card-wrap").length).toBeGreaterThan(0);
  });

  it("표시는 한 번 쓰면 지워져 새로고침(다시 그리기)에서는 나오지 않는다", () => {
    markSubmitted();
    const first = render(<Result paddles={PADDLES} />);
    expect(analyzing()).not.toBeNull();
    expect(peekAnalyzeMode()).toBeNull();
    first.unmount();
    render(<Result paddles={PADDLES} />);
    expect(analyzing()).toBeNull();
  });

  it("결과 주소로 바로 들어오면 나오지 않는다", () => {
    render(<Result paddles={PADDLES} />);
    expect(analyzing()).toBeNull();
  });

  it("'건너뛰기'나 화면을 누르면 바로 결과로 간다", () => {
    markSubmitted();
    render(<Result paddles={PADDLES} />);
    fireEvent.click(screen.getByRole("button", { name: /건너뛰기/ }));
    expect(analyzing()).toBeNull();

    cleanup();
    markSubmitted();
    render(<Result paddles={PADDLES} />);
    fireEvent.click(screen.getByTestId("analyzing"));
    expect(analyzing()).toBeNull();
  });

  it("이 탭에서 한 번 본 뒤 다시 제출하면 짧게 보여 준다", () => {
    markSubmitted();
    expect(peekAnalyzeMode()).toBe("full");
    const first = render(<Result paddles={PADDLES} />);
    advance(FULL);
    first.unmount();
    markSubmitted();
    expect(peekAnalyzeMode()).toBe("short");
    render(<Result paddles={PADDLES} />);
    expect(analyzing()).not.toBeNull();
    advance(STEP_MS.short * 3 + STEP_MS.short / 2);
    expect(analyzing()).toBeNull();
  });

  it("동작 줄이기를 켠 사용자에게는 보여 주지 않는다", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      markSubmitted();
      render(<Result paddles={PADDLES} />);
      expect(analyzing()).toBeNull();
      expect(screen.getAllByTestId("result-card-wrap").length).toBeGreaterThan(0);
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("결과 등장 연출", () => {
  it("카드가 순위 순서대로 80ms씩 늦게 나타난다", () => {
    render(<Result paddles={PADDLES} />);
    const delays = screen.getAllByTestId("result-card-wrap").map((el) => el.style.animationDelay);
    expect(delays).toEqual(delays.map((_, i) => `${i * 80}ms`));
  });
});

describe("결과 화면을 읽는 동안", () => {
  it("저장된 답변이 없으면(질문 화면으로 보내는 동안) 카드 스켈레톤과 화면 낭독기용 문구를 보여 준다", () => {
    window.sessionStorage.clear();
    const { container } = render(<Result paddles={PADDLES} />);
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
    expect(screen.getByRole("status").textContent).toContain("답변을 확인하고 있습니다");
    expect(container.querySelectorAll("[data-skeleton]").length).toBeGreaterThan(0);
  });
});

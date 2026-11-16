// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { SHOWCASE_INTERVAL_MS, ShapeShowcase } from "./ShapeShowcase";

const activeShape = () => document.querySelector("[data-active='true'] svg")?.getAttribute("data-shape");

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("형태 그림 강조(T-023)", () => {
  it("형태 4개를 그리고 2초마다 다음 형태를 강조한다", () => {
    render(<ShapeShowcase />);
    expect(document.querySelectorAll("svg[data-shape]")).toHaveLength(4);
    expect(activeShape()).toBe("standard");
    act(() => {
      vi.advanceTimersByTime(SHOWCASE_INTERVAL_MS);
    });
    expect(activeShape()).toBe("widebody");
    act(() => {
      vi.advanceTimersByTime(SHOWCASE_INTERVAL_MS * 3);
    });
    expect(activeShape()).toBe("standard");
  });

  it("그림은 화면 낭독기에 숨기고 한 문장으로 알린다", () => {
    render(<ShapeShowcase />);
    expect(screen.getByRole("list", { hidden: true }).getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText(/형태 4가지를 비교/)).toBeDefined();
  });

  it("동작 줄이기를 켠 사용자에게는 강조가 바뀌지 않는다", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      render(<ShapeShowcase />);
      act(() => {
        vi.advanceTimersByTime(SHOWCASE_INTERVAL_MS * 2);
      });
      expect(activeShape()).toBe("standard");
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("시작 화면(T-023)", () => {
  it("제목, 신뢰 요소 3개, 질문 시작 버튼이 있고 과장 표현(느낌표)이 없다", () => {
    const { container } = render(<Home />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("나에게 맞는 패들 3개");
    expect(screen.getByTestId("trust-points").querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "질문 시작하기" }).getAttribute("href")).toBe("/quiz");
    expect(container.textContent).not.toContain("!");
  });
});

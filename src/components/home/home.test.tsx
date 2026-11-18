// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import paddlesJson from "../../../data/paddles.json";
import { paddlesSchema } from "../../../data/schema";
import { EMPTY_FILTER, filterAndSort } from "@/lib/shared/browse";
import Home from "@/app/page";
import { SHOWCASE_INTERVAL_MS, SHOWCASE_ROUNDS, ShapeShowcase } from "./ShapeShowcase";
import { EXAMPLES } from "./ExamplePreview";
import { weightBand } from "@/lib/recommend/axes";

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

  it("3바퀴 돈 뒤 표준형에서 멈춘다(T-033)", () => {
    render(<ShapeShowcase />);
    act(() => {
      vi.advanceTimersByTime(SHOWCASE_INTERVAL_MS * 4 * SHOWCASE_ROUNDS);
    });
    expect(activeShape()).toBe("standard");
    act(() => {
      vi.advanceTimersByTime(SHOWCASE_INTERVAL_MS * 5);
    });
    expect(activeShape()).toBe("standard");
    expect(vi.getTimerCount()).toBe(0);
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
    // 모바일 하단 고정 버튼과 데스크톱 히어로 버튼 두 개(폭에 따라 하나만 보인다, T-043)
    const starts = screen.getAllByRole("link", { name: "질문 시작하기" });
    expect(starts).toHaveLength(2);
    for (const a of starts) expect(a.getAttribute("href")).toBe("/quiz");
    expect(container.textContent).not.toContain("!");
  });
});

describe("시작 화면 개편(T-043)", () => {
  const PRICES = paddlesSchema.parse(paddlesJson);
  const brands = [...new Set(PRICES.map((p) => p.brand))];

  it("히어로 안에 h1 하나, 히어로 버튼은 1024px 이상에서만, 고정 버튼은 그 아래에서만 보인다", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const hero = screen.getByTestId("hero-media");
    expect(within(hero).getByRole("heading", { level: 1 })).toBeDefined();
    const heroStart = within(hero).getByRole("link", { name: "질문 시작하기" });
    expect(heroStart.parentElement!.className).toMatch(/\bhidden\b.*\blg:flex\b/);
    expect(heroStart.className).toContain("bg-accent-on-hero");
    expect(heroStart.className).toContain("focus-visible:outline-focus-on-hero");
    expect(screen.getByTestId("sticky-start").className).toContain("lg:hidden");
  });

  it("결과 미리보기 예시에는 실제 브랜드명이 없고 '예시' 표시가 있다", () => {
    render(<Home />);
    const example = screen.getByTestId("example-preview");
    expect(example.textContent).toContain("예시");
    for (const brand of brands) expect(example.textContent, brand).not.toContain(brand);
  });

  it("3단계 설명이 순서대로 있다", () => {
    render(<Home />);
    const steps = within(screen.getByTestId("how-it-works")).getAllByRole("listitem");
    expect(steps.map((li) => li.textContent)).toEqual([
      expect.stringContaining("질문에 답하기"),
      expect.stringContaining("스펙 비교"),
      expect.stringContaining("이유와 함께 3개"),
    ]);
  });
});

describe("등록 제품 띠(D-040, T-043)", () => {
  const ALL = paddlesSchema.parse(paddlesJson);
  const items = (container: HTMLElement) => [...container.querySelectorAll("[data-testid='marquee-item']")];

  it("데이터 전체를 가격 낮은 순으로 한 벌만 읽히게 보여 주고, 복사본은 숨기고 포커스를 받지 않는다", () => {
    render(<Home />);
    const marquee = screen.getByTestId("product-marquee");
    expect(within(marquee).getByRole("heading", { level: 2 }).textContent).toBe(`등록된 패들 ${ALL.length}개`);
    const track = screen.getByTestId("marquee-track");
    const [main, copy] = [...track.querySelectorAll(":scope > ul")] as HTMLElement[];
    expect(copy!.getAttribute("aria-hidden")).toBe("true");
    expect(copy!.hasAttribute("inert")).toBe(true);
    const shown = items(main!).map((li) => li.textContent);
    const expected = filterAndSort(ALL, EMPTY_FILTER, "2000-01-01").map((p) => p.model);
    expect(shown).toHaveLength(ALL.length);
    expected.forEach((model, i) => expect(shown[i]).toContain(model));
    expect(items(copy!)).toHaveLength(ALL.length);
  });

  it("구매 링크·가격·적합도·순위가 없고, 링크는 '전체 둘러보기' 하나뿐이다", () => {
    render(<Home />);
    const marquee = screen.getByTestId("product-marquee");
    const text = marquee.textContent ?? "";
    expect(text).not.toMatch(/\d원|잘 맞음|보통|순위:|\d순위/);
    const links = [...marquee.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/browse"]);
    for (const p of ALL) if (p.purchase?.url) expect(marquee.innerHTML).not.toContain(p.purchase.url);
  });

  it("멈추기 버튼으로 멈추고 다시 움직인다", () => {
    render(<Home />);
    const button = screen.getByRole("button", { name: "멈추기" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    act(() => button.click());
    expect(screen.getByRole("button", { name: "다시 움직이기" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("marquee-track").className).toContain("[animation-play-state:paused]");
    act(() => screen.getByRole("button", { name: "다시 움직이기" }).click());
    expect(screen.getByTestId("marquee-track").dataset.paused).toBe("false");
  });

  it("마우스 올림·포커스 때 멈추는 클래스가 있고, 움직임은 transform 애니메이션이다", () => {
    render(<Home />);
    const cls = screen.getByTestId("marquee-track").className;
    expect(cls).toContain("animate-marquee");
    expect(cls).toContain("group-hover:[animation-play-state:paused]");
    expect(cls).toContain("group-focus-within:[animation-play-state:paused]");
  });

  it("동작 줄이기면 복사본·멈춤 버튼 없이 움직이지 않는 가로 목록이다", () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    try {
      render(<Home />);
      expect(screen.queryByTestId("marquee-track")).toBeNull();
      expect(screen.queryByRole("button", { name: "멈추기" })).toBeNull();
      expect(items(screen.getByTestId("marquee-static"))).toHaveLength(ALL.length);
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("결과 미리보기 예시(T-054)", () => {
  it("예시마다 지금 데이터에 같은 형태·무게대·코어 제품이 있다(기획 3.2)", () => {
    const paddles = paddlesSchema.parse(paddlesJson);
    for (const ex of EXAMPLES) {
      const match = paddles.filter((p) => p.shape === ex.shape && weightBand(p.weight_oz) === ex.band && p.core_mm === ex.core_mm);
      expect(match.length, `${ex.shape}·${ex.band}·${ex.core_mm}mm`).toBeGreaterThan(0);
    }
  });
});

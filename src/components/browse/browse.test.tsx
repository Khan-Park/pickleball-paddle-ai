// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { toPaddleDisplay, type Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { saveAnswers } from "@/lib/quiz/storage";
import { todayLocal } from "@/components/result/labels";
import { Result } from "@/components/result/Result";
import Home from "@/app/page";
import { Browse } from "./Browse";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

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
});

const today = todayLocal();
const p = (id: string, o: Partial<Paddle>) =>
  toPaddleDisplay(fakePaddle({ id, brand: "가짜", model: id, price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today }, ...o }));
const PADDLES = [
  p("wide-mid", { shape: "widebody", price_krw: 150_000 }),
  p("long-high", { shape: "elongated", price_krw: 320_000 }),
  p("std-low", { shape: "standard", price_krw: 90_000, certification: { usa_pickleball: "unknown", checked_at: today } }),
  p("hyb-mid", { shape: "hybrid", price_krw: 180_000 }),
];
const rows = () => screen.getAllByTestId("browse-row").map((r) => r.dataset.paddleId);
/** 필터 칩(목록 행 이름에도 형태가 들어 있어 필터 영역 안에서만 찾는다) */
const chip = (name: string) => {
  // 필터는 처음에 접혀 있다(T-037). 칩을 찾기 전에 펼친다
  const toggle = screen.getByTestId("browse-filter-toggle");
  if (toggle.getAttribute("aria-expanded") === "false") fireEvent.click(toggle);
  return within(screen.getByTestId("browse-filters")).getByRole("button", { name: new RegExp(name) });
};

describe("둘러보기 화면(T-026)", () => {
  it("전체를 가격 낮은 순으로 보이고 개수를 적는다", () => {
    render(<Browse paddles={PADDLES} />);
    expect(rows()).toEqual(["std-low", "wide-mid", "hyb-mid", "long-high"]);
    expect(screen.getByTestId("browse-count").textContent).toBe("4개 중 4개");
  });

  it("칩을 누르면 목록과 개수가 바뀌고 aria-pressed로 상태를 알린다", () => {
    render(<Browse paddles={PADDLES} />);
    fireEvent.click(chip("넓은 형"));
    fireEvent.click(chip("하이브리드형"));
    expect(chip("넓은 형").getAttribute("aria-pressed")).toBe("true");
    expect(rows()).toEqual(["wide-mid", "hyb-mid"]);
    fireEvent.click(chip("10~20만"));
    expect(rows()).toEqual(["wide-mid", "hyb-mid"]);
    fireEvent.click(chip("넓은 형"));
    expect(chip("넓은 형").getAttribute("aria-pressed")).toBe("false");
    expect(rows()).toEqual(["hyb-mid"]);
    expect(screen.getByTestId("browse-count").textContent).toBe("4개 중 1개");
  });

  it("가격 칩은 하나만 고르고, 같은 칩을 다시 누르면 풀린다. 승인 칩은 승인 확인된 제품만 남긴다", () => {
    render(<Browse paddles={PADDLES} />);
    fireEvent.click(chip("30만 넘음"));
    expect(rows()).toEqual(["long-high"]);
    fireEvent.click(chip("10만 이하"));
    expect(chip("30만 넘음").getAttribute("aria-pressed")).toBe("false");
    expect(rows()).toEqual(["std-low"]);
    fireEvent.click(chip("10만 이하"));
    fireEvent.click(chip("승인 확인된 제품만"));
    expect(rows()).not.toContain("std-low");
  });

  it("맞는 제품이 없으면 안내와 '필터 지우기'를 보이고, 누르면 전체로 돌아간다", () => {
    render(<Browse paddles={PADDLES} />);
    fireEvent.click(chip("표준형"));
    fireEvent.click(chip("승인 확인된 제품만"));
    const empty = screen.getByTestId("browse-empty");
    expect(empty.textContent).toContain("조건에 맞는 제품이 없습니다");
    fireEvent.click(within(empty).getByRole("button", { name: "필터 지우기" }));
    expect(rows()).toHaveLength(4);
  });

  it("행을 누르면 '제품 자세히' 시트가 열리고, 비슷한 제품은 자기 자신만 뺀다", () => {
    render(<Browse paddles={PADDLES} />);
    fireEvent.click(screen.getAllByTestId("browse-row")[0]!);
    const sheet = document.querySelector("dialog[open]") as HTMLElement;
    expect(within(sheet).getByTestId("product-detail").dataset.paddleId).toBe("std-low");
    const similar = within(sheet).getAllByTestId("similar-item").map((s) => s.dataset.paddleId);
    expect(similar).toHaveLength(2);
    expect(similar).not.toContain("std-low");
  });

  it("제휴 링크가 있으면 제목보다 앞에 대가 표시를 두고 행에 '광고'를 붙인다. 순서는 바뀌지 않는다", () => {
    const withAd = PADDLES.map((x) => (x.id === "long-high" ? { ...x, purchase: { url: "https://link.coupang.com/a/x", is_affiliate: true, program: "coupang_partners" as const } } : x));
    render(<Browse paddles={withAd} />);
    const notice = screen.getByTestId("affiliate-page-notice");
    expect(notice.textContent).toContain("쿠팡 파트너스");
    expect(notice.compareDocumentPosition(screen.getByRole("heading", { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const adRow = screen.getAllByTestId("browse-row").find((r) => r.dataset.paddleId === "long-high")!;
    expect(within(adRow).getByTestId("affiliate-badge")).toBeDefined();
    expect(rows()).toEqual(["std-low", "wide-mid", "hyb-mid", "long-high"]);
  });
});

describe("필터 접기(T-037)", () => {
  it("처음에는 접혀 있고, 펼치면 칩이 보이며, 접어도 고른 조건 요약과 개수가 보인다", () => {
    render(<Browse paddles={PADDLES} />);
    const toggle = screen.getByTestId("browse-filter-toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByTestId("browse-filters").hidden).toBe(true);
    expect(screen.getByTestId("browse-filter-summary").textContent).toBe("모든 제품");
    fireEvent.click(chip("넓은 형"));
    fireEvent.click(chip("10~20만"));
    fireEvent.click(screen.getByTestId("browse-filter-toggle"));
    expect(screen.getByTestId("browse-filters").hidden).toBe(true);
    expect(screen.getByTestId("browse-filter-summary").textContent).toBe("넓은 형 · 10~20만");
    expect(screen.getByTestId("browse-count").textContent).toBe("4개 중 1개");
    fireEvent.click(screen.getByRole("button", { name: "필터 지우기" }));
    expect(screen.getByTestId("browse-filter-summary").textContent).toBe("모든 제품");
  });
});

describe("둘러보기로 가는 길(T-026)", () => {
  it("시작 화면에 '질문 없이 둘러보기'가 있다", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "질문 없이 둘러보기" }).getAttribute("href")).toBe("/browse");
  });

  it("결과 화면에 '전체 둘러보기'가 있다", () => {
    saveAnswers({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" });
    render(<Result paddles={PADDLES} />);
    expect(screen.getByRole("link", { name: "전체 둘러보기" }).getAttribute("href")).toBe("/browse");
  });
});

// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { toPaddleDisplay, type Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { todayLocal } from "@/components/result/labels";
import { Result } from "@/components/result/Result";
import { ProductDetail } from "./ProductDetail";
import { sourceKind } from "./ProductExtras";

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
beforeEach(() => window.sessionStorage.clear());
afterEach(cleanup);

const today = todayLocal();
const p = (id: string, o: Partial<Paddle>) => {
  const shop = `https://shop.example.com/${id}`;
  return fakePaddle({
    id,
    brand: "가짜",
    model: id,
    price_checked_at: today,
    verified_at: today,
    certification: { usa_pickleball: "approved", checked_at: today },
    sources: ["https://www.maker.example.com/p", "https://equipment.usapickleball.org/x", shop],
    purchase: { url: shop, is_affiliate: false },
    notes: "내부 메모",
    ...o,
  });
};
// 넓은 형 가벼운 제품 3개가 추천되고, 나머지가 비슷한 제품 후보가 된다
const PADDLES: Paddle[] = [
  p("w1", { weight_oz: 7.6, core_mm: 16, shape: "widebody", price_krw: 120000 }),
  p("w2", { weight_oz: 7.7, core_mm: 16, shape: "widebody", price_krw: 130000 }),
  p("w3", { weight_oz: 7.8, core_mm: 16, shape: "widebody", price_krw: 140000 }),
  p("w4", { weight_oz: 7.9, core_mm: 16, shape: "widebody", price_krw: 480000 }),
  p("h1", { weight_oz: 7.7, core_mm: 16, shape: "hybrid", price_krw: 150000 }),
  p("e1", { weight_oz: 8.6, core_mm: 13, shape: "elongated", price_krw: 160000 }),
];
const answers: QuizAnswers = { experience: "1_to_3y", play_style: "control", weight: "light", arm: "no", shapes: ["widebody"], budget: "any", tournament: "no" };

describe("스펙 근거(T-024, D-030)", () => {
  it("출처를 종류와 함께 새 창 링크로 보이고, 스펙 확인일을 적는다. 내부 메모는 없다", () => {
    const paddle = toPaddleDisplay(PADDLES[0]!);
    render(<ProductDetail paddle={paddle} today={today} />);
    const section = screen.getByTestId("spec-sources");
    expect(section.textContent).toContain(`스펙 확인 ${today}`);
    const links = within(section).getAllByRole("link");
    expect(links.map((a) => a.textContent!.replace(/ ↗.*/, ""))).toEqual(["maker.example.com", "USA Pickleball 승인 목록", "판매처"]);
    for (const a of links) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
    expect(document.body.textContent).not.toContain("내부 메모");
    // 목록 정보가 없으면(카드만 그린 경우) 비슷한 제품은 그리지 않는다
    expect(screen.queryByTestId("similar-products")).toBeNull();
  });

  it("출처 종류는 '공식'이라고 단정하지 않는다", () => {
    expect(sourceKind("https://www.joola.com/p")).toBe("joola.com");
    expect(sourceKind("https://equipment.usapickleball.org/a")).toBe("USA Pickleball 승인 목록");
    expect(sourceKind("https://s.example.com/1", "https://s.example.com/1")).toBe("판매처");
  });
});

describe("비슷한 제품(T-024)", () => {
  /** 화면의 1순위 카드와 2·3순위 행 이름에서 추천된 제품 id를 읽는다(모델명이 id와 같다) */
  const recommendedIds = () =>
    [screen.getByRole("article").getAttribute("aria-label")!, ...screen.getAllByTestId("rank-row").map((r) => r.getAttribute("aria-label")!)].map(
      (label) => /가짜 (\w+)/.exec(label)![1]!,
    );

  it("결과 화면에서는 이번 추천 3개를 빼고 2개를 보이며, 가격·승인과 비슷한 이유를 함께 적는다", () => {
    saveAnswers(answers);
    render(<Result paddles={PADDLES.map(toPaddleDisplay)} />);
    const top = screen.getByRole("article");
    const items = within(top).getAllByTestId("similar-item");
    expect(items).toHaveLength(2);
    const recommended = recommendedIds();
    expect(recommended).toHaveLength(3);
    for (const item of items) expect(recommended).not.toContain(item.dataset.paddleId);
    expect(items[0]!.textContent).toMatch(/약 [\d,]+원/);
    expect(items[0]!.textContent).toContain("✓ 승인");
    expect(items[0]!.textContent).toMatch(/형 · 무게/);
    expect(within(top).getByTestId("similar-products").textContent).toContain("추천 조건과 상관없이");
  });

  it("누르면 '제품 자세히' 시트가 열리고, 그 안에서 다시 누르면 시트를 겹치지 않고 내용을 바꾸며 '이전 제품'으로 돌아간다", () => {
    saveAnswers(answers);
    render(<Result paddles={PADDLES.map(toPaddleDisplay)} />);
    const top = screen.getByRole("article");
    const first = within(top).getAllByTestId("similar-item")[0]!;
    const firstId = first.dataset.paddleId!;
    fireEvent.click(first);
    const sheet = () => [...document.querySelectorAll("dialog[open]")].find((d) => d.querySelector("[data-testid='product-detail']")) as HTMLElement;
    expect(within(sheet()).getByTestId("product-detail").dataset.paddleId).toBe(firstId);
    expect(within(sheet()).queryByRole("button", { name: /이전 제품/ })).toBeNull();

    const next = within(sheet()).getAllByTestId("similar-item")[0]!;
    const nextId = next.dataset.paddleId!;
    expect(nextId).not.toBe(firstId);
    fireEvent.click(next);
    expect(document.querySelectorAll("dialog[open]")).toHaveLength(1);
    expect(within(sheet()).getByTestId("product-detail").dataset.paddleId).toBe(nextId);
    // 바뀐 제품 이름으로 포커스가 간다
    expect(document.activeElement?.textContent).toBe(`가짜 ${nextId}`);

    fireEvent.click(within(sheet()).getByRole("button", { name: /이전 제품/ }));
    expect(within(sheet()).getByTestId("product-detail").dataset.paddleId).toBe(firstId);
  });

  it("2·3순위 상세 시트에서 열어도 시트는 2단(상세 → 제품 자세히)까지만 쌓인다", () => {
    saveAnswers(answers);
    render(<Result paddles={PADDLES.map(toPaddleDisplay)} />);
    fireEvent.click(screen.getAllByTestId("rank-row")[0]!);
    const rankSheet = document.querySelector("dialog[open]") as HTMLElement;
    fireEvent.click(within(rankSheet).getAllByTestId("similar-item")[0]!);
    expect(document.querySelectorAll("dialog[open]")).toHaveLength(2);
    const product = [...document.querySelectorAll("dialog[open]")].find((d) => d !== rankSheet) as HTMLElement;
    fireEvent.click(within(product).getAllByTestId("similar-item")[0]!);
    expect(document.querySelectorAll("dialog[open]")).toHaveLength(2);
  });
});

// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { certShort, COMPARE_ROWS } from "./CompareSheet";
import { todayLocal } from "./labels";
import { Result } from "./Result";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function")
    proto.close = function (this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  // jsdom에는 scrollIntoView가 없다
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

const today = todayLocal();
const ok = { usa_pickleball: "approved" as const, checked_at: today };
const p = (o: Partial<Paddle>) => fakePaddle({ price_checked_at: today, certification: ok, ...o });
// 코어·표면은 모두 같고, 무게·형태·가격은 다르다
const PADDLES: Paddle[] = [
  p({ id: "a", brand: "가짜", model: "에이", weight_oz: 7.8, core_mm: 16, shape: "widebody", price_krw: 120000 }),
  p({ id: "b", brand: "가짜", model: "비", weight_oz: 8.0, core_mm: 16, shape: "hybrid", price_krw: 150000 }),
  p({ id: "c", brand: "가짜", model: "씨", weight_oz: 8.2, core_mm: 16, shape: "elongated", price_krw: 180000 }),
];
const answers: QuizAnswers = { experience: "1_to_3y", play_style: "balanced", weight: "any", arm: "no", shapes: [], budget: "any", tournament: "no" };

beforeEach(() => {
  window.sessionStorage.clear();
  saveAnswers(answers);
});
afterEach(cleanup);

const openCompare = () => fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
const table = () => screen.getByTestId("compare-table");

describe("비교표(T-020)", () => {
  it("추천이 2개 이상일 때만 '비교하기'가 보인다", () => {
    render(<Result paddles={[PADDLES[0]!]} />);
    expect(screen.queryByRole("button", { name: "비교하기" })).toBeNull();
    cleanup();
    render(<Result paddles={PADDLES} />);
    expect(screen.getByRole("button", { name: "비교하기" })).toBeDefined();
  });

  it("열면 9줄 × 제품 수 칸이 있고, 점수 숫자는 없다", () => {
    render(<Result paddles={PADDLES} />);
    openCompare();
    expect(document.querySelector("dialog[open]")).not.toBeNull();
    const rows = within(table()).getAllByRole("row", { hidden: true });
    expect(rows).toHaveLength(1 + COMPARE_ROWS.length);
    expect(within(table()).getAllByRole("columnheader", { hidden: true })).toHaveLength(3);
    for (const row of rows.slice(1)) expect(within(row).getAllByRole("cell", { hidden: true })).toHaveLength(3);
    expect(table().textContent).not.toMatch(/\d+점|점수/);
  });

  it("제품끼리 같은 줄은 '모두 같음'을 글자로 붙이고, 다른 줄은 붙이지 않는다", () => {
    render(<Result paddles={PADDLES} />);
    openCompare();
    const row = (label: string) => table().querySelector(`[data-row='${label}']`)!;
    expect(row("코어 두께").getAttribute("data-same")).toBe("true");
    expect(row("코어 두께").textContent).toContain("모두 같음");
    expect(row("무게").getAttribute("data-same")).toBe("false");
    expect(row("무게").textContent).not.toContain("모두 같음");
  });

  it("2·3순위 열 머리를 누르면 비교 시트가 닫히고 그 제품 상세 시트가 열린다(겹치지 않음)", () => {
    render(<Result paddles={PADDLES} />);
    openCompare();
    fireEvent.click(within(table()).getByRole("button", { name: /^2순위/, hidden: true }));
    const opened = [...document.querySelectorAll("dialog[open]")];
    expect(opened).toHaveLength(1);
    expect(opened[0]!.textContent).toContain("2순위 자세히");
  });

  it("1순위 열 머리를 누르면 비교 시트를 닫고 화면의 1순위 카드 제목으로 포커스를 옮긴다", () => {
    render(<Result paddles={PADDLES} />);
    openCompare();
    fireEvent.click(within(table()).getByRole("button", { name: /^1순위/, hidden: true }));
    expect(document.querySelector("dialog[open]")).toBeNull();
    expect(document.activeElement?.tagName).toBe("H2");
  });

  it("제휴 링크가 있는 제품은 열 머리에 '광고'를 붙인다", () => {
    const withAd = PADDLES.map((x, i) => (i === 1 ? { ...x, purchase: { url: "https://shop.example.com/b", is_affiliate: true, program: "other" as const } } : x));
    render(<Result paddles={withAd} />);
    openCompare();
    expect(within(table()).getAllByTestId("compare-ad")).toHaveLength(1);
    expect(within(table()).getByRole("button", { name: /^2순위.*광고/, hidden: true })).toBeDefined();
  });

  it("대회 승인 줄은 확인 배지와 같은 기준(180일, 미래 날짜)을 쓴다", () => {
    expect(certShort({ usa_pickleball: "approved", checked_at: today }, today)).toBe("✓ 승인");
    expect(certShort({ usa_pickleball: "approved", checked_at: "2000-01-01" }, today)).toBe("재확인 필요");
    expect(certShort({ usa_pickleball: "approved", checked_at: "2999-01-01" }, today)).toBe("재확인 필요");
    expect(certShort({ usa_pickleball: "unknown", checked_at: today }, today)).toBe("미확인");
  });
});

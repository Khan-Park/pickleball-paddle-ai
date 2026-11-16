// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { todayLocal } from "./labels";
import { conditionChips, SpecScale } from "./parts";
import { Result } from "./Result";

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

const today = todayLocal();
const ok = { usa_pickleball: "approved" as const, checked_at: today };
const p = (o: Partial<Paddle>) => fakePaddle({ price_checked_at: today, certification: ok, ...o });
const PADDLES: Paddle[] = [
  p({ id: "light", brand: "가짜", model: "가벼운 16", weight_oz: 7.5, core_mm: 16, shape: "widebody", price_krw: 120000 }),
  p({ id: "mid", brand: "가짜", model: "중간 16", weight_oz: 8.0, core_mm: 16, shape: "hybrid", price_krw: 150000 }),
  p({ id: "heavy", brand: "가짜", model: "무거운 14", weight_oz: 8.8, core_mm: 14, shape: "elongated", price_krw: 180000 }),
];
const lightLover: QuizAnswers = { experience: "1_to_3y", play_style: "control", weight: "light", arm: "yes", shapes: ["widebody"], budget: "any", tournament: "yes" };

beforeEach(() => window.sessionStorage.clear());
afterEach(cleanup);

describe("결과 화면 구조(T-018)", () => {
  it("1순위는 적합도 막대·핵심 이유·스펙 칩·가격을 펼치지 않아도 보여 주고, 막대에는 점수 숫자를 쓰지 않는다", () => {
    saveAnswers(lightLover);
    render(<Result paddles={PADDLES} />);
    const top = screen.getByRole("article");
    expect(within(top).getByTestId("fit-bar").style.width).toMatch(/%$/);
    expect(within(top).getByTestId("key-reason").textContent!.length).toBeGreaterThan(0);
    expect(within(top).getByTestId("spec-chips").textContent).toContain("oz");
    expect(top.textContent).toMatch(/약 [\d,]+원/);
    expect(top.textContent).not.toMatch(/\d+점|점수/);
  });

  it("알아 둘 점이 있으면 접지 않고 개수와 첫 문장을 요약에 보여 준다", () => {
    saveAnswers({ ...lightLover, shapes: ["elongated"] });
    render(<Result paddles={[PADDLES[2]!]} />);
    const summary = screen.getByTestId("caution-summary");
    expect(summary.textContent).toMatch(/알아 둘 점 \d+개/);
    expect(summary.closest("details")).toBeNull();
  });

  it("2·3순위 행을 누르면 시트로 전체 정보가 열리고, 닫으면 행으로 포커스가 돌아온다", () => {
    saveAnswers(lightLover);
    render(<Result paddles={PADDLES} />);
    const [row] = screen.getAllByTestId("rank-row");
    row!.focus();
    fireEvent.click(row!);
    const dialog = document.querySelector("dialog[open]")!;
    expect(dialog).not.toBeNull();
    const card = within(dialog as HTMLElement).getByRole("article");
    expect(card.textContent).toContain("2순위");
    expect(within(card).getAllByTestId("spec-scale")).toHaveLength(2);
    fireEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "닫기" }));
    expect(document.querySelector("dialog[open]")).toBeNull();
    expect(document.activeElement).toBe(row);
  });

  it("제휴 링크가 있는 2·3순위 행에도 '광고'를 붙인다", () => {
    saveAnswers({ ...lightLover, tournament: "no" });
    const withLink = PADDLES.map((x) => ({ ...x, purchase: { url: `https://shop.example.com/${x.id}`, is_affiliate: true, program: "other" as const } }));
    render(<Result paddles={withLink} />);
    for (const row of screen.getAllByTestId("rank-row")) {
      expect(row.getAttribute("aria-label")).toContain("광고");
      expect(within(row).getByTestId("affiliate-badge").textContent).toBe("광고");
    }
  });

  it("'내 조건' 칩은 답을 요약하고 질문 화면으로 이어지며, 팔 불편 답과 '상관없어요'는 넣지 않는다", () => {
    expect(conditionChips(lightLover)).toEqual(["1~3년", "컨트롤", "가벼운 무게", "넓은 형", "대회용"]);
    expect(conditionChips({ ...lightLover, weight: "any", budget: "any", tournament: "no" })).toEqual(["1~3년", "컨트롤", "넓은 형"]);
    // 초보는 선호 모양을 묻지 않으므로 남아 있어도 칩을 만들지 않는다
    expect(conditionChips({ ...lightLover, experience: "under_1y" })).not.toContain("넓은 형");
    saveAnswers(lightLover);
    render(<Result paddles={PADDLES} />);
    const link = screen.getByRole("link", { name: /내 조건/ });
    expect(link.getAttribute("href")).toBe("/quiz");
    expect(link.getAttribute("aria-label")).not.toMatch(/팔|불편/);
  });
});

describe("SpecScale", () => {
  it("값의 위치를 범위 안 비율로 찍고, 범위 밖 값은 끝에 붙이며, 값 숫자와 뜻을 글자로도 알린다", () => {
    const { container } = render(
      <>
        <SpecScale label="무게" value={8} unit="oz" min={7} max={9} left="가벼움" right="묵직함" />
        <SpecScale label="코어 두께" value={20} unit="mm" min={11} max={17} left="파워" right="컨트롤" />
      </>,
    );
    const dots = [...container.querySelectorAll("[data-position]")].map((d) => d.getAttribute("data-position"));
    expect(dots).toEqual(["50", "100"]);
    expect(screen.getByText("8oz")).toBeDefined();
    expect(container.textContent).toContain("컨트롤 쪽");
  });
});

describe("구매 버튼과 가격 비교(T-019)", () => {
  const shop = (x: Paddle) => ({ ...x, purchase: { url: `https://shop.example.com/${x.id}`, is_affiliate: false } });

  it("1순위 카드와 2·3순위 시트에 판매처·가격 비교 버튼이 있고, 제휴가 아니면 대가 표시가 없다", () => {
    saveAnswers({ ...lightLover, tournament: "no" });
    render(<Result paddles={PADDLES.map(shop)} />);
    const top = screen.getByRole("article");
    const buy = within(top).getByRole("link", { name: /판매처에서 보기/ });
    expect(buy.getAttribute("href")).toMatch(/^https:\/\/shop\.example\.com\//);
    expect(buy.getAttribute("rel")).toBe("noopener noreferrer");
    const compare = within(top).getByRole("link", { name: /다른 곳 가격 비교/ });
    expect(new URL(compare.getAttribute("href")!).hostname).toBe("search.shopping.naver.com");
    expect(compare.getAttribute("target")).toBe("_blank");
    expect(screen.queryByTestId("affiliate-disclosure")).toBeNull();
    expect(document.querySelectorAll("dialog [data-testid='buy-buttons']")).toHaveLength(2);
  });

  it("구매 링크가 없는 제품에는 가격 비교 버튼도 두지 않는다", () => {
    saveAnswers({ ...lightLover, tournament: "no" });
    render(<Result paddles={PADDLES} />);
    expect(screen.queryByRole("link", { name: /다른 곳 가격 비교/ })).toBeNull();
  });
});

describe("하단 고정 구매 버튼(T-019)", () => {
  let report: (visible: boolean) => void = () => {};
  const original = globalThis.IntersectionObserver;
  beforeEach(() => {
    globalThis.IntersectionObserver = class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        report = (visible) => cb([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => {
    globalThis.IntersectionObserver = original;
  });

  it("1순위 구매 버튼이 화면 밖으로 나가면 나타나고, 다시 보이면 사라진다", async () => {
    saveAnswers({ ...lightLover, tournament: "no" });
    render(<Result paddles={PADDLES.map((x) => ({ ...x, purchase: { url: `https://shop.example.com/${x.id}`, is_affiliate: false } }))} />);
    expect(screen.queryByTestId("sticky-buy")).toBeNull();
    const { act } = await import("@testing-library/react");
    act(() => report(false));
    const bar = screen.getByTestId("sticky-buy");
    expect(within(bar).getByRole("link", { name: /판매처에서 보기/ })).toBeDefined();
    act(() => report(true));
    expect(screen.queryByTestId("sticky-buy")).toBeNull();
  });

  it("제휴 링크면 고정 버튼에도 링크 바로 위에 대가 표시가 함께 나온다", async () => {
    saveAnswers({ ...lightLover, tournament: "no" });
    render(<Result paddles={PADDLES.map((x) => ({ ...x, purchase: { url: `https://link.coupang.com/a/${x.id}`, is_affiliate: true, program: "coupang_partners" as const } }))} />);
    const { act } = await import("@testing-library/react");
    act(() => report(false));
    const bar = screen.getByTestId("sticky-buy");
    const disclosure = within(bar).getByTestId("affiliate-disclosure");
    const link = within(bar).getByRole("link", { name: /광고/ });
    expect(disclosure.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

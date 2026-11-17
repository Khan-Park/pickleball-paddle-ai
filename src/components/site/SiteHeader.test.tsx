// @vitest-environment jsdom
import type { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { toPaddleDisplay, type Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { loadAnswers, saveAnswers } from "@/lib/quiz/storage";
import { todayLocal } from "@/components/result/labels";
import { Browse } from "@/components/browse/Browse";
import { Result } from "@/components/result/Result";
import { Shared } from "@/components/share/Shared";
import Home from "@/app/page";
import BrowsePage from "@/app/browse/page";
import ResultPage from "@/app/result/page";
import SharedPage from "@/app/shared/page";
import NotFound from "@/app/not-found";
import QuizPage from "@/app/quiz/page";
import { SiteHeader } from "./SiteHeader";

const search = new URLSearchParams();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => search }));

beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function") proto.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); };
});
afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

const today = todayLocal();
const ad = { url: "https://link.coupang.com/a/x", is_affiliate: true, program: "coupang_partners" as const };
const p = (id: string, o: Partial<Paddle> = {}) =>
  toPaddleDisplay(fakePaddle({ id, brand: "가짜", model: id, price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today }, purchase: ad, ...o }));
const AD_PADDLES = [p("a", { shape: "widebody" }), p("b", { shape: "hybrid", core_mm: 14 }), p("c", { shape: "elongated", weight_oz: 7.6 })];

const isBefore = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe("공통 헤더(T-040)", () => {
  it.each<[string, () => ReactElement]>([
    ["시작", () => <Home />],
    ["둘러보기", () => <BrowsePage />],
    ["결과", () => <ResultPage />],
    ["공유받은 화면", () => <SharedPage />],
    ["404", () => <NotFound />],
  // 화면 안 <header>(제목 묶음)도 jsdom에서 banner로 잡혀 data-testid로 센다. 브라우저에서는 main 안 header는 banner가 아니다
  ])("%s 화면에 헤더가 1개 있고 <main>보다 앞에 있다", (_, page) => {
    render(page());
    const headers = screen.getAllByTestId("site-header");
    expect(headers).toHaveLength(1);
    expect(isBefore(headers[0]!, screen.getByRole("main"))).toBe(true);
  });

  it("질문 화면에는 헤더가 없다(한 흐름, D-028)", () => {
    render(<QuizPage />);
    expect(screen.queryByTestId("site-header")).toBeNull();
  });

  it("현재 화면 링크에만 aria-current=page가 붙는다", () => {
    render(<SiteHeader current="browse" />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/browse"]);
    cleanup();
    render(<SiteHeader current="home" />);
    expect(screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.getAttribute("href"))).toEqual(["/"]);
    cleanup();
    render(<SiteHeader />);
    expect(screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toEqual([]);
  });

  it("링크는 로고·패들 찾기·둘러보기·검색이고, 모두 이름이 있고 키보드로 갈 수 있다", () => {
    render(<SiteHeader />);
    const links = within(screen.getByTestId("site-header")).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/", "/quiz", "/browse", "/browse#search"]);
    for (const a of links) {
      expect(a.textContent?.trim() || a.getAttribute("aria-label")).toBeTruthy();
      expect(a.tabIndex).toBe(0);
      expect(a.className).toContain("focus-visible:outline-2");
    }
    expect(screen.getByRole("link", { name: "패들 검색" })).toBeDefined();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeDefined();
  });

  it("'내 패들 찾기'는 이 탭의 이전 답을 지운다(시작 버튼과 같음)", () => {
    saveAnswers({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" });
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("link", { name: /패들 찾기$/ }));
    expect(loadAnswers()).toBeNull();
  });

  it("저장 아이콘·추천 가이드·영문 로고는 아직 없다(T-050, U3, U6)", () => {
    render(<SiteHeader />);
    const text = screen.getByTestId("site-header").textContent ?? "";
    expect(text).not.toMatch(/저장|가이드|PaddleFit/);
  });
});

describe("대가 표시 순서: 헤더 → 대가 표시 → 제목(T-040, 기획 3.6)", () => {
  it.each<[string, () => ReactElement]>([
    ["둘러보기", () => <Browse paddles={AD_PADDLES} />],
    ["결과", () => <Result paddles={AD_PADDLES} />],
    ["공유받은 화면", () => <Shared paddles={AD_PADDLES} />],
  ])("%s", (_, body) => {
    saveAnswers({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" });
    search.set("p", "a,b,c");
    // 페이지 파일과 같은 배치(헤더 다음 <main>)로 그린다. 실제 데이터에는 아직 제휴 링크가 없어 가짜 제품을 쓴다
    render(
      <>
        <SiteHeader />
        <main>{body()}</main>
      </>,
    );
    const header = screen.getByTestId("site-header");
    const notice = screen.getByTestId("affiliate-page-notice");
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(isBefore(header, notice)).toBe(true);
    expect(isBefore(notice, h1)).toBe(true);
  });
});

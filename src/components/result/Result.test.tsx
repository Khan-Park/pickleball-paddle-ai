// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { affiliateProgram, DISCLOSURE, NOTICE, todayLocal } from "./labels";
import { Result } from "./Result";
import { CRITERIA_OTHER } from "./ConditionSummary";
import { SAVED_FIELDS, SAVED_KEY } from "@/lib/shared/saved";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const today = todayLocal();
const p = (o: Partial<Paddle>) => fakePaddle({ price_checked_at: today, certification: { usa_pickleball: "approved", checked_at: today }, ...o });
const PADDLES: Paddle[] = [
  p({ id: "wide", brand: "가짜", model: "와이드 16", core_mm: 16, weight_oz: 7.9, shape: "widebody", price_krw: 90000 }),
  p({ id: "control", brand: "가짜", model: "컨트롤 17", core_mm: 17, weight_oz: 8.0, shape: "standard", price_krw: 150000 }),
  p({ id: "power", brand: "가짜", model: "파워 13", core_mm: 13, weight_oz: 8.6, shape: "elongated", price_krw: 250000 }),
  p({ id: "unknown", brand: "가짜", model: "미확인 16", core_mm: 16, weight_oz: 7.8, shape: "hybrid", price_krw: 120000, certification: { usa_pickleball: "unknown", checked_at: today } }),
];
const beginner: QuizAnswers = { experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" };

// jsdom 31에는 <dialog>의 showModal·close가 없다(ui.test.tsx와 같은 최소 대체)
beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function") proto.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); };
});

beforeEach(() => {
  replace.mockClear();
  window.sessionStorage.clear();
  window.localStorage.clear();
});
afterEach(cleanup);

describe("결과 화면", () => {
  it("답변이 없으면 질문 화면으로 보낸다", () => {
    render(<Result paddles={PADDLES} />);
    expect(replace).toHaveBeenCalledWith("/quiz");
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("추천 3개를 순위·라벨·이유와 함께 보여 주고 점수 숫자는 보여 주지 않는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES} />);
    // 화면에는 1순위 카드 1개와 2·3순위 행 2개가 보이고, 2·3순위 카드는 닫힌 시트 안에 있다(T-018)
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getAllByTestId("rank-row")).toHaveLength(2);
    const cards = screen.getAllByRole("article", { hidden: true });
    expect(cards).toHaveLength(3);
    expect(cards[0]!.textContent).toMatch(/1순위 · (매우 잘 맞음|잘 맞음|보통)/);
    expect(within(cards[0]!).getByText("추천 이유")).toBeDefined();
    for (const card of cards) expect(card.textContent).not.toMatch(/\d{2}\.\d점|점수/);
    expect(replace).not.toHaveBeenCalled();
  });

  it("스펙·가격 확인일·대회 승인을 표시하고, 미확인 제품은 숨기지 않고 '미확인'으로 적는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[PADDLES[0]!, PADDLES[3]!]} />);
    const [first, second] = screen.getAllByRole("article", { hidden: true });
    const all = first!.textContent! + second!.textContent!;
    expect(all).toContain("약 90,000원");
    expect(all).toContain(`${today} 기준`);
    expect(all).toContain("USA Pickleball 승인 확인");
    expect(all).toContain("대회 승인 여부 미확인");
    expect(screen.getByText(/2개뿐이라 있는 만큼만/)).toBeDefined();
  });

  it("구매 링크가 없으면 버튼과 대가 표시를 그리지 않는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES} />);
    expect(screen.queryByRole("link", { name: /판매처에서 보기/ })).toBeNull();
    expect(screen.queryByText(DISCLOSURE.coupang)).toBeNull();
    expect(screen.queryByText(DISCLOSURE.other)).toBeNull();
  });

  it("제휴 링크가 있으면 같은 묶음 안에서 링크보다 먼저 대가 표시를 그린다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "linked", brand: "가짜", model: "링크", purchase: { url: "https://example.com/buy", is_affiliate: true } })]} />);
    const link = screen.getByRole("link", { name: /판매처에서 보기/ });
    expect(link.getAttribute("rel")).toBe("sponsored noopener");
    const disclosure = screen.getByTestId("affiliate-disclosure");
    expect(disclosure.textContent).toBe(DISCLOSURE.other);
    expect(disclosure.parentElement).toBe(link.parentElement);
    // 문서 순서상 대가 표시가 링크보다 앞에 온다
    expect(disclosure.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("화면 낭독기로 링크만 읽어도 광고임을 알 수 있다(이름에 '광고', 대가 표시와 연결)", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "linked", brand: "가짜", model: "링크", purchase: { url: "https://example.com/buy", is_affiliate: true } })]} />);
    const link = screen.getByRole("link", { name: /^광고\s*·\s*판매처에서 보기/ });
    const describedBy = link.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toBe(screen.getByTestId("affiliate-disclosure"));
  });

  it("제휴 링크가 있는 카드는 제목 근처에 '광고'를 먼저 보여 주고, 없는 카드에는 붙이지 않는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES.map((x, i) => (i === 0 ? { ...x, purchase: { url: "https://example.com/a", is_affiliate: true } } : x))} />);
    const badges = screen.getAllByTestId("affiliate-badge");
    expect(badges).toHaveLength(1);
    const card = badges[0]!.closest("article")!;
    expect(card.querySelector("h2")!.textContent).toBe("가짜 와이드 16");
    // 제목 묶음(header) 안에 있어 추천 이유보다 먼저 나온다
    expect(badges[0]!.closest("header")).not.toBeNull();
  });

  it("순위 안내 문장은 한 화면에 한 번만 나온다", () => {
    saveAnswers(beginner);
    const count = () => screen.getAllByText(NOTICE.ranking).length;
    render(<Result paddles={PADDLES} />);
    expect(count()).toBe(1);
    cleanup();
    render(<Result paddles={PADDLES.map((x) => ({ ...x, purchase: { url: `https://example.com/${x.id}`, is_affiliate: true } }))} />);
    expect(count()).toBe(1);
  });

  it("쿠팡 링크에는 쿠팡 파트너스 권장 문구를 그대로 쓴다", () => {
    expect(DISCLOSURE.coupang).toBe("이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.");
    expect(affiliateProgram({ program: "coupang_partners" })).toBe("coupang");
    expect(affiliateProgram({ program: "other" })).toBe("other");
    expect(affiliateProgram({})).toBe("other");

    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "cp", brand: "가짜", model: "쿠팡", purchase: { url: "https://link.coupang.com/a/abc", is_affiliate: true, program: "coupang_partners" } })]} />);
    expect(screen.getByTestId("affiliate-disclosure").textContent).toBe(DISCLOSURE.coupang);
    expect(screen.getByTestId("affiliate-page-notice").textContent).toContain(DISCLOSURE.coupang);
  });

  it("대가 표시는 한국어로 수수료를 받는다는 사실을 단정형으로 밝힌다", () => {
    for (const text of [DISCLOSURE.coupang, DISCLOSURE.other]) {
      expect(text).toContain("수수료를 제공받습니다");
      expect(text).not.toMatch(/받을 수 있|AD|Sponsor/);
    }
  });

  it("페이지 안내는 제목보다 앞에 있고 '광고'라고 밝히며, 접힌 영역 안에 있지 않다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES.map((x, i) => (i === 0 ? { ...x, purchase: { url: "https://example.com/a", is_affiliate: true } } : x))} />);
    const notice = screen.getByTestId("affiliate-page-notice");
    expect(notice.textContent).toMatch(/^광고/);
    expect(notice.compareDocumentPosition(screen.getByRole("heading", { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(notice.closest("details")).toBeNull();
  });

  it("제휴 링크가 있는 추천이 하나라도 있으면 카드보다 먼저 페이지 안내를 보여 주고, 없으면 보여 주지 않는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES.map((x, i) => (i === 0 ? { ...x, purchase: { url: "https://example.com/a", is_affiliate: true } } : x))} />);
    const notice = screen.getByTestId("affiliate-page-notice");
    expect(notice.textContent).toContain(DISCLOSURE.other);
    expect(notice.compareDocumentPosition(screen.getAllByRole("article")[0]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    cleanup();
    render(<Result paddles={PADDLES} />);
    expect(screen.queryByTestId("affiliate-page-notice")).toBeNull();
  });

  it("제휴가 아닌 일반 링크에는 대가 표시를 붙이지 않는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "plain", brand: "가짜", model: "일반 링크", purchase: { url: "https://example.com/p", is_affiliate: false } })]} />);
    const link = screen.getByRole("link", { name: /^판매처에서 보기/ });
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByTestId("affiliate-badge")).toBeNull();
    expect(screen.queryByTestId("affiliate-disclosure")).toBeNull();
    expect(screen.queryByTestId("affiliate-page-notice")).toBeNull();
  });

  it("구매 링크 유무는 순위에 영향을 주지 않는다", () => {
    saveAnswers(beginner);
    const order = () => screen.getAllByRole("article").map((a) => a.querySelector("h2")!.textContent);
    render(<Result paddles={PADDLES} />);
    const plain = order();
    cleanup();
    render(<Result paddles={PADDLES.map((x, i) => (i === 2 ? { ...x, purchase: { url: "https://example.com/x", is_affiliate: true } } : x))} />);
    expect(order()).toEqual(plain);
  });

  it("팔 불편을 고른 경우에만 안내 문구를 보여 준다", () => {
    saveAnswers({ ...beginner, arm: "yes" });
    render(<Result paddles={PADDLES} />);
    expect(screen.getByText(NOTICE.arm)).toBeDefined();
    cleanup();
    saveAnswers(beginner);
    render(<Result paddles={PADDLES} />);
    expect(screen.queryByText(NOTICE.arm)).toBeNull();
  });

  it("후보가 없으면 조건 완화 버튼을 보여 주고, 누르면 그 조건으로 다시 추천한다", () => {
    saveAnswers({ ...beginner, budget: "under_100k", tournament: "yes" });
    render(<Result paddles={[PADDLES[1]!, PADDLES[2]!]} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("찾지 못했습니다");
    fireEvent.click(screen.getByRole("button", { name: /150,000원까지 올려서 다시 보기/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("조건을 바꿔서 다시 찾은 결과입니다.")).toBeDefined();
    // 저장된 답변은 바뀌지 않는다
    expect(window.sessionStorage.getItem("pb.quiz.answers.v1")).toContain("under_100k");
  });

  it("대회용인데 승인이 확인된 제품이 없으면 승인 조건 완화를 제안한다", () => {
    saveAnswers({ ...beginner, tournament: "yes" });
    render(<Result paddles={[PADDLES[3]!]} />);
    fireEvent.click(screen.getByRole("button", { name: /대회 승인 조건을 빼고 다시 보기/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("스펙 기준 추천, 수수료와 순위 무관, 가격 안내가 항상 보인다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES} />);
    for (const text of [NOTICE.spec, NOTICE.ranking, NOTICE.price]) expect(screen.getByText(text)).toBeDefined();
  });

  it("가격 확인일이 30일을 넘으면 '가격 변동 가능'을 붙인다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "old", brand: "가짜", model: "오래된 가격", price_checked_at: "2020-01-01" })]} />);
    expect(screen.getByText("가격 변동 가능")).toBeDefined();
  });
});

describe("대회 승인 배지와 조건 완화", () => {
  it("문구는 주소가 아니라 데이터의 program을 따른다(쿠팡이 아닌 주소라도 program이 쿠팡 파트너스면 권장 문구)", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "short", brand: "가짜", model: "단축", purchase: { url: "https://example.com/short", is_affiliate: true, program: "coupang_partners" } })]} />);
    expect(screen.getByTestId("affiliate-disclosure").textContent).toBe(DISCLOSURE.coupang);
  });

  it("승인 확인일이 미래면 '오래됨'이 아니라 확인일을 확인할 수 없다고 알린다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "future", brand: "가짜", model: "미래", certification: { usa_pickleball: "approved", checked_at: "2999-01-01" } })]} />);
    const badge = screen.getByText(/승인 재확인 필요/);
    expect(badge.textContent).toContain("확인할 수 없음");
    expect(badge.textContent).not.toContain("오래됨");
  });

  it("확인한 지 180일이 넘은 승인은 '확인'이 아니라 '재확인 필요'로 보여 준다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "stale", brand: "가짜", model: "오래된 승인", certification: { usa_pickleball: "approved", checked_at: "2020-01-01" } })]} />);
    expect(screen.getByText(/승인 재확인 필요/)).toBeDefined();
    expect(screen.queryByText(/✓ USA Pickleball 승인 확인/)).toBeNull();
  });

  it("확인일이 미래인 승인도 '확인'으로 보여 주지 않는다", () => {
    saveAnswers(beginner);
    render(<Result paddles={[p({ id: "future", brand: "가짜", model: "미래 날짜", certification: { usa_pickleball: "approved", checked_at: "2999-01-01" } })]} />);
    expect(screen.queryByText(/✓ USA Pickleball 승인 확인/)).toBeNull();
  });

  it("예산을 올려 다시 볼 때 사용자가 정한 최소 예산은 그대로 둔다", () => {
    saveAnswers({ experience: "over_3y", play_style: "balanced", weight: "any", arm: "no", shapes: [], budget: "200k_to_300k", tournament: "no" });
    const cheap = p({ id: "cheap", brand: "가짜", model: "저가", price_krw: 30000 });
    const pricey = p({ id: "pricey", brand: "가짜", model: "고가", price_krw: 350000 });
    render(<Result paddles={[cheap, pricey]} />);
    fireEvent.click(screen.getByRole("button", { name: /350,000원까지 올려서 다시 보기/ }));
    const names = screen.getAllByRole("article").map((a) => a.querySelector("h2")!.textContent);
    expect(names).toEqual(["가짜 고가"]);
  });
});

describe("결과 레이아웃(T-045)", () => {
  const isBefore = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  it("DOM 순서: 대가 표시 → 히어로 제목 → 조건 요약 줄 → 카드", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES.map((x) => ({ ...x, purchase: { url: `https://link.coupang.com/a/${x.id}`, is_affiliate: true, program: "coupang_partners" as const } }))} />);
    const notice = screen.getByTestId("affiliate-page-notice");
    const hero = screen.getByTestId("hero-media");
    const h1 = screen.getByRole("heading", { level: 1 });
    const summary = screen.getByTestId("condition-summary");
    const firstCard = screen.getAllByTestId("result-card-wrap")[0]!;
    expect(hero.contains(h1)).toBe(true);
    expect(isBefore(notice, h1)).toBe(true);
    expect(isBefore(h1, summary)).toBe(true);
    expect(isBefore(summary, firstCard)).toBe(true);
  });

  it("Result.tsx에 시각 재배치 클래스가 없다", () => {
    const src = readFileSync(join(process.cwd(), "src/components/result/Result.tsx"), "utf8");
    expect(src).not.toMatch(/\b(order-|flex-row-reverse|flex-col-reverse|col-start-|row-start-)/);
  });

  it.each([
    [3, "답변에 맞는 패들 3개를 찾았어요"],
    [2, "답변에 맞는 패들 2개를 찾았어요"],
    [1, "답변에 맞는 패들 1개를 찾았어요"],
  ])("제목에 결과 개수(%i개)가 들어간다", (n, title) => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES.slice(0, n)} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(title);
  });

  it("결과가 없으면 찾지 못했다고 쓴다", () => {
    saveAnswers({ ...beginner, budget: "under_100k", tournament: "yes" });
    render(<Result paddles={[PADDLES[2]!]} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("조건에 맞는 패들을 찾지 못했습니다");
  });

  it("팔 불편 답은 조건 줄과 '추천 기준 보기' 시트에 없다", () => {
    saveAnswers({ ...beginner, arm: "yes" });
    render(<Result paddles={PADDLES} />);
    const summary = screen.getByTestId("condition-summary");
    fireEvent.click(within(summary).getByRole("button", { name: "추천 기준 보기" }));
    const text = `${summary.textContent} ${screen.getByTestId("criteria-list").textContent}`;
    expect(text).not.toMatch(/팔|손목|어깨|불편/);
    expect(screen.getByTestId("criteria-list").querySelectorAll("li").length).toBeGreaterThan(0);
  });

  it("1024px 이상에서는 하단 고정 구매 버튼과 그 자리 여백을 숨긴다", () => {
    const src = readFileSync(join(process.cwd(), "src/components/result/StickyBuy.tsx"), "utf8");
    expect(src).toMatch(/fixed inset-x-0 bottom-0[^"]*lg:hidden/);
  });
});

describe("결과 카드 데스크톱 3열(T-046)", () => {
  const desktop = () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("64rem"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    return () => {
      window.matchMedia = original;
    };
  };
  const AD = PADDLES.map((x) => ({ ...x, purchase: { url: `https://link.coupang.com/a/${x.id}`, is_affiliate: true, program: "coupang_partners" as const } }));

  it("1024px 이상: 카드 3장 모두 구매 묶음이 접히지 않고, 줄 형태가 없으며, 1순위 배지는 라임 + 글자다", () => {
    const restore = desktop();
    try {
      saveAnswers(beginner);
      render(<Result paddles={PADDLES.map((x) => ({ ...x, purchase: { url: `https://example.com/${x.id}`, is_affiliate: false } }))} />);
      const cards = within(screen.getByTestId("result-columns")).getAllByRole("article");
      expect(cards).toHaveLength(3);
      for (const card of cards) {
        const buy = within(card).getByTestId("buy-buttons");
        expect(buy.closest("details")).toBeNull();
      }
      expect(screen.queryAllByTestId("rank-row")).toHaveLength(0);
      const badges = screen.getAllByTestId("rank-badge");
      expect(badges.map((b) => b.textContent)).toEqual(["1순위", "2순위", "3순위"]);
      expect(badges[0]!.className).toContain("bg-lime");
      expect(badges[0]!.className).toContain("text-on-lime");
      expect(badges[1]!.className).not.toContain("bg-lime");
    } finally {
      restore();
    }
  });

  it("제휴 카드마다 '광고'가 이름 근처에 있고, 대가 표시 문구가 구매 링크 바로 앞에 있다", () => {
    const restore = desktop();
    try {
      saveAnswers(beginner);
      render(<Result paddles={AD} />);
      for (const card of within(screen.getByTestId("result-columns")).getAllByRole("article")) {
        const header = card.querySelector("header")!;
        expect(within(header).getByTestId("affiliate-badge")).toBeDefined();
        const disclosure = within(card).getByTestId("affiliate-disclosure");
        const link = within(card).getByRole("link", { name: /판매처/ });
        expect(disclosure.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    } finally {
      restore();
    }
  });

  it("카드에 특성 배지·코어 소재·점수 숫자가 없고, 강점·스펙 4줄(무게 g 병기)이 있다", () => {
    const restore = desktop();
    try {
      saveAnswers(beginner);
      render(<Result paddles={PADDLES} />);
      const grid = screen.getByTestId("result-columns");
      expect(grid.textContent).not.toMatch(/스핀|파워형|안정성|기동성|코어 소재|폴리프로필렌|노멕스|\d+점|%/);
      const rows = within(grid).getAllByTestId("spec-rows");
      expect(rows).toHaveLength(3);
      expect([...rows[0]!.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["무게", "코어 두께", "형태", "길이 × 폭"]);
      expect(rows[0]!.textContent).toMatch(/oz · 약 \d+g/);
    } finally {
      restore();
    }
  });

  it("카드 아래에 비교 표가 펼쳐 있고(시트 없음), 히어로 버튼은 표로 이동한다", () => {
    const restore = desktop();
    try {
      saveAnswers(beginner);
      render(<Result paddles={PADDLES} />);
      const inline = screen.getByTestId("inline-compare");
      expect(within(inline).getByTestId("compare-table")).toBeDefined();
      expect(screen.getByTestId("result-columns").compareDocumentPosition(inline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getByRole("link", { name: "비교 표 보기" }).getAttribute("href")).toBe("#result-compare");
      expect(screen.queryByRole("button", { name: "비교하기" })).toBeNull();
    } finally {
      restore();
    }
  });

  it("추천이 1개면 비교 표가 없다", () => {
    const restore = desktop();
    try {
      saveAnswers(beginner);
      render(<Result paddles={PADDLES.slice(0, 1)} />);
      expect(screen.queryByTestId("inline-compare")).toBeNull();
    } finally {
      restore();
    }
  });

  it("모바일 1순위 카드의 무게 칩도 g을 함께 쓴다", () => {
    saveAnswers(beginner);
    render(<Result paddles={PADDLES} />);
    expect(screen.getByTestId("spec-chips").textContent).toMatch(/oz · 약 \d+g/);
  });

  describe("결과 저장(T-050)", () => {
    it("누르면 이 기기에 1건이 저장되고 저장 화면 링크가 나온다", () => {
      saveAnswers(beginner);
      render(<Result paddles={PADDLES} />);
      expect(screen.queryByTestId("saved-link")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "결과 저장" }));
      const saved = JSON.parse(window.localStorage.getItem(SAVED_KEY)!);
      expect(saved).toHaveLength(1);
      expect(Object.keys(saved[0]).sort()).toEqual([...SAVED_FIELDS].sort());
      expect(saved[0].paddle_ids).toHaveLength(3);
      expect(saved[0].conditions).toContain("입문(1년 미만)");
      expect(screen.getByTestId("saved-link").getAttribute("href")).toBe("/saved");
      expect(screen.getByTestId("save-result-status").textContent).toBe("결과를 저장했습니다");
      // 같은 결과를 다시 저장해도 1건
      fireEvent.click(screen.getByRole("button", { name: "결과 저장" }));
      expect(JSON.parse(window.localStorage.getItem(SAVED_KEY)!)).toHaveLength(1);
    });

    it("팔 불편을 고른 답으로 저장해도 저장 값에 팔 불편·답 원문·점수가 없다", () => {
      saveAnswers({ ...beginner, arm: "yes" });
      render(<Result paddles={PADDLES} />);
      fireEvent.click(screen.getByRole("button", { name: "결과 저장" }));
      const text = window.localStorage.getItem(SAVED_KEY)!;
      expect(text).not.toMatch(/arm|팔|불편|under_1y|experience|score|점수|label/);
    });

    it("저장소가 막히면 안내가 나오고 화면은 그대로다", () => {
      saveAnswers(beginner);
      render(<Result paddles={PADDLES} />);
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      try {
        fireEvent.click(screen.getByRole("button", { name: "결과 저장" }));
      } finally {
        spy.mockRestore();
      }
      expect(screen.getByTestId("save-result-status").textContent).toBe("이 브라우저에서는 저장할 수 없습니다");
      expect(screen.queryByTestId("saved-link")).toBeNull();
      expect(screen.getByTestId("result-title")).toBeDefined();
    });
  });

  it("추천 기준 시트에는 팔 불편 답과 관계없이 같은 '그 밖의 답' 안내가 있다(T-053 결정)", () => {
    for (const arm of ["yes", "no"] as const) {
      saveAnswers({ ...beginner, arm });
      render(<Result paddles={PADDLES} />);
      const other = screen.getByTestId("criteria-other");
      expect(other.textContent).toBe(CRITERIA_OTHER);
      expect(other.textContent).not.toMatch(/팔|불편|통증/);
      cleanup();
    }
  });
});

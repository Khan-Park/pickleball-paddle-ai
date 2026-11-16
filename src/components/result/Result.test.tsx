// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import type { QuizAnswers } from "@/lib/quiz/questions";
import { saveAnswers } from "@/lib/quiz/storage";
import { affiliateProgram, DISCLOSURE, NOTICE, todayLocal } from "./labels";
import { Result } from "./Result";

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

beforeEach(() => {
  replace.mockClear();
  window.sessionStorage.clear();
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

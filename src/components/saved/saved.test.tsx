// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { toPaddleDisplay, type Paddle } from "../../../data/schema";
import { fakePaddle } from "../../../data/test-fixtures";
import { todayLocal } from "@/components/result/labels";
import { SAVED_KEY, writeSaved, type SavedEntry } from "@/lib/shared/saved";
import { Saved, SAVED_NOTICE, savedDateLabel } from "./Saved";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function") proto.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); };
});

const today = todayLocal();
const p = (o: Partial<Paddle>) => toPaddleDisplay(fakePaddle({ price_checked_at: today, ...o }));
const PADDLES = [
  p({ id: "a", brand: "가짜", model: "에이 16" }),
  p({ id: "b", brand: "가짜", model: "비 14" }),
  p({ id: "c", brand: "가짜", model: "씨 13" }),
];
const entry = (o: Partial<SavedEntry>): SavedEntry => ({
  id: "x",
  saved_at: today,
  paddle_ids: ["a", "b", "c"],
  conditions: ["입문(1년 미만)", "대회용"],
  relaxed: false,
  scoring_version: "0.2.0",
  ...o,
});

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("저장한 추천 화면(T-050)", () => {
  it("저장한 것을 최근 순으로 날짜·조건 칩·제품 이름과 함께 보여 준다", () => {
    writeSaved([entry({ id: "new", paddle_ids: ["c", "a"] }), entry({ id: "old", saved_at: "2026-11-01", paddle_ids: ["b"], relaxed: true })]);
    render(<Saved paddles={PADDLES} />);
    const entries = screen.getAllByTestId("saved-entry");
    expect(entries).toHaveLength(2);
    expect(entries[0]!.textContent).toContain(`${savedDateLabel(today)} 저장`);
    expect(entries[0]!.textContent).toContain("대회용");
    expect(within(entries[0]!).getAllByTestId("saved-row").map((r) => r.textContent)).toEqual([
      expect.stringContaining("씨 13"),
      expect.stringContaining("에이 16"),
    ]);
    expect(entries[1]!.textContent).toContain("2026년 11월 1일 저장");
    expect(entries[1]!.textContent).toContain("조건을 바꿔서 다시 찾은 결과");
  });

  it("안내 두 줄과 '지금 조건으로 다시 받기'가 있고, 적합도 라벨·점수는 없다", () => {
    writeSaved([entry({})]);
    render(<Saved paddles={PADDLES} />);
    expect(screen.getByText(SAVED_NOTICE.basis)).toBeDefined();
    expect(screen.getByText(SAVED_NOTICE.device)).toBeDefined();
    expect(SAVED_NOTICE.basis).toBe("저장 당시 추천된 제품입니다. 가격·승인은 지금 기준입니다.");
    expect(screen.getByRole("link", { name: "지금 조건으로 다시 받기" }).getAttribute("href")).toBe("/quiz");
    const text = screen.getByTestId("saved-list").textContent ?? "";
    expect(text).not.toMatch(/매우 잘 맞음|잘 맞음|보통|점수|추천 이유/);
  });

  it("지금 데이터에 없는 제품은 '지금은 목록에 없는 제품'으로 적는다", () => {
    writeSaved([entry({ paddle_ids: ["a", "gone", "gone2"] })]);
    render(<Saved paddles={PADDLES} />);
    expect(screen.getAllByTestId("saved-row")).toHaveLength(1);
    expect(screen.getByTestId("saved-missing").textContent).toBe("지금은 목록에 없는 제품 2개");
  });

  it("'지우기'는 그 건만 지운다", () => {
    writeSaved([entry({ id: "one" }), entry({ id: "two", saved_at: "2026-11-01", paddle_ids: ["b"] })]);
    render(<Saved paddles={PADDLES} />);
    fireEvent.click(screen.getByRole("button", { name: "2026년 11월 1일 저장 지우기" }));
    expect(screen.getAllByTestId("saved-entry")).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(SAVED_KEY)!).map((e: SavedEntry) => e.id)).toEqual(["one"]);
    expect(screen.getByTestId("saved-status").textContent).toBe("2026년 11월 1일 저장을 지웠습니다");
  });

  it("'모두 지우기'는 한 번 더 묻고, 취소하면 그대로, 확인하면 전부 지운다", () => {
    writeSaved([entry({ id: "one" }), entry({ id: "two", paddle_ids: ["b"] })]);
    render(<Saved paddles={PADDLES} />);
    const clear = screen.getByTestId("saved-clear");
    fireEvent.click(within(clear).getByRole("button", { name: "모두 지우기" }));
    expect(clear.textContent).toContain("2건을 모두 지울까요?");
    fireEvent.click(within(clear).getByRole("button", { name: "취소" }));
    expect(screen.getAllByTestId("saved-entry")).toHaveLength(2);
    fireEvent.click(within(clear).getByRole("button", { name: "모두 지우기" }));
    fireEvent.click(within(screen.getByTestId("saved-clear")).getByRole("button", { name: "모두 지우기" }));
    expect(screen.getByTestId("saved-empty")).toBeDefined();
    expect(window.localStorage.getItem(SAVED_KEY)).toBeNull();
  });

  it("저장한 것이 없으면 빈 화면 안내와 질문 시작 버튼이 있다", () => {
    render(<Saved paddles={PADDLES} />);
    expect(screen.getByTestId("saved-empty")).toBeDefined();
    expect(screen.getByRole("link", { name: "지금 조건으로 다시 받기" })).toBeDefined();
    expect(screen.queryByTestId("saved-clear")).toBeNull();
  });

  it("180일이 지난 저장은 보이지 않는다", () => {
    writeSaved([entry({ id: "old", saved_at: "2000-01-01" })]);
    render(<Saved paddles={PADDLES} />);
    expect(screen.getByTestId("saved-empty")).toBeDefined();
  });
});

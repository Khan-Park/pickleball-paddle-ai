// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
    // 펼친 상태에서는 칩 영역이 보인다(T-038에서 보강)
    expect(screen.getByTestId("browse-filters").hidden).toBe(false);
    expect(screen.getByTestId("browse-filter-toggle").getAttribute("aria-expanded")).toBe("true");
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
  it("시작 화면의 공통 헤더에 둘러보기 링크가 있다(T-040에서 위쪽 바를 헤더로 옮김)", () => {
    render(<Home />);
    expect(within(screen.getByTestId("site-header")).getByRole("link", { name: /둘러보기$/ }).getAttribute("href")).toBe("/browse");
  });

  it("결과 화면에 '전체 둘러보기'가 있다", () => {
    saveAnswers({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "any", tournament: "no" });
    render(<Result paddles={PADDLES} />);
    expect(screen.getByRole("link", { name: "전체 둘러보기" }).getAttribute("href")).toBe("/browse");
  });
});

describe("둘러보기 검색·브랜드·무게·데스크톱(T-048)", () => {
  const MIXED = [
    p("j-light", { brand: "JOOLA", model: "Hyperion Lite", weight_oz: 7.1, price_krw: 200_000 }),
    p("j-mid", { brand: "JOOLA", model: "Perseus", weight_oz: 7.9, price_krw: 250_000 }),
    p("s-mid", { brand: "Selkirk", model: "Vanguard", weight_oz: 8.0, price_krw: 280_000 }),
    p("f-heavy", { brand: "Franklin", model: "Signature", weight_oz: 8.6, price_krw: 120_000 }),
  ];
  const search = () => screen.getByTestId("browse-search") as HTMLInputElement;

  it("검색칸은 필터를 펼치지 않아도 보이고, 대소문자·공백을 무시해 찾는다", () => {
    render(<Browse paddles={MIXED} />);
    expect(screen.getByTestId("browse-filters").hidden).toBe(true);
    expect(screen.getByLabelText("브랜드·모델 검색")).toBe(search());
    fireEvent.change(search(), { target: { value: "joola  PER" } });
    expect(rows()).toEqual(["j-mid"]);
    expect(screen.getByTestId("browse-filter-summary").textContent).toContain("joola  PER");
  });

  it("브랜드 칩은 데이터에서 만들고, 무게 칩과 함께 그리고 조건으로 거른다", () => {
    render(<Browse paddles={MIXED} />);
    fireEvent.click(chip("^JOOLA$"));
    expect(rows()).toEqual(["j-light", "j-mid"]);
    fireEvent.click(chip("^중간"));
    expect(rows()).toEqual(["j-mid"]);
    expect(screen.getByTestId("browse-filter-summary").textContent).toBe("JOOLA · 중간 무게");
    const brandChips = within(screen.getByRole("group", { name: "브랜드(여러 개 선택)" })).getAllByRole("button").map((b) => b.textContent?.replace("✓ ", ""));
    expect(brandChips).toEqual(["Franklin", "JOOLA", "Selkirk"]);
  });

  it("'필터 지우기'는 검색어까지 지우고, 0건이면 검색 안내를 보여 준다", () => {
    render(<Browse paddles={MIXED} />);
    fireEvent.change(search(), { target: { value: "줄라" } });
    expect(screen.getByTestId("browse-empty").textContent).toContain("영문 브랜드·모델 이름으로 찾아 주세요");
    fireEvent.click(within(screen.getByTestId("browse-empty")).getByRole("button", { name: "필터 지우기" }));
    expect(search().value).toBe("");
    expect(rows()).toHaveLength(4);
  });

  it("검색어·필터는 주소와 저장소에 남지 않는다", () => {
    const before = window.location.href;
    render(<Browse paddles={MIXED} />);
    fireEvent.change(search(), { target: { value: "selkirk" } });
    fireEvent.click(chip("^Selkirk$"));
    fireEvent.click(chip("^묵직함"));
    expect(window.location.href).toBe(before);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it("주소 해시가 #search면 검색칸에 포커스하고, 해시가 바뀔 때도 옮긴다", () => {
    window.history.replaceState(null, "", "#search");
    try {
      render(<Browse paddles={MIXED} />);
      expect(document.activeElement).toBe(search());
      (document.activeElement as HTMLElement).blur();
      act(() => {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(document.activeElement).toBe(search());
    } finally {
      window.history.replaceState(null, "", window.location.pathname);
    }
  });

  it("데스크톱: 필터가 늘 펼쳐져 있고 접기 버튼이 없으며, 목록이 2열 격자다", () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("64rem"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    try {
      render(<Browse paddles={MIXED} />);
      expect(screen.getByTestId("browse-filters").hidden).toBe(false);
      expect(screen.queryByTestId("browse-filter-toggle")).toBeNull();
      expect(screen.getByTestId("browse-list").className).toContain("lg:grid-cols-2");
      expect(screen.getByTestId("browse-filter-column").className).toContain("lg:col-span-3");
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("둘러보기 비교 담기(T-049)", () => {
  const ITEMS = [
    p("a", { brand: "가짜", model: "에이", weight_oz: 7.8, price_krw: 100_000 }),
    p("b", { brand: "가짜", model: "비", weight_oz: 8.0, price_krw: 110_000 }),
    p("c", { brand: "가짜", model: "씨", weight_oz: 8.2, price_krw: 120_000 }),
    p("d", { brand: "가짜", model: "디", weight_oz: 8.4, price_krw: 130_000 }),
  ];
  const toggle = (name: string) => screen.getByRole("button", { name: `가짜 ${name} 비교 담기` });

  it("담기 버튼은 aria-pressed와 제품 이름을 갖고, 1개면 '비교하기'가 없고 2개부터 있다", () => {
    render(<Browse paddles={ITEMS} />);
    expect(screen.queryByTestId("compare-tray")).toBeNull();
    fireEvent.click(toggle("에이"));
    expect(toggle("에이").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("compare-tray-count").textContent).toBe("담은 패들 1/3");
    expect(within(screen.getByTestId("compare-tray")).queryByRole("button", { name: "비교하기" })).toBeNull();
    fireEvent.click(toggle("비"));
    expect(within(screen.getByTestId("compare-tray")).getByRole("button", { name: "비교하기" })).toBeDefined();
  });

  it("4번째는 담기지 않고 최대 개수를 안내한다", () => {
    render(<Browse paddles={ITEMS} />);
    for (const n of ["에이", "비", "씨"]) fireEvent.click(toggle(n));
    fireEvent.click(toggle("디"));
    expect(toggle("디").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("compare-tray-count").textContent).toBe("담은 패들 3/3");
    expect(screen.getByTestId("compare-tray-status").textContent).toBe("최대 3개까지 비교할 수 있습니다");
  });

  it("저장소에는 id 배열만 들어가고, 다시 그리면 남아 있으며 없어진 id는 빠진다", () => {
    const { unmount } = render(<Browse paddles={ITEMS} />);
    fireEvent.click(toggle("씨"));
    fireEvent.click(toggle("에이"));
    expect(Object.keys(window.sessionStorage)).toEqual(["pb.compare.tray.v1"]);
    expect(JSON.parse(window.sessionStorage.getItem("pb.compare.tray.v1")!)).toEqual(["c", "a"]);
    unmount();
    // 새로고침 흉내: c가 데이터에서 없어졌다
    render(<Browse paddles={ITEMS.filter((x) => x.id !== "c")} />);
    expect(screen.getByTestId("compare-tray-count").textContent).toBe("담은 패들 1/3");
    expect(toggle("에이").getAttribute("aria-pressed")).toBe("true");
  });

  it("'비교하기'는 담은 제품 모드(스펙 7줄, 적합도 없음)로 열리고, 이름을 누르면 비교를 닫은 뒤 상세를 연다", () => {
    render(<Browse paddles={ITEMS} />);
    fireEvent.click(toggle("에이"));
    fireEvent.click(toggle("비"));
    fireEvent.click(within(screen.getByTestId("compare-tray")).getByRole("button", { name: "비교하기" }));
    const table = screen.getByTestId("compare-table");
    expect(table.dataset.mode).toBe("picked");
    expect(table.querySelectorAll("[data-row]")).toHaveLength(7);
    expect(table.textContent).not.toContain("적합도");
    fireEvent.click(within(table).getByRole("button", { name: "가짜 비. 자세히 보기" }));
    expect(table.closest("dialog")!.hasAttribute("open")).toBe(false);
    const open = [...document.querySelectorAll("dialog[open]")];
    expect(open).toHaveLength(1);
    expect(open[0]!.textContent).toContain("가짜 비");
  });

  it("화면이 다시 그려지기 전에 연달아 눌러도 모두 담긴다(빠른 연속 탭)", () => {
    render(<Browse paddles={ITEMS} />);
    act(() => {
      toggle("에이").click();
      toggle("비").click();
      toggle("씨").click();
      toggle("디").click();
    });
    expect(screen.getByTestId("compare-tray-count").textContent).toBe("담은 패들 3/3");
    expect(JSON.parse(window.sessionStorage.getItem("pb.compare.tray.v1")!)).toEqual(["a", "b", "c"]);
  });

  it("'비우기'는 비교함을 없애고 저장소 값도 지운다", () => {
    render(<Browse paddles={ITEMS} />);
    fireEvent.click(toggle("에이"));
    fireEvent.click(within(screen.getByTestId("compare-tray")).getByRole("button", { name: "비우기" }));
    expect(screen.queryByTestId("compare-tray")).toBeNull();
    expect(window.sessionStorage.getItem("pb.compare.tray.v1")).toBeNull();
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { loadAnswers, saveAnswers } from "@/lib/quiz/storage";
import { ShapeIcon } from "@/components/ShapeIcon";
import { Quiz, SELECT_DELAY_MS } from "./Quiz";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
/** 선택지를 누르고 선택 표시 시간(SELECT_DELAY_MS)이 지나 다음 질문으로 넘어갈 때까지 진행한다 */
const pick = (name: string | RegExp) => {
  click(name);
  act(() => {
    vi.advanceTimersByTime(SELECT_DELAY_MS);
  });
};
const heading = () => screen.getByRole("group").querySelector("legend")!.textContent;

beforeEach(() => {
  vi.useFakeTimers();
  push.mockClear();
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("질문 화면", () => {
  it("첫 질문은 경력이고 진행 표시는 1 / 7", () => {
    render(<Quiz />);
    expect(heading()).toContain("얼마나 해 보셨나요");
    expect(screen.getByText("1 / 7")).toBeDefined();
  });

  it("진행 막대는 폭이 아니라 scaleX로 늘어난다(T-033)", () => {
    render(<Quiz />);
    const fill = screen.getByTestId("progress-fill");
    // jsdom은 소수를 6자리로 줄여 저장하므로 숫자로 비교한다
    const scale = () => Number(/^scaleX\(([\d.]+)\)$/.exec(fill.style.transform)?.[1]);
    expect(fill.style.width).toBe("");
    expect(scale()).toBeCloseTo(1 / 7, 5);
    pick(/처음이거나 1년 미만/);
    expect(scale()).toBeCloseTo(2 / 6, 5);
  });

  it("초보 흐름: 질문 6개, '잘 모르겠어요' 선택지가 있고 선호 모양을 묻지 않는다", () => {
    render(<Quiz />);
    pick(/처음이거나 1년 미만/);
    expect(screen.getByText("2 / 6")).toBeDefined();
    pick(/잘 모르겠어요/);
    pick(/상관없어요/);
    expect(heading()).toContain("불편한 적이 있나요");
    expect(screen.getByText(/의학적 조언이 아닙니다/)).toBeDefined();
    pick("없어요");
    expect(heading()).toContain("예산");
    pick(/10만 원 이하/);
    pick(/아니요/);

    expect(push).toHaveBeenCalledWith("/result");
    expect(loadAnswers()).toEqual({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "no", budget: "under_100k", tournament: "no" });
  });

  it("상급 흐름: 선호 모양을 여러 개 고르고 '다음'으로 넘어간다", () => {
    render(<Quiz />);
    pick(/3년 이상/);
    expect(screen.queryByRole("button", { name: /잘 모르겠어요/ })).toBeNull();
    pick(/강한 파워/);
    pick(/묵직하게/);
    pick("없어요");
    expect(heading()).toContain("모양");
    const next = screen.getByRole("button", { name: "다음" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    // 하이브리드형의 설명에도 "길쭉한 형"이 들어 있어 이름의 시작으로 구분한다
    click(/^길쭉한 형/);
    click(/^하이브리드형/);
    expect(screen.getByRole("button", { name: /^길쭉한 형/ }).getAttribute("aria-pressed")).toBe("true");
    click("다음");
    pick(/20만~30만 원/);
    pick("네");

    expect(push).toHaveBeenCalledWith("/result");
    expect(loadAnswers()).toMatchObject({ experience: "over_3y", shapes: ["elongated", "hybrid"], tournament: "yes" });
  });

  it("선호 모양 질문에만 형태 그림 4개가 나오고, 그림은 화면 낭독기에 숨긴다", () => {
    const { container } = render(<Quiz />);
    pick(/1~3년/);
    expect(container.querySelectorAll("svg[data-shape]")).toHaveLength(0);
    pick(/균형/);
    pick("중간");
    pick("없어요");
    const icons = [...container.querySelectorAll("svg[data-shape]")];
    expect(icons.map((s) => s.getAttribute("data-shape")).sort()).toEqual(["elongated", "hybrid", "standard", "widebody"]);
    for (const icon of icons) expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("형태 그림은 모르는 값이면 아무것도 그리지 않는다(화면이 깨지지 않는다)", () => {
    const { container } = render(<ShapeIcon shape="round" />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("선호 모양은 건너뛸 수 있다", () => {
    render(<Quiz />);
    pick(/1~3년/);
    pick(/균형/);
    pick("중간");
    pick("있어요");
    click("건너뛰기");
    expect(heading()).toContain("예산");
  });

  it("이전으로 돌아가 답을 바꿀 수 있고, 고른 답이 표시된다", () => {
    render(<Quiz />);
    pick(/3년 이상/);
    click(/← 이전/);
    expect(heading()).toContain("얼마나 해 보셨나요");
    expect(screen.getByRole("button", { name: /3년 이상/ }).getAttribute("aria-pressed")).toBe("true");
    pick(/처음이거나 1년 미만/);
    expect(screen.getByText("2 / 6")).toBeDefined();
  });

  it("끝까지 답하기 전에는 결과 화면으로 가지 않는다", () => {
    render(<Quiz />);
    pick(/3년 이상/);
    pick(/강한 파워/);
    expect(push).not.toHaveBeenCalled();
    expect(loadAnswers()).toBeNull();
  });
});

describe("질문 화면: 이어서 답하기와 이동", () => {
  const done = { experience: "over_3y", play_style: "power", weight: "heavy", arm: "no", shapes: [], budget: "200k_to_300k", tournament: "no" } as const;

  it("저장된 답변이 있으면 불러와 마지막 질문부터 보여 주고, 고른 답이 표시된다", () => {
    saveAnswers({ ...done, shapes: [] });
    render(<Quiz />);
    expect(heading()).toContain("대회에 나갈 계획");
    expect(screen.getByText("7 / 7")).toBeDefined();
    expect(screen.getByRole("button", { name: /아니요/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("결과에서 돌아와 한 가지만 바꾸고 '다음'으로 나머지를 지나갈 수 있다", () => {
    saveAnswers({ ...done, shapes: [] });
    render(<Quiz />);
    click(/← 이전/);
    expect(heading()).toContain("예산");
    pick(/10만~20만 원/);
    expect(heading()).toContain("대회에 나갈 계획");
    click("결과 보기");
    expect(push).toHaveBeenCalledWith("/result");
    expect(loadAnswers()).toMatchObject({ budget: "100k_to_200k", experience: "over_3y", tournament: "no" });
  });

  it("이미 답한 질문에는 '다음' 버튼이 있어 같은 답을 다시 누르지 않아도 된다", () => {
    render(<Quiz />);
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();
    pick(/3년 이상/);
    pick(/강한 파워/);
    click(/← 이전/);
    click(/← 이전/);
    expect(heading()).toContain("얼마나 해 보셨나요");
    click("다음");
    expect(heading()).toContain("어떤 플레이");
    click("다음");
    expect(heading()).toContain("무게");
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();
  });

  it("질문이 바뀌면 새 질문 제목으로 포커스가 옮겨 가고, 처음 열었을 때는 포커스를 가져가지 않는다", () => {
    render(<Quiz />);
    const legend = () => screen.getByRole("group").querySelector("legend")!;
    expect(document.activeElement).not.toBe(legend());
    pick(/3년 이상/);
    expect(document.activeElement).toBe(legend());
    expect(legend().textContent).toContain("어떤 플레이");
  });

  it("'처음부터 다시 답하기'는 저장된 답변을 지우고 첫 질문으로 돌아간다", () => {
    saveAnswers({ ...done, shapes: [] });
    render(<Quiz />);
    click("처음부터 다시 답하기");
    expect(heading()).toContain("얼마나 해 보셨나요");
    expect(screen.getByText("1 / 7")).toBeDefined();
    expect(loadAnswers()).toBeNull();
    expect(screen.queryByRole("button", { name: "처음부터 다시 답하기" })).toBeNull();
  });
});

describe("질문 화면: 선택 피드백과 전환 연출(T-016)", () => {
  it("선택지를 누르면 선택 표시가 먼저 보이고, 잠시 뒤 다음 질문으로 넘어간다", () => {
    render(<Quiz />);
    click(/3년 이상/);
    expect(heading()).toContain("얼마나 해 보셨나요");
    expect(screen.getByRole("button", { name: /3년 이상/ }).getAttribute("aria-pressed")).toBe("true");
    act(() => {
      vi.advanceTimersByTime(SELECT_DELAY_MS);
    });
    expect(heading()).toContain("어떤 플레이");
  });

  it("기다리는 동안 다른 선택지를 또 눌러도 무시하고 한 번만 넘어간다", () => {
    render(<Quiz />);
    click(/3년 이상/);
    click(/1~3년/);
    act(() => {
      vi.advanceTimersByTime(SELECT_DELAY_MS * 3);
    });
    expect(heading()).toContain("어떤 플레이");
    click(/← 이전/);
    expect(screen.getByRole("button", { name: /3년 이상/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("마지막 질문에서 선택 직후 '결과 보기'를 눌러도 결과 화면으로 한 번만 간다", () => {
    saveAnswers({ experience: "over_3y", play_style: "power", weight: "heavy", arm: "no", shapes: [], budget: "200k_to_300k", tournament: "no" });
    render(<Quiz />);
    click("네");
    click("결과 보기");
    act(() => {
      vi.advanceTimersByTime(SELECT_DELAY_MS * 3);
    });
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("앞으로 갈 때와 뒤로 갈 때 전환 방향이 다르다", () => {
    render(<Quiz />);
    const fieldset = () => screen.getByRole("group");
    pick(/3년 이상/);
    expect(fieldset().dataset.direction).toBe("forward");
    click(/← 이전/);
    expect(fieldset().dataset.direction).toBe("back");
  });

  it("동작 줄이기를 켠 사용자는 기다리지 않고 바로 넘어간다", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      render(<Quiz />);
      click(/3년 이상/);
      expect(heading()).toContain("어떤 플레이");
    } finally {
      window.matchMedia = original;
    }
  });
});

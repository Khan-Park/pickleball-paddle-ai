// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

afterEach(cleanup);

function Probe() {
  return <p data-testid="probe">{useMediaQuery("(min-width: 64rem)") ? "넓음" : "좁음"}</p>;
}

describe("useMediaQuery(T-046)", () => {
  it("matchMedia가 없으면 false(모바일 배치)", () => {
    const original = window.matchMedia;
    // @ts-expect-error 테스트에서 일부러 지운다
    delete window.matchMedia;
    try {
      render(<Probe />);
      expect(screen.getByTestId("probe").textContent).toBe("좁음");
    } finally {
      window.matchMedia = original;
    }
  });

  it("화면 조건이 바뀌면(change 이벤트) 다시 그린다", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      get matches() {
        return matches;
      },
      media: q,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    })) as unknown as typeof window.matchMedia;
    try {
      render(<Probe />);
      expect(screen.getByTestId("probe").textContent).toBe("좁음");
      act(() => {
        matches = true;
        listeners.forEach((fn) => fn());
      });
      expect(screen.getByTestId("probe").textContent).toBe("넓음");
    } finally {
      window.matchMedia = original;
    }
  });
});

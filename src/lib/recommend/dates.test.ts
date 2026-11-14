import { describe, expect, it } from "vitest";
import { daysBetween } from "./dates";

describe("daysBetween", () => {
  it("같은 날은 0일이다", () => {
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("월을 넘겨 계산한다", () => {
    expect(daysBetween("2026-01-01", "2026-02-01")).toBe(31);
    expect(daysBetween("2026-01-01", "2026-06-30")).toBe(180);
  });

  it("윤년을 반영한다", () => {
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
  });

  it("거꾸로면 음수다", () => {
    expect(daysBetween("2026-01-02", "2026-01-01")).toBe(-1);
  });

  it.each(["어제", "2026/01/01", "2026-1-1", "2026-02-30", "2026-13-01", ""])(
    "올바르지 않은 날짜 %j는 NaN이다",
    (bad) => {
      expect(daysBetween(bad, "2026-01-01")).toBeNaN();
      expect(daysBetween("2026-01-01", bad)).toBeNaN();
    },
  );
});
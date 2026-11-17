import { describe, expect, it } from "vitest";
import { formatWeight } from "./weight";

describe("무게 표기(T-046, U4)", () => {
  it("oz와 반올림한 g을 함께 쓴다", () => {
    expect(formatWeight(7.9)).toBe("7.9oz · 약 224g");
    expect(formatWeight(8)).toBe("8oz · 약 227g");
    expect(formatWeight(7.6)).toBe("7.6oz · 약 215g");
    expect(formatWeight(8.15)).toBe("8.15oz · 약 231g");
  });
});

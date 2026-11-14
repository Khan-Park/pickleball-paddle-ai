import { describe, expect, it } from "vitest";
import { parseUserProfile } from "./profile";

const valid = { budget: { min_krw: 50000, max_krw: 150000 }, needs_certification: true };

function failure(input: unknown) {
  const result = parseUserProfile(input);
  if (result.success) throw new Error("실패해야 하는 입력이 통과했다");
  return result.errors;
}

describe("parseUserProfile: 정상 입력", () => {
  it("올바른 프로필을 통과시킨다", () => {
    const result = parseUserProfile(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.profile).toEqual(valid);
  });

  it("예산을 모두 생략할 수 있다", () => {
    expect(parseUserProfile({ budget: {}, needs_certification: false }).success).toBe(true);
  });

  it("하한이나 상한만 줄 수 있다", () => {
    expect(parseUserProfile({ budget: { max_krw: 100000 }, needs_certification: false }).success).toBe(true);
    expect(parseUserProfile({ budget: { min_krw: 0 }, needs_certification: false }).success).toBe(true);
  });

  it("min과 max가 같아도 통과한다(경계 포함)", () => {
    expect(parseUserProfile({ budget: { min_krw: 1000, max_krw: 1000 }, needs_certification: false }).success).toBe(true);
  });
});

describe("parseUserProfile: 잘못된 입력", () => {
  it.each([
    ["NaN", Number.NaN],
    ["음수", -1],
    ["소수", 1000.5],
    ["문자열", "10만원"],
    ["무한대", Number.POSITIVE_INFINITY],
  ])("최대 예산이 %s이면 거부한다", (_label, value) => {
    const errors = failure({ budget: { max_krw: value }, needs_certification: false });
    expect(errors.some((e) => e.field === "budget.max_krw")).toBe(true);
  });

  it("최소 예산이 최대 예산보다 크면 한국어 메시지로 거부한다", () => {
    const errors = failure({ budget: { min_krw: 200000, max_krw: 100000 }, needs_certification: false });
    expect(errors).toEqual([{ field: "budget.min_krw", message: "최소 예산이 최대 예산보다 클 수 없습니다" }]);
  });

  it("대회 인증 필요 여부가 없으면 거부한다", () => {
    const errors = failure({ budget: {} });
    expect(errors[0]).toEqual({ field: "needs_certification", message: "대회 인증 필요 여부를 선택해 주세요" });
  });

  it("예산 정보가 없으면 거부한다", () => {
    const errors = failure({ needs_certification: true });
    expect(errors.some((e) => e.field === "budget")).toBe(true);
  });

  it("객체가 아니면 거부한다", () => {
    expect(failure("안녕")[0]?.message).toBe("프로필 형식이 올바르지 않습니다");
    expect(failure(null).length).toBeGreaterThan(0);
  });

  it("모든 오류 메시지는 한국어 문장이다(영어 기본 메시지가 섞이지 않는다)", () => {
    const errors = failure({ budget: { min_krw: -1, max_krw: "x" }, needs_certification: "yes" });
    for (const e of errors) expect(e.message).toMatch(/[가-힣]/);
  });
});
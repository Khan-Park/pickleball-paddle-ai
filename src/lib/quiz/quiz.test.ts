import { describe, expect, it } from "vitest";
import { answersToProfile } from "./answers";
import { nextQuestion, progress, visibleQuestions, type QuizAnswers } from "./questions";

const ids = (a: QuizAnswers) => visibleQuestions(a).map((q) => q.id);
const full: QuizAnswers = { experience: "over_3y", play_style: "power", weight: "heavy", arm: "no", shapes: ["elongated"], budget: "200k_to_300k", tournament: "yes" };

describe("visibleQuestions: 진행형 규칙", () => {
  it("기본은 7개를 정해진 순서로 보여 준다", () => {
    expect(ids({})).toEqual(["experience", "play_style", "weight", "arm", "shapes", "budget", "tournament"]);
    expect(ids({ experience: "1_to_3y" })).toHaveLength(7);
  });

  it("초보는 '선호 모양'을 건너뛴다(6개)", () => {
    expect(ids({ experience: "under_1y" })).toEqual(["experience", "play_style", "weight", "arm", "budget", "tournament"]);
  });

  it("'잘 모르겠어요'는 초보의 플레이 성향에만 나온다", () => {
    const styleOptions = (a: QuizAnswers) => visibleQuestions(a).find((q) => q.id === "play_style")!.options.map((o) => o.value);
    expect(styleOptions({ experience: "under_1y" })).toContain("unsure");
    expect(styleOptions({ experience: "over_3y" })).not.toContain("unsure");
    expect(styleOptions({})).not.toContain("unsure");
  });

  it("질문 정의를 바꾸지 않는다(초보용 선택지가 다음 호출에 남지 않는다)", () => {
    visibleQuestions({ experience: "under_1y" });
    expect(visibleQuestions({ experience: "over_3y" }).find((q) => q.id === "play_style")!.options).toHaveLength(3);
  });

  it("모든 질문과 선택지에 한국어 문구가 있고, 선호 모양만 여러 개 선택이다", () => {
    for (const q of visibleQuestions({ experience: "under_1y" }).concat(visibleQuestions({}))) {
      expect(q.title).toMatch(/[가-힣]/);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      for (const o of q.options) expect(o.label).toMatch(/[가-힣]/);
      expect(q.multiple).toBe(q.id === "shapes");
    }
  });

  it("팔 불편 질문에는 의학적 조언이 아니라는 안내가 있다", () => {
    expect(visibleQuestions({}).find((q) => q.id === "arm")!.note).toContain("의학적 조언이 아닙니다");
  });
});

describe("nextQuestion / progress", () => {
  it("답하지 않은 첫 질문을 돌려주고, 다 답하면 null", () => {
    expect(nextQuestion({})!.id).toBe("experience");
    expect(nextQuestion({ experience: "over_3y", play_style: "power" })!.id).toBe("weight");
    expect(nextQuestion(full)).toBeNull();
  });

  it("초보는 팔 불편 다음에 바로 예산을 묻는다", () => {
    expect(nextQuestion({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "no" })!.id).toBe("budget");
  });

  it("선호 모양을 건너뛴 빈 배열도 답한 것으로 본다", () => {
    expect(nextQuestion({ ...full, shapes: [] })).toBeNull();
  });

  it("진행 상황의 전체 수는 경력에 따라 6 또는 7", () => {
    expect(progress({})).toEqual({ answered: 0, total: 7 });
    expect(progress({ experience: "under_1y", play_style: "control" })).toEqual({ answered: 2, total: 6 });
    expect(progress(full)).toEqual({ answered: 7, total: 7 });
  });
});

describe("answersToProfile", () => {
  it("상급 사용자의 답을 프로필로 바꾼다", () => {
    const r = answersToProfile(full);
    expect(r).toEqual({
      success: true,
      profile: {
        skill_level: "advanced",
        play_style: "power",
        weight_preference: "heavy",
        arm_discomfort: false,
        preferred_shapes: ["elongated"],
        budget: { min_krw: 200_000, max_krw: 300_000 },
        needs_certification: true,
      },
    });
  });

  it("초보: '잘 모르겠어요'는 균형, '상관없어요'는 제한 없음, 선호 모양은 넣지 않는다", () => {
    const r = answersToProfile({ experience: "under_1y", play_style: "unsure", weight: "any", arm: "yes", budget: "any", tournament: "no" });
    expect(r).toEqual({
      success: true,
      profile: { skill_level: "beginner", play_style: "balanced", weight_preference: "no_preference", arm_discomfort: true, budget: {}, needs_certification: false },
    });
  });

  it("경력을 초보로 바꾸면 전에 고른 선호 모양은 쓰지 않는다", () => {
    const r = answersToProfile({ ...full, experience: "under_1y" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.profile).not.toHaveProperty("preferred_shapes");
  });

  it("선호 모양을 건너뛰면(빈 배열) 프로필에 넣지 않는다", () => {
    const r = answersToProfile({ ...full, shapes: [] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.profile).not.toHaveProperty("preferred_shapes");
  });

  it.each([
    ["under_100k", { max_krw: 100_000 }],
    ["100k_to_200k", { min_krw: 100_000, max_krw: 200_000 }],
    ["200k_to_300k", { min_krw: 200_000, max_krw: 300_000 }],
    ["any", {}],
  ] as const)("예산 %s → %o", (budget, expected) => {
    const r = answersToProfile({ ...full, budget });
    expect(r.success && r.profile.budget).toEqual(expected);
  });

  it("답하지 않은 질문이 있으면 어떤 질문인지 알려 준다", () => {
    expect(answersToProfile({})).toEqual({ success: false, missing: ["experience", "play_style", "weight", "arm", "shapes", "budget", "tournament"], invalid: [] });
    expect(answersToProfile({ experience: "under_1y", play_style: "control", weight: "light", arm: "no" })).toEqual({ success: false, missing: ["budget", "tournament"], invalid: [] });
  });

  it("입력 객체를 바꾸지 않는다", () => {
    const before = JSON.stringify(full);
    answersToProfile(full);
    expect(JSON.stringify(full)).toBe(before);
  });
});

describe("answersToProfile: 손상된 저장값", () => {
  const full: QuizAnswers = { experience: "over_3y", play_style: "power", weight: "heavy", arm: "no", shapes: ["elongated"], budget: "200k_to_300k", tournament: "yes" };
  const bad = (o: object) => answersToProfile({ ...full, ...o } as QuizAnswers);

  it("예산·팔 불편·대회 답이 선택지에 없는 값이면 기본값으로 바꾸지 않고 다시 묻는다", () => {
    expect(bad({ budget: "under100" })).toEqual({ success: false, missing: [], invalid: ["budget"] });
    expect(bad({ arm: "maybe" })).toEqual({ success: false, missing: [], invalid: ["arm"] });
    expect(bad({ tournament: true })).toEqual({ success: false, missing: [], invalid: ["tournament"] });
    expect(bad({ budget: 1, arm: "", tournament: "y" })).toEqual({ success: false, missing: [], invalid: ["budget", "arm", "tournament"] });
  });

  it("경력·무게·성향이 모르는 값이면 프로필 검증에서 실패한다", () => {
    expect(bad({ experience: "pro" }).success).toBe(false);
    expect(bad({ weight: "superheavy" }).success).toBe(false);
    expect(bad({ play_style: "fast" }).success).toBe(false);
  });
});

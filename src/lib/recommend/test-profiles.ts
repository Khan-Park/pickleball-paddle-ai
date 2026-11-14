import type { UserProfile } from "./profile";

/** 테스트 전용 프로필 생성기. 필드가 늘어도 이 파일만 고친다. */
export function fakeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    budget: {},
    needs_certification: false,
    skill_level: "beginner",
    play_style: "balanced",
    weight_preference: "no_preference",
    arm_discomfort: false,
    ...overrides,
  };
}

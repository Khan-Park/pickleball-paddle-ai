/**
 * 히어로 사진 자리와 사진 정보(T-042, docs/plan/m2.5-redesign.md 3.3).
 * 사진이 정해지면 이 파일과 public/hero/의 파일만 바꾼다. 비어 있으면(null) HeroMedia가 대체 배경을 그린다.
 * 사진마다 docs/design/assets.md에 출처·라이선스 기록이 있어야 한다(HeroMedia.test.tsx가 검사).
 */
export type HeroSlot = "home-wide" | "home-tall" | "result";

export type HeroPhoto = {
  /** public/ 기준 경로. 예: "/hero/home-wide.webp" */
  src: string;
  /** 원본 픽셀 크기. 화면이 밀리지 않게(CLS) <img>에 적는다 */
  width: number;
  height: number;
};

export const HERO_PHOTOS: Record<HeroSlot, HeroPhoto | null> = {
  "home-wide": null,
  "home-tall": null,
  result: null,
};

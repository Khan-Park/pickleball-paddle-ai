// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HERO_PHOTOS, type HeroSlot } from "@/lib/shared/hero-photos";
import { HeroMedia } from "./HeroMedia";

afterEach(cleanup);

const SLOTS: HeroSlot[] = ["home-wide", "home-tall", "result"];
const FAKE_PHOTO = { src: "/hero/test.webp", width: 1600, height: 900 };

describe("히어로 미디어(T-042)", () => {
  it.each(SLOTS)("%s: 사진이 없으면 대체 배경으로 그리고 <img>가 없다", (slot) => {
    render(
      <HeroMedia slot={slot} photo={null}>
        <h1>제목</h1>
      </HeroMedia>,
    );
    const hero = screen.getByTestId("hero-media");
    expect(hero.dataset.photo).toBe("no");
    expect(screen.getByTestId("hero-fallback").getAttribute("aria-hidden")).toBe("true");
    expect(hero.querySelector("img")).toBeNull();
  });

  it("사진을 지정하면 크기·빈 alt·바로 불러오기가 붙고, 덮개가 사진 위·글자 아래에 있다", () => {
    render(
      <HeroMedia slot="home-wide" photo={FAKE_PHOTO}>
        <h1>제목</h1>
      </HeroMedia>,
    );
    const img = screen.getByTestId("hero-media").querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/hero/test.webp");
    expect(img.getAttribute("width")).toBe("1600");
    expect(img.getAttribute("height")).toBe("900");
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("loading")).toBe("eager");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(screen.getByTestId("hero-photo-layer").getAttribute("aria-hidden")).toBe("true");
    const scrim = screen.getByTestId("hero-scrim");
    expect(scrim.className).toContain("bg-hero-scrim");
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(img.compareDocumentPosition(scrim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(scrim.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId("hero-fallback")).toBeNull();
  });

  it("children은 화면 낭독기에 읽히고, 히어로 글자색·포커스 링 토큰을 쓴다", () => {
    render(
      <HeroMedia slot="result" photo={null}>
        <h1>패들 3개를 찾았어요</h1>
      </HeroMedia>,
    );
    expect(screen.getByRole("heading", { name: "패들 3개를 찾았어요" })).toBeDefined();
    const cls = screen.getByTestId("hero-media").className;
    expect(cls).toContain("bg-hero");
    expect(cls).toContain("text-on-hero");
    expect(cls).toContain("outline-focus-on-hero");
  });

  it("대체 배경 그림에 고정 색 값이 없다(currentColor·var(--토큰)·url(#그라데이션)만)", () => {
    render(
      <HeroMedia slot="home-tall" photo={null}>
        <p>글</p>
      </HeroMedia>,
    );
    const art = screen.getByTestId("hero-fallback");
    const values = [...art.querySelectorAll("*")].flatMap((el) => [
      ...["fill", "stroke"].map((a) => el.getAttribute(a)).filter((v): v is string => v !== null),
      ...((el as SVGElement).style?.stopColor ? [(el as SVGElement).style.stopColor] : []),
    ]);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) expect(v).toMatch(/^(currentColor|none|var\(--[a-z-]+\)|url\(#hero-gradient-[a-z-]+\))$/);
  });

  it("사진 목록의 파일마다 docs/design/assets.md에 출처 기록이 있다", () => {
    const assets = readFileSync(join(process.cwd(), "docs/design/assets.md"), "utf8");
    const rows = assets.split(/\r?\n/).filter((line) => line.startsWith("| `"));
    for (const photo of Object.values(HERO_PHOTOS)) {
      if (!photo) continue;
      expect(rows.some((r) => r.includes(`\`${photo.src}\``)), `${photo.src}의 기록`).toBe(true);
    }
  });
});

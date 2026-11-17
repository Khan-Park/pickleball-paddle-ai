// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { BallIcon } from "./BallIcon";
import { FACE, SHAPE_ICON_SIZE, ShapeIcon } from "./ShapeIcon";

afterEach(cleanup);

const SHAPES = ["standard", "widebody", "hybrid", "elongated"] as const;

/** 그림 안 색 속성(fill·stroke)이 currentColor·var(--토큰)·none만 쓰는지 */
function colorsOf(svg: SVGElement): string[] {
  return [svg, ...svg.querySelectorAll("*")].flatMap((el) => ["fill", "stroke"].map((a) => el.getAttribute(a)).filter((v): v is string => v !== null));
}

describe("패들 그림(T-041)", () => {
  it("형태 4종의 면 폭·높이가 그대로다(시작 화면·공유 미리보기와 같은 비율)", () => {
    expect(Object.fromEntries(SHAPES.map((s) => [s, [FACE[s].width, FACE[s].height]]))).toEqual({
      standard: [30, 38],
      widebody: [36, 34],
      hybrid: [28, 42],
      elongated: [24, 46],
    });
  });

  it("크기 3단계이고 md·lg는 전과 같다", () => {
    expect(SHAPE_ICON_SIZE).toEqual({ sm: { width: 24, height: 36 }, md: { width: 36, height: 54 }, lg: { width: 56, height: 84 } });
    for (const size of ["sm", "md", "lg"] as const) {
      const { container } = render(<ShapeIcon shape="hybrid" size={size} />);
      const svg = container.querySelector("svg")!;
      expect([svg.getAttribute("width"), svg.getAttribute("height")]).toEqual([String(SHAPE_ICON_SIZE[size].width), String(SHAPE_ICON_SIZE[size].height)]);
      cleanup();
    }
  });

  it.each(SHAPES)("%s: data-shape가 있고, 장식용으로 숨겨지며, 글자·외부 그림·고정 색이 없다", (shape) => {
    const { container } = render(<ShapeIcon shape={shape} />);
    const svg = container.querySelector("svg")!;
    expect(svg.dataset.shape).toBe(shape);
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.querySelector("text, image, use")).toBeNull();
    for (const c of colorsOf(svg)) expect(c).toMatch(/^(currentColor|none|var\(--[a-z-]+\))$/);
    // 면 테두리가 그림 상자 안에 있다
    const face = [...svg.querySelectorAll("rect")].find((r) => r.getAttribute("width") === String(FACE[shape].width))!;
    expect(Number(face.getAttribute("y")) + FACE[shape].height).toBeLessThan(72);
  });

  it("모르는 형태 값이면 그리지 않는다", () => {
    const { container } = render(<ShapeIcon shape="round" />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("손잡이와 끝 마개가 그림 상자(높이 72) 안에 있다", () => {
    for (const shape of SHAPES) {
      const { container } = render(<ShapeIcon shape={shape} />);
      for (const r of container.querySelectorAll("rect")) expect(Number(r.getAttribute("y")) + Number(r.getAttribute("height"))).toBeLessThanOrEqual(72);
      cleanup();
    }
  });
});

describe("공 그림(T-041)", () => {
  it("라임 바탕·currentColor 테두리이고 장식용으로 숨겨진다", () => {
    const { container } = render(<BallIcon size="lg" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.getAttribute("width")).toBe("40");
    const body = svg.querySelector("circle")!;
    expect(body.getAttribute("fill")).toBe("var(--lime)");
    expect(body.getAttribute("stroke")).toBe("currentColor");
    expect(svg.querySelector("text, image, use")).toBeNull();
    for (const c of colorsOf(svg)) expect(c).toMatch(/^(currentColor|none|var\(--[a-z-]+\))$/);
  });
});

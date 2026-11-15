import { describe, expect, it } from "vitest";
import { inferShape, mapManufacturerShape } from "./shape";

describe("inferShape (D-018)", () => {
  it.each([
    // [길이, 폭, 형태, 경계 근처]
    [16.5, 7.45, "elongated", true], // Selkirk Boomstik Elongated: 제조사 표기와 일치
    [15.95, 8, "widebody", true], // Selkirk Boomstik Widebody: 제조사 표기와 일치
    [16.4, 7.3, "hybrid", true], // JOOLA Hyperion Vision
    [16.5, 7.5, "elongated", true], // NOX JC6
    [15.5, 7.8, "standard", false],
    [17, 7.0, "elongated", false],
    [16.0, 7.9, "standard", true], // 길이 16.1 경계 0.1 이내
    [15.6, 8.3, "widebody", false],
  ] as const)("%f x %f in → %s (경계 근처 %s)", (length, width, shape, nearBoundary) => {
    expect(inferShape(length, width)).toEqual({ shape, nearBoundary });
  });

  it("임계값 자체는 위쪽 분류에 포함한다(폭 8.0, 길이 16.5, 길이 16.1)", () => {
    expect(inferShape(15, 8.0).shape).toBe("widebody");
    expect(inferShape(16.5, 7).shape).toBe("elongated");
    expect(inferShape(16.1, 7).shape).toBe("hybrid");
    expect(inferShape(16.09, 7).shape).toBe("standard");
  });

  it("폭이 8.0 이상이면 길이와 무관하게 widebody가 우선한다", () => {
    expect(inferShape(17, 8).shape).toBe("widebody");
  });
});

describe("mapManufacturerShape", () => {
  it("패들 형태 표현을 매핑하고 대소문자·공백을 무시한다", () => {
    expect(mapManufacturerShape(" Traditional ")).toBe("standard");
    expect(mapManufacturerShape("WideBody")).toBe("widebody");
    expect(mapManufacturerShape("Elongated")).toBe("elongated");
  });

  it("목록에 없는 표현(예: Hyperion)은 undefined", () => {
    expect(mapManufacturerShape("Hyperion")).toBeUndefined();
  });
});

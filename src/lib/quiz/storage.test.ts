import { describe, expect, it } from "vitest";
import { parseAnswers } from "./storage";

describe("parseAnswers: 저장된 답변의 모양 확인", () => {
  it("정상 답변은 그대로 돌려준다", () => {
    const answers = { experience: "under_1y", arm: "no", shapes: ["standard", "hybrid"] };
    expect(parseAnswers(JSON.stringify(answers))).toEqual(answers);
    expect(parseAnswers("{}")).toEqual({});
  });

  it("비어 있거나 JSON이 아니거나 객체가 아니면 null", () => {
    expect(parseAnswers(null)).toBeNull();
    expect(parseAnswers("")).toBeNull();
    expect(parseAnswers("{깨짐")).toBeNull();
    expect(parseAnswers("[]")).toBeNull();
    expect(parseAnswers("null")).toBeNull();
    expect(parseAnswers('"문자열"')).toBeNull();
  });

  it("선호 모양이 문자열 배열이 아니면 통째로 버린다(화면이 배열 함수를 부르다 깨지지 않게)", () => {
    expect(parseAnswers('{"shapes":"elongated"}')).toBeNull();
    expect(parseAnswers('{"shapes":{"0":"elongated"}}')).toBeNull();
    expect(parseAnswers('{"shapes":[1,2]}')).toBeNull();
    expect(parseAnswers('{"shapes":null}')).toBeNull();
  });

  it("한 가지를 고르는 답이 문자열이 아니면 통째로 버린다", () => {
    expect(parseAnswers('{"budget":1}')).toBeNull();
    expect(parseAnswers('{"tournament":true}')).toBeNull();
    expect(parseAnswers('{"experience":["under_1y"]}')).toBeNull();
  });

  it("문자열이기만 하면 선택지에 없는 값도 통과시킨다(그 검증은 answersToProfile이 한다)", () => {
    expect(parseAnswers('{"budget":"under100"}')).toEqual({ budget: "under100" });
  });
});

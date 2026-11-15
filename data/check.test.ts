import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { checkDraft, checkPaddles, DATA_MAX_AGE_DAYS, parsePaddlesJson, PRICE_MAX_AGE_DAYS, todayLocal } from "./check";
import { paddleSchema } from "./schema";
import { fakePaddle, goodPaddle } from "./test-fixtures";

const TODAY = "2026-06-01";
/** TODAY에서 n일 전 날짜 */
const ago = (n: number) => new Date(Date.UTC(2026, 5, 1) - n * 86_400_000).toISOString().slice(0, 10);
// 출처 호스트에 브랜드명이 들어가는 정상 제품(기준일 TODAY에서 경고 없음)
const good = goodPaddle;

describe("가격 확인일 스키마", () => {
  it("가격이 있는데 확인일이 없으면 거부한다", () => {
    const { price_checked_at: _omit, ...rest } = fakePaddle();
    void _omit;
    const result = paddleSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["price_checked_at"]);
  });

  it("가격이 없으면 확인일 없이 통과한다", () => {
    const { price_checked_at: _omit, price_krw: _price, ...rest } = fakePaddle();
    void _omit;
    void _price;
    expect(paddleSchema.safeParse(rest).success).toBe(true);
  });
});

describe("checkPaddles", () => {
  it("정상 데이터와 빈 목록을 통과시킨다", () => {
    expect(checkPaddles([good()], TODAY)).toEqual({ count: 1, errors: [], warnings: [] });
    expect(checkPaddles([], TODAY)).toEqual({ count: 0, errors: [], warnings: [] });
  });

  it("스키마 오류는 errors로, 날짜 점검은 하지 않는다", () => {
    const r = checkPaddles([good({ id: "BAD ID", verified_at: ago(999) })], TODAY);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0]).toContain("id");
    expect(r.warnings).toEqual([]);
  });

  it("목록이 아니거나 id가 중복되면 오류", () => {
    expect(checkPaddles({}, TODAY).errors.length).toBeGreaterThan(0);
    expect(checkPaddles([good(), good()], TODAY).errors.join()).toContain("중복");
  });

  it("기준일이 올바르지 않으면 RangeError", () => {
    expect(() => checkPaddles([], "어제")).toThrow(RangeError);
  });

  it("미래 날짜는 오류", () => {
    const r = checkPaddles([good({ verified_at: "2026-06-02", price_checked_at: "2026-07-01" })], TODAY);
    expect(r.errors.some((e) => e.includes("verified_at"))).toBe(true);
    expect(r.errors.some((e) => e.includes("price_checked_at"))).toBe(true);
  });

  it(`스펙 확인일: ${DATA_MAX_AGE_DAYS}일까지 통과, 다음 날부터 경고`, () => {
    expect(checkPaddles([good({ verified_at: ago(DATA_MAX_AGE_DAYS) })], TODAY).warnings).toEqual([]);
    const r = checkPaddles([good({ verified_at: ago(DATA_MAX_AGE_DAYS + 1) })], TODAY);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("스펙 확인");
    expect(r.errors).toEqual([]);
  });

  it(`가격 확인일: ${PRICE_MAX_AGE_DAYS}일까지 통과, 다음 날부터 경고`, () => {
    expect(checkPaddles([good({ price_checked_at: ago(PRICE_MAX_AGE_DAYS) })], TODAY).warnings).toEqual([]);
    const r = checkPaddles([good({ price_checked_at: ago(PRICE_MAX_AGE_DAYS + 1) })], TODAY);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("가격 확인");
  });

  it("대회 인증 확인일이 오래되면 경고하되, approved가 아니면 경고하지 않는다", () => {
    const old = { usa_pickleball: "approved" as const, checked_at: ago(DATA_MAX_AGE_DAYS + 1) };
    expect(checkPaddles([good({ certification: old })], TODAY).warnings[0]).toContain("대회용 추천에서 제외");
    expect(checkPaddles([good({ certification: { ...old, usa_pickleball: "unknown" } })], TODAY).warnings).toEqual([]);
  });

  it("브랜드명이 부분 문자열로만 들어간 호스트는 공식 도메인으로 보지 않는다", () => {
    const warn = (brand: string, url: string) => checkPaddles([good({ brand, sources: [url] })], TODAY).warnings.length;
    expect(warn("HEAD", "https://headphones-shop.com/x")).toBe(1);
    expect(warn("JOOLA", "https://joola-reseller.example/x")).toBe(1);
    expect(warn("JOOLA", "https://www.joola.com/x")).toBe(0);
    expect(warn("Selkirk", "https://www.selkirk.co.kr/x")).toBe(0);
    expect(warn("NOX", "https://noxpickleball.com/x")).toBe(0);
  });

  it("브랜드명이 하위 라벨일 뿐인 위장 도메인은 경고하고, 하이픈 도메인은 정규화해 비교한다", () => {
    const warn = (brand: string, url: string) => checkPaddles([good({ brand, sources: [url] })], TODAY).warnings.length;
    expect(warn("JOOLA", "https://joola.com.shop-deals.net/x")).toBe(1);
    expect(warn("JOOLA", "https://joola.evil.example/x")).toBe(1);
    expect(warn("Six Zero", "https://www.six-zero.com/x")).toBe(0);
    expect(warn("JOOLA", "https://us.joola.com/x")).toBe(0);
  });

  it("출처 호스트에 브랜드명이 없으면 경고, 있으면(대소문자·공백 무시) 경고 없음", () => {
    expect(checkPaddles([good({ sources: ["https://shop.example.com/x"] })], TODAY).warnings[0]).toContain("공식 도메인");
    expect(checkPaddles([good({ brand: "Six Zero", sources: ["https://us.sixzeropickleball.com/p"] })], TODAY).warnings).toEqual([]);
    expect(checkPaddles([good({ brand: "글룩스", sources: ["https://shop.example.com/x"] })], TODAY).warnings).toEqual([]);
  });
});

describe("todayLocal / parsePaddlesJson", () => {
  it("todayLocal은 UTC가 아니라 로컬 날짜를 쓴다", () => {
    expect(todayLocal(new Date(2026, 10, 15, 8, 0, 0))).toBe("2026-11-15"); // 로컬 오전 8시
    expect(todayLocal(new Date(2026, 0, 5, 23, 59, 59))).toBe("2026-01-05");
  });

  it("BOM이 있어도 읽는다", () => {
    expect(parsePaddlesJson("\uFEFF[]")).toEqual([]);
    expect(parsePaddlesJson("[]")).toEqual([]);
  });
});

describe("checkDraft (staging 초안)", () => {
  const draft = (paddle: object) => ({ paddle });
  const base = goodPaddle();

  it("null·TODO 필드는 보류로 모으고 오류로 보지 않는다", () => {
    const r = checkDraft(draft({ ...base, shape: "TODO: 규칙 결정 후", length_in: null, verified_at: "TODO" }));
    expect(r.errors).toEqual([]);
    expect(r.pending.sort()).toEqual(["length_in", "shape", "verified_at"]);
  });

  it("채워진 필드가 스키마에 어긋나면 오류로 알린다", () => {
    expect(checkDraft(draft({ ...base, id: "Bad ID" })).errors.join()).toContain("id");
    expect(checkDraft(draft({ ...base, core_mm: 99 })).errors.join()).toContain("core_mm");
    expect(checkDraft(draft({ ...base, length_in: 17, width_in: 8 })).errors.join()).toContain("24인치");
    expect(checkDraft(draft({ ...base, sources: ["not a url"] })).errors.length).toBeGreaterThan(0);
  });

  it("paddle 객체가 없으면 오류", () => {
    expect(checkDraft({}).errors).toEqual(["paddle 객체가 없다"]);
    expect(checkDraft(null).errors).toEqual(["paddle 객체가 없다"]);
  });

  it("저장소의 모든 staging 초안이 스키마와 구조 규칙을 지킨다", () => {
    const dir = new URL("./staging/", import.meta.url);
    const files = readdirSync(dir).filter((f) => f.endsWith(".draft.json"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const d = parsePaddlesJson(readFileSync(new URL(f, dir), "utf8")) as Record<string, Record<string, unknown>>;
      expect(checkDraft(d).errors, f).toEqual([]);
      expect(Object.keys(d), f).toEqual(expect.arrayContaining(["status", "paddle", "evidence", "source_meta"]));
      // evidence의 키는 paddle 필드명만 쓴다(url·read_at 같은 메타는 source_meta에)
      for (const key of Object.keys(d.evidence!)) expect(Object.keys(d.paddle!), `${f}:${key}`).toContain(key);
      expect(d.source_meta, f).toMatchObject({ url: expect.any(String), read_at: expect.any(String) });
    }
  });
});

describe("실제 data/paddles.json", () => {
  it("스키마 오류와 미래 날짜가 없다(경고는 허용)", () => {
    const raw = parsePaddlesJson(readFileSync(new URL("./paddles.json", import.meta.url), "utf8"));
    // 기준일을 먼 미래로 고정해 실행 시각과 무관하게 한다(미래 날짜 검사는 위 단위 테스트가 맡는다)
    expect(checkPaddles(raw, "2999-12-31").errors).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { goodPaddle } from "./test-fixtures";

const CLI = fileURLToPath(new URL("./check-cli.mts", import.meta.url));

function run(args: string[], fileContent?: string) {
  const dir = mkdtempSync(join(tmpdir(), "data-check-"));
  try {
    const file = join(dir, "paddles.json");
    if (fileContent !== undefined) writeFileSync(file, fileContent, "utf8");
    const result = spawnSync(process.execPath, [CLI, ...args.map((a) => (a === "<file>" ? file : a))], { encoding: "utf8" });
    return { code: result.status, out: result.stdout, err: result.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const good = JSON.stringify([goodPaddle()]);

describe("data:check CLI", () => {
  it("정상 데이터는 종료 코드 0과 '통과'를 낸다", () => {
    const r = run(["2026-06-01", "<file>"], good);
    expect(r.code).toBe(0);
    expect(r.out).toContain("제품 1개");
    expect(r.out).toContain("통과");
  });

  it("BOM이 붙은 파일도 읽는다", () => {
    expect(run(["2026-06-01", "<file>"], "\uFEFF" + good).code).toBe(0);
  });

  it("오류가 있으면 종료 코드 1과 오류 메시지를 낸다", () => {
    const r = run(["2026-06-01", "<file>"], '[{"id":"x"}]');
    expect(r.code).toBe(1);
    expect(r.err).toContain("오류:");
  });

  it("미래 날짜는 종료 코드 1이다", () => {
    expect(run(["2026-01-01", "<file>"], good).code).toBe(1);
  });

  it("경고만 있으면 종료 코드 0이다", () => {
    const r = run(["2027-06-01", "<file>"], good);
    expect(r.code).toBe(0);
    expect(r.out).toContain("경고:");
    expect(r.out).toContain("경고 있음");
  });

  it("--strict면 경고만 있어도 종료 코드 1이다", () => {
    expect(run(["--strict", "2027-06-01", "<file>"], good).code).toBe(1);
    expect(run(["--strict", "2026-06-01", "<file>"], good).code).toBe(0);
  });

  it("잘못된 기준일은 스택 트레이스 없이 사용법을 알리고 종료 코드 1이다", () => {
    const r = run(["어제", "<file>"], good);
    expect(r.code).toBe(1);
    expect(r.err).toContain("사용법");
    expect(r.err).not.toMatch(/\n\s+at /);
  });

  it("파일을 읽을 수 없으면 종료 코드 1이다", () => {
    const r = run(["2026-06-01", "<file>"]); // 파일을 만들지 않음
    expect(r.code).toBe(1);
    expect(r.err).toContain("읽지 못했다");
  });
});
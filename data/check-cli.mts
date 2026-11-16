import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDraft, checkPaddles, parsePaddlesJson, todayLocal } from "./check.ts";
import { BUDGET_ANSWERS, COVERAGE_MIN, coverage } from "./coverage.ts";
import { paddlesSchema } from "./schema.ts";
import { SHAPE_LABEL } from "../src/lib/shared/shape-labels.ts";

const USAGE = "사용법: npm run data:check [-- [--strict] [YYYY-MM-DD [파일경로]]]  (기준일 생략 시 이 컴퓨터의 오늘 날짜, --strict는 경고도 실패로 본다)\n       npm run data:check -- --staging  (data/staging 초안을 스키마로 점검)\n       npm run data:check -- --coverage  (질문 조합별 맞는 제품 수. 정보 출력이며 실패로 보지 않는다)";

/** data/staging의 초안을 모두 점검한다. 채워진 필드가 스키마에 어긋나면 1, 보류(null/TODO)는 알리기만 한다 */
function checkStaging(): number {
  const dir = fileURLToPath(new URL("./staging/", import.meta.url));
  const files = readdirSync(dir).filter((f) => f.endsWith(".draft.json")).sort();
  let failed = false;
  for (const f of files) {
    let report;
    try {
      report = checkDraft(parsePaddlesJson(readFileSync(join(dir, f), "utf8")));
    } catch (e) {
      report = { pending: [], errors: [`읽지 못했다: ${e instanceof Error ? e.message : String(e)}`] };
    }
    const pending = report.pending.length > 0 ? ` (보류 필드: ${report.pending.join(", ")})` : "";
    console.log(`${report.errors.length > 0 ? "오류" : "확인"}: ${f}${pending}`);
    for (const e of report.errors) console.error(`  오류: ${e}`);
    if (report.errors.length > 0) failed = true;
  }
  console.log(`초안 ${files.length}개 점검`);
  return failed ? 1 : 0;
}

/** 종료 코드를 돌려준다. process.exit()로 끊지 않아 출력이 잘리지 않는다 */
function main(): number {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  if (args.includes("--staging")) return checkStaging();
  const [dateArg, fileArg] = args.filter((a) => !a.startsWith("--"));
  const today = dateArg ?? todayLocal();
  const file = fileArg ?? fileURLToPath(new URL("./paddles.json", import.meta.url));

  let raw: unknown;
  try {
    raw = parsePaddlesJson(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`paddles.json을 읽지 못했다: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }

  let report;
  try {
    report = checkPaddles(raw, today);
  } catch (e) {
    console.error(`${e instanceof Error ? e.message : String(e)}\n${USAGE}`);
    return 1;
  }

  console.log(`제품 ${report.count}개, 기준일 ${today}`);
  for (const w of report.warnings) console.log(`경고: ${w}`);
  for (const e of report.errors) console.error(`오류: ${e}`);
  if (report.errors.length > 0) return 1;
  if (strict && report.warnings.length > 0) {
    console.error("--strict: 경고가 있어 실패로 처리한다. 재확인 후 다시 실행해 달라");
    return 1;
  }
  console.log(report.warnings.length > 0 ? "통과(경고 있음)" : "통과");
  if (args.includes("--coverage")) printCoverage(raw, today);
  return 0;
}

/** 한글은 두 칸으로 보고 오른쪽을 공백으로 채운다(터미널 표 정렬용) */
function pad(s: string, width: number): string {
  const w = [...s].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x7f ? 2 : 1), 0);
  return s + " ".repeat(Math.max(1, width - w));
}

/** 질문 조합별 맞는 제품 수를 표로 출력한다. 기준(COVERAGE_MIN)보다 적은 칸에 ! 를 붙인다 */
function printCoverage(raw: unknown, today: string): void {
  const cells = coverage(paddlesSchema.parse(raw), today);
  const mark = (n: number) => `${n}${n < COVERAGE_MIN ? "!" : ""}`;
  console.log(`\n질문 조합별 맞는 제품 수 (예산·대회 필터 통과 + 형태 일치, 기준 ${COVERAGE_MIN}개 이상, ! = 부족)`);
  console.log(`${pad("형태", 14)}${pad("예산", 10)}${pad("대회 아님", 11)}대회`);
  let short = 0;
  for (const c of cells.filter((x) => !x.tournament)) {
    const t = cells.find((x) => x.shape === c.shape && x.budget === c.budget && x.tournament)!;
    short += Number(c.ids.length < COVERAGE_MIN) + Number(t.ids.length < COVERAGE_MIN);
    const budget = BUDGET_ANSWERS.find((b) => b.value === c.budget)!.label;
    console.log(`${pad(SHAPE_LABEL[c.shape], 14)}${pad(budget, 10)}${pad(mark(c.ids.length), 11)}${mark(t.ids.length)}`);
  }
  console.log(`부족한 조합 ${short}개 / 전체 ${cells.length}개`);
}

process.exitCode = main();

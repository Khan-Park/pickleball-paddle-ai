import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDraft, checkPaddles, parsePaddlesJson, todayLocal } from "./check.ts";

const USAGE = "사용법: npm run data:check [-- [--strict] [YYYY-MM-DD [파일경로]]]  (기준일 생략 시 이 컴퓨터의 오늘 날짜, --strict는 경고도 실패로 본다)\n       npm run data:check -- --staging  (data/staging 초안을 스키마로 점검)";

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
  return 0;
}

process.exitCode = main();

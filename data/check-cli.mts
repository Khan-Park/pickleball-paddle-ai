import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkPaddles, parsePaddlesJson, todayLocal } from "./check.ts";

const USAGE = "사용법: npm run data:check [-- YYYY-MM-DD [파일경로]]  (기준일 생략 시 이 컴퓨터의 오늘 날짜)";

const today = process.argv[2] ?? todayLocal();
const file = process.argv[3] ?? fileURLToPath(new URL("./paddles.json", import.meta.url));

let raw: unknown;
try {
  raw = parsePaddlesJson(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`paddles.json을 읽지 못했다: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}

let report;
try {
  report = checkPaddles(raw, today);
} catch (e) {
  console.error(`${e instanceof Error ? e.message : String(e)}\n${USAGE}`);
  process.exit(1);
}

console.log(`제품 ${report.count}개, 기준일 ${today}`);
for (const w of report.warnings) console.log(`경고: ${w}`);
for (const e of report.errors) console.error(`오류: ${e}`);
if (report.errors.length > 0) process.exit(1);
console.log(report.warnings.length > 0 ? "통과(경고 있음)" : "통과");

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** YYYY-MM-DD를 UTC 자정 밀리초로 바꾼다. 형식이나 달력상 존재하지 않는 날짜면 NaN. */
function toUtcDay(date: string): number {
  const match = ISO_DATE.exec(date);
  if (!match) return Number.NaN;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const back = new Date(ms);
  const exists =
    back.getUTCFullYear() === year && back.getUTCMonth() === month - 1 && back.getUTCDate() === day;
  return exists ? ms : Number.NaN;
}

/** from에서 to까지의 일수(to - from). 날짜가 올바르지 않으면 NaN. 현재 시각을 읽지 않는다. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcDay(to) - toUtcDay(from)) / MS_PER_DAY);
}

/**
 * 이 기기의 로컬 날짜(YYYY-MM-DD). 한국 시간 오전에도 오늘 날짜가 나온다(UTC 아님).
 * 엔진은 현재 시각을 읽지 않으므로, 화면과 점검 스크립트가 이 값을 만들어 넘긴다.
 */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

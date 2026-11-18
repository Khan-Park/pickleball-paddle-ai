import type { PaddleDisplay } from "../../../data/schema";
import { affiliateProgram, DISCLOSURE, NOTICE, type AffiliateProgram } from "./labels";

/** 화면에 보이는 제품들의 제휴 프로그램. 비어 있으면 제휴 링크가 없다 */
export function affiliatePrograms(paddles: readonly (PaddleDisplay | undefined)[]): Set<AffiliateProgram> {
  const programs = new Set<AffiliateProgram>();
  for (const paddle of paddles) {
    if (paddle?.purchase?.is_affiliate) programs.add(affiliateProgram(paddle.purchase));
  }
  return programs;
}

/**
 * 게시물 첫 부분의 경제적 이해관계 표시(심사지침 Ⅴ.6, 쿠팡 파트너스 가이드, D-022). 결과 화면·둘러보기가 같이 쓴다.
 * 제목보다 앞, 본문보다 큰 글자와 다른 색, 접히지 않는 위치에 둔다. 제휴 링크가 없으면 그리지 않는다.
 * 문구 끝의 순위 안내(ranking)는 화면마다 다를 수 있어 바꿀 수 있게 한다.
 */
export function AffiliatePageNotice({ programs, note = NOTICE.ranking }: { programs: ReadonlySet<AffiliateProgram>; note?: string }) {
  if (programs.size === 0) return null;
  return (
    <div className="rounded-lg border-2 border-navy bg-card p-4" data-testid="affiliate-page-notice">
      {/* "광고"와 표시 문구는 본문(text-body)보다 큰 글자(D-022 (1), T-054). 크기 비교는 affiliate-notice.test.tsx */}
      <p className="text-heading font-bold text-navy" data-testid="affiliate-page-notice-label">
        광고
      </p>
      {(["coupang", "other"] as const)
        .filter((program) => programs.has(program))
        .map((program) => (
          <p key={program} className="mt-1 text-heading font-semibold text-navy" data-testid="affiliate-page-notice-text">
            {DISCLOSURE[program]}
          </p>
        ))}
      <p className="mt-2 text-sm leading-relaxed text-ink">{note}</p>
    </div>
  );
}

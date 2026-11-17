import type { PaddleSpec } from "../../../data/schema";
import { isApprovedNow } from "./browse";

/**
 * 대회 승인을 짧게. 확인 배지(CertBadge)와 같은 기준(180일, 미래 날짜는 재확인 필요).
 * 비교표·목록 줄·순위 줄·상세가 같이 쓴다(T-047에서 비교표 파일에서 옮김).
 */
export function certShort(certification: PaddleSpec["certification"], today: string): string {
  if (certification.usa_pickleball === "approved") return isApprovedNow(certification, today) ? "✓ 승인" : "재확인 필요";
  return certification.usa_pickleball === "not_approved" ? "미승인" : "미확인";
}

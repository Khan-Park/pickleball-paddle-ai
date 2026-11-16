/**
 * 쿠팡으로 보이는 주소인지. 데이터 입력 실수를 잡는 점검용이다(화면의 대가 표시 문구는 purchase.program으로 정한다).
 * coupa.ng는 쿠팡 단축 주소로 알려져 있어 넣었다. 파트너스가 지금 발급하는 링크 형식은 직접 확인하지 못했으므로,
 * 다른 도메인이 확인되면 여기에 추가한다.
 */
const COUPANG_HOSTS = ["coupang.com", "coupa.ng"];

export function isCoupangUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return COUPANG_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

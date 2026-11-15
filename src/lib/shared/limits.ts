/**
 * 대회 인증 확인일이 이 일수를 넘으면 approved라도 '확인 필요'로 보고 대회용 추천에서 제외한다.
 * 사용자가 180일로 확정했다. 확인 후 180일째까지는 통과한다. (docs/decisions.md D-013)
 * 엔진(filter.ts)과 데이터 점검(data/check.ts)이 같은 값을 쓰도록 import 없는 이 파일에 둔다.
 */
export const CERT_MAX_AGE_DAYS = 180;

/** 가격 확인일 기준. 가설: 가격은 자주 바뀌고 직구는 편차가 커서 30일로 둔다. 데이터 점검과 결과 화면이 같이 쓴다 */
export const PRICE_MAX_AGE_DAYS = 30;

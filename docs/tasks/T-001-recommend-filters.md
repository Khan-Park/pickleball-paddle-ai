# T-001 추천 프로필 타입과 하드 필터

## 목표
사용자 프로필 타입을 정의하고, 가격대·대회 인증 조건으로 제품을 거르는 순수 함수를 만든다. UI는 만들지 않는다.

## 수용 기준
- [x] `src/lib/recommend/types.ts`에 UserProfile 정의 (예산 범위, 대회 인증 필요 여부)
- [x] `src/lib/recommend/filter.ts`에 `hardFilter(paddles: PaddleSpec[], profile: UserProfile): PaddleSpec[]`
- [x] 가격 정보가 없는 제품의 처리 방식을 코드 주석과 docs/decisions.md에 기록
- [x] 인증이 unknown인 제품의 처리 방식을 같은 방식으로 기록 (대회 인증이 필요한 사용자에게는 제외하는 쪽이 안전)
- [x] 테스트 6개 이상 (예산 범위 안/밖, 경계값, 인증 필요/불필요, 가격 없음, 빈 목록)
- [x] `npm run check` 통과

## 건드릴 파일
- src/lib/recommend/ (새로 만들기), docs/decisions.md

## 건드리지 말 것
- data/schema.ts, 구매 링크(purchase) 관련 코드, UI

## 참고
- docs/spec.md의 추천 로직 원칙
- 테스트 데이터는 테스트 파일 안의 가짜 샘플만 쓴다 (실제 제품 데이터 금지)

## 결과 (2026-11-14)
- 테스트 10개 추가(전체 18개), npm run check 통과
- 결정 D-009, D-010 기록. 구현 중 추가한 규칙: min_krw > max_krw 이면 RangeError

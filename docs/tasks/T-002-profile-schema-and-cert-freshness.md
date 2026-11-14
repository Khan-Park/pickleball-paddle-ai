# T-002 UserProfile 스키마(zod)와 인증 확인일 정책

## 목표
1. UserProfile을 zod 스키마로 정의해, 질문 플로우(UI)가 입력을 이 스키마로 검증한 뒤 엔진에 넘기게 한다. 타입은 스키마에서 추론한다(data/schema.ts와 같은 방식).
2. 대회 인증 `approved`의 확인일(`checked_at`)이 오래된 경우의 처리 정책을 정하고 구현한다. (T-001 코드 리뷰에서 분리된 항목)

## 사용자 결정 필요 (구현 전에 확정)
- 인증 확인일이 며칠 지나면 `approved`라도 '확인 필요'로 보고 대회용 추천에서 제외할지. 기본 제안: 데이터 원칙과 같은 180일. 값은 사용자가 정한다.
- 기준일 처리: 엔진은 순수 함수여야 하므로 현재 날짜를 내부에서 읽지 않고 호출부가 `today`를 넘긴다.

## 수용 기준
- [ ] `src/lib/recommend/profile.ts`에 zod 스키마와 `UserProfile` 추론 타입 (예산 0 이상 유한 정수, min <= max, 인증 필요 여부)
- [ ] 스키마 파싱 실패 시 UI가 보여줄 수 있는 오류 메시지(한국어) 제공
- [ ] hardFilter의 RangeError 방어는 유지하되, 정상 경로에서는 스키마가 먼저 걸러낸다
- [ ] 확인일 정책을 decisions.md에 기록하고 hardFilter에 반영 (기준일은 인자로 주입)
- [ ] 확인일이 오래된 approved, 경계(정확히 N일), 확인일 형식 오류 테스트
- [ ] 엔진 소스에 purchase·affiliate 참조 없음(purity.test.ts 통과)
- [ ] `npm run check` 통과

## 건드릴 파일
- src/lib/recommend/ , docs/decisions.md

## 건드리지 말 것
- data/schema.ts(제품 스키마), UI, 구매 링크 관련 코드

## 참고
- docs/decisions.md D-009 ~ D-012
- T-001 코드 리뷰 지적 사항(NaN 예산, 인증 확인일, 경계 검증 위치)
# T-014 화면 재리뷰 반영 (제휴 프로그램 명시, 저장값 검증, 필드 목록 통합)

## 목표
T-013 병합 뒤 재리뷰에서 나온 10건을 고친다.

## 수용 기준
- [x] 대가 표시 문구를 주소 추정이 아니라 데이터의 `purchase.program`으로 고른다(D-023). 제휴 링크는 `program` 필수, 제휴가 아닌 링크에는 `program` 금지
- [x] 데이터 점검: 쿠팡 주소(coupang.com, coupa.ng)인데 `program`이 `coupang_partners`가 아니면 오류. 쿠팡 주소 판정은 `src/lib/shared/affiliate.ts` 한 곳에만 둔다
- [x] 저장된 답변의 모양을 확인한다. 한 가지를 고르는 답이 문자열이 아니거나 선호 모양이 문자열 배열이 아니면 통째로 버린다
- [x] 시작 화면의 "질문 시작하기"는 이 탭에 남은 답변을 지운다. 결과 화면의 링크는 "답변 고치기"로 바꾸고 답변을 유지한다. 질문 화면은 답변을 불러왔을 때 안내를 보여 준다
- [x] 승인 배지: 180일이 지난 경우("오래됨")와 확인일이 미래이거나 읽을 수 없는 경우("확인할 수 없음")를 구분한다
- [x] 엔진용·화면용 필드 목록을 `SPEC_FIELDS`, `DISPLAY_EXTRA_FIELDS` 상수로 두고 타입과 복사 함수(`toPaddleSpec`, `toPaddleDisplay`)를 거기서 만든다
- [x] 형태 값은 스키마의 `SHAPES`·`Shape` 하나만 정의로 쓴다(질문, 점수 설정, 이름, 그림이 가져다 쓴다)
- [x] 답변 변환 실패를 `missing`(답하지 않음)과 `invalid`(선택지에 없는 값)로 나누고 화면 문구도 나눈다
- [x] 테스트 추가(262개), `npm run check`·`npm run build` 통과

## 건드릴 파일
- data/schema.ts, data/check.ts, data/shape.ts, src/lib/shared/, src/lib/quiz/, src/lib/recommend/scoring-config.ts(타입 가져오기만), src/components/, src/app/page.tsx, src/app/result/page.tsx, docs/decisions.md

## 건드리지 말 것
- 엔진의 점수·필터 로직, data/paddles.json

## 확인하지 못한 것
- 쿠팡 파트너스가 지금 발급하는 링크의 도메인(coupa.ng 외에 더 있는지). 가입 후 실제 링크로 확인하고 `COUPANG_HOSTS`를 맞춘다.
- 대가 표시 배치는 여전히 실제 제품 링크로 화면에서 보지 못했다(모든 제품의 구매 링크가 비어 있다).

# T-009 질문 정의와 답변 → 프로필 변환

## 목표
질문 7개의 정의와 진행형 규칙, 답변을 추천 엔진의 `UserProfile`로 바꾸는 순수 함수를 만든다. 화면은 만들지 않는다. 설계: docs/design/ui-flow.md 2장.

## 수용 기준
- [x] `src/lib/quiz/questions.ts`: 질문 7개(한국어 문구, 선택지), `visibleQuestions`, `nextQuestion`, `progress`
- [x] 진행형 규칙 두 가지: 초보는 '선호 모양'을 건너뛰고, '플레이 성향'에 "잘 모르겠어요"가 추가된다
- [x] `src/lib/quiz/answers.ts`: `answersToProfile`이 답변을 프로필로 바꾸고 `parseUserProfile`로 검증한다. 답하지 않은 질문은 `missing`으로 알린다
- [x] 예산 구간 4가지 변환, "잘 모르겠어요" → 균형, "상관없어요" → 제한 없음, 건너뛴 선호 모양은 프로필에 넣지 않음
- [x] 팔 불편 질문에 "의학적 조언이 아닙니다" 안내
- [x] 순수 함수(입력 불변), `npm run check` 통과

## 건드릴 파일
- src/lib/quiz/ (새 폴더), docs/tasks

## 건드리지 말 것
- src/lib/recommend 엔진, data/, 화면(app/)

## 알려 둘 점
- 예산 구간의 경계 금액(10만, 20만 원)은 양쪽 구간에 모두 포함된다. 하드 필터가 양끝을 포함하기 때문이다.
- 30만 원을 넘는 제품만 보려는 선택지는 없다("상관없어요"를 고르면 전부 나온다). 필요하면 구간을 추가한다.

## 참고
- docs/design/ui-flow.md, src/lib/recommend/profile.ts

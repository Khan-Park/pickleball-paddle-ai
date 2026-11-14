# T-005 recommend() 조립, 추천 이유, 조건 완화 힌트

## 목표
하드 필터와 점수 축을 합쳐 상위 N개를 돌려주는 `recommend()`를 만든다. 이유 문장 템플릿과 결과 없음 시 조건 완화 힌트를 포함한다. 설계: docs/design/scoring.md 4~7장.

## 수용 기준
- [ ] `recommend(paddles, profile, { today }, { limit = 3 })` : hardFilter -> 점수 -> 정렬(동점은 id) -> 상위 N
- [ ] 결과에 점수(내부), 라벨(매우 잘 맞음/잘 맞음/보통), 축별 점수, 이유 목록, 주의 문구, `SCORING_VERSION` 포함
- [ ] 이유·주의 문장은 규칙 ID별 템플릿. 의학적 효과를 단정하지 않는 표현만 사용
- [ ] 후보 0개일 때 조건 완화 힌트(예산, 대회 인증을 각각 풀었을 때 후보 수)
- [ ] 골든 페르소나 테스트: 가짜 제품 4~5종 x 대표 사용자 10~15명의 기대 1순위 고정
- [ ] 같은 입력은 항상 같은 결과. purity.test.ts 통과
- [ ] `npm run check` 통과

## 건드릴 파일
- src/lib/recommend/ (새 파일), docs/decisions.md

## 건드리지 말 것
- data/schema.ts, 구매 링크 관련 코드, UI

## 참고
- docs/design/scoring.md, T-003·T-004 결과
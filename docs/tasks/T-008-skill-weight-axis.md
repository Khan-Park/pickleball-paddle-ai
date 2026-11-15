# T-008 경력별 무게 적합 축

## 목표
초보·중급 사용자에게 권장 무게대를 벗어난 패들이 상위에 오지 않게 한다. 근거: 실제 데이터에서 초보·균형 사용자에게 8.75oz 패들이 1순위로 나온 사례(D-021).

## 수용 기준
- [x] `skill_weight` 축: 초보·중급에게만 켜지고, 무게 선호를 직접 고르면 꺼진다(중복 감점 없음)
- [x] 숫자는 `scoring-config.ts`에 두고 `SCORING_VERSION`을 0.2.0으로 올린다
- [x] 이유·주의 문장 템플릿 추가(의학적 표현 없음)
- [x] 테스트: 축 제외 조건, 경계값(7.3/8.4oz), 감점, 초보에게 중간 무게가 무거운 것보다 위, 상급자 미적용
- [x] 기존 골든 페르소나 테스트가 그대로 통과
- [x] `npm run check` 통과

## 건드릴 파일
- src/lib/recommend/ (axes.ts, scoring-config.ts, recommend.ts, reasons.ts, 테스트), docs/design/scoring.md, docs/decisions.md

## 건드리지 말 것
- data/schema.ts, data/paddles.json, UI

## 참고
- docs/design/scoring.md 10장, docs/spec.md의 무게 해석 기준
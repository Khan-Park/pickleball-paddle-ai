# T-004 점수 축 순수 함수와 설정 파일

## 목표
파워/컨트롤, 관용성, 팔 부담, 무게 선호, 형태 선호 축의 점수 함수(0~1)와, 모든 숫자를 모은 설정 파일을 만든다. 설계: docs/design/scoring.md 3장.

## 수용 기준
- [ ] `src/lib/recommend/scoring-config.ts`에 임계값·가중치·`SCORING_VERSION` 집약. 각 값에 근거(출처 또는 '가설')를 주석으로 적는다
- [ ] `src/lib/recommend/axes.ts`에 축별 순수 함수. 반환값은 항상 0~1이며 `reason`(규칙 ID + 값)을 함께 낸다
- [ ] 현재 시각, 난수, 구매 링크 필드를 읽지 않는다(purity.test.ts 통과)
- [ ] 속성 테스트: 범위 0~1, 결정성, 코어가 두꺼울수록 control 선호의 power_control 적합도가 내려가지 않음, 팔 불편이 아니면 arm_comfort 축 제외
- [ ] 경계값 테스트(코어 13/15/17mm, 무게 7.1/7.9/8.7oz, 무게대 경계 7.3/8.4oz)
- [ ] `npm run check` 통과

## 건드릴 파일
- src/lib/recommend/ (새 파일), docs/decisions.md

## 건드리지 말 것
- filter.ts, data/schema.ts, UI

## 참고
- docs/design/scoring.md 1장(한계)·3장
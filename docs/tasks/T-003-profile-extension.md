# T-003 UserProfile 확장 (소프트 점수화 입력)

## 목표
소프트 점수화에 필요한 입력을 UserProfile 스키마에 추가하고 한국어 검증 메시지를 제공한다. 설계: docs/design/scoring.md 2장.

## 수용 기준
- [ ] `skill_level`, `play_style`, `weight_preference`, `arm_discomfort`, `preferred_shapes`(선택) 추가
- [ ] 각 필드 누락·잘못된 값에 한국어 오류 메시지
- [ ] 기존 필드(budget, needs_certification)와 hardFilter 동작은 그대로
- [ ] 테스트: 정상, 필수 누락, 잘못된 값, preferred_shapes가 스키마의 shape 값만 허용
- [ ] `npm run check` 통과

## 건드릴 파일
- src/lib/recommend/profile.ts, profile.test.ts, 필요 시 filter.test.ts의 프로필 샘플

## 건드리지 말 것
- filter.ts 로직, data/schema.ts, UI

## 참고
- docs/design/scoring.md, docs/decisions.md D-015
# T-007 제품 데이터 첫 묶음 (초안 단계)

## 목표
`docs/data/product-candidates.md`의 첫 묶음 후보(약 16개)에 대해 제조사 공식 스펙 초안을 만들고, 사람이 원문과 대조해 승인한 것만 `data/paddles.json`에 올린다. 이 카드의 현재 범위는 **초안 작성**까지다.

## 수용 기준
- [x] 초안 파일 구조 확정(`data/staging/README.md`)과 조사 절차 기록
- [x] 파일럿 4개 제품 초안 또는 보류 파일(근거 원문·URL 포함)
- [x] 초안을 스키마로 검사하는 절차(`npm run data:check -- --staging`)와 테스트
- [ ] 나머지 후보의 초안 또는 보류 파일
- [ ] 사람이 확인표를 승인한 초안만 `paddles.json`으로 승격(`verified_at`은 사람이 확인한 날짜)
- [ ] 승격 후 `npm run check:release` 통과
- [ ] `npm run check` 통과

## 건드릴 파일
- data/staging/ (초안·README), data/check.ts·check-cli.mts·테스트(staging 검사), docs/tasks, docs/decisions.md(형태 분류 규칙 결정 시)
- data/shape.ts(형태 분류 규칙 D-018), data/schema.ts·schema.test.ts(길이+폭 반올림 허용 오차 D-020, 사용자 결정)

## 건드리지 말 것
- `data/paddles.json`을 사람 승인 없이 수정하지 않는다
- 공식 페이지에 없는 값을 비공식 출처나 추정으로 채우지 않는다(`null`로 두고 보류)
- 추천 엔진 로직, UI

## 참고
- docs/data/product-candidates.md, data/staging/README.md, CLAUDE.md 핵심 규칙 2

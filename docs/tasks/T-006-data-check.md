# T-006 제품 데이터 검증 스크립트와 가격 확인일 필드

## 목표
제품 데이터를 사람이 넣기 전후에 자동으로 점검한다. 가격은 판매처마다 편차가 크고(직구 포함) 예산 필터가 이 값에 의존하므로 확인일을 함께 기록한다.

## 수용 기준
- [x] `price_checked_at`(선택, 날짜) 추가. `price_krw`가 있으면 `price_checked_at`도 필수
- [x] `data/check.ts`의 `checkPaddles(raw, today)`: 스키마 오류(errors), 미래 날짜(errors), 재확인 필요(warnings)를 돌려준다
- [x] 경고 기준: `verified_at` 180일 초과, 대회 인증 `checked_at`은 엔진과 같은 `CERT_MAX_AGE_DAYS`, `price_checked_at` 30일 초과(가설, 가격은 자주 변함), 출처 URL의 등록 도메인이 브랜드 공식 도메인으로 보이지 않음
- [x] `npm run data:check`로 `data/paddles.json`을 점검(오류가 있으면 종료 코드 1, `--strict`면 경고도 1). 기준일은 로컬 날짜, BOM 허용
- [x] `npm run check:release`(배포 전): `check` + `data:check --strict`
- [x] 테스트: 정상, 빈 목록, 스키마 오류, 가격 확인일 누락, 미래 날짜, 경계(180/181일, 30/31일), 도메인 판정(위장·하이픈·2단 TLD), BOM, 실제 paddles.json, CLI 종료 코드
- [x] `npm run check` 통과

## 건드릴 파일
- data/schema.ts, data/test-fixtures.ts, data/check.ts, data/check-cli.mts, data/check.test.ts, data/check-cli.test.ts, package.json(스크립트·type module·engines), tsconfig.json(allowImportingTsExtensions), CLAUDE.md(배포 전 명령 1줄)
- 리뷰 반영으로 추가: `src/lib/shared/dates.ts`·`dates.test.ts`(src/lib/recommend에서 이동), `src/lib/shared/limits.ts`(CERT_MAX_AGE_DAYS 공용화), `src/lib/recommend/filter.ts`(import 경로와 re-export만 변경, 동작 변경 없음)

## 건드리지 말 것
- 엔진 동작(필터·점수 로직), UI

## 참고
- 직구 포함 결정은 `docs/product-candidates` 브랜치의 `docs/data/product-candidates.md`(해당 브랜치 병합 후 main에서 볼 수 있음), docs/decisions.md

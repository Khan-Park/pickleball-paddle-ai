# 피클볼 패들 추천

질문 몇 개에 답하면 맞는 피클볼 패들 3개를 이유와 주의점과 함께 추천하는 한국어 웹앱입니다.

- 추천은 제조사·판매처가 공개한 스펙(무게, 코어 두께, 형태, 가격, 대회 승인)으로 계산합니다. LLM을 호출하지 않습니다.
- 구매 링크나 제휴 수수료는 추천 순위에 영향을 주지 않습니다. 추천 엔진은 구매 정보를 읽지 못하게 타입으로 막혀 있습니다.
- 답변은 브라우저 탭(sessionStorage)에만 저장하고 서버로 보내지 않습니다.

상세 기획은 [docs/spec.md](docs/spec.md), 결정 기록은 [docs/decisions.md](docs/decisions.md)에 있습니다.

## 구성

| 경로 | 내용 |
|---|---|
| `src/app` | 화면(시작 `/`, 질문 `/quiz`, 결과 `/result`, 404) |
| `src/lib/recommend` | 추천 엔진(순수 함수). 필터 → 점수 축 6개 → 라벨·이유·주의 |
| `src/lib/quiz` | 질문 목록, 답변 → 프로필 변환, 답변 저장 |
| `data/paddles.json` | 화면에 쓰는 제품 데이터. 사람이 출처를 확인한 값만 넣는다 |
| `data/staging` | 확인 전 초안과 보류 제품 |
| `docs/tasks` | 작업 카드(T-001~) |

기술: Next.js 16(App Router, 정적 내보내기) + TypeScript + Tailwind 4, 테스트 Vitest, 스키마 zod. Node 22.18 이상.

## 개발

```bash
npm install
npm run dev
```

## 검사

| 명령 | 내용 |
|---|---|
| `npm run check` | 타입 검사 + 린트 + 테스트. 커밋 전에 통과시킨다 |
| `npm run data:check` | 제품 데이터 점검(스키마, 날짜, 출처). `-- --staging`이면 초안까지 |
| `npm run check:release` | 배포 전 점검. 확인일이 오래된 스펙·가격·승인이나 출처 경고가 있으면 실패한다 |
| `npm run build` | 정적 내보내기. 결과는 `out/` |

## 배포

`npm run build`로 만든 `out/` 폴더를 Cloudflare에 정적 파일로 올립니다. 서버 코드와 환경변수는 없습니다. 절차와 확인 항목은 [docs/deploy.md](docs/deploy.md)에 있습니다.

## 제품 데이터를 고칠 때

1. 출처를 직접 확인한 값만 넣는다. 추정하지 않는다. 제품마다 `sources`와 `verified_at`이 필요하다.
2. 범위로 적힌 값은 중간값을 쓰고 `notes`에 근거를 남긴다.
3. `npm run check:release`가 통과해야 배포한다.

자세한 기준은 [data/staging/README.md](data/staging/README.md)와 결정 기록(D-016~D-026)에 있습니다.

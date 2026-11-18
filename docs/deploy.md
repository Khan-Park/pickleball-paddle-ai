# 배포 절차 (Cloudflare Workers 정적 파일)

push와 배포는 사람이 한다(CLAUDE.md). 이 문서는 그 절차와 확인 항목이다.

## 방식
- `next.config.ts`의 `output: "export"`로 `npm run build`가 `out/`에 HTML·CSS·JS만 만든다. 서버 코드, API, 환경변수, 비밀값은 없다.
- `wrangler.jsonc`가 `out/`을 Cloudflare Workers 정적 파일로 올린다(Worker 스크립트 없음).
- 근거(2026-11-16 확인):
  - 정적 파일 요청은 무료·유료 요금제 모두 무료·무제한: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations
  - 정적 사이트 설정: https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/
  - 새 프로젝트는 Pages보다 Workers 권장: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- Vercel 무료(Hobby)는 비상업 용도만 허용해서 쓰지 않는다(제휴 링크를 넣으면 상업 이용).
- `cacheComponents`는 PPR을 켜서 정적 내보내기와 함께 쓸 수 없어 뺐다("PPR cannot be enabled in export mode" 빌드 오류).

## 배포 전 (로컬)
1. `npm run check:release`가 통과한다(확인일이 오래된 데이터가 있으면 실패한다).
2. `npm run build`가 성공하고 `out/`에 `index.html`, `quiz.html`, `result.html`, `404.html`이 있다.

## 처음 한 번
1. GitHub에 저장소를 만들고 main을 push한다(공개·비공개 선택).
2. Cloudflare 대시보드에서 Workers 프로젝트를 만들고 GitHub 저장소를 연결한다.
3. 빌드 설정
   - 빌드 명령: `npm run build`
   - 배포 명령: `npx wrangler deploy` (Cloudflare 기본값으로 알려져 있다. 화면에서 확인)
   - Node 버전: 22.18 이상(`package.json`의 engines). Workers Builds 기본 Node는 24.22.1이라 따로 지정하지 않아도 된다(2026-11-16 확인: https://developers.cloudflare.com/workers/ci-cd/builds/build-image/). 바꿀 때는 빌드 환경변수 `NODE_VERSION`
   - Worker 이름은 `wrangler.jsonc`의 `name`(`pickleball-paddle-ai`)과 같아야 한다. 다르면 빌드가 실패한다
4. 배포가 끝나면 아래 "배포 후 확인"을 한다.

대시보드 메뉴 이름과 위치는 바뀔 수 있다. 화면이 다르면 위 공식 문서를 기준으로 한다.

## 배포 후 확인
- [ ] `/`, `/quiz`, `/result`가 열린다(슬래시 없는 주소)
- [ ] 없는 주소(예: `/abc`)에서 한국어 404 화면이 404 상태로 나온다
- [ ] 휴대폰 폭에서 시작 → 질문 7개 → 결과 3개가 나온다
- [ ] 결과의 "답변 고치기"로 돌아가면 답이 남아 있고, 시작 화면의 "질문 시작하기"는 처음부터 시작한다
- [ ] 브라우저 탭 아이콘이 패들 아이콘이다
- [ ] `/browse`가 열리고 필터가 동작한다
- [ ] `/og.png`가 그림으로 열리고, 응답의 파일 종류(Content-Type)가 `image/png`다
- [ ] `/robots.txt`, `/sitemap.xml`이 열리고 주소가 지금 사이트 주소다
- [ ] 카카오톡에 사이트 주소를 보내 미리보기(제목 "패들핏 · 나에게 맞는 피클볼 패들", 설명, 그림)가 나온다. 전에 같은 주소를 보낸 적이 있으면 옛 미리보기가 남아 있을 수 있다(카카오 쪽 캐시, 미확인)

## 사이트 주소
- **https://pickleball-paddle-ai.paddlefit.workers.dev** (2026-11-16부터). 코드에서는 `src/lib/shared/site.ts`의 `SITE_URL` 한 곳에만 적는다
- 계정의 workers.dev 하위 도메인을 이메일 아이디가 아닌 이름으로 바꿔 만들었다(D-030). 바꾼 직후 옛 주소는 열리지 않았다(이름을 찾을 수 없음). 옛 주소로 공유한 링크는 끊긴다
- 하위 도메인을 다시 바꾸거나 도메인을 사면 `SITE_URL`을 바꾸고 다시 빌드한다(미리보기·sitemap·robots가 같이 바뀐다)
- Cloudflare 문서는 workers.dev를 개인·취미 프로젝트용으로 안내한다. 수익(쿠팡 파트너스, M3) 전에 도메인 구입을 다시 판단한다

## 알려진 문제
- 로컬 확인용 정적 서버에서는 질문 화면으로 갈 때 미리 받기 파일 `quiz/__next.quiz.__PAGE__.txt`가 404였다(파일은 `quiz/__next.quiz/__PAGE__.txt` 폴더 경로로 만들어진다). Cloudflare에서는 이 요청이 200으로 응답해 문제가 없다(2026-11-16 배포본에서 확인). 로컬 서버로 확인할 때만 무시하면 된다.

## 배포 기록
- 2026-11-16 첫 배포(Workers Builds, workers.dev 주소). 확인한 것: `/`, `/quiz`, `/result` 200, `/quiz/`·`/quiz.html`은 `/quiz`로 이동, 없는 주소는 한국어 404 화면과 404 상태, 375px 폭에서 시작→질문→결과 3개, "답변 고치기"는 답 유지, "질문 시작하기"는 답 초기화, 앱이 보낸 요청 중 실패 없음
- 2026-11-17 M2.5 중간 배포(main 1b31d06, Cloudflare 빌드 9507f140 Ready). 처음 확인했을 때는 예전 HTML이 나왔고, 몇 분 뒤 새 버전으로 바뀌었다(전파 시간으로 보임, 원인 미확인)
  - 확인한 것(배포본, 이 앱의 브라우저)
    - 홈(1440px): 히어로, 등록 제품 띠 "등록된 패들 23개", 무게 "7.95oz · 약 225g"
    - 결과(1440px): 제목 "답변에 맞는 패들 3개를 찾았어요", 카드 3장 각 347px, 1순위 라임 배지, 카드 아래 비교 표. 스크린샷으로 카드끼리 겹치지 않고 구매 버튼 줄이 맞는 것을 봤다
    - 결과(1024px 어두운 화면): 카드 각 299px
    - 둘러보기(1440px, `/browse#search`): 검색칸 포커스, 목록 2열(398px씩), 23개
    - 질문(375px): 선택 카드 64px, "질문 N" 줄. 스크린샷에서 고른 카드(틸 테두리·옅은 틸 바탕)와 고르지 않은 카드(흰 바탕·얇은 선)가 구분됐다
    - 가로 스크롤: 위 화면 모두 없음
  - 확인하지 못한 것: 1024px 어두운 화면 스크린샷(시간 초과), 홈 띠·질문 공 그림의 실제 움직임(창이 가려지면 애니메이션이 돌지 않음), 실기기 확인 목록(T-053)

- 2026-11-18 M2.5 배포(main `acea99f`: T-050 결과 저장, T-051 공유받은 화면·404·분석 중, T-054 검수 보완). push 직후에는 예전 HTML이 나왔고(`/saved` 404, 헤더 저장 아이콘 없음), Cloudflare 빌드 Ready 확인 뒤 다시 보니 새 버전이었다(두 번째 같은 현상, 원인 미확인)
  - 확인한 것: 5개 폭 × 7개 화면 가로 넘침 0건, 375px 전체 흐름(질문 → 결과 저장 → `/saved` → 공유 → 비교), 저장 값에 팔 불편·답 원문·점수 없음. 상세는 docs/plan/m2.5-review.md 4장
  - 이후 사용자 확인: Lighthouse 4개 화면(아래 성능·접근성 기록), 실기기 8개 항목 + 헤더 한 줄 "전부 됨"(기종·브라우저 미기재, m2.5-review.md 6장)

## 아직 정하지 않은 것
- 도메인 구입: M3 전에 다시 판단(위 "사이트 주소"). 공유 미리보기·robots·sitemap은 T-027에서 넣었다
- 개인정보 안내 문구: 앱은 개인정보를 수집하지 않는다(답변은 sessionStorage에만). 안내 문구를 둘지는 미정
- Cloudflare 무료 요금제의 상업 이용 조건: 약관 원문 미확인. 제휴 링크를 넣기 전에 확인한다

## 데이터를 갱신할 때
`data/paddles.json`을 고치고 `npm run check:release`를 통과시킨 뒤 push하면 Cloudflare가 다시 빌드·배포한다. 가격 확인일은 30일, 스펙·대회 승인 확인일은 180일이 지나면 `check:release`가 실패하므로 그 전에 재확인한다.

## 성능·접근성 기록(Lighthouse, PageSpeed Insights)
- 2026-11-16 첫 측정(T-037). 사용자가 크롬에서 PageSpeed Insights로 잰 결과(화면 캡처): 성능 100, 접근성 100, 권장사항 100, 검색엔진 최적화 100, 에이전트형 브라우징 2/2. 대상은 시작 화면(`/`) 주소로 안내했고 기기 구분(휴대기기/데스크톱)은 캡처에 나오지 않아 미확인. `/browse`·`/quiz`는 아직 재지 않음
- 이 앱의 브라우저로는 잴 수 없었다: PageSpeed Insights 화면이 "분석 실행 중"에서 멈췄고(3회), 키 없이 쓰는 공개 API는 하루 공용 한도 초과(429)
- 2026-11-18 M2.5(T-053 완료 기준 10, 사용자 측정, PageSpeed Insights, Lighthouse 13.6.0, 에뮬레이션 Moto G Power·느린 4G)
  - `/` 휴대전화(13:08 보고서): 성능 98, 접근성 100, 권장사항 100, 검색엔진 최적화 100, 에이전트형 브라우징 2/2. FCP 1.5초, LCP 1.5초, TBT 0밀리초, CLS 0, **Speed Index 4.0초(주황)**
  - 데스크톱: 네 항목 모두 100, 에이전트형 브라우징 2/2(캡처에 주소가 나오지 않음. 사용자 설명으로는 같은 측정의 데스크톱 탭)
  - `/quiz` 휴대전화(13:43 보고서): 성능 98, 접근성 100, 권장사항 100, 검색엔진 최적화 100, 에이전트형 2/2
  - `/browse` 휴대전화(13:45 보고서): 네 항목 모두 100, 에이전트형 2/2
  - `/saved` 휴대전화(13:47 보고서): 성능 100, 접근성 100, 권장사항 100, **검색엔진 최적화 63**, 에이전트형 2/2. 원인: 저장 화면은 기기마다 내용이 다른 개인 화면이라 일부러 검색 색인을 막았다(`<meta name="robots" content="noindex, follow">`, T-050). Lighthouse는 색인이 막힌 페이지를 검색엔진 최적화에서 크게 감점한다. 의도한 설정이라 그대로 둔다. 같은 설정인 `/result`·`/shared`도 재면 비슷하게 나올 것으로 보인다(재지 않음). 진단(점수에 포함되지 않음)은 시작 화면과 같은 종류: 렌더링 차단 CSS 8KiB, 레거시 JavaScript 14KiB, 사용하지 않는 JavaScript 51KiB, 긴 작업 1개
  - 시작 화면 성능이 M2(100)보다 2점 낮다. 원인(추정, 확인 안 함): 측정항목 중 Speed Index만 주황이다. 시작 화면에는 처음 그린 뒤에도 화면이 계속 바뀌는 연출이 있다 — 형태 예시 강조 순환(`ShapeShowcase`, `transition-colors`라 합성되지 않는 애니메이션 후보, 보고서 "합성 작업을 거치지 않은 애니메이션 2개"), 등록 제품 띠(`ProductMarquee`, transform), 제목 등장 연출(`animate-rise-in`). Speed Index는 화면이 다 그려지기까지의 시각 진행을 재므로 이런 연출이 늦게 끝날수록 나빠진다. 연출을 끈 빌드와 비교하지 않아 확정하지 않았다
  - 같은 보고서의 다른 진단(점수에 포함되지 않음): 렌더링 차단 CSS 8KiB(150ms), 레거시 JavaScript 14KiB, 사용하지 않는 JavaScript 58KiB(Next.js 공통 묶음 2개), 긴 기본 스레드 작업 1개. 정적 내보내기 기본 산출물이라 이번에는 손대지 않는다
  - 처리: 98은 제안 목표(네 항목 90 이상) 안이고 LCP·CLS·TBT가 모두 좋아 지금은 고치지 않는다. 히어로 사진(U7)을 넣을 때 다시 재고, 그때 Speed Index가 더 나빠지면 형태 예시 강조를 opacity 방식으로 바꾸는 안을 검토한다
- 목표(제안): 네 항목 모두 90 이상 유지. 배포 전 점검(`check:release`)에는 넣지 않고, 큰 화면 변경 뒤 사람이 다시 잰다

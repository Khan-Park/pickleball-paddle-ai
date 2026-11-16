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

## 아직 정하지 않은 것
- 도메인 구입: M3 전에 다시 판단(위 "사이트 주소"). 공유 미리보기·robots·sitemap은 T-027에서 넣었다
- 개인정보 안내 문구: 앱은 개인정보를 수집하지 않는다(답변은 sessionStorage에만). 안내 문구를 둘지는 미정
- Cloudflare 무료 요금제의 상업 이용 조건: 약관 원문 미확인. 제휴 링크를 넣기 전에 확인한다

## 데이터를 갱신할 때
`data/paddles.json`을 고치고 `npm run check:release`를 통과시킨 뒤 push하면 Cloudflare가 다시 빌드·배포한다. 가격 확인일은 30일, 스펙·대회 승인 확인일은 180일이 지나면 `check:release`가 실패하므로 그 전에 재확인한다.

## 성능·접근성 기록(Lighthouse, PageSpeed Insights)
- 2026-11-16 첫 측정(T-037). 사용자가 크롬에서 PageSpeed Insights로 잰 결과(화면 캡처): 성능 100, 접근성 100, 권장사항 100, 검색엔진 최적화 100, 에이전트형 브라우징 2/2. 대상은 시작 화면(`/`) 주소로 안내했고 기기 구분(휴대기기/데스크톱)은 캡처에 나오지 않아 미확인. `/browse`·`/quiz`는 아직 재지 않음
- 이 앱의 브라우저로는 잴 수 없었다: PageSpeed Insights 화면이 "분석 실행 중"에서 멈췄고(3회), 키 없이 쓰는 공개 API는 하루 공용 한도 초과(429)
- 목표(제안): 네 항목 모두 90 이상 유지. 배포 전 점검(`check:release`)에는 넣지 않고, 큰 화면 변경 뒤 사람이 다시 잰다

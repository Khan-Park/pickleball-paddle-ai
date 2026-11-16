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
   - Node 버전: 22.18 이상(`package.json`의 engines). 빌드 환경의 기본 Node 버전은 미확인이라 첫 빌드 로그에서 확인하고, 낮으면 빌드 환경변수 `NODE_VERSION`을 22 이상으로 지정한다
4. 배포가 끝나면 아래 "배포 후 확인"을 한다.

대시보드 메뉴 이름과 위치는 바뀔 수 있다. 화면이 다르면 위 공식 문서를 기준으로 한다.

## 배포 후 확인
- [ ] `/`, `/quiz`, `/result`가 열린다(슬래시 없는 주소)
- [ ] 없는 주소(예: `/abc`)에서 한국어 404 화면이 404 상태로 나온다
- [ ] 휴대폰 폭에서 시작 → 질문 7개 → 결과 3개가 나온다
- [ ] 결과의 "답변 고치기"로 돌아가면 답이 남아 있고, 시작 화면의 "질문 시작하기"는 처음부터 시작한다
- [ ] 브라우저 탭 아이콘이 패들 아이콘이다

## 알려진 문제
- 시작 화면에서 질문 화면으로 갈 때 브라우저 콘솔에 404가 한 건 찍힌다. Next가 `quiz/__next.quiz/__PAGE__.txt`(폴더 안)로 만든 미리 받기 파일을 `quiz/__next.quiz.__PAGE__.txt`(점으로 이은 이름)로 요청해서 생긴다. 화면 이동은 `quiz.txt`로 대신 받아 정상 동작한다(2026-11-16 로컬 정적 서버에서 확인). 원인이 Next 정적 내보내기의 동작인지는 미확인이고, Cloudflare에서도 같은지 배포 후 확인한다.

## 아직 정하지 않은 것
- 도메인: 정해지면 `layout.tsx`에 `metadataBase`, 공유 미리보기(Open Graph), `robots.txt`, `sitemap.xml`을 추가한다
- 개인정보 안내 문구: 앱은 개인정보를 수집하지 않는다(답변은 sessionStorage에만). 안내 문구를 둘지는 미정
- Cloudflare 무료 요금제의 상업 이용 조건: 약관 원문 미확인. 제휴 링크를 넣기 전에 확인한다

## 데이터를 갱신할 때
`data/paddles.json`을 고치고 `npm run check:release`를 통과시킨 뒤 push하면 Cloudflare가 다시 빌드·배포한다. 가격 확인일은 30일, 스펙·대회 승인 확인일은 180일이 지나면 `check:release`가 실패하므로 그 전에 재확인한다.

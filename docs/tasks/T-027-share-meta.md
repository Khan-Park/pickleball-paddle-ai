# T-027 주소·공유 미리보기·검색 노출

## 목표
결과 공유(T-025)를 열기 전에 (1) 공유 주소에서 이메일 아이디가 드러나지 않게 하고(D2), (2) 링크를 카카오톡 등에 붙였을 때 제목·설명·그림이 나오게 하며, (3) 검색 엔진에 필요한 페이지만 알린다. 기획: docs/plan/m2.md 3장 B·9장 D2·D7, phase2 4장 M2.

## 확인한 사실 (2026-11-16)
Cloudflare 공식 문서(developers.cloudflare.com/workers/configuration/routing/workers-dev/, …/custom-domains/)
- 계정의 workers.dev 하위 도메인은 대시보드에서 바꿀 수 있다: Workers & Pages → "Your subdomain" 옆 "Change"
- **바꾼 뒤 옛 주소가 계속 열리는지, 넘겨 주는지는 문서에 없다(미확인)**. 변경 횟수 제한·반영 시간도 문서에 없다
- 하위 도메인 이름 규칙은 문서에 없다. Worker 이름 규칙(영문 소문자·숫자·대시, 대시로 시작·끝 불가, 63자 이하)을 따르는 것이 안전하다(추정)
- 문서는 workers.dev를 "개인·취미 프로젝트용"이라고 적고, 운영 서비스는 연결 도메인을 권한다. **M3(쿠팡 파트너스, 수익) 전에 도메인 구입을 다시 판단해야 한다**
- 연결 도메인(custom domain)은 Cloudflare에 등록된 도메인(zone)이 있어야 한다

Next 16 문서(node_modules/next/dist/docs)
- 공유 미리보기 그림은 `opengraph-image` 파일 규칙(그림 파일 또는 코드로 그리는 `ImageResponse`)으로 만든다. `next/og`는 Next에 들어 있어 새 패키지가 필요 없다
- `sitemap.ts`·`robots.ts`는 정적 내보내기에서 빌드할 때 파일로 만들어진다(요청을 읽지 않는 GET만, `dynamic = 'force-static'`)
- 상대 주소로 미리보기 그림을 적으려면 `metadataBase`(사이트 전체 주소)가 있어야 한다. 없으면 빌드 오류 → **새 주소가 정해져야 시작할 수 있다**

## 사용자가 할 일 (시작 전)
1. **서비스 이름 정하기(D7)**. 화면 상단·탭 제목·공유 미리보기 제목에 쓴다
2. **Cloudflare 하위 도메인 바꾸기**: 대시보드 Workers & Pages → "Your subdomain" → Change. 이메일 아이디가 아닌 이름(예: 서비스 이름의 영문)으로. 바꾼 뒤 새 주소(`https://pickleball-paddle-ai.<새 이름>.workers.dev`)를 알려 준다
3. 바꾼 뒤 옛 주소가 어떻게 되는지(계속 열림 / 안 열림) 확인해 알려 준다. 문서에 없어서 직접 봐야 한다

## 할 일 (구현)
1. **사이트 정보**(`src/app/layout.tsx`)
   - `metadataBase`: 새 주소. 주소는 한 곳(`src/lib/shared/site.ts`의 상수)에 두고 sitemap·robots도 같이 쓴다
   - 제목 틀 `%s | 서비스 이름`, 기본 설명, Open Graph(사이트 이름, `ko_KR`, website), 트위터 카드 `summary_large_image`
   - 각 페이지 제목은 틀을 쓰게 바꾼다(지금은 페이지마다 "| 피클볼 패들 추천"을 직접 적음)
2. **공유 미리보기 그림**(`src/app/opengraph-image.tsx`, 1200×630, `ImageResponse`, 빌드 때 한 번 만듦)
   - **글자 없는 그림**: 앱 아이콘 + 형태 4가지 선 그림(시작 화면과 같은 모양, 코트 청록·남색). 한국어 글자를 그림에 넣으려면 한글 글꼴 파일이 필요한데 글꼴 라이선스는 아직 검토 전이라(결정 기록 2번) 넣지 않는다. 제목·설명은 미리보기의 글자 칸(og:title·og:description)으로 나온다
   - 대체 글: `opengraph-image.alt.txt`
3. **검색 엔진**
   - `robots.ts`: 전체 허용 + sitemap 주소
   - `sitemap.ts`: `/`, `/browse`만. `/quiz`·`/result`는 넣지 않는다(결과는 탭에 저장된 답변이 없으면 비어 있다)
   - `/result`에는 `robots: { index: false }`(검색 결과에 빈 결과 화면이 나오지 않게)
4. **이름 바꾸기**: 시작 화면 상단 "패들 추천", 제목 틀. 앱 아이콘 그림은 그대로
5. **문서**: docs/deploy.md에 새 주소와 확인 방법(미리보기 확인 도구는 사용자가 실기기 카카오톡으로)을 적는다
6. **테스트**: 사이트 주소 상수가 https이고 이메일 아이디 형태가 아닌지(빌드 산출물에 옛 하위 도메인 문자열이 없는지 점검 스크립트), sitemap에 `/`·`/browse`만, robots에 sitemap 주소, `/result` noindex, 제목 틀

## 수용 기준
- [ ] 빌드 산출물(`out/`)에 옛 하위 도메인 문자열이 없다
- [ ] `out/`에 `opengraph-image`(png), `sitemap.xml`, `robots.txt`가 생기고, 각 페이지 HTML에 og:title·og:description·og:image(절대 주소)가 있다
- [ ] `/result`는 noindex
- [ ] `npm run check`·`npm run build` 통과
- [ ] 배포 후 카카오톡에 새 주소를 붙여 미리보기가 나온다(사용자 확인)

## 건드릴 파일
- `src/app/layout.tsx`, 각 `page.tsx`·`not-found.tsx`의 metadata, `src/app/page.tsx`(이름 글자만)
- 새 파일: `src/lib/shared/site.ts`, `src/app/opengraph-image.tsx`·`.alt.txt`, `src/app/robots.ts`, `src/app/sitemap.ts`와 테스트
- `docs/deploy.md`

## 건드리지 말 것
- 화면 동작, 추천 엔진, 데이터, wrangler 설정의 Worker 이름(`pickleball-paddle-ai`)

## 확인하지 못한 것
- 옛 주소의 동작(사용자 확인), 카카오톡 미리보기 캐시(같은 주소를 전에 공유한 적이 있으면 옛 미리보기가 남을 수 있다)
- 하위 도메인 이름 규칙(문서에 없음)

## 참고
- docs/plan/m2.md, docs/decisions.md D-030·D-027, docs/deploy.md
- node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/(opengraph-image·robots·sitemap), …/04-functions/generate-metadata.md(metadataBase), …/02-guides/static-exports.md

## 결정 (2026-11-16)
- 서비스 이름: **패들핏**(사용자 확정, D7). 영문 후보 `paddlefit`. 상표·같은 이름의 서비스 여부는 확인하지 않았다

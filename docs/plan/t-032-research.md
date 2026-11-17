# T-032 실시간 최저가 조사 결과 (fury)

확인일: 2026-11-17. 조사만 했고 판단·권고는 하지 않는다. 코드·데이터는 바꾸지 않았다.

## 0. 조사 한계 (먼저 읽을 것)

이 조사 환경에서 **원문 페이지를 한 건도 열람하지 못했다.** WebFetch가 전 도메인(developers.naver.com, developers.cloudflare.com 등)에서 "Unable to verify if domain ... is safe to fetch"로 막혔고, Bash curl은 권한 거부됐다. 아래 모든 사실은 **검색 결과 요약만 확인**한 것이다. 따라서:

- 따옴표 안 문구는 검색 요약이 인용해 보여 준 문구이며, 원문과 글자 단위로 대조하지 못했다.
- 수치(한도·기간 등)는 전부 "원문 재확인 필요"다. 구현 결정의 근거로 쓰기 전에 hawkeye 또는 사용자가 원문을 직접 열어 대조해야 한다.
- 가장 중요한 발견(쇼핑 검색 API 종료)은 2차 자료(GitHub 이슈·PR, 블로그)만으로 확인됐고, 네이버 공지 원문은 못 읽었다.

검증 등급 표기: [요약] = 검색 요약만 확인, [2차] = 개발자 블로그·GitHub 등 제3자 자료의 요약. 공식 원문 열람은 0건.

---

## 1. 네이버 쇼핑 검색 API

### 1-0. 핵심 발견: 쇼핑 검색 API가 2026-07-31에 종료된 것으로 보인다

| 사실 | 원문 인용(검색 요약 속 문구) | 출처 | 등급 |
|---|---|---|---|
| 검색 쇼핑·책·전문자료 API를 2026-07-31(금) 종료한다는 네이버 공지 32564 | "검색 '쇼핑/책/전문자료' API 서비스 종료 안내" / "적용 일시 2026-07-31(금)" (이슈 본문, hawkeye 열람) | https://github.com/NomaDamas/k-skill/issues/786 | [2차·열람] 공지 원문 미열람. "24:00"·"약관 부칙"·"2026-07-20 공지"는 근거 없음(미확인) |
| 기존 키 이용자도 종료 대상 | "기존 키를 가진 사용자도 2026년 7월 31일 종료 대상" | https://waffleboard.io/blog/naver-search-api-hub-migration-guide | [2차·열람] (처음 적었던 #786 인용은 출처에 없어 삭제) |
| 나머지 검색 API 신규 신청은 2026-07-30 중단, 기존 이용자 유예는 2027년 6월까지로 보고됨 | (요약 문장, 직접 인용 없음) | 검색 요약 | [요약] 원문 재확인 필요 |
| 일반 검색(블로그·뉴스 등)은 NAVER API HUB로 이관, 쇼핑은 이관 제외·공식 대체 API 없음 | (요약 문장) | https://waffleboard.io/blog/naver-search-api-hub-migration-guide, https://github.com/NomaDamas/k-skill/pull/785 | [2차] |
| 공지 두 건: 32530 = Search API·Search Trend·Shopping Insight 종료 및 NAVER API HUB 이관 안내, 32564 = 검색 쇼핑·책·전문자료 API 종료 안내 | (2차 자료의 링크 제목) | waffleboard 위 URL | [2차·열람] 네이버 원문 미열람 |
| 쇼핑 페이지 자동 수집 경로(search.shopping.naver.com/api/search/all)는 HTTP 418, robots.txt 전면 차단이라는 보고 | "쇼핑 서비스 접속이 일시적으로 제한" | https://github.com/NomaDamas/k-skill/issues/786 외 | [2차] |
| 같은 종료를 다룬 다른 저장소 기록 | PR 제목에 "쇼핑 검색 API 종료" | https://github.com/3ndstructure/shutter/pull/3, https://github.com/1L-SANG/wearless_studio/pull/444 | [2차] 제목만 확인 |

확인일 2026-11-17. 위 사실이 맞다면 질문 1(a)~(e)의 "현재 이용 가능 여부"가 먼저 해소돼야 한다. 아래 1-1~1-5는 **종료 전(구) 문서·약관 기준 정보이거나 확인 못 한 항목**이다.

### 1-1. (a) 상업적 이용 허용 여부
- 미확인(읽지 못함: 네이버 약관 원문 열람 불가). 검색 요약에서도 상업 이용 허용 여부를 명시한 문구를 찾지 못했다.
- 참고: 2026년 8월 개정 약관 보도에 "애플리케이션 등에서 네이버 검색 결과를 제공하기 위한 목적으로만" 이용 가능, AI 학습·답변 생성·재판매 제한이 있다는 내용이 있다. 이 개정은 일반 검색 API(API HUB) 대상으로 보이며 쇼핑과의 관계는 미확인. https://www.dataeconomy.co.kr/news/articleView.html?idxno=42307 / https://www.tokenpost.kr/news/ai/403521 — 기사 요약만 확인, 해석 필요.

### 1-2. (b) 결과 표시 의무
- 보도 요약: "데이터 원본의 출처 표시와 원본 이동 링크 제공"이 요구된다고 함. 출처: https://www.tokenpost.kr/news/ai/403521 (검색 요약) — [요약] 개정 약관 대상 범위(쇼핑 포함 여부) 미확인, 원문 재확인 필요.
- 로고 사용 의무: 미확인.

### 1-3. (c) 저장·캐시·가공·재배열
- 보도 요약: 결과를 "가공 없이" 노출해야 하고 내용·순위 수정·변조·왜곡 금지. 임시 보관은 제한적 허용: 사용자 기기 24시간 또는 새 질의 시점 중 짧은 쪽, 서버 이력 조회 목적 최대 21일. 출처: https://www.tokenpost.kr/news/ai/403521 (검색 요약) — [요약] 기사 날짜·시행일 미확인, 쇼핑 API 적용 여부 미확인, 원문 재확인 필요.
- 쇼핑 구약관의 캐시 조항: 미확인(읽지 못함).
- 시사점(사실 한정): 위 보도가 맞다면 "빌드 때 가격을 파일로 굳혀 배포"하는 방식은 보관 기간(21일 등)·"서버 이력 조회 목적" 문구와 충돌 여부 해석이 필요하다. 해석은 하지 않는다.

### 1-4. (d) 일 호출 한도·초과 동작·키 발급 조건
- 일 한도: "검색 API의 하루 호출 한도는 25,000회" — 검색 요약(출처 표기: 네이버 공식 API 문서라고 했으나 URL 미제시). 다른 블로그도 25,000건, start 최대 1,000으로 적음(비공식). [요약] 원문 재확인 필요. 쇼핑 단독 한도인지 미확인.
- 초과 시 동작(오류 코드 등): 미확인.
- 키 발급 조건(사업자 필요 여부): 미확인. 단 위 1-0에 따라 검색 API 신규 이용 신청은 2026-07-30부로 중단됐다고 보고됨 [2차].

### 1-5. (e) 응답 필드·같은 모델 필터링
- 공식 필드 명세(lprice, mallName, link, productId, productType, brand, maker, category1~4, exclude 파라미터)는 **읽지 못했다.** 검색 요약에서 확인된 것은 블로그가 lprice=최저가, mallName=판매처로 설명한다는 정도다(비공식). Apify 스크레이퍼 예시에 productType "NORMAL"이 보이나 공식 명세 아님.
- 같은 모델만 거를 수 있는지: 미확인.

---

## 2. 다른 선택지

| 후보 | 확인된 사실 | 출처 | 등급 |
|---|---|---|---|
| 공식 대체 경로 | #786이 검토한 후보: 다나와(첫 제안 danawa-price-search), 쿠팡, 11번가, 네이버 커머스API("판매자용 API, 소비자 대상 상품 검색 API로 보이지 않음"), 로그인 브라우저(우회 위험으로 권하지 않음). "네이버 고유 데이터가 꼭 필요하면 공식 경로가 없음을 명시" | https://github.com/NomaDamas/k-skill/issues/786 | [2차·열람] (처음 적었던 '네이버 가격비교 검색이 가장 가까운 대안'은 출처에 없어 삭제) |
| 쿠팡 파트너스 API | 수수료 3%, 정산 익월 15일(블로그). 가입 조건·승인 기준·호출 제한은 공식 근거 못 찾음. 서드파티 n8n 패키지 readme는 "30회/시간 초과 시 24시간 정지" 취지로 적었으나 공식 아님, 다른 자료의 10회/시간과도 불일치 | https://yellowit.co.kr/..., https://www.pkgstats.com/pkg:n8n-nodes-coupang-partners | [2차] 미확인 |
| 다나와 | 공개 API 없다는 서드파티 주장(Apify 액터 소개). 2026-08 다나와 MCP 출시 보도가 있으나 외부 개발자 제공 조건 미확인. 운영사 커넥트웨이브 | https://apify.com/ai94_jin/apify-actors-1, https://byline.network/2026/08/05_19228713/ | [2차] 미확인 |
| 에누리 등 기타 | 검색 결과에서 공개 API 근거 없음 | - | 미확인 |

쿠팡 파트너스 API가 "키워드 상품 검색" 엔드포인트를 제공하는지: 미확인(서드파티 패키지는 카테고리별 베스트 경로만 보임). 이용 약관(가격 저장·표시 조건): 미확인.

---

## 3. Cloudflare Workers (처음엔 검색 요약, 이후 hawkeye가 원문 대조: 5장)

| 항목 | 내용 | 출처 | 등급 |
|---|---|---|---|
| Free 일 요청 한도 | 100,000건/일, UTC 자정 리셋, 초과 시 Error 1027 | https://developers.cloudflare.com/workers/platform/limits/ | [원문·hawkeye 열람] 일치 |
| Free CPU 시간 | HTTP 요청당 10 ms, 네트워크 대기 시간은 CPU에 안 셈 | 위와 같음 | [원문·hawkeye 열람] 일치 |
| 서브리퀘스트 | Free 50/호출. 메모리 128 MB | 위와 같음 | [원문·hawkeye 열람] 일치 |
| 정적 파일 요금 | 정적 asset 요청은 무료·무제한(Pricing 페이지). 파일 수 20,000개/Worker 버전, 파일당 25 MiB | https://developers.cloudflare.com/workers/platform/pricing/ | [원문·hawkeye 열람] 일치 |
| asset 요청과 무료 한도 | "Requests to static assets are free and unlimited." Worker 스크립트 호출만 과금. 무료 한도를 넘기면 `run_worker_first` 경로는 "429 (Too Many Requests)", `!/` 패턴은 계속 asset으로 서빙. 일 한도 집계에서 빠진다는 명시 문장은 없음(과금·429 동작으로 강하게 추정) | https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ | [원문·hawkeye 열람] |
| 한 프로젝트에 같이 두기 | wrangler 설정에서 `main`(스크립트)과 `assets`를 같이 지정. "Only one collection of static assets can be configured in each Worker." | https://developers.cloudflare.com/workers/static-assets/binding/ | [원문·hawkeye 열람] |
| 라우팅 | `run_worker_first` 기본 false(asset 일치 시 직접 서빙), true면 전부 Worker 먼저, 배열 패턴 최대 100개. "Wrangler v4.20.0 이상"·"`/` 또는 `!/`로 시작"은 원문에서 찾지 못함(미확인) | https://developers.cloudflare.com/workers/static-assets/binding/ | [원문·hawkeye 열람] 일부 미확인 |
| 비밀값 | `npx wrangler secret put <KEY>`(새 버전 즉시 배포). 로컬은 `.dev.vars` 또는 `.env`(둘 중 하나, .gitignore 대상). `secrets.required` 설정으로 필요한 키만 로드 | https://developers.cloudflare.com/workers/configuration/secrets/ | [요약] |
| Workers Free의 상업 이용 약관 | 미확인(D-027에도 미확인으로 기록됨) | - | 미확인 |

Next.js `output: "export"`의 `out/`을 assets로 쓰면서 Worker 스크립트를 추가하는 구성의 실제 동작·`wrangler` 설정 예: 미확인(이 환경에서 검증하지 않음).

대안 "빌드 때 굳히기": Cloudflare 쪽 제약은 없으나 가능 여부는 1장 약관(저장·재표시)과 API 존속에 달려 있다. 사실 정리만 한다.

---

## 4. 정확성 (다른 모델·중고·부품 혼입)

- 공식 exclude 파라미터 허용값, productType 값의 의미: 미확인(읽지 못함). 검색 요약은 exclude 관련 공식 정보를 못 찾았다. 요약에 나온 "Exclude sponsored products"는 Apify 스크레이퍼 옵션이며 네이버 API와 무관.
- 실제 검색어 예시 실험: 하지 못했다. 이유 1) API 호출 금지(조사 지침), 2) 쇼핑 검색 API가 종료된 것으로 보고됨, 3) 저장소 `data/paddles.json`에 `compare_query`가 설정된 제품이 없다(grep 결과 `compare_query`는 data/schema.ts, data/schema-fields.test.ts의 스키마·테스트 샘플 "샘플 테스트 피클볼"과 decisions.md뿐). D-029대로 없으면 "브랜드 모델 피클볼" 폼 검색어를 쓴다. 예시 후보(brand/model 필드 그대로): "NOX X-TREME Tempus 16mm", "JOOLA Hyperion Vision 16mm", "Franklin FS Tour Series Tempo 16mm"에 "피클볼"을 붙인 형태. 결과 품질은 미검증.

---

## 미확인 목록

1. 네이버 공지 원문(쇼핑 검색 API 종료·API HUB 이관)과 약관 부칙 원문 — 열람 못 함. 종료일 2026-07-31은 2차 자료 기반.
2. 쇼핑 검색 API가 종료되지 않았다면 적용될 상업 이용·표시·캐시·재배열 조항 원문 전부.
3. 일 호출 한도 25,000회의 공식 원문 및 쇼핑 단독 한도, 초과 시 동작, 사업자 필요 여부.
4. 개정 약관 보도(출처 표시, 24시간/21일 보관)의 시행일과 쇼핑 적용 여부.
5. 응답 필드 공식 명세, exclude 값, productType 값의 의미, 같은 모델 필터링 수단.
6. 네이버 가격비교 검색의 공개 API 여부와 조건.
7. 쿠팡 파트너스 API의 키워드 검색 제공 여부, 가입·승인·호출 제한, 가격 저장·표시 약관.
8. 다나와·에누리 등 제휴·API 공식 조건.
9. Cloudflare 한도 수치 전부의 원문 재확인, asset 요청이 일 요청 한도에 포함되는지, Free 플랜 상업 이용 약관, 정적 export + Worker 혼합 구성의 실제 설정.
10. 검색어별 실제 결과 혼입 정도(실험 불가).

## 출처 목록 (fury 작성 시점 기준. 원문 대조 결과는 5장)

- https://github.com/NomaDamas/k-skill/issues/786
- https://github.com/NomaDamas/k-skill/pull/785
- https://github.com/3ndstructure/shutter/pull/3
- https://github.com/1L-SANG/wearless_studio/pull/444
- https://waffleboard.io/blog/naver-search-api-hub-migration-guide
- https://www.tokenpost.kr/news/ai/403521
- https://www.dataeconomy.co.kr/news/articleView.html?idxno=42307
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://www.pkgstats.com/pkg:n8n-nodes-coupang-partners
- https://apify.com/ai94_jin/apify-actors-1
- https://byline.network/2026/08/05_19228713/

## 5. 독립 검증 결과 (hawkeye, 2026-11-17)
- **developers.naver.com은 브라우저·WebFetch 모두 접근이 막혀 네이버 공식 원문을 한 건도 열지 못했다.** 네이버 항목은 2차 자료 4건(k-skill 이슈 #786, PR #785, waffleboard 글, dataeconomy 기사)을 직접 열어 대조했다
- 쇼핑 API 종료: 2차 자료 4건이 서로 일치하고, PR #785에 실제 호출 결과(SE05 404, 쇼핑 페이지 HTTP 418 차단, 2026-11-03 재현)가 있어 사실일 가능성이 높다. 공식 원문 확인은 남아 있다
- 신규 신청 중단·기존 이용자 유예(2027-06-30)는 2차 두 건 일치: "기존 이용자의 유예기간은 2027년 6월 30일까지"(dataeconomy). 이는 이관된 일반 검색 API 이야기이며 쇼핑은 종료
- 개정 약관: 처음 근거로 쓴 tokenpost 기사(24시간/21일 보관)는 지금 404로 확인 불가. dataeconomy 기사(2026-09-02)는 "8월 초 공지, 9월 7일 시행"과 조선비즈 재인용 "복사·저장·캐싱, 광고 수익화까지 전면 금지"를 적는다. 두 보도가 다르고 약관 원문은 미열람. 1-1·1-3의 약관 서술은 이 상태로 읽는다
- 쿠팡·다나와 출처(2장)는 우선순위 밖이라 열지 않았다(미확인 유지)
- Cloudflare: limits·pricing·static-assets(개요·binding·routing·billing) 원문 6쪽에서 Free 수치 모두 일치

## 6. 선택지 (메인 세션 정리, 2026-11-17)
| 선택지 | 내용 | 필요한 작업 | 비용 | 위험 |
|---|---|---|---|---|
| **A. 하지 않음(지금처럼)** | 사람이 확인한 판매처 가격 + "다른 곳 가격 비교"(네이버 쇼핑 검색 결과 링크) 유지 | 없음. T-034처럼 30일 재확인 | 0원 | 가격이 최대 30일 늦을 수 있음(이미 "판매처 가격과 다를 수 있음" 표시). 네이버 쇼핑 검색 **페이지** 링크는 API 종료와 별개로 열리는지 실기기 확인 필요(미확인) |
| B. 빌드 때 가격을 굳히기 | 배포할 때 API를 불러 가격을 파일로 저장 | 쓸 수 있는 가격 API가 먼저 있어야 함 | 미정 | **네이버 쇼핑 API가 종료**되어 쓸 API가 없다. 대체 API(쿠팡 파트너스·다나와)는 공식 조건 미확인. 개정 약관이 저장·캐싱을 금지한다는 보도도 있음 |
| C. Worker로 실시간 | 정적 사이트 + Worker 스크립트(`/api/*`만 Worker)로 키를 숨기고 그때그때 조회 | Worker 코드, 비밀값, 캐시, 같은 모델 거르기 규칙, 실패 시 표시 | Workers Free 일 100,000건(asset 요청은 무료·무제한) | B와 같은 문제(쓸 API 없음). 처음으로 서버 코드가 생김(D-027 변경) |
| D. M3 이후 다시 보기 | 쿠팡 파트너스 가입(M3) 때 파트너스 쪽 상품 검색 수단을 함께 확인 | M3 카드에 조사 항목 추가 | 0원(지금) | 없음. 그때까지는 A와 같음 |

- 메인 세션 판단: 이 결과로는 선택지가 실질적으로 갈리지 않는다(B·C는 쓸 API가 없어 지금 할 수 없다). 그래서 권고안 담당(strange)은 부르지 않았다. **A 유지 + D(M3에서 쿠팡 쪽 확인)**가 남은 조합이다
- 참고: 데이터의 실제 제품에는 `compare_query`가 하나도 없어, 가격 비교 링크는 기본 검색어 "브랜드 모델 피클볼"로 만들어진다

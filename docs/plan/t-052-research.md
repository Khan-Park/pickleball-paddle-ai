# T-052 특성 데이터 조사 결과 (fury 조사, hawkeye 원문 대조 반영)

확인일: 2026-11-18. 조사만 했고 판단·권고는 하지 않는다. 코드·데이터는 바꾸지 않았다. **같은 날 hawkeye가 핵심 사실을 원문과 대조했고(7장), 메인 세션이 차단 2건을 브라우저로 다시 확인했다. 아래 본문은 대조 결과로 고친 상태다(고친 곳에 [대조] 표시).** 질문 출처: docs/tasks/T-052-trait-data-research.md, docs/plan/m2.5-redesign.md 6장.

## 0. 조사 한계 (먼저 읽을 것)

**검증 등급 표기**
- [원문] = WebFetch로 해당 페이지를 직접 열었다. 단 WebFetch는 작은 모델이 페이지를 가공해 돌려주는 도구라서 "원문 텍스트 그대로"가 아니다. 따옴표 문구는 도구가 돌려준 문구이며 글자 단위 대조는 못 했다. hawkeye 대조 대상이다.
- [요약] = 검색 결과 요약만 확인(페이지를 열지 못함). 수치는 전부 "원문 재확인 필요".
- [2차] = 제3자 자료.

**열람 결과**
- 열린 페이지(가공 열람) 24건: pickleballeffect.com 15건(리뷰 목록·홈·약관·DB 본문·검사 방법·DB 목록 1~11쪽), johnkewpickleball.com 3건(DB 안내, Raw Data, Content Usage Policy), pickleballstudio.com/paddles, equipment.usapickleball.org 항목 1건, thedinkpickleball.com 기사 1건, pickleballcentral.com 2건(NOX 제품 페이지, 자체 랩 안내 글). (Raw Data는 "Loading live data…"만 보여 데이터 못 봄. justpaddles.com/paddle-lab-data는 빈 내용이 돌아와 열람으로 세지 않음)
- 막힌 도메인과 증상
  - HTTP 429(재시도해도 계속): joola.com, www.joola.com, www.selkirk.com, gospartus.com, luzzpickleball.com, vaticpro.com, noxsport.com, www.mattspickleball.com
  - HTTP 403: franklinsports.com, www.justpaddles.com(블로그)
  - HTTP 401: europe.ppatour.com, ppatour.com (PPA Tour Paddle Lab 전부)
  - HTTP 418: www.dickssportinggoods.com
  - "Unable to verify if domain ... is safe to fetch": www.sixzeropickleball.com, fridaypickle.com, 11six24.com, starsportsmall.co.kr
  - 열어 보지 않음(공식 URL이 data/paddles.json에 없음): Picklepoppers, Honolulu 공식 사이트
- 결과(fury): 13개 브랜드 중 제조사 공식 제품 페이지를 연 곳이 0건이었다. [대조] hawkeye는 브라우저 도구로 selkirk.com·joola.com 제품 페이지, Kew Raw Data, PPA 약관을 열었다(PPA Paddle Lab 본문은 브라우저에서도 401). 나머지 11개 브랜드 공식 페이지는 시도하지 않았다
- 개인정보는 외부 요청에 넣지 않았다.

---

## 1. 질문 1: 제조사 공식 특성 표기

공식 페이지를 열지 못했으므로 "있다/없다"를 확정하지 못한다. 아래는 검색 요약과 제3자 자료에서 나온 단서다.

| 브랜드(우리 모델 수) | 공식 제품 페이지에 등급·막대·점수가 있는가 | 척도·정의 | 근거 | 등급 |
|---|---|---|---|---|
| Selkirk (1) | 단서 있음: 검색 요약이 "Performance Ratings" 구역에 막대형 표시와 Power·Spin·Control·Sweet Spot 항목이 있다고 보고. 같은 페이지 안에서 숫자가 서로 다르게 요약됨(한 블록은 Spin 8·Control 7·Power 10·Sweet Spot 9, 다른 목록은 Power 10·Spin 10·Control 8·Sweet Spot 10). 이 요약은 오리지널 Boomstik 기준이고 ST 페이지 값은 미확인 | 척도·정의 미확인. [대조] ST 페이지에 "Performance Ratings" 구역과 SPIN·CONTROL·POWER·SWEET SPOT 항목이 있으나 숫자가 애니메이션 카운터라 텍스트로는 0으로만 읽혀 값 미확인. 같은 페이지 스펙 목록에 "Sweet spot size: 9"(elongated), "Average swing weight (as sold): 115 +/- 2", "Average twist weight (as sold): 7.0 +/- 0.2"(elongated)가 있다 | https://www.selkirk.com/products/boomstik-st (hawkeye 브라우저 열람) | [원문] 등급 숫자는 미확인 |
| JOOLA (5) | 미확인. 제3자 Pickleball Science가 "JOOLA의 숫자 등급이 어떻게 만들어지는지" 의문을 제기한 글이 있어 JOOLA가 수치 등급을 낸다는 단서는 있으나 JOOLA 페이지에서 확인 못 함. [대조] Power FX 페이지의 보이는 글자·접근성 트리에서 수치 등급을 찾지 못함, SPECIFICATIONS 탭은 미확인 | 미확인 | https://pickleballscience.org/joola-hyperion-perseus-paddle-review/ (검색 요약) | [요약][2차] |
| Franklin (3) | 검색 요약상 공식 페이지에서 특성 등급은 못 찾음. Franklin 보도자료(stories.franklinsports.com)가 Tempo 14mm의 스윙웨이트를 "116 KG*CM²"로 적었다고 요약됨(등급 아님, 스펙) | 해당 없음/미확인 | https://stories.franklinsports.com/franklin-sports-officially-announces-the-fs-tour-paddle-series (검색 요약). franklinsports.com은 403 | [요약] |
| NOX (2) | 공식 페이지는 못 엶. 리테일러 Pickleball Central의 NOX X-TREME 페이지는 수치 등급 없이 문장 설명뿐이며 모양·두께별 스윙웨이트·트윈웨이트 수치가 있다고 가공 열람됨 | 등급 없음. 스윙웨이트·트윈웨이트는 스펙 수치(측정 주체 미확인) | https://pickleballcentral.com/nox-x-treme-pickleball-paddle/ | [원문] (리테일러 페이지, NOX 공식 아님) |
| Friday (2) | 검색 요약상 공식 Aura Pro 페이지는 수치 등급 없이 문장 설명("more pop, more noise, more power on demand" 취지) | 해당 없음 | 검색 요약. fridaypickle.com 열람 불가 | [요약] |
| Vatic Pro (1) | 검색 요약상 공식 페이지에 숫자 등급 없음(가격·고객 후기·짧은 설명) | 해당 없음 | 검색 요약. vaticpro.com 429 | [요약] |
| Six Zero (2) | 미확인(검색 요약에 공식 페이지 내용 없음) | 미확인 | — | 미확인 |
| Spartus (1) | 미확인(검색 요약에 공식 페이지 내용 없음) | 미확인 | — | 미확인 |
| 11SIX24 (2) | 미확인 | 미확인 | — | 미확인 |
| Luzz (1) | 미확인 | 미확인 | — | 미확인 |
| Honolulu (1) | 미확인(공식 URL을 data에 두지 않음) | 미확인 | — | 미확인 |
| Picklepoppers (1) | 미확인(공식 URL을 data에 두지 않음) | 미확인 | — | 미확인 |
| STAR (1) | 미확인(한국 쇼핑몰 URL, 열람 불가) | 미확인 | — | 미확인 |

**브랜드 간 비교 가능성(사실만)**: 확인된 제조사 수치 등급 단서는 Selkirk(막대형, 척도 미확인)와 JOOLA(단서만) 둘뿐이며, 두 곳의 척도 정의 문서는 못 찾았다. 제3자 Pickleball Science는 JOOLA 등급이 0~100 척도라면 있어야 할 파워·컨트롤 상충이 나타나지 않는다고 지적했다([요약]). 독립 매체 쪽 척도는 매체마다 다르다(2절).

**제조사 표기 대신 매체가 붙이는 "특성 점수" 사례(참고, 제조사 값 아님)** — 모두 [요약]
- Pickleball Effect 리뷰: Power·Pop·Control·Spin·Sweet Spot·Maneuverability를 퍼센트 형태로 표기. 예: Spartus Spitfire Elongated "Power 93% Pop 90% Control 79% Spin 100% Sweet Spot 84% Maneuverability 85%". 같은 사이트가 "Performance ratings are based on playtesting, paddle comparisons, and power, pop, and spin tests"라고 쓴다는 요약. https://pickleballeffect.com/equipment-reviews/spartus-spitfire/
- Matt's Pickleball: 1~5점 항목 + 0~100 컨트롤 점수(검색 요약). 예: Coral Pro Elongated Spin 5/5·Power 3/5·Control 3/5. https://www.mattspickleball.com/paddle/coral-pro-elongated-16mm (열람 불가)
- Pickleheads: 10점 척도(요약). https://www.pickleheads.com/pickleball-gear/joola-perseus-review

---

## 2. 질문 2: 독립 측정치

### 2-1. Pickleball Effect Paddle Database (1인 운영 매체)
- URL: https://pickleballeffect.com/pickleball-paddle-database/ [원문]
- 규모: 목록 쪽수 11쪽, 518개 패들로 표시(DB 목록 1쪽 열람 결과) [원문]
- 측정 항목(열 30개): 무게, 스윙웨이트(+백분위), 트윈웨이트(+백분위), 밸런스 포인트, Impact feel, 스핀 RPM·스핀 등급, 그릿 내구 등급, Power·Pop(mph, +백분위), Firepower(0~100) 등 [원문]
- 방법 공개: 공개됨. 스윙·트윈웨이트는 Briffidi SW1(5 cm 어댑터, 트윈웨이트 어댑터), 밸런스는 Briffidi Paddle Balance Device, Power·Pop·Spin은 Stalker Pro S3 레이더·실내 코트·Franklin X-40 공. 그릿 내구는 자체 마모 기계 + Starrett SR160. 정의: "Power: The average speed of ten serves." "Pop: The average speed of ten punch volleys." "Spin: The average spin rate of ten serves." 매 세션 기준 패들을 다시 측정해 드리프트 확인. Firepower는 방법 페이지에서 정의를 찾지 못함 [원문] https://pickleballeffect.com/how-we-test/
- "Every measurement is collected in-house. Nothing is sourced from manufacturers or third parties." [원문]
- 이용 조건(원문 위치: DB 페이지 "Data use" 구역 + https://pickleballeffect.com/terms-of-service/ 의 "Pickleball Paddle Database" 구역) [원문]
  - DB 페이지: "All data on this website is proprietary intellectual property of Pickleball Effect." / "Personal research use only." / "Unauthorized scraping, reproduction, redistribution, or commercial use is strictly prohibited."
  - 약관: "The Paddle Database is provided for personal, non-commercial use only, such as researching pickleball paddles." / "You may not use the data for any commercial purpose, including but not limited to creating competing databases, marketing products, or selling data." / "You may not scrape, extract, or otherwise copy large portions of the data without explicit written permission." / "You may not modify or alter the data in any way." / "You may not distribute or share the data with any third party without explicit written permission." / "Automated systems (including bots, spiders, or scrapers) may not be used to access or retrieve data without explicit written permission." [대조: 두 인용의 잘린 뒷부분을 원문대로 채움]
  - [대조] 공개 게재 관련 문구는 같은 약관의 "Pickleball Paddle Database" 구역에 있다(처음 서술의 "다른 PE 페이지 [요약]"은 틀림): "Any requests to share or use Paddle Database information publicly (such as in articles, websites, videos, or other content) must first be approved in writing." 같은 구역 마지막 문장: "Unauthorized commercial use or redistribution of the Paddle Database is prohibited." (hawkeye 대조, 메인 브라우저 재확인) [원문]
  - 제휴 사이트를 직접 지목한 문구는 없다. 약관에 출처 표기(attribution) 조항은 없다(hawkeye 대조로 맞음)
  - 해석은 하지 않는다.
- 우리 23개 커버리지: 4절 표 참조(열 "PE DB")

### 2-2. John Kew Pickleball Paddle Database (+ PPA Tour Paddle Lab 재게재)
- URL: https://www.johnkewpickleball.com/paddle-database [원문]
- 규모: 페이지는 "385 paddles and 72 brands"(도구 보고). PPA Tour Paddle Lab 쪽 검색 요약은 "818 paddles from 115 brands, 468 measured"로 다름 — 불일치, 원문 재확인 필요 [원문]/[요약]
- 측정 항목·방법(페이지 안내, [원문]): KewCOR(볼 캐논이 LT 공을 50 MPH로 쏴 면 전체 반발계수 측정)을 기준으로 한 컨트롤/올코트/파워 구분(구분 경계 0.366, 0.39), Power·Pop(전체·짧은 스윙 볼 속도, z-점수로 합쳐 Firepower), 스핀 RPM(Stalker Pro 3s 레이더, 실제 스윙; 구간 Elite 2,300 초과·Good 2,100~2,300·Fair 1,900~2,100·Poor 1,900 미만), 캐논 스핀 내구(100회 타격 후 스핀 변화율), 스윙웨이트·트윈웨이트·밸런스("measured dynamically instead of estimated" [대조: 처음 "rather than"으로 적은 것을 원문대로 고침]), 일부 분해·X-ray. 페이지 내부 불일치 1건(Tier 1 정의 대 "Holds" 정의)을 도구가 지적.
- "Nothing in these numbers is pay-to-play." 다수 목록에 제휴 링크가 있으나 "it never changes how a paddle is tested or where it lands in the data."라고 FAQ가 말한다는 보고 [원문]
- 이용 조건: 푸터에 "Content Usage Policy" 링크가 있고(약관 별도 링크는 없음), 정책 URL https://www.johnkewpickleball.com/content-usage-policy 를 열었다 [원문, 가공]. 도구가 돌려준 문구(길이 제한으로 일부는 인용, 일부는 의역이라고 도구가 밝힘)
  - 인용: "is the intellectual property of JohnKew, LLC unless otherwise stated." / "Unauthorized use, reproduction, distribution, or monetization of any content from this site is strictly prohibited without express written permission. This includes, but is not limited to:" [대조: 처음 인용이 조건절 앞에서 끊겨 무조건 금지처럼 읽혔음. 메인 브라우저 재확인] / "Republishing or modifying paddle and gear data, articles, and other website content." / "commercial gain, advertising, or sponsorships."
  - [대조] 목록 항목 원문: "Reposting videos or screenshots", "Embedding content in monetized platforms or services", "Using content for commercial gain, advertising, or sponsorships". 허가·라이선스 문의 경로(이메일)가 있다. 인용 허용이나 제휴 사이트에 관한 별도 조항은 없다 [원문]
- [대조] Raw Data 페이지(https://www.johnkewpickleball.com/paddles-raw-data)는 로딩이 끝나면 "526 paddles" 표가 보인다(처음 서술의 "데이터 못 봄"은 열람 시점 문제). 열 39개: Spin RPM, Swing/Twist Weight, Serve Speed(Power), Pop, Firepower(0-100), KewCOR 등. 우리 모델 커버리지는 4절 열 C [원문, 메인 브라우저 재확인: 526개 표시, Tour Tempo·Boomstik ST 이름 검색됨]
- [대조] 규모: DB 안내 페이지 "385 PADDLES / 72 BRANDS"와 Raw Data "526 paddles"로 페이지마다 수가 다르다. "818/115/468"은 Kew 페이지에 없고 PPA 쪽 수치로 보이나 PPA 본문을 못 열어 미확인
- PPA Tour Paddle Lab(https://europe.ppatour.com/paddle-lab/): 열 수 없음(401). 검색 요약상 "every measurement ... comes from John Kew Pickleball paddle database", 수치는 "copied through unchanged", 스윙웨이트·트윈웨이트·밸런스는 "physical pendulum and balance test", 스핀은 "controlled strike"의 RPM. 운영 주체는 PPA Tour·MLP로 요약됨("Pickleball Central과 같은 모회사"라는 요약은 출처에서 확인 못 함, 미확인) [요약]. [대조] PPA 약관 https://ppatour.com/about/terms/ (LAST UPDATED: MAY 22, 2026, 스스로 요약본이라고 밝힘)은 열렸다: "Don't scrape, mirror, or rebroadcast our content commercially without written permission.", "commercial use requires a license." /content-policy는 같은 약관으로 이동. Paddle Lab 본문의 "copied through unchanged" 등은 여전히 미확인 [원문(약관만)]
- 같은 측정자의 방법 변경 가능성: 오래된 뉴스레터는 "20회 톱스핀 서브의 평균 RPM"으로 스핀을 쟀다고 요약됨. 현재 방법과 같은지 미확인 [요약][2차]

### 2-3. Pickleball Studio
- URL: https://pickleballstudio.com/paddles [원문]. 제목에 "404+ Paddles", 매주 추가. 항목: 무게·스윙웨이트·트윈웨이트·스핀 RPM·치수. 방법: "measures each paddle itself", 무게·스윙·트윈웨이트 계산, 스핀 RPM 시험, 치수 확인. 장비·절차 상세는 페이지에 없음. 한 번에 최대 4개 비교.
- 이용 조건: 약관 원문 미확인(페이지에 약관 텍스트 없음, 검색에서도 못 찾음)
- 우리 23개 커버리지: 미확인

### 2-4. JustPaddles Paddle Lab (리테일러)
- URL: https://www.justpaddles.com/paddle-lab/ (열람 불가, 403/빈 응답) [요약]
- 검색 요약: 지표 6개(Exit velocity, swing weight, spin rate, twist weight, consistency(표준편차), balance point), 고속 카메라로 스핀, 일정 속도·각도로 공을 쏴 출구 속도, 백분위 표기. 패들당 약 90분~2시간. 500개 이상. 카메라 설정·공 종류·시행 횟수·백분위 계산 방식은 공개 확인 못 함 [요약]
- 같은 패들의 스핀 수치가 다른 곳과 크게 다르게 요약됨(예: 요약된 Coral Pro Elongated 1332.36 RPM, PE 목록은 2085). 측정법이 달라 직접 비교하지 않는다고 요약이 적음 [요약]
- 이용 조건: 미확인

### 2-5. Pickleball Central 자체 랩 (리테일러)
- URL: https://pickleballcentral.com/blog/the-lab-at-pickleball-central-why-swingweight-twistweight-and-balance-points-matter-in-pickleball/ [원문]. "4-in-1 Racket and Paddle testing machine"(HEAD Pickleball와 함께)으로 정적 무게·스윙웨이트·트윈웨이트·밸런스 포인트("quarter-inch steps from the center") 측정. 신제품·기존 제품의 "average Static Weights, Swingweights, Twistweights, and Balance Points" 게시 예정이라 적음. 데이터 재사용 조건은 글에 없음.
- 우리 모델 커버리지: NOX X-TREME 페이지에 스윙·트윈웨이트가 있다는 가공 결과(수치는 못 받음). 나머지 미확인

### 2-6. USA Pickleball 승인 장비 목록
- https://equipment.usapickleball.org/paddle-list/entry/13858/ (Selkirk Boomstik ST Elongated) [원문]. 항목: 브랜드·모델·승인 상태·추가일·소재·깊이·모양·그릿 종류. 스핀·스윙웨이트·표면 거칠기·무게·크기·코어 항목은 이 항목에 없었다. 특성 값 출처가 되지 않는다(이 한 항목 기준, 다른 항목 미확인).

### 2-7. 참고: 매체의 리뷰 점수(측정과 다른 종류)
- Pickleball Effect 리뷰의 퍼센트 점수, Matt's Pickleball의 1~5점·0~100점은 1절 참조. [대조] PE 방법 페이지 원문: 코트 점수는 "Braydon's judgment after playing with the paddle, informed by the measurements but not produced by them." — 측정값에서 계산한 점수가 아니라 리뷰어 판단이다 [원문]. Matt's 점수의 성격은 미확인

### 2-8. 매체 간 수치 비교 가능성(사실만)
- 같은 패들 Vapor Jelly Bean 2: PE 116/6.73/2152(스윙/트윈/RPM), Matt's Pickleball 118.45/6.75/2,377 RPM(검색 요약, 열람 불가) [요약]. [대조] PE 방법 페이지에 다른 리뷰어의 수치와 비교하지 말라는 항목("Compare our numbers to another reviewer's")이 있다 [원문]. 같은 패들 Boomstik ST 스핀: PE 2214, Kew 2,610 [원문].

---

## 3. 질문 3: 스펙에서 계산하는 공개 공식

- Pickleball Science: 스윙웨이트를 "중심 관성모멘트 + 질량 × (회전축~무게중심 거리)²" 형태(평행축 정리)로 설명, 밸런스 웨이트는 정적 무게 × 스윙 반경으로 설명 — https://pickleballscience.org/?p=4210 , https://pickleballscience.org/?p=4850 [요약]
- 정적 무게와 밸런스 포인트만으로 스윙웨이트를 근사하는 지름길 공식이 일부 가이드에 있다고 요약됨(중심 관성항을 빼는 거친 근사, "peak weight" 미정의): https://mypickleballconnect.com/guides/pickleball-paddle-balance/ [요약][2차]
- 계산기: https://thekitchenpickle.com/swing-weight-calculator/ 존재. 요약에 공식이 안 보임 [요약]
- 정적 무게와 밸런스 포인트만으로 닫힌 형태로 완전히 정해진 공식은 이 조사에서 찾지 못했다(검색 요약 기준).
- 컨트롤·파워·스핀·안정성을 스펙(무게·코어)에서 계산하는 공개 공식: 찾지 못함. 단, 측정값을 합성한 점수는 존재(Kew의 Firepower = Power·Pop z-점수 합성 [원문], PE의 Firepower 0~100 [원문], 정의 미확인). 이것은 스펙 계산이 아니라 측정값 합성이다.
- 같은 무게 구간에서도 스윙웨이트가 ±20% 이상 변동한다는 보도가 있음: https://rpmpb.com/pages/swing-weight [요약][2차]
- 판단하지 않는다.

---

## 4. 커버리지 표 (우리 23개 × 주요 출처)

표기: 있음(이름·형태가 맞는 항목에서 값 확인) / 후보(이름이나 형태가 달라 같은 제품인지 사람 확인 필요) / 이름 검색상 없음 / 미확인. 값은 스윙웨이트/트윈웨이트/스핀 RPM.
- 열 A "제조사 공식 등급": Selkirk만 페이지 구역 확인(숫자 미확인), 나머지 미확인
- 열 B "PE": [대조] hawkeye가 PE DB 페이지의 공개 시트(522행) 전체에서 이름으로 검색해 값을 대조했다. 처음 표에 적었던 "1쪽·3쪽" 같은 쪽 번호는 근거가 확인되지 않아 뺐다
- 열 C "Kew": [대조] hawkeye가 Raw Data(526개) 전체에서 이름으로 검색했다. 처음에는 전부 미확인이었다
- 열 D "기타": 처음 조사(검색 요약) 그대로

| # | 모델(id) | A 제조사 공식 | B PE | C Kew | D 기타 |
|---|---|---|---|---|---|
| 1 | NOX X-Foam JC6 16mm | 미확인 | 후보: "NOX / X-FOAM" Hybrid 16, 109/6.67/2022 (우리 데이터는 elongated) | 후보: "Nox X-Foam JC6" Hybrid 표기 (우리 데이터는 elongated) | 미확인 |
| 2 | NOX X-TREME Tempus 16mm | 미확인 | 이름 검색상 없음 | 후보: "NOX X-Foam Tempus" (모델명 다름) | Pickleball Central에 스윙·트윈웨이트 존재(수치 미수령) |
| 3 | JOOLA Heat Vision Scorpeus 16mm | 미확인 | 이름 검색상 없음 | 미확인(검색 결과 보고 없음) | 미확인 |
| 4 | JOOLA Hyperion Vision 16mm | 미확인 | 이름 검색상 없음 | 미확인(검색 결과 보고 없음) | 미확인 |
| 5 | Spartus Spitfire Elongated 16mm | 미확인 | 있음 117/6.18/2132 | 있음 116.2/6.14/2,433 | Matt's URL 있음 [요약] |
| 6 | Franklin FS Tour Tempo 16mm | 미확인 | 있음 123/7.68/1925 (Widebody, 무게 PE 8.9 대 우리 8.75) | 있음 "Tour Tempo" 16mm 122/7.5/2,094 | JustPaddles 값 있다고 요약 [요약] |
| 7 | JOOLA Ben Johns Perseus Pro 3S Dual 14mm | 미확인 | 후보: "Perseus 3S (14mm)" Elongated 14, 117/6.00, 스핀 칸 빈칸 | 후보: "JOOLA Perseus 3S" 14mm (Dual 표기 없음) | 미확인 |
| 8 | Six Zero Boulder Opal Hybrid 14mm | 미확인 | 있음 116/6.28/2099 (Hybrid 14. PE는 USAP·Durable Texture, 표면 Smooth/Rough 구분 없음) | 있음 114.1/6.36/2,216 | 미확인 |
| 9 | Luzz Gabby's Dollhouse Glider 2026 Hybrid 16mm | 미확인 | 있음 "Glider 2026" Hybrid 16, 109/6.50/2155 (Gabby's Dollhouse판 표기 없음) | 있음 "Luzz Glider 2026" 108.6/6.47/2,281 | 미확인 |
| 10 | JOOLA Power FX 16mm | 미확인(수치 등급 찾지 못함) | 있음 PE 항목명 "Power FX", Elongated 16, 114/6.10/2097 | 있음 114.5/6.12/2,147 | 미확인 |
| 11 | Friday Original Carbon Fiber 16mm | 미확인 | 후보: "Friday / Original" 118/6.29/1926 — PE Shape Hybrid, 우리 데이터 elongated | 미확인(검색 결과 보고 없음) | 미확인 |
| 12 | Six Zero Coral Pro Hybrid 16mm | 미확인 | 있음 114/6.79/2062 | 있음 "Coral Pro-Hybrid" 111.6/6.76/2,316 | Matt's는 Elongated·Widebody URL만 [요약] |
| 13 | Selkirk Boomstik ST Elongated 16mm | 구역 있음, 숫자 미확인 | 있음 118/6.70/2214 | 있음 "LABS Project Boomstik ST – Elongated" 121.7/7.12/2,610 | USAP 승인 항목, 특성 값 없음 |
| 14 | Franklin Signature Fiberglass 16mm | 미확인 | 이름 검색상 없음 | 미확인(검색 결과 보고 없음) | 미확인 |
| 15 | Picklepoppers POP N ROOKIE 16mm | 미확인 | 이름 검색상 없음 | 미확인(검색 결과 보고 없음) | 미확인 |
| 16 | STAR Reactive Carbon 16mm | 미확인 | 이름 검색상 없음 | 미확인(검색 결과 보고 없음) | 미확인 |
| 17 | Friday Aura Pro Gen 4 Hybrid 16mm | 미확인 | 후보: "Aura Pro Hybrid" 116/6.43/2051. PE의 "Gen 4"는 구조 세대 열이라 제품 세대(Gen 4) 일치는 미확인 | 후보: "Aura Pro Hybrid" 113.6/6.48/2,283 (세대 표기 미확인) | Matt's URL 있음 [요약] |
| 18 | 11SIX24 Hurache-X Power 2 Elongated 16mm | 미확인 | 있음 117/6.12/2092 | 있음 "Hurache-X Power 2" 114.9/6.46/2,306 | 미확인 |
| 19 | Vatic Pro V-SOL Tour Bloom 16mm | 미확인 | 있음 110/7.23/2108 | 있음 107.6/6.87/2,448 | Matt's URL 있음 [요약] |
| 20 | Honolulu J6CR Crystal Blue Endurance Elongated 16mm | 미확인 | 후보 2행: "J6CR CBE" 114/6.30/2120(UPA-A, Durable Texture), "J6CR" 112/6.22/2048(USAP, Carbon Raw Texture). 처음 적은 "J6CR Crystal Blue Endurance"는 PE에 없는 이름(CBE 약자 뜻은 원문 미확인). 우리 notes("Crystal Blue Endurance판은 UPA-A만 표기") 기준으로는 CBE 행이 가깝다 | 후보: "J6CR" 112.5/6.38/2,232, 변형 "J6CR Blue Grit"·"J6CR M105 Blue Grit" 별도, Crystal Blue Endurance 행 없음 | 미확인 |
| 21 | JOOLA Essentials 12mm | 미확인 | 이름 검색상 없음 | 미확인(검색 결과 보고 없음) | 미확인 |
| 22 | Franklin Anna Leigh Waters C45 Aurelius 16mm | 미확인 | 후보: "Aurelius ALW" Widebody 16, 99/6.16, 스핀·파워 "—" | 있음 "C45 Aurelius 16 mm" 102.5/6.39/2,310 | 미확인 |
| 23 | 11SIX24 Vapor Jelly Bean 2 Hybrid 16mm | 미확인 | 있음 "Jelly Bean 2 Vapor" Hybrid 16, 116/6.73/2152 | 있음 "Vapor Jelly Bean 2" 119.9/6.66/2,389 | Matt's 2,377 RPM [요약] |

집계([대조] 기준)
- B PE: 있음 10(5·6·8·9·10·12·13·18·19·23), 후보 6(1·7·11·17·20·22), 이름 검색상 없음 7(2·3·4·14·15·16·21). 단 웹 DB(518개)와 공개 시트(522행)의 행 수가 약간 달라 "없음"은 시트 기준이다
- C Kew: 있음 11(5·6·8·9·10·12·13·18·19·22·23), 후보 5(1·2·7·17·20), 나머지 7(3·4·11·14·15·16·21)은 hawkeye 보고에 결과가 없어 미확인
- 두 출처 모두 "있음": 5·6·8·9·10·12·13·18·19·23 = 10개
- 수치는 출처마다 다르다(예: 13번 스핀 PE 2214 대 Kew 2,610). 같은 열에서도 섞어 쓸 수 없다

## 5. 출처 후보 요약 표

| 출처 | URL | 척도 | 측정 방법 | 이용 조건(원문 위치) | 덮는 모델 수(23개 중) | 검증 등급 |
|---|---|---|---|---|---|---|
| Pickleball Effect Paddle Database | https://pickleballeffect.com/pickleball-paddle-database/ | 스윙웨이트·트윈웨이트(+백분위), 스핀 RPM, Power·Pop mph, Firepower 0~100, 내구 티어 | 공개(Briffidi SW1, Stalker Pro S3, Franklin X-40, 10회 서브·10회 펀치 발리, 기준 패들 재측정) | "Personal research use only." 상업 이용·재배포·스크레이핑 금지. [대조] 공개 공유·사용(웹사이트 포함)은 사전 서면 승인 필요 조항 있음. DB 페이지 Data use 구역, https://pickleballeffect.com/terms-of-service/ | 있음 10, 후보 6, 없음 7 | [원문] hawkeye 대조 |
| John Kew Pickleball Paddle Database | https://www.johnkewpickleball.com/paddle-database | KewCOR, Power·Pop z-점수→Firepower, 스핀 RPM, 스핀 내구 %변화, 스윙·트윈웨이트 | 공개(볼 캐논 50 MPH, Stalker Pro 3s, 100회 타격) | Content Usage Policy: 서면 허가 없는 사용·재게시·수익화·상업 목적 금지("without express written permission"), 허가·라이선스 문의 경로 있음. https://www.johnkewpickleball.com/content-usage-policy | 있음 11, 후보 5, 미확인 7 | [원문] hawkeye 대조 |
| PPA Tour Paddle Lab (Kew 수치 재게재) | https://europe.ppatour.com/paddle-lab/ | Kew와 같음(0~100 지수 포함) | Kew 방법 인용 | [대조] 약관(요약본): 상업적 스크레이핑·미러링·재방송은 서면 허가 필요, "commercial use requires a license." https://ppatour.com/about/terms/ | 미확인(Paddle Lab 본문 401) | 약관 [원문], 본문 [요약] |
| Pickleball Studio | https://pickleballstudio.com/paddles | 무게·스윙·트윈웨이트·스핀 RPM·치수 | 자체 측정이라고만 공개, 장비 미공개 | 미확인 | 미확인 | [원문](가공) |
| JustPaddles Paddle Lab | https://www.justpaddles.com/paddle-lab/ | 출구속도, 스윙·트윈웨이트, 스핀, 일관성(SD), 밸런스; 백분위 | 일부 공개, 세부 미확인 | 미확인 | 미확인(Coral Pro·Aura Pro·Tempo 값이 있다고 요약) | [요약] |
| Pickleball Central Lab | https://pickleballcentral.com/blog/the-lab-at-pickleball-central-why-swingweight-twistweight-and-balance-points-matter-in-pickleball/ | 정적 무게, 스윙·트윈웨이트, 밸런스(1/4인치 단위) | 4-in-1 기계 사용만 공개 | 글에 재사용 조건 없음 | NOX Tempus 외 미확인 | [원문](가공) |
| Matt's Pickleball | https://www.mattspickleball.com/ | 1~5점, 0~100 컨트롤 점수, 자체 측정 스윙·트윈·RPM·서브 속도(요약) | 미확인 | 미확인 | 미확인(모델 URL 5개 이상 검색 결과에 있음) | [요약] |
| 제조사 공식(Selkirk 등) | https://www.selkirk.com/products/boomstik-st | Selkirk: 막대형 Power·Spin·Control·Sweet Spot(숫자 요약이 서로 다름) | 해당 없음/미확인 | 미확인 | 열람 0 | [요약] |
| USA Pickleball 승인 목록 | https://equipment.usapickleball.org/paddle-list/ | 특성 값 없음(승인·소재·형태) | 해당 없음 | 미확인 | 특성 값 0 | [원문](1항목) |

---

## 6. 미확인 항목 (정리, 대조 후)
1. 11개 브랜드 공식 제품 페이지의 특성 등급 유무(시도 안 함). Selkirk 등급 숫자와 척도, JOOLA SPECIFICATIONS 탭
2. PPA Paddle Lab 본문(401): Kew 수치를 그대로 옮긴다는 서술, 818/115/468
3. Pickleball Studio·JustPaddles·Matt's의 이용 약관과 우리 모델 커버리지(원문 미열람)
4. 4장의 "후보" 행들이 같은 제품인지(형태·세대·변형 표기 차이)
5. Kew 열 C에서 hawkeye 보고에 결과가 없는 7개(3·4·11·14·15·16·21)의 존재 여부
6. PE Firepower 정의(용어집 "Firepower Z" 항목 미열람), Kew FAQ 문구 글자 대조
7. 3장 공식 관련 URL들(원문 미열람)
8. 약관의 법적 해석은 하지 않았다

---

## 7. 원문 대조 기록 (hawkeye, 2026-11-18)

대조자: hawkeye(읽기 전용, 브라우저 도구 + WebFetch). 메인 세션이 차단 2건과 인용 1건을 브라우저로 다시 확인했다.

| # | 구분 | 처음 서술 | 원문 확인 결과 | 반영 |
|---|---|---|---|---|
| B1 | 차단 | PE 공개 공유 승인 문구는 "다른 PE 페이지"에 있다는 요약, URL 미열람 | 틀림. 같은 약관의 Paddle Database 구역에 있음: "Any requests to share or use Paddle Database information publicly (such as in articles, websites, videos, or other content) must first be approved in writing." / "Unauthorized commercial use or redistribution of the Paddle Database is prohibited." (메인 재확인) | 2-1, 5장 |
| B2 | 차단 | Kew Raw Data "데이터 못 봄", 커버리지 전부 미확인 | 로딩 후 526개 표가 보임. 우리 모델 이름 일치 13개(그중 2개는 세대·변형 차이로 4장에서 후보 처리)(메인 재확인: 526 paddles, Tour Tempo·Boomstik ST 검색됨) | 2-2, 4장 열 C, 5장 |
| R1 | 권장 | Kew 인용이 "strictly prohibited"에서 끝남 | 원문은 "...without express written permission. This includes, but is not limited to:" (메인 재확인) | 2-2 |
| R2 | 권장 | PE 약관 인용 2개 잘림 | 원문대로 뒷부분 채움 | 2-1 |
| R3 | 권장 | Friday Original "있음" | PE Shape Hybrid, 우리 데이터 elongated → 후보 | 4장 11 |
| R4 | 권장 | "J6CR Crystal Blue Endurance" | PE 항목명은 "J6CR CBE", 판별 단서(승인·면) 추가 | 4장 20 |
| R5 | 권장 | "Perseus Power FX", 쪽 표기 | PE 항목명 "Power FX", 쪽 표기 근거 없음 | 4장 10, 쪽 표기 삭제 |
| R6 | 권장 | JOOLA 3S Dual·NOX JC6 미확인 | 이름 다른 후보 행 있음 | 4장 1·7 |
| R7 | 권장 | "rather than estimated" | 원문 "instead of estimated" | 2-2 |
| R8 | 권장 | 제조사 페이지 0건 열람 | 브라우저로 Selkirk·JOOLA 열림. Selkirk Performance Ratings 구역 있음(숫자 미확인) | 0·1장 |
| R9 | 권장 | 리뷰 점수 성격 [요약] | 원문: 코트 점수는 측정값으로 만든 것이 아니라 리뷰어 판단. 다른 리뷰어 수치와 비교하지 말라는 항목 있음 | 2-7·2-8 |
| 기타 | 참고 | "Pickleball Central과 같은 모회사" | 출처에서 확인 못 함 → 미확인으로 표시 | 2-2 |
| 기타 | 참고 | "요약상 10점 만점 추정 불가·미확인" | 문장 모순 → "척도 미확인" | 1장 |

맞음으로 확인된 것(요약): PE DB "518 PADDLES LOGGED"·열 30개·Data use 문구 3개·방법(Briffidi SW1, Stalker Pro S3, Franklin X-40, 10회 측정, 기준 패들), PE 값 13개, Kew "385 PADDLES / 72 BRANDS"와 방법(KewCOR 50 MPH, 경계 0.366·0.39, Firepower z-점수, 구간), Kew 정책의 나머지 인용·의역, 약관에 출처 표기 조항 없음

---

## 8. 사용자가 정할 것

조사 문서는 판단하지 않는다. 결정에 필요한 질문만 적는다.
1. **측정 데이터를 쓸지**: PE·Kew·PPA 모두 상업 사이트 게재나 공개 사용에 서면 승인·허가·라이선스를 요구하는 문구가 있다(우리 사이트는 제휴 링크를 넣을 예정이라 상업 사이트로 볼 가능성이 높다 — 법적 해석은 하지 않았다). 쓰려면 (가) 운영자에게 서면 허가를 요청할지 (나) 측정 데이터는 쓰지 않을지
2. **허가를 요청한다면 어느 출처에**: 커버리지는 Kew 있음 11개, PE 있음 10개. 둘 다 있는 모델 10개. 두 출처 수치는 서로 섞을 수 없다
3. **제조사 등급**: 13개 브랜드 중 확인된 단서는 Selkirk 하나(숫자 미확인)라 브랜드 간 비교 척도로 쓰기 어렵다는 사실만 있다. 더 조사할지
4. **덮는 비율 기준**: 레이더·막대를 넣으려면 23개 중 몇 개 이상이 같은 척도로 있어야 하는지(기획 6장, 조사 후 사용자 결정)
5. **"후보" 행 처리**: 형태·세대가 다른 후보 6개(PE)·5개(Kew)를 같은 제품으로 볼지 — 데이터를 쓰기로 할 때만 필요

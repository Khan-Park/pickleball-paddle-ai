# T-054 M2.5 검수 보완

## 목표
T-053 검수(docs/plan/m2.5-review.md, 브랜치 `review/t-053-m25` 커밋 a2413f6) 5장의 발견 1·2·3·4·6·7·8·9를 고친다. 사용자 판단 항목(저장 화면 버튼 문구, 추천 기준 시트 문구, 제품명 예시)과 발견 5·10~14는 이 카드에서 다루지 않는다.

## 설계
- **발견 1 홈 예시 카드**(`ExamplePreview.tsx`)
  - 지금 데이터에서 실제로 나올 수 있는 조합으로 바꾼다
    - 하이브리드형 · 중간 무게 · 코어 16mm(그대로)
    - 넓은 형 · 무거운 편(8.4oz 초과) · 코어 16mm
    - 길쭉한 형 · 중간 무게 · 코어 14mm
  - 테스트: 예시마다 (형태, 무게대, 코어) 조합에 맞는 제품이 `data/paddles.json`에 1개 이상 있는지 검사한다. 무게대 판정은 엔진 `weightBand`를 쓴다. 데이터가 바뀌어 예시가 범위를 벗어나면 테스트가 실패한다
- **발견 2 대가 표시 글자 크기**(`AffiliatePageNotice.tsx`)
  - "광고"와 표시 문구를 본문(`--text-body` 1rem)보다 큰 `text-heading`(1.125rem)으로 올린다. 순위 안내(note)는 지금 크기 그대로
  - 테스트: 컴포넌트 소스의 "광고"·표시 문구 클래스가 `text-heading`이고, `globals.css`의 `--text-heading`이 `--text-body`보다 크다
- **발견 3 대가 표시 공통 테스트**(새 `src/components/site/affiliate-notice.test.tsx` 또는 `SiteHeader.test.tsx` 확장)
  - 네 화면(결과·둘러보기·공유받은 화면·저장)에서 대가 표시에 `details` 조상과 `hidden` 속성 조상이 없다
  - 네 화면 소스 파일 + `AffiliatePageNotice.tsx`에 시각 재배치 클래스가 없다: `order-`, `flex-row-reverse`, `flex-col-reverse`, `col-start-`, `row-start-`, `absolute`, `fixed`, `sticky`, `hidden lg:`·`lg:hidden`이 대가 표시 묶음에 붙지 않음
    - 화면 파일 전체에서 `absolute`·`sticky`를 금지하면 다른 부품(아래 고정 버튼 등)까지 막히므로, 파일 전체는 `order-`·`*-reverse`·`col-start-`·`row-start-`만 금지하고, `absolute`·`fixed`·`sticky`·`hidden`은 `AffiliatePageNotice.tsx`와 대가 표시의 부모(section 줄)에서만 금지한다
- **발견 4 저장 화면 조건 칩**(`Saved.tsx`)
  - `<p aria-label>` + `aria-hidden` 칩 대신 `<ul aria-label="조건">` + `<li>` 칩으로 바꿔 낭독기가 칩 글자를 읽게 한다
  - 테스트: 칩 글자가 접근성 트리에 있다(`aria-hidden` 조상 없음), 목록 이름이 "조건"이다
- **발견 6 소스 검사**: `compare-tray.test.ts`에 `purchase|affiliate|compare_query|price_krw` 소스 검사 추가
- **발견 7 라임 검사 넓히기**(`copy.test.ts`): `text-lime` 외에 `text-[…lime…]`, 인라인 `color: var(--lime)`·`color:"var(--lime)"`도 잡는다
- **발견 8 저장 화면 실패 처리**(`saved.ts`, `Saved.tsx`)
  - `loadSaved`와 별도로 `savedStorageAvailable()`: 저장소 객체를 얻을 수 있고 `getItem`이 예외 없이 되는지만 본다(시험 쓰기는 하지 않는다)
  - 저장소를 못 쓰면 빈 목록 대신 "이 브라우저에서는 저장한 추천을 볼 수 없습니다(사생활 보호 모드 등)" 안내
  - 지우기·모두 지우기에서 `writeSaved`가 false면 목록을 그대로 두고 "지우지 못했습니다. 브라우저 저장소를 쓸 수 없습니다"를 상태 영역과 화면에 알린다
- **발견 9 지운 뒤 포커스**(`Saved.tsx`)
  - "지우기" 뒤: 다음 항목의 날짜 줄로(마지막이었으면 앞 항목, 남은 게 없으면 `h1`). 날짜 줄은 `tabIndex={-1}`
  - "모두 지우기" 확인 뒤: `h1`로. "취소" 뒤: "모두 지우기" 버튼으로. "모두 지우기"를 처음 눌렀을 때: 확인 묶음의 "모두 지우기" 버튼으로

## 수용 기준
- [ ] 예시 3개가 실제 데이터 조합이다(데이터 대조 테스트)
- [ ] 대가 표시 "광고"·표시 문구가 본문보다 큰 토큰이다(테스트)
- [ ] 네 화면에서 대가 표시가 `details`·`hidden` 조상 밖이고, 재배치 클래스 검사가 네 화면 + 표시 부품을 본다(테스트). 검사가 실제로 잡는지 확인하려고 한 번 일부러 어겨 실패하는 것을 본 뒤 되돌린다
- [ ] 저장 화면 조건 칩을 낭독기가 읽을 수 있다(`ul` 이름 "조건", 칩에 `aria-hidden` 없음)(테스트)
- [ ] `compare-tray.ts` 소스 검사, 넓힌 라임 검사가 통과한다
- [ ] 저장소를 못 쓰면 저장 화면이 그 사실을 안내한다. 지우기 실패 시 목록이 그대로고 실패 안내가 나온다(테스트)
- [ ] 지우기·모두 지우기·취소 뒤 포커스가 설계대로 간다(테스트)
- [ ] 기존 테스트는 고치지 않고 통과한다(바꿔야 하는 기존 테스트가 있으면 이유를 결과에 적는다)
- [ ] 375px 홈 예시 카드, 1024px 저장 화면 가로 스크롤 없음(브라우저 측정)
- [ ] `npm run check` 통과, 빌드 통과

## 건드릴 파일
- `src/components/home/ExamplePreview.tsx`, 홈 테스트
- `src/components/result/AffiliatePageNotice.tsx`
- `src/components/saved/Saved.tsx`, `src/components/saved/saved.test.tsx`, `src/lib/shared/saved.ts`, `src/lib/shared/saved.test.ts`
- `src/lib/shared/compare-tray.test.ts`, `src/app/copy.test.ts`
- 새 대가 표시 공통 테스트 파일
- 이 카드, docs/plan/m2.5-review.md(처리 결과는 T-053 브랜치에서 적는다 — 이 카드에서는 건드리지 않는다)

## 건드리지 말 것
- 추천 엔진, 제품 데이터, 저장 데이터 형식(키 6개), 결과·둘러보기·공유받은 화면의 배치, 사용자 판단 대기 항목(버튼 문구·시트 문구·제품명 예시)

## 확인하지 못한 것
- 실제 화면 낭독기(TalkBack·VoiceOver)로 듣는 확인은 하지 않는다. 접근성 트리 테스트로 대신한다
- 대가 표시 크기를 키운 모습은 제휴 링크가 0개라 배포본에서 볼 수 없다. 가짜 데이터 테스트로만 본다

## 참고
- docs/plan/m2.5-review.md 5장(T-053 브랜치), docs/decisions.md D-022, 기획 3.2·3.6

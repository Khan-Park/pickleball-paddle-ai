# T-038 M2 검수 보완

## 목표
M2 검수(docs/plan/m2-review.md 4장)의 "M2 안에서 고칠 것" 5건을 고치고, 사용자가 제안대로 정한 판단 4건(A~D)을 기록에 반영해 M2의 화면 기능 부분을 닫는다. 데이터 기준(조합 보강, T-035)은 이 카드 범위 밖이다.

## 할 일
### 검수 발견 5건
1. **다크 모드 로고**(page.tsx, globals.css): 로고는 화면 색이 아니라 상표 색이므로 새 토큰 `--brand`(밝은·어두운 모두 #1e2a44)를 만들어 로고 바탕에 쓴다. 제목 글자색 `--navy`와 분리한다. 대비 테스트의 "어두운 값이 빠짐없이 있는지" 점검에서 `--brand`는 일부러 같은 값임을 적어 예외로 둔다
2. **og:url**(layout.tsx, 각 page.tsx, site.ts): 레이아웃의 `openGraph.url: "/"`를 빼고, 페이지마다 자기 주소를 적는다(`/`, `/browse`). `/shared`·`/quiz`·`/result`는 og:url을 넣지 않는다(공유 주소의 `?p=`는 빌드 때 알 수 없다). 하위 페이지의 openGraph는 부모 값을 통째로 바꾸므로, 공통 값(사이트 이름·제목·설명·그림)을 `site.ts`의 함수로 만들어 같이 쓴다
3. **시트 위 안내 낭독**(Toast.tsx, BottomSheet.tsx): 안내를 띄울 때 열려 있는 시트 안의 화면 낭독기용 상태 영역(`role="status"`, 눈에 보이지 않음)에도 같은 글자를 넣는다. 화면에 보이는 안내는 지금처럼 popover 하나
4. **동작 줄이기 지연**(globals.css): 동작 줄이기 규칙에 `animation-delay: 0s !important`를 더한다
5. **필터 접기 테스트**(browse.test.tsx): 펼친 뒤 `hidden === false`, 다시 접은 뒤 `true`를 확인한다

### 판단 4건(사용자 결정: 제안대로)
- **A**: T-024 수용 기준을 "제품 시트(상세 → 제품 자세히)는 2단까지, 도움말 시트는 따로 센다"로 고쳐 적는다(동작은 바꾸지 않음)
- **B**: 대가 표시 두 가지(시트에서 연 제휴 제품이 맨 위 표시 계산에서 빠짐, 시트 안 "광고" 배지 위치)는 M3 쿠팡 파트너스(T-029)의 선행 조건으로 기록한다
- **C**: `/browse` 미리 만든 HTML에 목록이 없는 문제는 M3 검색 노출 검토 때 판단하도록 기록한다
- **D**: 가격 경계(10만·20만 원이 두 칩에 모두)는 그대로 둔다. 결정만 기록한다
- 기록 위치: docs/plan/m2.md에 "M3로 넘김" 절을 만들고 B·C를 적는다. A는 T-024 카드, D는 m2-review 판단 기록

## 수용 기준
- [ ] 어두운 화면에서 로고가 남색 바탕 + 흰 선으로 보인다(브라우저 흉내로 확인)
- [ ] 빌드 산출물에서 `/browse`의 og:url이 `/browse`, `/shared`에는 og:url이 없고, 모든 페이지에 og:image·og:title이 그대로 있다
- [ ] 시트가 열린 채 안내를 띄우면 시트 안 상태 영역에도 같은 글자가 들어간다(테스트)
- [ ] 동작 줄이기 규칙에 지연 0이 있다(테스트)
- [ ] `npm run check`·`npm run build` 통과

## 건드릴 파일
- `src/app/globals.css`, `src/app/page.tsx`(로고 색만), `src/app/layout.tsx`, `src/app/browse/page.tsx`, `src/lib/shared/site.ts`
- `src/components/ui/Toast.tsx`, `src/components/ui/BottomSheet.tsx`와 테스트, `src/app/tokens.test.ts`, `src/app/site.test.ts`, `src/components/browse/browse.test.tsx`
- 문서: docs/plan/m2.md, docs/tasks/T-024-product-detail.md

## 건드리지 말 것
- 추천 엔진, 데이터, 공유 주소 형식, 대가 표시 위치(B는 기록만)

## 확인하지 못한 것
- 카카오톡이 og:url이 없을 때 실제 주소를 쓰는지(실기기 확인)
- 화면 낭독기가 시트 안 상태 영역을 읽는지(실기기 확인)

## 참고
- docs/plan/m2-review.md, docs/decisions.md D-022·D-030, T-024·T-027·T-028·T-037

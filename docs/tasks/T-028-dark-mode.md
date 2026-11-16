# T-028 다크 모드

## 목표
휴대폰을 어두운 화면으로 쓰는 사용자에게 어두운 색으로 보여 준다. 색은 토큰(`globals.css`)만 바꾸고, 모든 글자·배경 조합의 명도 대비를 테스트로 지킨다. 기획: docs/plan/m2.md 3장 B, phase2 7.4.

## 지금
- 색 토큰 14개(`:root`)를 Tailwind 색 이름으로 쓰고, 화면은 토큰 이름만 쓴다. 기본 팔레트(gray-500 등)는 쓰지 않는다
- 토큰을 거치지 않는 곳이 있다
  - `text-white` 6곳: 청록(accent) 바탕 위 글자(주 버튼, 구매 버튼, 비교표 순위, 분석 중 체크, 선택 체크, 시작 화면 ✓)
  - 404 화면 버튼: `bg-navy text-white`. `navy`는 제목 글자색으로도 쓰여서, 어두운 화면에서 제목을 밝게 하면 이 버튼이 깨진다
  - 시작 화면 앱 아이콘: `fill="var(--navy)"`·`#ffffff`(그림)
  - 시트 뒤 배경, 그림자: 고정 rgb 값

## 할 일
1. **켜는 방법**: 운영체제(휴대폰) 설정을 따른다(`prefers-color-scheme: dark`). **앱 안 전환 버튼은 넣지 않는다**(저장소가 필요하고, 화면이 적어 설정을 따르는 것으로 충분하다고 제안). Next의 `viewport`에 `colorScheme: "light dark"`와 화면 위 색(`themeColor`)을 밝은·어두운 값으로 넣는다
2. **토큰 정리**
   - 새 토큰 `on-accent`: 청록 바탕 위 글자. 밝은 화면 흰색, 어두운 화면에서는 청록을 밝게 하므로 어두운 글자. `text-white` 6곳을 `text-on-accent`로 바꾼다
   - 404 화면 버튼은 주 버튼(`buttonClass`)으로 바꾼다(`bg-navy` 제거)
   - 앱 아이콘 그림은 그대로 둔다(아이콘 자체의 색, 어두운 바탕에서도 남색 사각형으로 보인다)
   - 시트 뒤 배경·그림자를 토큰(`--backdrop`, `--shadow-color`)으로 바꾼다
3. **어두운 값**(`@media (prefers-color-scheme: dark)`의 `:root`). 처음 제안값이고 대비 테스트를 통과하도록 조정한다

   | 토큰 | 밝은 | 어두운(안) |
   |---|---|---|
   | surface / card / line | #f6f7f9 / #ffffff / #e5e7eb | #0f1520 / #182131 / #2c374a |
   | ink / muted / navy(제목) | #1f2937 / #6b7280 / #1e2a44 | #e5e7eb / #a3acba / #eef2f8 |
   | accent / on-accent | #0f6e56 / #ffffff | #3cc39a / #04261c |
   | accent-soft / accent-ink | #e1f5ee / #085041 | #12382e / #a8ecd4 |
   | accent-bright(장식) | #1d9e75 | #2fb487 |
   | caution / caution-soft | #b45309 / #fef3e2 | #f2a65e / #3a2a17 |
   | confirm / confirm-soft | #166534 / #e8f5ec | #74d69a / #143222 |

4. **대비 테스트 확장**(`tokens.test.ts`): 밝은·어두운 값 모두에서 본문 4.5:1 이상
   - ink·muted·navy·accent·caution·confirm 글자 / card·surface 바탕
   - on-accent / accent, accent-ink / accent-soft, caution / caution-soft, confirm / confirm-soft
   - 테스트가 `@media (prefers-color-scheme: dark)` 안의 값도 읽게 한다
5. **눈으로 확인**: 브라우저에서 어두운 화면을 흉내 내어 시작·질문·분석 중·결과(카드·행·시트·비교표·도움말)·둘러보기·공유받은 화면·404를 375px로 본다. 동작 줄이기와는 무관

## 수용 기준
- [ ] 휴대폰이 어두운 화면이면 모든 화면이 어두운 색으로 나온다(브라우저 흉내로 확인)
- [ ] 밝은·어두운 값 모두 대비 테스트 통과
- [ ] 화면 코드에 `text-white`·`bg-navy` 같은 고정 색이 남지 않는다(검색으로 확인, 앱 아이콘 그림 제외)
- [ ] `npm run check`·`npm run build` 통과

## 건드릴 파일
- `src/app/globals.css`, `src/app/tokens.test.ts`, `src/app/layout.tsx`(viewport)
- `text-white`가 있는 6곳과 `src/app/not-found.tsx`(색 이름만)
- `src/components/ui/BottomSheet.tsx`는 건드리지 않고 `globals.css`의 시트 뒤 배경만 바꾼다

## 건드리지 말 것
- 화면 구조·동작, 공유 미리보기 그림(사이트 공통 그림은 밝은 색 그대로), 추천 엔진, 데이터

## 확인하지 못한 것
- 실기기의 어두운 화면(특히 OLED 화면에서 카드 경계가 보이는지)
- 카카오톡 앱 안 브라우저가 어두운 화면 설정을 넘겨주는지

## 참고
- docs/plan/m2.md, docs/plan/phase2.md 7.4, T-015(토큰), T-033(대비 테스트)
- node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md(colorScheme·themeColor)

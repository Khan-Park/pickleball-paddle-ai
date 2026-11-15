# T-010 시작·질문 화면

## 목표
시작 화면(`/`)과 질문 화면(`/quiz`)을 만든다. 질문 정의와 답변 변환은 T-009의 순수 함수를 그대로 쓴다. 설계: docs/design/ui-flow.md 1~2장, 4장, 10장.

## 수용 기준
- [x] `/`: 소개, 시작 버튼, 추천 방식 안내(스펙 기준, 수수료와 무관한 순위)
- [x] `/quiz`: 한 화면에 질문 하나, 진행 표시, 이전 버튼. 답을 고르면 다음으로 넘어가고, 선호 모양만 여러 개 선택 + 다음/건너뛰기
- [x] 초보 분기(질문 6개, "잘 모르겠어요")가 화면에 반영된다
- [x] 다 답하면 답변을 `sessionStorage`에만 저장하고 `/result`로 이동한다. 답변을 URL에 넣지 않는다
- [x] 화면 톤: 짙은 남색·회색, 강조색 하나, 색은 CSS 변수(밝은 화면만)
- [x] 키보드로 조작 가능(버튼, 포커스 표시), 선택 상태는 색과 함께 ✓ 글자와 `aria-pressed`로 표시
- [x] 화면 테스트(jsdom): 초보 흐름, 상급 흐름, 건너뛰기, 이전으로 돌아가 수정, 중간에 이동하지 않음
- [x] `npm run check`, `npm run build` 통과. 브라우저(폭 375px)에서 초보 흐름을 끝까지 확인

## 건드릴 파일
- src/app/(layout.tsx, page.tsx, globals.css, quiz/page.tsx, result/page.tsx 임시 화면), src/components/quiz/, src/lib/quiz/storage.ts, vitest.config.mts, package.json(개발용 패키지)

## 건드리지 말 것
- src/lib/recommend 엔진, data/, 결과 화면의 실제 내용(T-011)

## 알려 둘 점
- 설치한 개발용 패키지: `@testing-library/react`, `@testing-library/dom`(필수 짝 패키지), `jsdom`. Next.js 16 가이드의 `@vitejs/plugin-react`와 `vite-tsconfig-paths`는 없어도 동작해 설치하지 않았다.
- `/result`는 임시 화면이다. T-011에서 추천 카드로 바꾼다.
- 선호 모양 질문의 선 그림은 아직 없다(글자와 한 줄 설명만). T-011이나 T-012에서 추가한다.
- 기본 글꼴 설정(Geist)을 빼고 시스템 한글 글꼴을 쓴다.

## 참고
- docs/design/ui-flow.md, node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md

# T-033 M1 검수 보완

## 목표
M1 검수(docs/plan/m1-review.md 4장)에서 나온 "M1 안에서 고칠 것" 10건과 사용자가 제안대로 정한 판단 3건(A·B·C)을 고쳐 M1을 닫는다.

## 할 일
### 검수 발견 10건
1. **행의 "광고" 잘림**(RankRow.tsx): "광고" 배지를 말줄임 영역 밖, 이름 앞에 둔다. 이름이 길어도 배지는 늘 보인다
2. **행의 승인 표시**(RankRow.tsx): 비교표의 `certShort`를 같이 써서 "✓ 승인 / 재확인 필요 / 미승인 / 미확인"을 카드·비교표와 같은 기준(180일, 미래 날짜)으로 보인다
3. **확인 배지 대비**(globals.css): `--confirm`을 `#15803d` → `#166534`로 진하게 한다. 옅은 바탕 `#e8f5ec` 위 대비 4.5:1 이상을 테스트에서 계산해 확인한다
4. **분석 중 화면 시간**(analyzing-flag.ts): 단계 시간 full 350 → 320ms. 전체 = 단계 3개 + 마무리 0.5단계 = 1,120ms(기준 1.2초 이하). short는 170ms(595ms) 유지. 전체 시간이 1.2초 이하인지 테스트로 고정한다
5. **분석 중 화면 뒤 포커스**(Result.tsx): 끝나거나 건너뛰면 결과 제목으로 포커스를 옮긴다
6. **겹친 시트의 스크롤 잠금**(BottomSheet.tsx): 열린 시트 수를 세어, 마지막 시트가 닫힐 때만 잠금을 푼다
7. **행의 낭독 정보**(RankRow.tsx): 행 이름에 가격과 승인 표시를 넣는다(예: "2순위 ○○, 잘 맞음, 약 24만 원, 승인. 자세히 보기")
8. **ⓘ 버튼 이름**(HelpButton.tsx, ResultCard.tsx): 글자가 보이는 버튼은 보이는 글자로 이름이 시작한다(예: "무게란? 설명 보기"). 결과 카드의 "용어 설명"은 여는 내용에 맞게 "코어 두께란?"으로 바꾼다
9. **구매 링크 누락 점검**(data/check.ts): purchase가 없는 제품을 오류로 잡는다(실사용 기준 1번)
10. **엔진 순수성 테스트**(purity.test.ts, schema-fields.test.ts): 엔진 소스가 `compare_query`를 읽지 않는지, `compare_query`가 화면용 필드에만 있는지 확인한다

### 판단 3건(사용자 결정: 제안대로)
- **A**(StickyBuy.tsx): 제휴 링크일 때 하단 고정 바의 제품 이름 앞에 "광고" 배지를 붙인다. 대가 표시 문구는 지금처럼 링크 바로 위에 둔다
- **B**(ShapeShowcase.tsx): 형태 강조는 3바퀴(12번 바뀜) 돈 뒤 표준형에서 멈춘다
- **C**(Quiz.tsx): 진행 막대를 폭 대신 `scaleX`로 움직인다(왼쪽 기준, transform만)

## 수용 기준
- [ ] 위 13건이 모두 반영되고 각각 테스트가 있다(C는 style 값 확인)
- [ ] 이름이 긴 제휴 제품에서도 행의 "광고"가 보인다(테스트: 배지가 말줄임 영역 밖)
- [ ] 미승인 제품 행에 "미승인", 오래된 승인에 "재확인 필요"가 나온다
- [ ] `npm run check`·`npm run check:release`·`npm run build` 통과, 375px 브라우저 확인

## 건드릴 파일
- `src/components/result/`: RankRow.tsx, Result.tsx, ResultCard.tsx(도움말 글자만), StickyBuy.tsx, analyzing-flag.ts와 테스트
- `src/components/ui/BottomSheet.tsx`, `src/components/help/HelpButton.tsx`, `src/components/home/ShapeShowcase.tsx`, `src/components/quiz/Quiz.tsx`(진행 막대만)와 테스트
- `src/app/globals.css`(`--confirm` 값만), `data/check.ts`와 테스트, `src/lib/recommend/purity.test.ts`, schema-fields 테스트

## 건드리지 말 것
- 추천 엔진 본체, 제품 데이터 값, 질문 내용
- M2로 넘긴 연출(적합도 막대 채움, "자세히" 펼침, 판매처 이동 안내, 시트 끌어 닫기, Lighthouse)

## 확인하지 못한 것
- 실기기 체감·화면 낭독기 실제 안내는 이 환경에서 확인할 수 없다(사용자 실기기 확인 대상)
- 실제 제휴 링크가 아직 없어 A는 테스트 데이터로만 확인한다

## 참고
- docs/plan/m1-review.md, D-022, docs/plan/phase2.md 6.1·6.3

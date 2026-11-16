# T-036 보류 제품·승인 미확인 정리

## 목표
(1) 데이터에 있지만 대회 승인이 "미확인"인 제품 6개를 다시 대조해 승인 여부를 정리하고, (2) 필수 값이 없어 보류 중인 초안 5개를 살리거나 보류 사유를 확정한다. 값은 사람이 출처를 확인한 것만 넣는다(규칙 2). 기획: docs/plan/m2.md 3장 A, phase2 9장.

## 대상
### A. 데이터에 있고 승인 미확인(대회용 추천에서 빠짐)
| 제품 | 지금 막힌 점(기록) |
|---|---|
| JOOLA Hyperion Vision 16mm | 제조사는 "USAP certified: Yes", 승인 목록 JOOLA Hyperion 21건에 'Vision' 없음 |
| Six Zero Boulder Opal Hybrid 14mm | 목록 'Boulder Opal RCS 14mm'(entry 11655)가 같은 제품인지. 제조사: Smooth 면이 USAP 승인판 |
| Six Zero Coral Pro Hybrid 16mm | UPA 전용판과 USAP 승인판이 따로 있음. 국내 판매판이 어느 쪽인지 |
| 11SIX24 Hurache-X Power 2 Elongated 16mm | 제조사·판매처 모두 UPA-A만 표기 |
| Honolulu J6CR Elongated 16mm | 기존 기록에 승인 정정 이력 있음(notes). 목록 재대조 |
| 11SIX24 Vapor Jelly Bean 2 Hybrid 16mm | 목록에 1세대만 |

### B. 보류 초안(데이터에 없음)
| 초안 | 빠진 값 |
|---|---|
| TRION V-1 Control 16mm, V-1 Power 16mm | 폭(→ 형태) |
| ProKennex Kinetic Pro Speed | 코어 두께·표면 |
| ProKennex Power | 코어 두께(13mm가 코어인지), 형태(폭 7 7/8in, standard·widebody 경계) |
| SKARO PKR-T700 | 코어 두께(16mm가 코어인지 패들 두께인지) |
- Selkirk LABS Project Boomstik 2종은 2026-11-16 "제외 확정"(국내 판매처 없음)이라 대상에서 뺀다

## 진행 순서
1. **승인 목록 재대조(메인 세션)**: A의 6개를 USA Pickleball 승인 목록에서 브랜드·모델명으로 다시 찾는다. 새로 등록됐거나 이름이 다른 항목이 있으면 entry 번호·등록일·두께를 적는다
2. **제조사 자료 재조사(메인 세션)**: B의 TRION(trionsports.com), ProKennex, SKARO 공식 자료를 앱 안 브라우저로 다시 찾는다
3. **같은 제품인지 판단이 필요한 것은 확인표로**: 목록 이름이 판매명과 조금 다른 경우(예: 'Boulder Opal RCS', 'Perseus POWER FX' 때처럼)는 근거를 적어 사용자가 정한다
4. **판매처 문의 문안(사용자가 보냄)**: 1·2로도 안 풀리는 값은 피앤피노에 물어볼 문안을 제품별로 만든다. 문의 발송과 답 받기는 사용자가 한다(외부 발송)
5. **반영**: 승인된 것만 `data/paddles.json`(승인 상태·확인일·sources에 entry URL)과 초안 상태를 고친다. 문의 답을 기다리는 것은 "보류(문의 중, 날짜)"로 적는다
6. **전후 비교**: 조합 보고와 추천 순위 변화(대회용 답에 새로 들어오는 제품)

## 수용 기준
- [ ] A 6개 모두 승인 상태가 다시 대조됐고, 결과(approved / unknown 유지와 이유)가 기록돼 있다
- [ ] B 5개마다 "살림 / 문의 중 / 제외"가 정해져 있다
- [ ] 바뀐 값은 사용자 승인을 거쳤다
- [ ] 조합·추천 순위 전후를 보고했다
- [ ] `npm run check:release` 통과

## 건드릴 파일
- `data/paddles.json`(승인 상태·확인일·sources·notes만), `data/staging/`(초안 상태·값)
- 이 카드의 결과 칸

## 건드리지 말 것
- 추천 엔진, 화면 코드, 다른 제품의 스펙 값
- 사용자 개인 폴더의 수집 자료는 읽지 않는다
- 판매처 문의를 대신 보내지 않는다(문안만 만든다)

## 확인하지 못한 것
- 승인 목록이 이름만으로 같은 제품인지 늘 알 수는 없다(두께·면 버전 차이). 애매하면 unknown을 유지한다

## 참고
- data/staging/README.md(승인 목록 검색 주소, 조사 방법), docs/decisions.md D-024·D-025, T-035 결과

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

## 1·2단계 결과 (2026-11-17)
### A. 승인 목록 재대조
| 제품 | 목록에서 찾은 것 | 결론 |
|---|---|---|
| JOOLA Hyperion Vision 16mm | JOOLA Hyperion 21건(Pro V·Double Vision·IV·3S Dual·C2·CFS 등)에 'Vision' 단독 없음 | unknown 유지 |
| Six Zero Boulder Opal Hybrid 14mm | 'Boulder Opal RCS 14mm'(entry 11655, 2025-07-15) 1건 | 국내 판매판이 USAP 승인판(Smooth)인지 모름 → **판매처 문의** |
| Six Zero Coral Pro Hybrid 16mm | 'Coral Pro'(13780, 2026-10-01), 새로 'Coral Pro RCD-E 16MM'(13889)·'RCD-W'(13890)·'RCD-EFT'(13893, 모두 2026-11-06) | 국내 판매판이 UPA·USAP 승인판인지 모름 → **판매처 문의**. 새 항목은 이름으로 보아 다른 형태판(추정, 미확인) |
| 11SIX24 Hurache-X Power 2 Elongated 16mm | Hurache-X 11건 중 'Power 16mm'(1세대, 10474)뿐 | unknown 유지 |
| Honolulu J6CR Elongated 16mm | 'J6CR'(12459, 2025-12-11) | 기존 기록대로 목록판은 LOOSE WEAVE 일반 카본판, 국내 판매판은 Crystal Blue Endurance → **판매처 문의**(같은 판인지) |
| 11SIX24 Vapor Jelly Bean 2 | Jelly Bean 6건 중 'Vapor Jelly Bean 16mm'(1세대, 10340)뿐 | unknown 유지 |

### B. 제조사 자료 재조사
| 초안 | 결과 |
|---|---|
| TRION V-1 Control·Power | 제조사 공식몰(trionsports.com)에 상품 페이지가 있으나 스펙은 상세 이미지 한 장(`V-120CONTROL_FULL.jpg`, `V-120POWER_FULL.jpg`)에만 있다. 글자로 읽을 수 없음 → 이미지를 내려받아 보거나 사용자가 확인 |
| ProKennex Kinetic Pro Speed·Power | 제조사 미국 사이트(prokennex.com)에 두 모델 상품 페이지 없음(검색 결과에 Black Ace·Q 시리즈만) → **판매처 문의** |
| SKARO PKR-T700 | 2026-11-16 재조사와 같음(공개 자료에 코어 두께 없음) → **판매처 문의** |

## 3단계: 판매처(피앤피노) 문의 문안 (사용자가 보냄)
> 안녕하세요. 아래 제품의 규격과 인증 정보를 확인하고 싶어 문의드립니다. 상세페이지에 없는 항목이라 확인 부탁드립니다.
>
> 1. 식스제로 볼더 오팔 하이브리드 14mm: 판매 중인 제품의 면이 Smooth(USA Pickleball 승인판)인가요, Rough(UPA 전용판)인가요?
> 2. 식스제로 코랄 프로 하이브리드 16mm: 판매 중인 제품이 UPA·USAP 승인판인가요, UPA 전용판인가요?
> 3. 호놀룰루 J6CR 크리스탈 블루 엔듀런스 일롱게이티드: USA Pickleball 승인 제품인가요? (승인 목록의 J6CR과 같은 판인지)
> 4. 프로케넥스 키네틱 프로 스피드: 코어 두께(mm)와 면 소재가 무엇인가요?
> 5. 프로케넥스 파워: 상세페이지의 '두께 13mm'가 코어 두께인가요? 길이·폭도 알려 주세요.
> 6. 스카로 PKR-T700: 상세페이지의 '16mm'가 코어 두께인가요, 패들 전체 두께인가요?
> 7. 트라이온 V-1 컨트롤·V-1 파워: 패들 폭(가로)이 몇 mm인가요? (제조사 스펙 표에는 패들 길이 415mm와 'Handle Width 110mm'만 있습니다)
>
> 감사합니다.

- 답이 오면 이 카드에 원문과 날짜를 적고, 값마다 확인표를 거쳐 반영한다(판매처 답변은 판매처 표기로 기록, D-025)
- JOOLA Hyperion Vision·Hurache-X Power 2·Vapor Jelly Bean 2는 문의해도 승인 목록 등재가 바뀌지 않으므로 문의하지 않는다(목록에 오르면 그때 바꾼다)

## TRION 제조사 스펙 이미지 (2026-11-17, 사용자 승인 후 앱 안 브라우저로 이미지를 열어 읽음. 파일 저장 없음)
- V-1 CONTROL(`V-120CONTROL_FULL.jpg`, 860×11473): Paddle Length 415mm, Handle Length 415mm(표기 그대로), Handle Width 110mm, Balance Point 180mm, Core Thickness 16mm, Weight 225g ± / 7.9oz, Material T-700 CARBON SURFACE / HYPERDENSITY EPP FOAM CORE
- V-1 POWER(`copy-1762241598-V-120POWER_FULL.jpg`, 860×11770): Handle Length 415mm, Handle Width 110mm, Balance Point 180mm, Core Thickness 16mm, Weight 230g ± / 8.1oz, Material T-700 CARBON SURFACE / GEL SKIN FOAM, HONEYCOMB CORE
- **패들 폭 칸이 없다.** 'Handle Width 110mm'는 손잡이 폭으로 보기에는 크고 패들 폭(보통 190mm 안팎)으로 보기에는 작아 어느 쪽인지 알 수 없다 → 폭은 계속 비워 두고 판매처 문의 7번에 넣었다
- 코어 16mm·무게·면 소재는 기존 초안 값과 맞는지 반영 단계에서 대조한다
- 처리: B의 TRION 2개는 "문의 중"

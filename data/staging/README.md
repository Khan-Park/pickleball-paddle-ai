# 제품 스펙 초안 (staging)

`paddles.json`에 넣기 전 단계. 이 폴더의 값은 앱이 읽지 않는다. 작업 범위는 `docs/tasks/T-007-data-batch-1.md`.

## 초안 파일 구조 (`<id>.draft.json`)
- `status`: 초안 / 보류와 그 이유
- `paddle`: `paddles.json`에 들어갈 스키마 모양. 아직 모르는 값은 `null`, 사람이 채울 값은 `"TODO: ..."`로 둔다
- `evidence`: **필드명을 키로** 하는 근거(`원문`, 범위·파생 정보, `비고`)
- `source_meta`: 읽은 `url`, `read_at`, `method`(필드가 아닌 메타 정보)
- `open_questions`: 사람이 확인할 것

`npm run data:check -- --staging`이 모든 초안을 스키마로 검사한다(`null`·`TODO` 필드는 보류로 보고 제외, 나머지가 어긋나면 실패).

## 값의 규칙
- **파생값 표시**: 제조사가 범위로 적은 무게는 중간값을 `weight_oz`에 넣되, 원래 범위는 `evidence.weight_oz.범위_oz`에 구조화해 남기고 `파생`으로 표시한다. 승격할 때 `notes`에도 적는다.
- **인증 `unknown`의 `checked_at`**: `unknown`은 USA Pickleball 승인 목록과 대조하지 않았다는 뜻이고, 이때 `checked_at`은 **초안 기록일이며 확인일이 아니다**(스키마가 날짜를 요구해서 넣는다). 인증 재확인 경고(`data/check.ts`)는 `approved`일 때만 `checked_at`을 보므로 영향이 없다. 제조사 페이지의 인증 문구는 `evidence.certification`에 적고, 승인 목록과 대조하기 전에는 `approved`로 올리지 않는다.
- **형태 정보가 없으면** `null`로 둔다. 제조사 문장을 형태로 해석하지 않는다.

## 조사 방법 (2026-11-15 파일럿에서 확인)
1. **서브에이전트에게 공식 페이지 읽기를 맡기지 않는다.** WebFetch가 selkirk.com, joola.com, noxsport.com, franklinsports.com에서 403 또는 429(Retry-After 60)로 막혔고, 에이전트는 검색 요약에서 온 값을 보고했다(원문 구절이 없는 약한 값).
2. **앱 내 브라우저로 직접 읽는다.** 제품 페이지를 열고 3초쯤 기다린 뒤, 페이지 안에서 `document.body.innerText` 또는 `textContent.replace(/\s+/g,' ')`를 읽는다.
   - 스펙이 접힌 아코디언(Selkirk의 "Description & Specs")에 있으면 `innerText`에는 안 보이고 `textContent`에만 보인다. `Description & Specs` 위치부터 약 4500자를 잘라 읽는다.
   - 키워드(Weight, Core, Length, Width, USAP 등) 주변 문맥만 뽑아 읽으면 토큰이 적게 든다.
3. **읽을 수 없는 사이트**: 네이버 쇼핑은 접근 제한, 쿠팡은 봇 차단 화면(우회하지 않는다). 이 사이트들은 사용자가 캡처·제품명을 준다.
4. **USA Pickleball 승인 확인**: `https://equipment.usapickleball.org/paddle-list/`는 앱 내 브라우저로 읽힌다. 브랜드·모델 검색은 `?gv_search=&filter_5=<브랜드>&filter_55=<모델>&mode=all` 주소로 되고(같은 페이지에서 `fetch`로 결과 HTML을 받아 파싱 가능), 결과의 `entry/<번호>`에 Status(Pass)·Added·Depth·Material이 있다. 길이·폭은 없다. 같은 이름의 다른 모델(예: `C45 Tempo`)이 섞이므로 모델명을 정확히 대조하고, 찾아도 모델명이 다르면(`Hyperion Double Vision`) 승인으로 보지 않는다. 대조하면 `approved`와 `checked_at`(대조한 날), `sources`에 `entry` URL을 적는다.
5. **사용자 수집본(피앤피노 248종)**: 제조사 페이지에 없는 값은 이 자료의 상세 이미지에서 찾을 수 있다. 엑셀의 OCR 열은 미검수이므로 zip에서 해당 상품의 `02_상세규격` 원본 이미지를 꺼내 눈으로 대조한 값만 쓴다. 판매처 표기는 `evidence`에 '판매처 표기'로 구분하고, g·cm는 oz·in로 환산해 `파생`에 계산식을 적는다. 위치는 `docs/data/product-candidates.md` 참조.
6. 형태는 제조사가 패들 형태를 적었으면 그대로, 아니면 `data/shape.ts`(D-018)로 정한다. 경계 근처는 사람이 확인한다.
4. 값마다 `원문` 구절과 URL을 `evidence`·`source_meta`에 남긴다. 공식 페이지에 없는 값은 비공식 출처로 채우지 않고 `null`로 둔다.

## 파일럿 4개 결과
| 제품 | 파일 | 상태 | 비고 |
|---|---|---|---|
| Selkirk LABS Project Boomstik (Elongated, Widebody) | `selkirk-...-elongated`, `-widebody` | 초안 | 무게(범위)·코어·치수·표면 공식 확인. 승인 approved(USAP entry 11440, 11441) |
| JOOLA Hyperion Vision 16mm | `joola-hyperion-vision-16mm` | 초안 | 모든 스펙 공식 확인. 형태는 치수 규칙(D-018)으로 hybrid(경계 근처, 사람 확인). USAP 목록에서 'Hyperion Vision'을 못 찾아 unknown |
| NOX X-Foam JC6 16mm | `nox-x-foam-jc6-16mm` | 초안 | 코어·치수·표면·승인 확인, 형태 elongated. 무게는 **판매처(피앤피노) 표기 230g ±5**를 환산한 8.11oz, 가격 394,000원 |
| Franklin FS Tour Tempo 16mm | `franklin-fs-tour-tempo-16mm` | 초안(형태 결정 대기) | 무게 범위·코어·표면·승인 확인. 길이·폭은 **판매처(피앤피노) 표기 40.3 × 20.3cm**를 환산한 15.87 × 7.99in. 폭이 widebody 경계라 형태는 사람 결정. 가격 280,000원 |

## 공통 쟁점
1. **필수 필드를 공식 자료가 안 주는 경우**: NOX 무게, Franklin 길이·폭. 제조사 공식 페이지 2곳과 USAP 목록에 없다. 국내 판매 페이지의 값은 비공식이라 사용자 판단이 필요하다.
2. **한국 판매 모델과 해외 모델의 대응**: 셀커크 '붐스틱 코어'가 Elongated인지 Widebody인지, JOOLA '하이페리온 비전'에 'Ben Johns'가 붙는지 등.

## 1차 묶음 6개 (피앤피노 수집본 기준, 2026-11-15)
| 제품 | 파일 | 승인(USAP) | 사람이 볼 것 |
|---|---|---|---|
| JOOLA Power FX 16mm | `joola-power-fx-16mm` | unknown (목록에는 'Perseus POWER FX 16mm') | 같은 모델인지, 길이·폭 16.5 × 7.5 추론 |
| JOOLA Heat Vision Scorpeus 16mm | `joola-heat-vision-scorpeus-16mm` | approved (entry 11671) | 형태: 폭 7.99in 경계(standard와 widebody 중) |
| Spartus Spitfire Elongated 16mm | `spartus-spitfire-elongated-16mm` | approved (entry 13265) | 길이·폭 16.5 × 7.5 추론, 표면 QuadFiber 분류 |
| Friday Original Carbon Fiber 16mm | `friday-original-carbon-fiber-16mm` | unknown (목록 모델명이 코드) | 무게(OCR 값), 형태 elongated(경계) |
| NOX X-TREME Tempus 16mm | `nox-x-treme-tempus-16mm` | approved (entry 12147) | 제조사 페이지 대조 |
| SKARO PKR-T700 | `skaro-pkr-t700` | unknown (목록에서 못 찾음) | 전체 길이 415mm·표면(OCR 값), 16mm가 코어 두께인지 |

주의: 판매처가 cm로 적은 치수를 인치로 환산하면 반올림 때문에 길이+폭이 24in를 0.02 넘는 경우가 있다(41.9 + 19.1cm). 이때는 근거를 적고 16.5 × 7.5in로 기록하며 사람 확인 대상으로 표시한다.
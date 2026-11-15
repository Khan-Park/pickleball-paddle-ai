# 제품 스펙 초안 (staging)

`paddles.json`에 넣기 전 단계. 파일마다 `paddle`(스키마 모양), `evidence`(필드별 원문·URL), `open_questions`를 담는다.
사람이 원문과 대조해 승인하면 `verified_at`을 채워 `paddles.json`으로 옮긴다. 이 폴더의 값은 앱이 읽지 않는다.

## 조사 방법 (2026-11-15 파일럿에서 알게 된 것)
- 서브에이전트의 WebFetch는 제조사 사이트에서 403/429로 막혔다. **앱 내 브라우저로 공식 페이지를 직접 읽는 방식**이 통했다(스펙이 'Description & Specs' 아코디언 안에 있는 경우 textContent로 읽어야 보임).
- 서브에이전트 보고는 검색 요약에서 온 값이 많아 근거가 약하다. 값은 공식 페이지 원문으로 다시 확인한 것만 초안에 넣는다.

## 파일럿 4개 결과
| 제품 | 상태 | 비고 |
|---|---|---|
| Selkirk LABS Project Boomstik (Elongated, Widebody) | 초안 작성(2개) | 무게·코어·치수·표면 공식 확인. 승인(USAP)은 unknown |
| NOX X-Foam JC6 16mm | **보류** | 공식 페이지(noxsport.com)에 코어 16mm, 길이 16.5in, 폭 7.5in, USAPA·UPA-A 인증 문구는 있으나 **무게가 없음**. 무게는 필수 필드이므로 제조사 카탈로그(PDF 등)에서 확인되면 재개 |
| Franklin FS Tour Tempo 16mm | **보류** | 공식 페이지에 코어 16mm, 무게 8.6-8.9oz, USAPA 승인 문구, 형태 'traditional'(추정)은 있으나 **길이·폭이 없음**. 다른 공식 자료에서 치수 확인되면 재개 |
| JOOLA Hyperion Vision | 조사 중 | 에이전트 보고 대기 → 공식 페이지 직접 확인 필요 |

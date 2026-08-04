# Step 1: gsc-collection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step에서 만들어진 인증 유틸과 스크립트 구조를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/lib/googleAuth.ts` (이전 step에서 생성 — 그대로 재사용)
- `/scripts/collect-analytics.ts` (이전 step에서 GA4 부분이 작성됨 — 이 파일에 GSC 부분을 이어서 추가)
- `/SERVICE-SETUP.md` ("2. Google Search Console" 섹션 — **도메인 속성**으로 인증돼 있다는 점이 중요)

## 작업

`scripts/collect-analytics.ts`에 Search Console API 호출 부분을 추가한다.

- Search Console API(`https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`)의 정확한 요청 body 스키마는 최신 공식 문서를 직접 찾아서 확인하라(`https://developers.google.com/webmaster-tools/search-console-api-original/v1/searchanalytics/query` 계열 문서 확인 권장).
- **중요**: `bitkittools.com`은 GSC에 **도메인 속성**(URL-prefix 속성이 아님)으로 등록되어 있다. 도메인 속성의 `siteUrl` 파라미터는 `https://bitkittools.com/` 형태가 아니라 **`sc-domain:bitkittools.com`** 형태여야 하고, 이 값은 URL 경로에 들어가므로 `encodeURIComponent`로 인코딩해야 한다.
- 요청 내용: 어제 날짜(GSC 데이터는 보통 2~3일 지연되므로, 정확히 "어제"가 아니라 "그저께"(2일 전) 데이터를 요청하는 것이 더 안전할 수 있다 — 이 부분은 GSC API 문서에서 데이터 신선도(freshness) 관련 안내를 확인하고 적절한 날짜를 선택하라).
- `dimensions`: 반드시 `["query", "page", "country", "device"]` 4개를 함께 요청한다(로드맵에서 결정된 사항 — 노출은 비영어권에서 몰리고 타겟 국가 CTR은 정상일 수 있는 패턴을 잡기 위함).
- 이전 step의 `getGoogleAccessToken()`을 재사용해 인증한다(GSC scope `webmasters.readonly`는 이미 step 0에서 포함시켰다).
- 결과를 `/data/raw/gsc-{YYYY-MM-DD}.json`에 저장한다.
- GA4 호출이 실패해도 GSC 호출을 계속 시도하고, 반대의 경우도 마찬가지로 **서로 독립적으로 동작**하게 한다(하나의 API 실패가 다른 API 수집까지 막지 않도록 각각 try/catch로 감싸고, 실패한 쪽은 명확한 에러 로그를 남긴 뒤 계속 진행한다). 단, 스크립트 전체가 아무 데이터도 수집하지 못했다면(GA4/GSC 둘 다 실패) 최종적으로 `process.exit(1)`로 종료한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `siteUrl`이 `sc-domain:bitkittools.com` 형태로 올바르게 인코딩됐는가?
   - `dimensions`에 query/page/country/device 4개가 전부 포함됐는가?
   - GA4와 GSC 호출이 서로 독립적으로 실패/성공하는가(하나가 실패해도 다른 하나는 계속 시도하는가)?
   - GSC API 요청 body 스키마를 실제 공식 문서를 확인해서 작성했는가?
3. 결과에 따라 `phases/10-ga4-gsc-clarity-collection/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `siteUrl`을 `https://bitkittools.com/` 형태(URL-prefix 속성용)로 쓰지 마라 — 도메인 속성이라 반드시 `sc-domain:` 접두사가 필요하다.
- 4차원 중 일부만 요청하지 마라(query/page/country/device 전부 필수).
- 이 step에서 Clarity 호출 로직을 추가하지 마라(다음 step 스코프).
- 기존 테스트를 깨뜨리지 마라.

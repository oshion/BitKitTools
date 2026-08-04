# Step 2: clarity-collection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step들의 스크립트 구조를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/collect-analytics.ts` (이전 step들에서 GA4+GSC 부분이 작성됨 — 이 파일에 Clarity 부분을 이어서 추가)
- `/SERVICE-SETUP.md` ("3. Microsoft Clarity" 섹션)

`CLARITY_API_KEY` 시크릿이 이미 GitHub Secrets에 등록되어 있다.

## 작업

`scripts/collect-analytics.ts`에 Microsoft Clarity Data Export API 호출 부분을 추가한다.

- Clarity Data Export API의 정확한 엔드포인트/요청 형식은 최신 공식 문서를 직접 찾아서 확인하라(Microsoft Learn의 Clarity Data Export API 문서 검색 권장). 인증은 `Authorization: Bearer {CLARITY_API_KEY}` 헤더 방식이다.
- **주의**: Clarity Data Export API는 세션 리플레이/히트맵처럼 상세한 UX 데이터는 제공하지 않고, 집계된 요약 지표(트래픽, 참여도 관련 수치 등) 정도만 제공할 가능성이 높다. 문서에서 실제로 어떤 필드가 제공되는지 확인하고, 제공되는 필드만 그대로 저장한다 — 문서에 없는 필드를 추측해서 만들어내지 마라.
- 결과를 `/data/raw/clarity-{YYYY-MM-DD}.json`에 저장한다.
- **이 API 호출은 다른 두 소스(GA4/GSC)와 완전히 독립적으로 동작해야 한다** — Clarity 호출이 실패하거나, API 응답 형식이 예상과 다르거나, 요청 자체가 막히더라도(예: rate limit) GA4/GSC 수집 결과에는 전혀 영향을 주지 않아야 한다. try/catch로 감싸고 실패 시 명확한 에러 로그만 남긴 뒤 스크립트를 정상 종료한다(Clarity 실패만으로는 `process.exit(1)`하지 않는다 — GA4/GSC 둘 다 실패했을 때만 전체 실패로 처리하는 이전 step의 로직을 그대로 유지한다).

## Acceptance Criteria

```bash
npm run lint
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - Clarity 호출 실패가 GA4/GSC 수집에 영향을 주지 않는가?
   - 문서에 없는 필드를 추측해서 만들지 않았는가?
   - Clarity API 인증/엔드포인트를 실제 공식 문서를 확인해서 작성했는가?
3. 결과에 따라 `phases/10-ga4-gsc-clarity-collection/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Clarity API가 제공하지 않는 필드(세션 리플레이 상세 데이터 등)를 있는 것처럼 만들어내지 마라.
- Clarity 수집 실패로 GA4/GSC 수집까지 중단되게 만들지 마라.
- 이 step에서 워크플로우 파일(`collect-data.yml`)을 만들지 마라(다음 step 스코프).
- 기존 테스트를 깨뜨리지 마라.

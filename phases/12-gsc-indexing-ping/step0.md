# Step 0: gsc-url-inspection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 기존 GSC 연동 패턴을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/lib/googleAuth.ts` (기존 서비스 계정 인증 유틸 — 그대로 재사용, `webmasters.readonly` scope는 이미 포함되어 있으나 urlInspection에는 `webmasters` 전체 scope가 필요할 수 있으니 공식 문서에서 필요한 scope를 확인하라)
- `/scripts/collect-analytics.ts` (기존 GSC 호출 패턴 — `sc-domain:bitkittools.com` 도메인 속성, fetch 기반 REST 호출 스타일 참고)
- `/src/app/sitemap.ts` (사이트의 전체 URL 목록이 어떻게 구성되는지)
- `/src/lib/config/tools-config.ts` (`addedAt` 필드로 최근 추가된 tool을 판별 가능)

## 작업

`scripts/check-indexing-status.ts`를 작성한다. GSC의 URL Inspection API로 사이트 URL들의 색인 상태를 추적해 `/data/indexing-status.json`에 저장한다.

**API**: URL Inspection API 엔드포인트(`urlInspection/index:inspect`)의 정확한 요청/응답 스키마는 최신 공식 문서를 직접 찾아서 확인하라(`https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect` 계열 문서 검색 권장). 요청 body에는 `inspectionUrl`(검사할 정확한 URL)과 `siteUrl`(`sc-domain:bitkittools.com`)이 필요하다.

**검사 대상 URL 선정 (전체를 매번 검사하지 않는다 — API 쿼터 절약 및 불필요한 반복 방지)**:
- `tools-config.ts`의 `addedAt`이 오늘 기준 30일 이내인 tool은 EN/KO 두 버전 URL 모두 항상 포함한다("신규 페이지" 추적).
- 이전 실행에서 `/data/indexing-status.json`에 기록된 상태가 "색인 안 됨"(예: `verdict !== 'PASS'` 또는 이에 준하는 미색인 상태)이었던 URL은 색인 여부가 바뀔 때까지 계속 재검사 대상에 포함한다.
- 이미 색인이 확인됐고 최근 추가 페이지도 아닌 URL은 이번 실행에서 건너뛴다(쿼터 절약).
- `src/app/sitemap.ts`의 URL 생성 로직을 참고해 EN(prefix 없음)/KO(`/ko/` prefix) 두 버전을 각각 별도 URL로 취급한다.

**출력**: `/data/indexing-status.json`(날짜별 파일이 아니라 URL별 최신 상태를 담은 단일 롤링 스냅샷 파일)에 `{ [url]: { verdict, coverageState, lastCheckedAt } }` 형태로 저장한다(정확한 필드명은 실제 API 응답 스키마에 맞춰 합리적으로 정한다). 기존에 기록되어 있던, 이번에 검사하지 않은 URL의 상태는 그대로 유지한다(덮어쓰지 않음 — 파일을 읽어서 병합 후 다시 쓴다).

**에러 처리**: 개별 URL 검사가 실패해도(예: 그 URL만 API 오류) 다른 URL 검사는 계속 진행한다. 전체 스크립트는 모든 URL 검사가 실패했을 때만 `process.exit(1)`한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
```

`GOOGLE_SERVICE_ACCOUNT_JSON` 없이 로컬에서 실행하면 명확한 에러로 종료하는지 확인한다(실제 API 성공 여부는 로컬에서 검증 불가 — 실제 워크플로우 실행에서만 검증).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 전체 URL을 매번 검사하지 않고, "최근 30일 추가" + "미색인 상태" URL만 검사 대상으로 선정했는가?
   - EN/KO 두 버전을 별도 URL로 각각 처리했는가?
   - 기존 `/data/indexing-status.json`의 검사 안 한 URL 상태를 보존하는가(덮어쓰지 않는가)?
   - 개별 URL 검사 실패가 다른 URL 검사를 막지 않는가?
   - URL Inspection API 요청 스키마를 실제 공식 문서를 확인해서 작성했는가?
3. 결과에 따라 `phases/12-gsc-indexing-ping/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 매번 사이트의 모든 URL을 검사하지 마라 — API 쿼터 낭비이자 이 step의 설계 의도(신규/미색인만 추적)에 어긋난다.
- 시크릿 값을 하드코딩하지 마라.
- 이 step에서 sitemap 재제출/ping 로직을 추가하지 마라(다음 step 스코프).
- 기존 테스트를 깨뜨리지 마라.

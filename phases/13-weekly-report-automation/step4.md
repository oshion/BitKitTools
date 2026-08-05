# Step 4: report-generation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step들의 산출물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/lib/aggregateWeeklyReport.ts` (step 1)
- `/scripts/lib/classifyIntent.ts` (step 2)
- `/scripts/lib/detectStagnation.ts` (step 3 — `readTrend`, `appendTrendPoint`, `writeTrend` 사용)
- `/scripts/process-analytics.ts` (`ProcessedDay` 타입, `data/processed/{date}.json` 파일 명명 규칙)
- `/src/lib/config/tools-config.ts` (`addedAt` 필드 — "정리 후보" 섹션에서 90일 이상 된 tool 판별용)
- `bitkittools-ai-automation-roadmap.md`의 "Phase 2 — 리포팅 자동화" 섹션과 "6. 사이트 비대화 방지" 섹션

## 작업

`scripts/generate-report.ts`를 작성한다 (CLI 진입점, `npx tsx scripts/generate-report.ts`로 실행).

### 1. 데이터 수집

- `data/processed/` 아래 최근 7일치 `{date}.json` 파일들을 읽는다(파일명이 `YYYY-MM-DD.json` 형식인 것만 대상 — `weekly/` 하위 롤업 파일은 제외). 존재하는 날짜만 모으고, 없는 날짜가 있어도 에러 내지 않는다.
- `aggregateWeeklyReport(days)`(step 1)로 주간 데이터를 집계한다.
- `queries` 중 `intent` 분류가 필요한 상위 쿼리(예: impressions 기준 상위 30개, 중복 제거)를 뽑아 `classifyIntentRuleBased`(step 2)로 1차 분류하고, `ambiguous`로 남은 것만 `classifyAmbiguousQueries`(step 2, `ANTHROPIC_API_KEY` 필요)로 폴백 분류한다.
- **정리 후보 체크(가벼운 버전)**: `tools-config.ts`의 모든 tool 중 `addedAt`이 오늘 기준 90일 이상 지난 것을 찾고, 그 tool의 최근 7일 `sessions` 합계(위에서 읽은 `days`의 `pages` 중 해당 tool 경로)가 0에 가까우면(예: 5 미만) "정리 후보"로 리스트업한다. 해당하는 tool이 없으면(현재 사이트는 전부 90일 미만이라 당연히 없을 것) 이 섹션은 "해당 없음"으로 표시한다 — 별도 스크립트 없이 이 함수 안에서 간단히 처리한다.
- `readTrend()`(step 3)로 기존 트렌드를 읽고, 이번 주 `totals.sessions`/`totals.clicks`로 `WeeklyTrendPoint`를 만들어 `appendTrendPoint` 후 `writeTrend`로 저장한다. `isStagnant(trend)` 결과를 다음 step(전략 재검토)이 참고할 수 있도록 **`data/processed/trend.json`에 이미 반영되므로 별도 전달 불필요** — step 5가 직접 `readTrend()` + `isStagnant()`로 재확인한다.
- `data/history.md`를 읽는다(파일 없으면 빈 문자열로 취급).

### 2. Claude Sonnet 호출

- Anthropic Messages API를 raw `fetch()`로 호출한다(step 2와 동일한 인증 헤더 패턴, `model: 'claude-sonnet-5'`).
- 프롬프트에는: 이번 주 집계 데이터(`WeeklyReportData` 전체를 JSON으로), intent 분류 결과, 정리 후보 리스트, `history.md` 전체 내용을 포함한다. 다음을 요청한다:
  - CTR 0 페이지, 이탈률 높은 페이지, 국가/기기별 CTR 편차, 검색 의도 분류 요약, 순위 상승/하락 쿼리를 각각 짧게 해설
  - **추가 아이디어 제안 최소 1개 이상 필수** (신규 콘텐츠 방향, 놓치고 있는 키워드, 벤치마킹할 사례 등 — 발견된 문제와 별개로 항상 포함)
  - `history.md` 내용을 참고해서 이미 시도했던 접근을 반복 제안하지 않도록 지시
  - **정리 후보 섹션** (위에서 계산한 리스트, 비어있으면 "해당 없음"이라고 명시)
- 모델 응답은 아래 형식으로 받도록 프롬프트에 명시한다(JSON 대신 구분자 방식 — 마크다운 안에 따옴표/줄바꿈이 많아 JSON 이스케이핑이 깨지기 쉬우므로):
  ```
  ===REPORT===
  (여기에 전체 마크다운 리포트 본문)
  ===HISTORY===
  (여기에 3~5줄 압축 요약, "YYYY년 MM월 N주차: 핵심 지표 / 특이사항 / 시도한 개선 / 결과" 형식)
  ===END===
  ```
- 응답 텍스트를 정규식으로 파싱해 `report`/`historyEntry` 두 부분을 추출한다. **파싱 실패 시(구분자를 못 찾은 경우) 전체 응답 텍스트를 그대로 `report`로 쓰고 `historyEntry`는 생략**한다(fail-soft — 리포트 자체는 최대한 살린다).

### 3. 저장

- `data/reports/{연도}/{YYYY-MM-DD}.md`에 리포트 본문을 저장한다(연도 폴더 없으면 생성). 파일명의 날짜는 실행일 기준.
- `historyEntry`가 있으면 `data/history.md` 끝에 append한다(빈 줄로 구분).
- 다음 step(Slack 발송)이 리포트 내용을 읽을 수 있도록, 저장한 리포트 파일 경로를 `console.log`로 명확히 출력한다(예: `[generate-report] Saved report to data/reports/2026/2026-08-10.md`).

### 4. 에러 처리

- `ANTHROPIC_API_KEY` 환경변수가 없으면 명확한 에러 메시지와 함께 `process.exit(1)`.
- `data/processed/`에 최근 7일 데이터가 전혀 없으면(파일 0개) 리포트를 억지로 생성하지 않고 로그만 남기고 정상 종료(exit 0) — 아직 데이터가 안 쌓인 초기 상태를 에러로 취급하지 않는다.
- Anthropic API 호출 실패(네트워크/4xx/5xx)는 명확한 에러 로그와 함께 `process.exit(1)` — 리포트 생성은 이 워크플로우의 핵심 산출물이므로 여기서는 실패를 숨기지 않는다(step 6 Slack 발송과는 다른 원칙 — 그쪽은 실패해도 워크플로우를 막지 않지만, 리포트 생성 자체의 실패는 사람이 알아야 한다).

## Acceptance Criteria

```bash
npm run lint
npm run build
```

`ANTHROPIC_API_KEY` 없이 로컬에서 실행하면 명확한 에러로 종료하는지 확인한다(실제 API 성공 여부는 로컬에서 검증 불가 — 실제 워크플로우 실행에서만 검증).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `history.md` 전체 내용이 프롬프트에 포함되는가(반복 제안 방지)?
   - "추가 아이디어 제안"이 프롬프트에서 필수로 요구되는가?
   - 정리 후보 섹션이 포함되는가(현재는 빈 리스트가 정상)?
   - 응답 파싱 실패 시 크래시하지 않고 원문을 그대로 저장하는가?
   - `data/reports/{연도}/`, `data/history.md` 저장 경로가 정확한가?
   - 데이터가 아예 없는 초기 상태를 에러로 취급하지 않는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `@anthropic-ai/sdk` 패키지를 추가하지 마라 — raw `fetch()` 스타일 유지.
- Slack 발송 로직을 이 파일에 넣지 마라(다음 step 스코프) — 이 스크립트는 리포트 생성/저장까지만 담당한다.
- API 키를 하드코딩하지 마라.
- 기존 테스트를 깨뜨리지 마라.

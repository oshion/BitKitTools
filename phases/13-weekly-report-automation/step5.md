# Step 5: strategy-review-generation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step들의 산출물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/lib/detectStagnation.ts` (step 3 — `readTrend`, `isStagnant`, `readActionLog`, `filterCooldownComplete`)
- `/scripts/generate-report.ts` (step 4 — 이 step은 그 스크립트가 저장한 리포트 파일에 섹션을 이어붙인다. 파일 경로 규칙과 Anthropic API 호출 패턴을 그대로 따른다)
- `bitkittools-ai-automation-roadmap.md`의 "2-1. 트래픽 정체 감지 & 전략 재검토" 섹션

## 배경

이 스크립트는 **정체가 감지됐을 때만** 의미 있는 작업을 하고, 그렇지 않으면 즉시 아무것도 하지 않고 종료한다(no-op). `generate-report.ts`(step 4) 실행 후 별도로 실행되는 독립 스크립트다.

## 작업

`scripts/generate-strategy-review.ts`를 작성한다 (CLI 진입점, `npx tsx scripts/generate-strategy-review.ts`로 실행).

### 1. 정체 판정

- `readTrend()`로 `data/processed/trend.json`을 읽는다(step 4가 이미 이번 주 데이터포인트를 append해둔 상태).
- `isStagnant(trend)`가 `false`면: `console.log('[generate-strategy-review] Not stagnant — skipping.')`만 출력하고 `process.exit(0)`. **이 경우가 정상 케이스다** — 대부분의 주는 이렇게 조용히 끝난다.

### 2. 정체 감지 시 전략 재검토 리포트 생성

- `readActionLog()`로 `data/action-log.json`을 읽고, `filterCooldownComplete(entries, new Date())`로 21일 쿨다운이 지난 액션만 추림 (쿨다운 안 지난 액션은 "아직 효과 미반영"이므로 이번 분석 대상에서 제외 — 실패로 취급하지 않는다).
- `trend.json`의 최근 데이터 + 쿨다운 통과한 액션 로그를 Anthropic Sonnet API(step 4와 동일한 raw fetch 패턴, `model: 'claude-sonnet-5'`)에 전달해 다음을 요청한다:
  - "무엇을 했는데도 왜 트래픽이 안 늘었는지" 분석
  - 원인을 5개 구조적 영역으로 분류: 콘텐츠 문제 / 키워드 선정 문제 / 기술적 문제(색인 누락, CWV) / 경쟁 심화 / 시즌성
  - 대안 전략 제안 (예: "기존 tool 개선에 집중", "타겟 키워드 재설정")
- 액션 로그가 비어있으면(아직 아무 액션도 자동 실행된 적 없는 지금 시점) 프롬프트에 그 사실을 명시하고, "실행한 개선책이 아직 없는 상태에서의 정체"로 분석 방향을 조정하도록 지시한다 — 없는 액션 로그를 억지로 분석하려 하지 않는다.

### 3. 저장

- 오늘 날짜로 이미 존재하는 `data/reports/{연도}/{YYYY-MM-DD}.md`(step 4가 생성)를 읽어서, 그 파일 끝에 `## 전략 재검토 (트래픽 정체 감지)` 섹션으로 이어붙인다. 해당 리포트 파일이 없으면(step 4가 이미 실패해서 종료됐거나 순서가 어긋난 경우) 에러 로그를 남기고 `process.exit(1)`.

### 4. 에러 처리

- `ANTHROPIC_API_KEY` 없으면 명확한 에러로 `process.exit(1)`.
- API 호출 실패 시 명확한 에러 로그와 함께 `process.exit(1)`(step 4와 동일 원칙 — 리포트 관련 실패는 숨기지 않는다).

### 테스트

이 스크립트 자체는 API 호출이 있어 단위 테스트 대상이 아니지만(step 4와 동일하게 lint+build만 AC), **"정체 아님일 때 즉시 no-op으로 종료"** 로직만큼은 `detectStagnation.ts`의 `isStagnant` 단위 테스트(step 3에서 이미 커버됨)로 충분히 검증됐다고 간주한다 — 이 step에서 추가 테스트 파일을 만들 필요는 없다.

## Acceptance Criteria

```bash
npm run lint
npm run build
```

`ANTHROPIC_API_KEY` 없이, 그리고 `data/processed/trend.json`이 4주 미만 데이터인 상태로 로컬 실행 시 정상적으로 no-op(exit 0)되는지 확인한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 정체가 아닐 때 API를 호출하지 않고 즉시 종료하는가(불필요한 과금 방지)?
   - 21일 쿨다운 미경과 액션이 분석 대상에서 제외되는가?
   - 액션 로그가 비어있는 경우를 프롬프트에서 명시적으로 다루는가?
   - `data/reports/{연도}/{날짜}.md`에 섹션을 append하는 방식이 step 4의 출력과 올바르게 이어지는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 5를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 정체가 아닌데도 API를 호출하지 마라 — 반드시 `isStagnant` 체크가 API 호출보다 먼저다.
- Slack 발송 로직을 넣지 마라(다음 step 스코프).
- 기존 테스트를 깨뜨리지 마라.

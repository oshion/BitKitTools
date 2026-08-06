# Step 2: reindex-tracking

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/check-indexing-status.ts` (전체) — `selectUrlsToCheck`, `inspectUrl`, `UrlIndexStatus`, `IndexingStatusMap`, `loadExistingStatus`/`saveStatus`
- `/scripts/lib/detectStagnation.ts` — `ActionLogEntry`, `ActionLog`, `readActionLog`, `isCooldownComplete`
- `/.github/workflows/collect-data.yml` — `check-indexing-status.ts`가 **매일** 이 워크플로우에서 실행된다는 것을 확인하라(이번 phase가 만드는 `weekly-report.yml` 통합과는 다른 스케줄이다)
- `/bitkittools-ai-automation-roadmap.md`의 "2-2" 섹션 중 "쿨다운 시작 시점은 배포 시각이 아니라 재색인 확인 시각" 항목

## 배경 — 반드시 이해하고 시작할 것

`check-indexing-status.ts`는 이미 매일 실행되며, "최근 30일 내 추가된 tool 페이지" + "이전에 PASS가 아니었던 URL"만 검사 대상으로 선택한다(쿼터 절약을 위한 의도적 설계). **타이틀 실험으로 title/description이 바뀐 페이지는 이 두 조건 중 어느 것에도 자동으로 걸리지 않을 수 있다** — 그 tool 자체는 30일도 더 전에 추가됐고, 이미 PASS 상태였을 수 있기 때문이다. 따라서 이 스텝에서 선택 로직에 세 번째 규칙을 추가해야 한다.

또한 기존 `UrlIndexStatus`는 `verdict`(색인 여부)만 저장하고 **"언제 크롤링됐는지"는 기록하지 않는다**. 배포 시각 이후에 실제로 재크롤링됐는지 판단하려면 `lastCrawlTime`(구글이 실제로 이 URL을 마지막으로 크롤링한 시각)이 필요하다 — 우리가 API를 호출한 시각(`lastCheckedAt`)이 아니라, GSC가 알려주는 실제 크롤 시각이다.

## 작업

### 1. `check-indexing-status.ts`에 `lastCrawlTime` 추가

- `UrlInspectionApiResponse`의 `indexStatusResult`에 `lastCrawlTime?: string` 필드를 추가하라(Search Console URL Inspection API 공식 문서로 실제 필드명을 확인하라 — 추측하지 말고 `developers.google.com/webmaster-tools/v1/urlInspection.index/inspect` 응답 스키마를 확인해서 정확한 필드명을 써라).
- `UrlIndexStatus`에도 `lastCrawlTime?: string`을 추가하고, `inspectUrl`이 이 값을 함께 반환하도록 수정하라. API가 이 필드를 안 주면 `undefined`로 저장한다(에러 아님).
- **기존 `verdict`/`coverageState` 로직과 30일/PASS 선택 규칙은 절대 건드리지 마라.**

### 2. `selectUrlsToCheck`에 세 번째 규칙 추가

```typescript
// Rule 3: pages with a pending title-experiment reindex check
// (data/action-log.json 의 type: 'title-experiment' 이면서 cooldownStartedAt 이 아직 없는 항목의 page)
```

이 규칙을 위해 `scripts/lib/detectStagnation.ts`의 `readActionLog`를 가져다 쓴다. `page`가 en 경로만 저장돼 있다면(다음 step에서 실제로 어떻게 저장하는지 확인 후) en/ko 두 URL 모두 검사 대상에 추가하라(기존 Rule 1과 동일한 패턴).

### 3. `scripts/lib/titleExperimentReindex.ts` (순수 함수, 신규 파일)

```typescript
import type { ActionLog } from './detectStagnation'

export interface IndexingStatusEntry {
  verdict: string
  coverageState: string
  lastCheckedAt: string
  lastCrawlTime?: string
}

export type IndexingStatusMap = Record<string, IndexingStatusEntry>

export interface ReindexConfirmation {
  actionLogEntryId: string
  cooldownStartedAt: string  // = 해당 URL의 lastCrawlTime
}

/**
 * cooldownStartedAt이 아직 없는 title-experiment 항목 중,
 * indexingStatus에 기록된 lastCrawlTime이 존재하고 deployedAt보다 이후인
 * 것만 반환한다. lastCrawlTime이 없거나 deployedAt 이전이면 아직 판정
 * 보류(반환하지 않음) — 성급하게 쿨다운을 시작시키지 않는다.
 */
export function findReindexedExperiments(
  actionLog: ActionLog,
  indexingStatus: IndexingStatusMap
): ReindexConfirmation[]
```

`IndexingStatusMap`/`IndexingStatusEntry`는 `check-indexing-status.ts`가 이미 내부적으로 쓰던 타입과 형태가 같아야 한다(파일을 공유해서 읽고 쓰므로) — 필요하면 `check-indexing-status.ts` 쪽에서 이 타입을 `export`해서 재사용하고, 이 파일에서 새로 정의하지 마라(타입 중복 방지).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `scripts/lib/__tests__/titleExperimentReindex.test.ts`에서 최소: `lastCrawlTime`이 `deployedAt`보다 이후(포함 확인), `lastCrawlTime`이 `deployedAt`보다 이전(제외), `lastCrawlTime`이 없음(제외), 이미 `cooldownStartedAt`이 있는 항목(대상에서 제외) 케이스를 검증하는지 확인한다.
3. `check-indexing-status.ts`의 기존 테스트(있다면)가 깨지지 않았는지, 30일/PASS 선택 로직이 그대로인지 확인한다.
4. 결과에 따라 `phases/16-title-ab-test-automation/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `check-indexing-status.ts`의 기존 30일/PASS 선택 로직이나 에러 처리 방식을 바꾸지 마라 — 세 번째 규칙만 추가한다.
- `lastCrawlTime`이 없는 과거 `indexing-status.json` 항목에 대해 마이그레이션 코드를 만들지 마라 — `undefined`로 자연스럽게 처리되면 충분하다.
- 쿨다운 시작 시점을 `lastCrawlTime` 없이 추정하지 마라(예: "배포 후 3일 지나면 크롤됐다고 가정" 같은 임의 로직 금지) — 반드시 실제 `lastCrawlTime` 확인 후에만 `cooldownStartedAt`을 채운다.
- 기존 테스트를 깨뜨리지 마라.

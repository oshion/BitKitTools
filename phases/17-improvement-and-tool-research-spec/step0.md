# Step 0: proposal-tracking-foundation

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 **"Phase 4 — 기존 페이지 개선 / 신규 tool 리서치"** 섹션 전체 — 이 phase가 구현하는 대상의 최종 명세. 특히 "중복 제안 방지 — proposals.json 대조 필수", "고성과 페이지 확장 spec — 완전 자동", "주당 생성 개수 상한" 세 노트를 정확히 이해하라.
- `/scripts/lib/detectStagnation.ts` — `trend.json`을 다루는 순수 함수 + I/O 분리 관례(`readX`/`writeX`, `appendTrendPoint`의 "같은 weekStart면 교체" 패턴)를 그대로 따른다.
- `/scripts/lib/aggregateWeeklyReport.ts`의 `TopPerformingPage` 인터페이스(`{ path, clicks, impressions, ctr }`)와 `WeeklyReportData.topPerformingPages`

## 배경

이 phase는 여러 종류의 spec(개선/고성과 확장/신규 tool/신규 카테고리/Programmatic SEO)을 생성하는데, 전부 공통으로 두 가지 인프라가 필요하다:
1. **중복 제안 방지**: 같은 문제에 대해 이미 `pending` 상태인 제안이 있으면 다시 spec을 만들지 않고 "N주째 대기 중" 리마인더만 표시
2. **고성과 페이지의 다주 연속 신호 추적**: `trend.json`이 사이트 전체 주간 추이를 롤링 기록하는 것처럼, 페이지별 주간 top-performer 이력도 롤링 기록해야 "2~3주 연속" 여부를 코드로 판정할 수 있다

이 스텝은 이 두 인프라만 만든다. 실제 spec 생성 로직은 다음 스텝들이 이걸 가져다 쓴다.

## 작업

### 1. `scripts/lib/proposalTracking.ts` (순수 함수 + I/O)

```typescript
export interface ProposalEntry {
  id: string  // 안정적 식별자. 형식은 구현 시 정하되 동일 (type, target) 조합이면 항상 같은 id가 나오도록 결정론적으로 생성하라(예: `${type}-${slugify(target)}`) — 재실행마다 다른 id가 나오면 중복 체크가 무력화된다.
  type: 'improvement' | 'growth' | 'tool-research' | 'new-category' | 'programmatic-seo'
  target: string          // 페이지 path 또는 신규 tool/카테고리 주제를 나타내는 문자열
  firstProposedAt: string // ISO 날짜
  status: 'pending' | 'implemented'
  lastReminderAt: string  // 가장 최근에 "아직 대기 중"으로 리포트에 언급된 시각. 최초 생성 시 firstProposedAt과 동일
}

export interface ProposalLog {
  proposals: ProposalEntry[]
}

export function readProposals(filePath?: string): ProposalLog   // 파일 없으면 { proposals: [] }
export function writeProposals(log: ProposalLog, filePath?: string): void

/** 같은 (type, target)의 pending 항목을 찾는다. 없으면 undefined. */
export function findPendingProposal(
  log: ProposalLog,
  type: ProposalEntry['type'],
  target: string
): ProposalEntry | undefined

/**
 * pending 항목이 이미 있으면 lastReminderAt만 asOf로 갱신해 반환한다(신규 스펙 생성 안 함 신호).
 * 없으면 새 항목을 추가한다(신규 스펙 생성 필요 신호).
 * 호출부가 "이미 있었는지"를 알 수 있도록 { log: ProposalLog; isNew: boolean } 형태로 반환하라.
 */
export function upsertProposal(
  log: ProposalLog,
  entry: Omit<ProposalEntry, 'lastReminderAt'>,
  asOf: Date
): { log: ProposalLog; isNew: boolean }

/** asOf 기준 firstProposedAt으로부터 며칠이 지났는지가 아니라 "몇 번째 주"인지 — (asOf - firstProposedAt) / 7일, 올림 처리 */
export function weeksPending(entry: ProposalEntry, asOf: Date): number

export function markImplemented(log: ProposalLog, id: string): ProposalLog
```

`asOf`는 항상 명시적 인자로 받아라 — 이 프로젝트의 기존 관례(`isCooldownComplete`가 `new Date()`를 내부에서 호출하지 않는 것)와 동일하게, 테스트가 결정론적이어야 한다.

### 2. `scripts/lib/topPagesHistory.ts` (순수 함수 + I/O)

```typescript
export interface WeeklyTopPage {
  page: string
  clicks: number
}

export interface WeeklyTopPagesPoint {
  weekStart: string
  pages: WeeklyTopPage[]
}

export interface TopPagesHistory {
  weeks: WeeklyTopPagesPoint[]  // 오래된 것 먼저, 최대 12주 (trend.json과 동일 상수 재사용 또는 동일 값으로 별도 정의)
}

export function readTopPagesHistory(filePath?: string): TopPagesHistory
export function writeTopPagesHistory(history: TopPagesHistory, filePath?: string): void

/** trend.json의 appendTrendPoint와 동일 원칙: 같은 weekStart면 교체, 아니면 추가 후 12주로 트림 */
export function appendTopPagesPoint(
  history: TopPagesHistory,
  point: WeeklyTopPagesPoint
): TopPagesHistory

/**
 * 최근 minConsecutiveWeeks주(기본 3주, 최소 2주까지 허용하는 파라미터로) 연속으로
 * pages 배열에 등장한 page만 반환한다. 데이터가 minConsecutiveWeeks주보다 적으면
 * 빈 배열(성급하게 판정하지 않음).
 */
export function findConsecutiveTopPerformers(
  history: TopPagesHistory,
  minConsecutiveWeeks?: number
): string[]
```

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `scripts/lib/__tests__/proposalTracking.test.ts` 최소 케이스: 신규 제안(isNew: true), 기존 pending 제안(리마인더만 갱신, isNew: false), `weeksPending` 경계값, `markImplemented` 후 `findPendingProposal`이 더 이상 못 찾는지.
3. `scripts/lib/__tests__/topPagesHistory.test.ts` 최소 케이스: 같은 weekStart 재실행 시 교체(중복 안 됨), 12주 초과 시 오래된 것부터 트림, 연속 3주 등장 페이지만 반환(2주만 등장한 페이지는 제외), 데이터가 3주 미만이면 빈 배열.
4. 결과에 따라 `phases/17-improvement-and-tool-research-spec/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `readX`/`upsertProposal`/`appendTopPagesPoint` 등 어디에서도 `new Date()`를 내부에서 직접 호출하지 마라 — 항상 `asOf`/날짜를 인자로 받아라.
- 이 스텝에서 실제 spec 생성 로직이나 Claude API 호출을 만들지 마라 — 이 스텝은 추적 인프라만 만든다.
- 기존 테스트를 깨뜨리지 마라.

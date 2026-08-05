# Step 3: stagnation-detection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트 구조와 이전 step들의 산출물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/lib/aggregateWeeklyReport.ts` (`WeeklyReportData.totals` 형태 참고 — 이 step의 트렌드 계산 입력으로 재사용)
- `/scripts/manage-data-retention.ts` (파일 읽기/쓰기 + 디렉토리 생성 관례 참고)

## 배경

로드맵 Phase 2-1: 매주 최근 4주 오가닉 세션/클릭 추이를 누적해 "정체" 여부를 판단하고, 액션(타이틀 실험 등)이 배포된 지 21일이 안 됐으면 "아직 효과 미반영"으로 간주해 실패로 판단하지 않는 쿨다운 규칙을 둔다. 지금은 실제로 액션을 자동 실행하는 Phase 2-2(타이틀 A/B 테스트)가 아직 없으므로 `data/action-log.json`은 이 step에서 **스키마만 정의하고 최초 생성**하며, 당장은 비어있는 상태로 시작한다 — 이후 Phase 2-2가 이 파일에 기록을 추가하게 된다.

## 작업

`scripts/lib/detectStagnation.ts`를 작성한다.

### 트렌드 데이터 (`data/processed/trend.json`)

```typescript
export interface WeeklyTrendPoint {
  weekStart: string // ISO date (YYYY-MM-DD), 그 주 리포트 집계 시작일
  organicSessions: number
  organicClicks: number
}

export interface TrendData {
  weeks: WeeklyTrendPoint[] // 오래된 것부터 최신 순으로 정렬, 최대 12개만 보관(그 이상은 오래된 것부터 제거)
}

export function readTrend(): TrendData // 파일 없으면 { weeks: [] } 반환
export function appendTrendPoint(trend: TrendData, point: WeeklyTrendPoint): TrendData // 순수 함수, 12개 초과 시 가장 오래된 것 제거
export function writeTrend(trend: TrendData): void // data/processed/trend.json에 저장 (디렉토리 없으면 생성)

export function isStagnant(trend: TrendData): boolean
```

**`isStagnant` 규칙**:
- `trend.weeks`가 4개 미만이면 무조건 `false`를 반환한다(판단할 데이터가 부족 — 사이트가 신생이라 첫 몇 주는 정체 여부를 판단하면 안 된다).
- 가장 최근 4개 주(`weeks`의 마지막 4개)를 대상으로: 연속된 각 주가 "직전 주 대비 organicSessions와 organicClicks 성장률이 모두 +5% 미만"이면 그 구간은 정체로 카운트한다. 4주 연속(직전 주 대비 비교이므로 실제로는 3번의 주간 비교) 전부 정체 조건을 만족하면 `true`.
- 또는 최근 4주 동안 `organicClicks`가 순감소 추세(각 주가 직전 주보다 낮음)이면 그것만으로도 `true`.
- 나눗셈 시 직전 주 값이 0인 경우(0에서 0으로는 성장률 계산 불가) 해당 구간은 "정체 아님"으로 보수적으로 처리한다(분모 0 예외 처리, 크래시 금지).

### 액션 로그 (`data/action-log.json`)

```typescript
export interface ActionLogEntry {
  id: string
  type: string // 예: 'title-experiment', 'content-update' — 자유 문자열, 이 step에서는 값을 채워넣지 않음
  page: string
  deployedAt: string // ISO timestamp
  description: string
}

export interface ActionLog {
  actions: ActionLogEntry[]
}

export function readActionLog(): ActionLog // 파일 없으면 { actions: [] } 반환 (자동 생성하지 않음 — 읽기만)
export function isCooldownComplete(entry: ActionLogEntry, asOf: Date, cooldownDays?: number): boolean // 기본 cooldownDays = 21
export function filterCooldownComplete(entries: ActionLogEntry[], asOf: Date): ActionLogEntry[]
```

`asOf`를 항상 인자로 받아라(`new Date()`를 함수 내부에서 직접 호출하지 마라) — 테스트에서 결정론적으로 검증하기 위함이다. 실제 호출부(다음 step들)에서 현재 시각을 넘겨준다.

### 테스트

`scripts/lib/__tests__/detectStagnation.test.ts`에서:
- `isStagnant`: 4주 미만 데이터는 항상 false, 4주 연속 +5% 미만 성장은 true, 정상 성장 중인 데이터는 false, 클릭수 순감소 추세는 true, 직전 주 값 0일 때 크래시 없이 처리되는지
- `appendTrendPoint`: 12개 초과 시 가장 오래된 항목이 제거되는지
- `isCooldownComplete`/`filterCooldownComplete`: 21일 경과/미경과 경계값(정확히 21일째)이 올바르게 처리되는지

를 각각 검증하라. `readTrend`/`writeTrend`/`readActionLog`는 실제 파일 I/O가 있으므로 `manage-data-retention.test.ts`처럼 임시 디렉토리(tmpdir) 기반으로 테스트하거나, 파일 경로를 주입 가능하게 설계해 테스트 격리를 확보하라.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 4주 미만 데이터에서 절대 정체로 판단하지 않는가(신생 사이트 오탐 방지)?
   - 21일 쿨다운 계산에 `asOf`를 인자로 받아 테스트 결정론성을 확보했는가(`Date.now()` 직접 호출 없음)?
   - `trend.json`/`action-log.json` 파일이 없을 때 크래시 없이 기본값을 반환하는가?
   - 나눗셈 0 분모 등 예외 상황이 안전하게 처리되는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `data/action-log.json`에 더미/예시 액션을 미리 채워넣지 마라 — 빈 상태로 두고 스키마만 정의한다.
- 함수 내부에서 `new Date()`/`Date.now()`를 직접 호출해 "지금 시각"을 구하지 마라 — 반드시 인자로 받아라.
- 이 step에서 Anthropic API나 Slack 연동을 하지 마라(다음 step들의 스코프).
- 기존 테스트를 깨뜨리지 마라.

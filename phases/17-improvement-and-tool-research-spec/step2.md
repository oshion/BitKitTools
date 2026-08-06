# Step 2: growth-spec-generation

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 "Phase 4" 섹션 3번 항목("고성과 페이지 확장 spec") — 이 스텝이 구현하는 대상의 최종 명세
- 이전 step 산출물: `/scripts/lib/topPagesHistory.ts`(`appendTopPagesPoint`, `findConsecutiveTopPerformers`), `/scripts/lib/proposalTracking.ts`
- `/scripts/lib/aggregateWeeklyReport.ts`의 `TopPerformingPage`, `WeeklyReportData.topPerformingPages`
- `/scripts/generate-report.ts` — Anthropic API 호출 패턴

## 배경

이 spec은 문제를 고치는 게 아니라 **이미 검증된 성과를 증폭**하는 방향이다. "몇 주 연속 top performer인가"는 이미 step 0에서 만든 `topPagesHistory.ts`가 판정하므로, 이 스텝은 (1) 매주 이력을 기록하고 (2) 조건을 충족하는 페이지가 있으면 spec을 생성하는 것만 하면 된다. 조건을 충족하는 페이지가 없는 주는 **에러 없이 조용히 빈 결과를 반환**해야 한다 — 이게 정상 동작이다.

## 작업

### 1. 이력 기록

```typescript
export function recordWeeklyTopPages(
  topPerformingPages: TopPerformingPage[],
  weekStart: string,
  historyFilePath?: string
): TopPagesHistory
```

`topPagesHistory.ts`의 `readTopPagesHistory` → `appendTopPagesPoint`(TopPerformingPage를 WeeklyTopPage로 변환: `{ page: path, clicks }`) → `writeTopPagesHistory`를 순서대로 호출하는 얇은 wrapper.

### 2. `scripts/generate-growth-spec.ts`

```typescript
export interface GrowthSpecCandidate {
  page: string
  consecutiveWeeks: number
  evidence: string  // "최근 N주 연속 클릭 상위 페이지" + 실제 클릭 수치를 포함한 문장
}

/**
 * findConsecutiveTopPerformers(기본 3주, 최소 2주 파라미터로 조정 가능 — 로드맵의
 * "2~3주 이상 연속"이라는 표현을 그대로 반영해 하한 2주로 호출) 결과에서
 * proposalTracking으로 이미 pending인 페이지는 제외하고 candidate 목록을 만든다.
 * 주당 개수 상한은 없다(로드맵 확정 사항 — 발생 빈도 자체가 낮아 상한 불필요).
 */
export function selectGrowthCandidates(
  history: TopPagesHistory,
  proposals: ProposalLog,
  asOf: Date,
  minConsecutiveWeeks?: number
): { candidates: GrowthSpecCandidate[]; reminders: string[] }

/**
 * Claude를 호출해 "이미 잘 되는 페이지를 더 키우는" spec을 생성한다:
 * 관련 서브 키워드 전용 페이지 분리, 내부링크 강화, 콘텐츠/FAQ 보강 등의 방향 제안.
 * history.md를 프롬프트에 포함한다(Step 1과 동일 원칙).
 */
export async function generateGrowthSpec(
  candidate: GrowthSpecCandidate,
  historyMd: string,
  apiKey: string
): Promise<string>
```

`generate-growth-spec.ts`도 Step 1과 동일하게 독립 CLI가 아니라 마지막 step이 가져다 쓰는 모듈로 만든다.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 단위 테스트 최소 케이스: 연속 조건 미충족 시 `selectGrowthCandidates`가 빈 배열을 반환하는지(에러 아님), 이미 pending인 페이지는 candidate에서 제외되고 리마인더에 담기는지, `recordWeeklyTopPages`가 같은 주 재실행 시 중복 기록하지 않는지(step 0의 교체 로직 재사용 확인).
3. 결과에 따라 `phases/17-improvement-and-tool-research-spec/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 조건을 충족하는 페이지가 없을 때 예외를 던지거나 에러 로그를 남기지 마라 — 정상적인 빈 결과다.
- 이 스텝에서 새로운 임계값 상수를 로드맵과 다르게(예: 4주 이상) 정하지 마라 — 2~3주 범위를 지켜라.
- 기존 테스트를 깨뜨리지 마라.

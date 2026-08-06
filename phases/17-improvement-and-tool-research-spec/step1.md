# Step 1: improvement-spec-generation

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 "Phase 4" 섹션 — 특히 "근거 명시 필수", "history.md 참고 필수", "주당 생성 개수 상한(개선 spec 최대 3개)" 노트
- `/scripts/lib/detectCtrAnomalies.ts`(Phase 16에서 만든 CTR 판정 공유 모듈 — `detectCtrAnomalies`, `PageCtrSample`, `CtrBenchmarkTable`)
- `/scripts/lib/aggregateWeeklyReport.ts`의 `HighBouncePage`(`{ path, bounceRate, sessions }`)와 `WeeklyReportData.highBouncePages` — 이미 세션≥5 필터가 적용된 상태로 계산된다
- `/scripts/process-analytics.ts`의 `ProcessedQuery`(`{ query, page, country, device, impressions, clicks, ctr, position }`)
- `/scripts/generate-report.ts` — Anthropic API 호출 패턴(`fetch`, `MODEL`, `extractAnthropicText`, 빈 응답 가드, 프롬프트 인라인 방식)
- 이전 step 산출물: `/scripts/lib/proposalTracking.ts`

## 배경 — 데이터 변환 시 주의할 점

`detectCtrAnomalies`가 받는 `PageCtrSample`은 `(page, query)` 조합 하나당 하나의 레코드를 기대한다(`{ page, query, impressions, clicks, avgPosition }`). 그런데 실제 원본 데이터인 `ProcessedQuery`는 `(query, page, country, device)` 4차원으로 쪼개져 있다 — 같은 페이지·같은 쿼리라도 국가/기기별로 여러 행이 존재한다. **이 스텝에서 먼저 country/device를 합산해 `(page, query)` 단위로 집계하는 변환**이 필요하다(impressions/clicks는 합산, position은 impressions 가중 평균 — `aggregateWeeklyReport.ts`가 `gscAvgPosition`을 계산할 때 쓰는 것과 같은 방식을 참고하되 이번엔 페이지 단위가 아니라 페이지+쿼리 단위로 계산한다).

## 작업

### 1. 데이터 집계 함수

```typescript
// scripts/lib/aggregateWeeklyReport.ts 또는 새 파일 — 기존 구조를 보고 적절한 위치 판단
export function aggregateQueriesByPageAndQuery(queries: ProcessedQuery[]): PageCtrSample[]
```

### 2. `scripts/generate-improvement-spec.ts`

```typescript
export interface ImprovementSpecCandidate {
  page: string
  reason: string          // "CTR이 벤치마크 대비 낮음" / "이탈률이 높음" 등 사람이 읽을 근거 요약
  evidence: string        // 실제 수치를 포함한 구체적 근거 문장 (프롬프트와 spec 본문에 그대로 사용)
}

/**
 * detectCtrAnomalies + highBouncePages를 합쳐 후보를 뽑고,
 * proposalTracking으로 이미 pending인 건 제외(리마인더 문자열만 별도로 모은다),
 * 근거 강도 순으로 정렬해 상위 3개(MAX_IMPROVEMENT_SPECS_PER_WEEK 상수)만 반환한다.
 */
export function selectImprovementCandidates(
  ctrAnomalies: CtrAnomaly[],
  bouncePages: HighBouncePage[],
  proposals: ProposalLog,
  asOf: Date
): { candidates: ImprovementSpecCandidate[]; reminders: string[] }

/**
 * Claude를 호출해 candidate 하나당 spec 텍스트 하나를 생성한다.
 * 내용: 무엇을 어떻게 바꿀지, 근거 데이터, title/description/콘텐츠 구조 제안(en/ko 모두).
 * history.md 전체 내용을 프롬프트에 포함해 "이미 시도했던 접근"을 반복 제안하지 않게 한다.
 * 근거를 명시할 수 없으면(evidence가 비어있으면) 이 함수를 호출하기 전에 selectImprovementCandidates
 * 단계에서 걸러졌어야 한다 — 이 함수 자체는 항상 evidence가 있다고 가정해도 된다.
 */
export async function generateImprovementSpec(
  candidate: ImprovementSpecCandidate,
  historyMd: string,
  apiKey: string
): Promise<string>
```

**`generate-improvement-spec.ts`는 독립 CLI 스크립트가 아니라 다음 step들처럼 오케스트레이션(마지막 step 5)이 가져다 쓰는 모듈**로 만든다 — `main()`을 두지 마라.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 단위 테스트 최소 케이스: `aggregateQueriesByPageAndQuery`가 국가/기기 여러 행을 올바르게 합산하는지, `selectImprovementCandidates`가 이미 pending인 후보를 제외하고 리마인더에 담는지, 상위 3개로 제한하는지, evidence 없는 후보는 애초에 candidate로 만들어지지 않는지.
3. `generateImprovementSpec`의 프롬프트 조립/파싱 로직이 실제 네트워크 호출과 분리돼 테스트 가능한지 확인한다.
4. 결과에 따라 `phases/17-improvement-and-tool-research-spec/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `MAX_IMPROVEMENT_SPECS_PER_WEEK` 값(3)을 여러 곳에 중복 하드코딩하지 마라 — 상수 하나로 관리하라.
- 근거(evidence)가 없는 후보에 대해 spec을 생성하지 마라.
- 실제 `ANTHROPIC_API_KEY`로 네트워크 호출하는 테스트를 만들지 마라.
- 기존 테스트를 깨뜨리지 마라.

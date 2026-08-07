# Step 5: weekly-report-integration

## 읽어야 할 파일

- `/.github/workflows/weekly-report.yml` (전체 — Phase 16에서 "Run title experiment" 스텝이 이미 추가된 상태다)
- `/bitkittools-ai-automation-roadmap.md`의 "Phase 4" 섹션 전체(특히 "실행 주기·출력 형태", 7번·8번 항목)
- 이전 step 산출물 전부:
  - `/scripts/lib/proposalTracking.ts`, `/scripts/lib/topPagesHistory.ts`, `/scripts/lib/unmatchedQueryHistory.ts`, `/scripts/lib/toolResearchMatching.ts`, `/scripts/lib/checkPageSimilarity.ts`
  - `/scripts/generate-improvement-spec.ts`, `/scripts/generate-growth-spec.ts`, `/scripts/generate-tool-research-spec.ts`, `/scripts/generate-programmatic-seo-spec.ts`
- `/scripts/generate-report.ts` — 이 phase의 모든 spec을 리포트 본문에 결정론적으로 이어붙일 위치와 방식 참고(Phase 15의 Lighthouse 경고, Phase 16의 타이틀 실험 섹션과 같은 패턴)

## 작업

### 1. `scripts/generate-weekly-specs.ts` (신규 오케스트레이션 스크립트)

이번 phase의 모든 spec 생성 스크립트를 한 곳에서 순서대로 호출하는 모듈. `weekly-report.yml`에서 직접 실행할 CLI 진입점이다.

흐름 (반드시 이 순서 — **기록(record)은 후보가 없어도 매주 실행**해야 다음 주 연속 판정이 정확해진다):
1. `recordWeeklyTopPages`(step 2) — 이번 주 `topPerformingPages`를 무조건 기록
2. `unmatchedQueryHistory`의 이번 주 포인트도 무조건 기록(step 3)
3. `selectImprovementCandidates` → `generateImprovementSpec` 반복 (최대 3개)
4. `selectGrowthCandidates` → `generateGrowthSpec` 반복 (있으면)
5. `selectToolResearchCandidates` → `generateToolResearchSpec` 반복 (최대 2개)
6. `selectNewCategoryCandidate` → `generateNewCategorySpec` (있으면, `null`이면 스킵)
7. `findNearMissQueries` → `draftAndValidateVariant` → `generateProgrammaticSeoSpec` 반복
8. 새로 생성된 모든 spec에 대해 `proposalTracking.upsertProposal`로 `proposals.json`에 `pending` 기록
9. 결과를 하나의 구조체로 모아 반환:

```typescript
export interface WeeklySpecsResult {
  improvementSpecs: string[]
  growthSpecs: string[]
  toolResearchSpecs: string[]
  newCategorySpec: string | null
  programmaticSeoSpecs: string[]
  reminders: string[]  // "N주째 대기 중" 문구 전부 합침
}

export async function generateWeeklySpecs(apiKey: string): Promise<WeeklySpecsResult>
```

각 하위 단계 중 하나가 실패해도(예: Claude 호출 실패) 나머지 단계는 계속 진행하라 — 개선 spec 생성이 실패했다고 신규 tool spec 생성까지 막지 않는다(이 phase 전체의 반복되는 원칙).

### 2. 리포트 섹션 조립

`generate-report.ts`(또는 적절한 위치)에 결정론적 조립 함수를 추가한다:

```typescript
export function buildWeeklySpecsSection(result: WeeklySpecsResult): string | null
```

- 모든 배열이 비어있고 `newCategorySpec`도 `null`이고 `reminders`도 없으면 `null` 반환(섹션 생략).
- 신규 카테고리 제안이 있으면 로드맵 7번 항목대로 **별도로 눈에 띄게 표시**(예: 상단에 `## 🆕 신규 카테고리 제안` 별도 헤딩).
- 최종 리포트 조합에 `titleExperimentSection`(Phase 16) 뒤에 이어붙인다.

### 3. `weekly-report.yml`에 스텝 추가

"Run title experiment" 스텝 뒤에 추가:

```yaml
      - name: Generate weekly specs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npx tsx scripts/generate-weekly-specs.ts
        continue-on-error: true
```

`git add` 대상에 `data/proposals.json`, `data/processed/top-pages-history.json`, `data/processed/unmatched-query-history.json`이 포함돼 있는지 확인하고 없으면 추가한다(Phase 13의 for-loop 기반 `git add` 패턴 — 파일이 없으면 스킵 — 그대로 재사용).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

**로컬에서 `npx tsx scripts/generate-weekly-specs.ts`를 실제로 실행하지 마라** — `ANTHROPIC_API_KEY` 없이 의미 없는 실패만 발생한다. 실제 동작 검증은 이 phase 완료 후 GitHub Actions 실행으로 한다(이 phase 범위 밖).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `generateWeeklySpecs`의 각 하위 단계가 실패해도 나머지가 계속 실행되는지 목업으로 테스트한다.
3. `buildWeeklySpecsSection`이 전부 비어있을 때 `null`을 반환하는지, 신규 카테고리가 있을 때 별도 헤딩이 붙는지 테스트로 확인한다.
4. `weekly-report.yml`이 YAML로 파싱되는지 확인한다(Phase 16 step 4와 동일 검증 방식).
5. 결과에 따라 `phases/17-improvement-and-tool-research-spec/index.json`의 step 5를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이력 기록(1, 2번)을 후보가 없다는 이유로 건너뛰지 마라 — 매주 반드시 기록해야 다음 주 연속 판정이 정확하다.
- 하위 spec 생성 단계 하나의 실패가 다른 단계나 워크플로우 전체를 막게 만들지 마라.
- "진행 중인 타이틀 실험" 섹션(Phase 16)의 기존 동작이나 순서를 바꾸지 마라 — 새 섹션을 그 뒤에 추가하는 것만 한다.
- 기존 테스트를 깨뜨리지 마라.

최신 주간 리포트(`data/reports/{year}/*.md`)를 검증하고, 실제 트래픽 개선에 도움이 될 만한 데이터 기반 개발 초안을 잡아라.

먼저 다음을 읽어라:
- `/CLAUDE.md`
- `src/lib/config/tools-config.ts` (현재 존재하는 tool 목록 — 리포트가 "신규 제작 검토"라고 잘못 제안하는 걸 잡아내려면 필수)
- `scripts/lib/aggregateWeeklyReport.ts`, `scripts/lib/weeklyReportWindow.ts` (리포트 집계/기간 로직)
- `scripts/generate-report.ts` (리포트 생성 프롬프트 — 이 리포트가 어떤 데이터를 근거로 뭘 쓰라고 지시받았는지)
- `data/proposals.json` (이번 주 리포트 파일 하단에 `generate-weekly-specs.ts`가 자동으로 append한 개선/성장/툴리서치/신규카테고리/프로그래매틱 SEO 초안들의 추적 상태 — pending/rejected/implemented)
- `data/action-log.json` (title-experiment 및 content-update 액션들의 배포 이력 — Step 0이 지난 content-update 액션의 효과를 검증하는 데 사용)
- `scripts/lib/detectStagnation.ts` (`countContentUpdateAttempts`/`shouldEscalateApproach` — 페이지별 content-update 시도 횟수와 접근 전환 임계치 로직)

## 배경 지식 (세션 간 반복 설명을 피하기 위해 여기 고정)

- **주간 리포트 기간**: 항상 캘린더 토~금(Sat~Fri). `getWeeklyReportWindow()`가 `오늘-2일`(GSC 프레시니스 랙)을 기준으로 가장 최근 완결된 토~금 주를 계산한다. 리포트 헤더의 기간이 이 규칙과 안 맞으면 버그다.
- **GSC 클릭/노출의 authoritative 소스는 `gsc-page-totals-{date}.json`**(page 전용 fetch)이지 `gsc-{date}.json`(query-dimensioned)이 아니다. 후자는 희귀 쿼리를 프라이버시 이유로 redact하기 때문에 클릭을 과소집계한다 — 페이지 레벨 합계는 `mergePageTotalsIntoPages()`가 나중에 덮어쓰므로 정상이라면 문제없지만, 혹시 `gsc-page-totals-*.json` 파일 자체가 특정 날짜에 없다면 그 값은 과소집계된 상태로 리포트에 들어간다.
- **GA4/Clarity는 방문자가 쿠키 동의 배너에서 "동의"를 눌러야만 수집이 시작된다**(`AnalyticsScripts.tsx`, Google Consent Mode v2). 그래서 GSC 클릭·노출은 있는데 GA4 세션/Clarity 데이터가 0인 것은 버그가 아니라 정상적인 동의 게이팅 결과일 수 있다 — "세션 0이 이상하다"고 성급히 지적하지 마라. 다만 GSC 클릭이 **여러 건** 발생했는데 세션이 계속 0이라면(즉 검색 결과 클릭이 실제 방문으로 이어지지 않는 정도가 과도하다면) 그건 별개로 짚을 만한 신호다.
- **`toolEngagement`(input_enter 이벤트/세션)와 `claritySignals`(DeadClick/RageClick/ScriptErrorCount/QuickbackClick)**는 이미 `aggregateWeeklyReport.ts`가 계산해서 `WeeklyReportData`에 넣어주고, 리포트 프롬프트의 "8. 툴 품질 신호" 섹션이 이걸 서술한다. 데이터가 없으면(둘 다 빈 배열) 이 섹션 자체가 생략되는 게 정상이다 — GA4/Clarity 동의 트래픽이 쌓이기 전까지는 계속 비어있을 수 있다.
- **표본 크기가 매우 작다** (이 사이트는 신생 사이트, 주당 클릭 수가 한 자릿수인 경우가 흔함). 클릭 1~2건 차이로 "급증/급감"이라 서술하거나 확정적 원인을 단정하는 건 과잉해석이다.
- **이 리포트 파일에는 이미 자동 생성된 제안이 섞여 있다**: `generate-weekly-specs.ts`가 매주 `generate-report.ts`의 AI 서술 리포트 뒤에 개선/성장/툴리서치/신규카테고리/프로그래매틱 SEO 초안 섹션을 자동으로 append하고, 그 추적 상태를 `data/proposals.json`(status: `pending`/`rejected`/`implemented`)에 기록한다. `rejected`는 이 스킬의 Step 8에서 사용자가 거절한 제안을 기록해 다음 주 자동 파이프라인이 재생성하지 않도록 막는 상태다. 이 스킬의 Step 7이 "새로운" 제안을 만들기 전에 반드시 이 자동 생성분과 겹치는지, 이미 `rejected` 처리된 항목을 다시 제안하는 건 아닌지 먼저 확인해야 한다.

## Step 0: 지난 콘텐츠 개선 액션의 효과 검증

`data/action-log.json`에서 `type: 'content-update'`이고 `status: 'in-progress'`인 항목을 찾는다 — 이 스킬의 이전 Step 8 실행에서 승인·배포된 콘텐츠/문구 수정 건들이다 (title-experiment는 `run-title-experiment.ts`가 별도로 자동 평가하므로 여기서 다루지 않는다). 각 항목에 대해:

1. `deployedAt` 기준 14일 이상 경과했는지 확인한다 (GSC 재색인 + 클릭 데이터 반영에 필요한 최소 기간). 아직이면 건너뛴다.
2. 경과했다면, 이번 주 `data/processed/*.json`의 `queries`를 모아 해당 `page`의 현재 CTR을 계산한다 — `scripts/lib/titleExperimentOrchestrator.ts`가 이미 export하는 `getPageCtr(queries, page)`를 그대로 재사용한다 (CTR 계산 로직을 직접 재구현하지 말 것). 예:
   ```bash
   npx tsx -e "
   import { getPageCtr } from './scripts/lib/titleExperimentOrchestrator'
   import { readFileSync, readdirSync } from 'fs'
   const files = readdirSync('data/processed').filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
   const queries = files.flatMap(f => JSON.parse(readFileSync('data/processed/' + f, 'utf-8')).queries)
   console.log(getPageCtr(queries, '/해당/경로/'))
   "
   ```
3. `entry.baselineCtr`과 비교한다: 개선됐으면 `status`를 `'kept'`로, 개선되지 않았으면 `'no-improvement'`로 `data/action-log.json`에 직접 Edit한다 (별도 스크립트 없음 — title-experiment의 자동 롤백과 달리 content-update는 자동으로 되돌리지 않는다). 표본이 너무 작아 판단이 어려우면 상태를 바꾸지 말고 `in-progress`를 유지한다.
4. `'no-improvement'`로 바뀐 직후에는 반드시 그 페이지가 **접근 전환 임계치**에 도달했는지 확인한다 — `scripts/lib/detectStagnation.ts`가 export하는 `shouldEscalateApproach(log, page)`를 그대로 재사용한다 (기본 임계치 2회 연속 `no-improvement`; 로직을 직접 재구현하지 말 것):
   ```bash
   npx tsx -e "
   import { readActionLog, shouldEscalateApproach } from './scripts/lib/detectStagnation'
   console.log(shouldEscalateApproach(readActionLog(), '/해당/경로/'))
   "
   ```
   `true`면 이 페이지는 Step 7에서 더 이상 "문구 재수정"을 제안하지 않는다 — 대신 접근 자체를 재고해야 한다는 신호로 Step 8에 명시한다.
5. 이 결과를 Step 8 최종 보고에 "지난 실행 효과" 섹션으로 반드시 포함한다 (예: "jetlag-recovery-calculator FAQ 추가 — CTR 0.0%→1.2%로 개선, kept로 기록", 또는 "hydrometer-temperature-correction — 2회 연속 content-update 효과 없음, 접근 전환 검토 필요").

## Step 1: 대상 리포트 식별 및 최신성 확인

```bash
ls -t data/reports/*/*.md | head -1
```

가장 최근 파일을 대상으로 한다. 파일의 git 커밋 시각과 오늘 날짜를 비교해, 리포트가 진짜 "최신"인지(며칠 전 stale 리포트를 검토하고 있는 게 아닌지) 확인한다.

## Step 2: 리포트 vs 원본 데이터 재계산 대조

리포트 헤더의 기간을 `getWeeklyReportWindow` 규칙과 대조해 정확한지 확인한 뒤, 그 기간에 해당하는 `data/processed/{date}.json` 전부를 읽어 클릭/노출 합계를 직접 재계산하고 리포트 본문의 숫자와 비교한다 (Python 한 줄 스크립트로 충분 — 이전 세션에서 GSC 언더카운트 버그를 찾을 때 썼던 방식과 동일):

```bash
python3 -c "
import json, glob
total_clicks = total_impr = 0
for f in sorted(glob.glob('data/processed/2026-08-*.json')):  # 실제 기간에 맞게 날짜 패턴 조정
    d = json.load(open(f, encoding='utf-8'))
    total_clicks += sum(p['gscClicks'] for p in d['pages'])
    total_impr += sum(p['gscImpressions'] for p in d['pages'])
print(total_clicks, total_impr)
"
```

숫자가 안 맞으면: (a) 리포트가 잘못된 날짜 범위를 읽었는지, (b) 특정 날짜의 `gsc-page-totals-*.json`이 비어있거나 없어서 과소집계됐는지, (c) 예전에 있었던 것과 유사한 race condition(다른 워크플로우가 동시에 돌면서 빈 placeholder 처리 파일을 만든 경우)이 있는지 원인을 찾는다.

## Step 3: Raw 데이터 오분석 여부 점검

- 그 주에 해당하는 `data/processed/*.json` 각각의 `pages`/`queries` 배열이 비어있지 않은지, 있다면 왜 비어있는지(원본 raw 파일 자체가 없어서인지, 진짜로 노출이 0이었는지) 확인한다.
- 리포트가 인용한 개별 쿼리·페이지가 실제로 해당 `processed` 파일의 `queries`/`pages` 안에 존재하는지 원본 대조한다 (환각/오귀속 방지).
- `data/raw/clarity-*.json`의 `information` 배열이 비어있는데 리포트가 Clarity 데이터를 근거로 뭔가 서술했다면 그건 명백한 오류다.

## Step 4: 분석 내용 적절성 검증

- 리포트가 특정 tool을 "존재하지 않는다/신규 제작 검토"라고 썼다면, `tools-config.ts`에서 실제로 검색해 이미 존재하는지 확인한다. 이미 존재하면 리포트의 오류로 기록하고, "신규 제작"이 아니라 "기존 페이지 보강"으로 재해석한다.
- 표본 크기(클릭/노출 절대값)를 확인해서, 근거 없이 과도하게 확정적인 톤으로 쓰인 문장이 있으면 지적한다.
- Week-over-Week 비교가 있다면 비교 대상 주(`data/processed/trend.json`)가 실제로 존재하고 올바른 주인지 확인한다.

## Step 5: GSC/GA4/Clarity 수집 상태 및 상호 일관성 체크

`data/raw/`에서 그 주에 해당하는 `ga4-*.json`, `ga4-bounce-*.json`, `clarity-*.json`, `gsc-page-totals-*.json`이 각 날짜마다 실제로 존재하는지 확인한다 (파일이 아예 없다면 수집 자체가 실패한 것 — Actions 로그를 볼 것을 사용자에게 안내). 존재하되 내용이 비어있는 건 위 배경지식대로 동의 게이팅 때문일 수 있으니 정상 케이스와 구분해서 판단한다.

## Step 6: 정리 후보(cleanup candidates) 검토

리포트의 "정리 후보" 섹션에 tool이 있으면:
1. 왜 후보가 됐는지(게시 90일 경과 + 세션 5 미만) 재확인한다.
2. **바로 삭제/비활성화하지 말고**, 후보 목록과 근거를 사용자에게 제시해 어떻게 처리할지(완전 제거 / 콘텐츠 보강 후 재평가 / 그대로 유지) 확인받는다 — tool 제거는 되돌리기 번거로운 작업이다.

## Step 7: 제안 카테고리별 검토 및 개발 초안 작성

**먼저 중복/재제안 여부부터 확인한다**: `data/proposals.json`을 읽어 이번 주 리포트 파일 하단에 자동 append된 스펙 섹션(개선/성장/툴리서치/신규카테고리/프로그래매틱 SEO)의 대상(page/query)이 이미 `pending`으로 추적 중인지, 혹은 과거에 `rejected`로 기록된 적 있는지 확인한다. `pending` 항목은 새로 만들지 말고 "N주째 대기 중" 상태로만 요약한다. `rejected` 항목은 그때와 다른 새로운 근거(다른 데이터 신호, 시간 경과에 따른 상황 변화)가 없는 한 다시 제안하지 않는다 — 왜 거절됐었는지 `data/history.md`에서 사유를 확인하고, 그 사유가 지금도 유효한지 판단한다.

**두 번째로 접근 전환 대상 페이지를 확인한다**: Step 0에서 `shouldEscalateApproach()`가 `true`를 반환한 페이지가 있으면, 그 페이지는 아래 "기존 tool SEO 보완"(타이틀/설명 재수정) 카테고리로 다시 초안을 만들지 않는다. 대신 별도로 **"⚠️ 접근 전환 필요"** 카테고리를 만들어 왜 문구 수정이 안 먹혔는지(타겟 키워드 자체가 순위 밖이라 CTR 개선이 무의미한 경우가 많다 — Step 2~5에서 확인한 실제 순위를 근거로 판단할 것)와, 문구 수정이 아닌 대안(타겟 키워드 재설정, 페이지 통합/분리, 정리 후보 재평가 등)을 제안한다.

이렇게 걸러진 뒤, 리포트의 "추가 아이디어 제안" 섹션과, 이 스킬이 Step 2~5에서 직접 발견한 이상 신호들을 모아 아래 다섯 카테고리로 분류한다:

- **⚠️ 접근 전환 필요**: 위에서 확인한, `shouldEscalateApproach()`가 `true`인 페이지
- **기존 tool SEO 보완**: 타이틀/설명/keywords가 실제 GSC 쿼리와 어긋나는 경우 (참고: `tools-config.ts`의 `keywords`는 SERP 노출에 영향 없음 — title/description에 반영해야 실효가 있다). **단, 접근 전환 대상 페이지는 여기 포함하지 않는다.**
- **기존 tool 개선**: Lighthouse 점수 저하, `toolEngagement` 참여율 저조, `claritySignals`(특히 `ScriptErrorCount`)로 드러난 UX/버그 이슈
- **콘텐츠 구조 개선**: 여러 tool에 걸친 내부 링크·카테고리 구성·홈페이지 노출 방식 등
- **기타 UX/콘텐츠 개선**: 위 카테고리에 안 들어가는 나머지

각 카테고리마다 **실행 가치가 있다고 판단되는 항목만** 골라, 다음 형식으로 개발 초안을 작성한다 (실제 코드 변경은 여기서 하지 않는다 — 이 skill의 역할은 검증된 근거와 구체적인 변경안을 사람이 바로 판단할 수 있는 형태로 제시하는 것까지다):

```
### [카테고리] 제목
- **근거**: (구체적 데이터 — 어떤 쿼리/페이지/수치)
- **현재 상태**: (관련 코드 위치, 현재 값)
- **제안 변경**: (구체적으로 뭘 어떻게 바꿀지)
- **예상 효과**: (근거에 기반한, 과장 없는 기대치)
```

증거가 빈약하거나(표본 1~2건) 이미 처리된 항목(과거 `data/history.md`에 시도했다고 기록된 것)은 제안에서 제외한다.

## Step 8: 종합 보고

Step 0~7 결과를 종합해 사용자에게 보고한다:
1. 리포트 자체의 품질 문제(있다면) — 최우선으로 짚는다.
2. 데이터 수집 상태 이상(있다면).
3. **지난 실행 항목 효과** (Step 0 결과) — 개선됐는지, 무변화인지, 아직 판단하기엔 이른지.
4. 정리 후보 처리 여부 확인 요청.
5. Step 7에서 작성한 개발 초안 목록 — 우선순위 순으로 제시하고 어떤 걸 진행할지 사용자에게 확인받는다.

**사용자가 특정 항목을 거절하면**: 그 항목이 `data/proposals.json`의 자동 생성 스펙과 대응되면(Step 7에서 확인한 type/target), `scripts/lib/proposalTracking.ts`의 `markRejected()`와 동일한 결과가 되도록 해당 엔트리의 `status`를 `'rejected'`로 직접 Edit한다 (파일에 아직 엔트리가 없으면 새로 추가 — `id`는 `{type}-{target을 소문자+영숫자 외 문자는 하이픈으로 치환}`, `firstProposedAt`/`lastReminderAt`은 오늘 날짜). 이렇게 하면 다음 주 `generate-weekly-specs.ts` 실행 시 같은 (type, target) 조합이 다시 후보로 선정되지 않는다. 자동 생성 스펙과 대응되지 않는, 이 스킬이 Step 2~5에서 직접 도출한 제안이면 `data/history.md`에 "YYYY년 MM월 N주차: 제안했으나 거절 — {내용} / 사유: {사유}" 형식으로 한 줄 남긴다. 어느 쪽이든 대화창에만 남기지 않는다 — 다음 주 세션(자동 파이프라인이든, 이 스킬의 재실행이든)이 같은 걸 또 제안하지 않도록 반드시 파일에 기록한다.

**사용자가 특정 항목의 진행을 승인하면**, 그 항목에 한해 TDD(테스트 먼저) → `npm run lint && npm test && npm run build` 검증 → 커밋 → PR → auto-merge 흐름으로 진행한다 (이 프로젝트의 기존 브랜치 보호 정책상 `master` 직접 push는 하지 않는다 — `gh pr create` 후 `gh pr merge --auto --merge`). CLAUDE.md rule 17에 따라, 스펙이 실질적으로 바뀌는 큰 범위의 작업(신규 tool 추가 등)이라면 여기서 멈추고 `docs/screens/` 설계부터 사용자와 논의한다.

**병합이 끝나면 (콘텐츠/문구 성격의 변경이고, CTR로 효과 판단이 가능할 때)**, 다음 주 이후의 Step 0이 효과를 검증할 수 있도록 `data/action-log.json`에 항목을 추가한다: `type: 'content-update'`, `page`(영향받은 경로), `deployedAt`(병합 시각 ISO), `description`(무엇을 바꿨는지 한 줄), `baselineCtr`(변경 직전 — 이번 주 데이터 기준 그 페이지의 CTR, 0이어도 명시적으로 기록), `status: 'in-progress'`, `attemptNumber`(이 페이지의 몇 번째 content-update 시도인지 — `scripts/lib/detectStagnation.ts`의 `countContentUpdateAttempts(log, page) + 1`을 그대로 재사용해 계산할 것, 직접 세지 말 것). "⚠️ 접근 전환 필요" 카테고리에서 나온 항목(즉 `shouldEscalateApproach()`가 이미 `true`였던 페이지)을 다시 승인해 배포하는 경우, `description`에 반드시 "접근 전환: {이전과 뭐가 다른지}"를 명시해 단순 재시도가 아님을 기록에 남긴다. 신규 tool 추가나 순수 버그 수정처럼 CTR로 효과를 판단하기 어려운 변경에는 이 로그를 남기지 않는다.

최신 주간 리포트(`data/reports/{year}/*.md`)를 검증하고, 실제 트래픽 개선에 도움이 될 만한 데이터 기반 개발 초안을 잡아라.

먼저 다음을 읽어라:
- `/CLAUDE.md`
- `src/lib/config/tools-config.ts` (현재 존재하는 tool 목록 — 리포트가 "신규 제작 검토"라고 잘못 제안하는 걸 잡아내려면 필수)
- `scripts/lib/aggregateWeeklyReport.ts`, `scripts/lib/weeklyReportWindow.ts` (리포트 집계/기간 로직)
- `scripts/generate-report.ts` (리포트 생성 프롬프트 — 이 리포트가 어떤 데이터를 근거로 뭘 쓰라고 지시받았는지)

## 배경 지식 (세션 간 반복 설명을 피하기 위해 여기 고정)

- **주간 리포트 기간**: 항상 캘린더 토~금(Sat~Fri). `getWeeklyReportWindow()`가 `오늘-2일`(GSC 프레시니스 랙)을 기준으로 가장 최근 완결된 토~금 주를 계산한다. 리포트 헤더의 기간이 이 규칙과 안 맞으면 버그다.
- **GSC 클릭/노출의 authoritative 소스는 `gsc-page-totals-{date}.json`**(page 전용 fetch)이지 `gsc-{date}.json`(query-dimensioned)이 아니다. 후자는 희귀 쿼리를 프라이버시 이유로 redact하기 때문에 클릭을 과소집계한다 — 페이지 레벨 합계는 `mergePageTotalsIntoPages()`가 나중에 덮어쓰므로 정상이라면 문제없지만, 혹시 `gsc-page-totals-*.json` 파일 자체가 특정 날짜에 없다면 그 값은 과소집계된 상태로 리포트에 들어간다.
- **GA4/Clarity는 방문자가 쿠키 동의 배너에서 "동의"를 눌러야만 수집이 시작된다**(`AnalyticsScripts.tsx`, Google Consent Mode v2). 그래서 GSC 클릭·노출은 있는데 GA4 세션/Clarity 데이터가 0인 것은 버그가 아니라 정상적인 동의 게이팅 결과일 수 있다 — "세션 0이 이상하다"고 성급히 지적하지 마라. 다만 GSC 클릭이 **여러 건** 발생했는데 세션이 계속 0이라면(즉 검색 결과 클릭이 실제 방문으로 이어지지 않는 정도가 과도하다면) 그건 별개로 짚을 만한 신호다.
- **`toolEngagement`(input_enter 이벤트/세션)와 `claritySignals`(DeadClick/RageClick/ScriptErrorCount/QuickbackClick)**는 이미 `aggregateWeeklyReport.ts`가 계산해서 `WeeklyReportData`에 넣어주고, 리포트 프롬프트의 "8. 툴 품질 신호" 섹션이 이걸 서술한다. 데이터가 없으면(둘 다 빈 배열) 이 섹션 자체가 생략되는 게 정상이다 — GA4/Clarity 동의 트래픽이 쌓이기 전까지는 계속 비어있을 수 있다.
- **표본 크기가 매우 작다** (이 사이트는 신생 사이트, 주당 클릭 수가 한 자릿수인 경우가 흔함). 클릭 1~2건 차이로 "급증/급감"이라 서술하거나 확정적 원인을 단정하는 건 과잉해석이다.

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

리포트의 "추가 아이디어 제안" 섹션과, 이 스킬이 Step 2~5에서 직접 발견한 이상 신호들을 모아 아래 네 카테고리로 분류한다:

- **기존 tool SEO 보완**: 타이틀/설명/keywords가 실제 GSC 쿼리와 어긋나는 경우 (참고: `tools-config.ts`의 `keywords`는 SERP 노출에 영향 없음 — title/description에 반영해야 실효가 있다)
- **기존 tool 개선**: Lighthouse 점수 저하, `toolEngagement` 참여율 저조, `claritySignals`(특히 `ScriptErrorCount`)로 드러난 UX/버그 이슈
- **콘텐츠 구조 개선**: 여러 tool에 걸친 내부 링크·카테고리 구성·홈페이지 노출 방식 등
- **기타 UX/콘텐츠 개선**: 위 세 카테고리에 안 들어가는 나머지

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

Step 2~7 결과를 종합해 사용자에게 보고한다:
1. 리포트 자체의 품질 문제(있다면) — 최우선으로 짚는다.
2. 데이터 수집 상태 이상(있다면).
3. 정리 후보 처리 여부 확인 요청.
4. Step 7에서 작성한 개발 초안 목록 — 우선순위 순으로 제시하고 어떤 걸 진행할지 사용자에게 확인받는다.

사용자가 특정 항목의 진행을 승인하면, 그 항목에 한해 TDD(테스트 먼저) → `npm run lint && npm test && npm run build` 검증 → 커밋 → PR → auto-merge 흐름으로 진행한다 (이 프로젝트의 기존 브랜치 보호 정책상 `master` 직접 push는 하지 않는다 — `gh pr create` 후 `gh pr merge --auto --merge`). CLAUDE.md rule 17에 따라, 스펙이 실질적으로 바뀌는 큰 범위의 작업(신규 tool 추가 등)이라면 여기서 멈추고 `docs/screens/` 설계부터 사용자와 논의한다.

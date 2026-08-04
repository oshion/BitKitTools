# BitKitTools.com — AI 자동화 파이프라인 구축 로드맵 (v2, 스코프 확정판)

> 목표: **트래픽을 지속적으로 늘리기 위해**, GA4/GSC/Clarity 데이터를 자동 수집·분석하고, 지표 기반으로 기존 tool 개선안과 신규 tool/콘텐츠 제안을 자동 생성해 사람에게 전달하는 자동화 파이프라인을 **최대한 무료**로 구축한다. 사이트는 다국어(한글/영어) 지원이 기본이며, **영어권 트래픽을 주력**으로 확보하는 것이 핵심 목표다.
>
> **v2 변경 요약**: 최초 초안을 이 프로젝트의 CLAUDE.md/ADR와 대조 리뷰한 뒤, 세션에서 항목별로 "작업량 대비 효과"를 논의해 스코프를 확정했다. 무엇을 왜 뺐는지는 [0-1. 확정 스코프](#0-1-이번-세션-논의-결과--확정-스코프)에 정리했다.

---

## 0. 현재 상태 요약

| 항목 | 현재 상태 |
|---|---|
| 프레임워크 | Next.js (App Router), Static Export |
| 배포 | AWS EC2 + Nginx, **수동 배포** |
| DB / Backend | 없음 (LocalStorage만 사용) — **이 원칙은 자동화 파이프라인 도입 후에도 유지** |
| 테스트 | **Jest + React Testing Library** (ADR-003, 이미 구축됨) |
| 다국어 라우팅 | **next-intl `localePrefix: as-needed` 로 이미 구현·운영 중** (ADR-007) — 신규 구축 불필요 |
| 모니터링 | GA4, GSC, Microsoft Clarity |
| 예산 | 최대한 무료 |
| 언어 | 다국어(한/영) 기본 지원, **영어권 트래픽 주력 확보 목표** |
| 현재 문제 | 노출수 대비 클릭수 저조 (CTR 이슈, GSC 데이터로 원인 진단 필요) |

---

## 0-1. 이번 세션 논의 결과 — 확정 스코프

| 항목 | 결정 | 이유 |
|---|---|---|
| 테스트 프레임워크 | ~~Vitest~~ → **Jest 그대로 유지** | ADR-003이 "Vitest 대신 Jest" 를 이미 명시적으로 결정. 로드맵 초안이 이 사이트 현황을 모르고 일반론으로 작성됨 |
| 다국어 라우팅(`app/[lang]/...`) | **계획에서 삭제** | 이미 next-intl + `postbuild.mjs` 로 구현·운영 중인 걸 "미해결 과제"로 착각한 항목 |
| `generate-sitemap.ts` | **GSC 재제출(ping) 스크립트로 범위 축소** | sitemap.xml 자체는 `app/sitemap.ts` 가 `toolsConfig` 기반으로 이미 자동 생성 중 |
| Phase 3 블로그 자동 포스팅 파이프라인 | **전면 제외**, 용어사전(Glossary)으로 대체 | 신생 도메인 블로그는 SEO 효과까지 수개월 걸리고, 지금 진단된 문제(CTR)와 직결되지 않음. 스크립트 12개+ 신규 콘텐츠 인프라 대비 리턴이 불확실. Glossary는 트렌드 추적/원본성 체크 같은 무거운 장치 없이 비슷한 목적(내부링크 허브, 에버그린 유입)을 달성 |
| Playwright E2E | **전면 제외** | 계산/변환 로직은 Jest golden test로 이미 검증됨. E2E가 추가로 잡는 건 주로 UI 연결 오류인데, 브라우저 설치·캐싱·CI 분당 관리 비용 대비 효용이 낮음. 대체로 lint 규칙(하드코딩 href 금지 등) 검토 |
| Phase 4 (기존 tool 개선 / 신규 tool 리서치) | **"코드 자동생성+PR" → "spec 문서 생성까지만"** | CLAUDE.md rule 17: 스코프가 바뀌는 작업은 Claude가 `docs/screens` 설계에서 멈추고 harness 실행은 사람이 판단. 자동화 파이프라인도 동일 원칙 적용 — AI는 데이터 기반 개선/신규 제안 spec만 만들고, 실제 구현은 사람이 harness 세션에서 진행 |
| Programmatic SEO | **유지, 단 spec 생성까지만** | 70% 유사도 가드레일을 "생성된 코드"가 아니라 "spec 단계"에서 적용 — Phase 4와 동일한 흐름에 편입 |
| 경쟁사 페이지 구조 분석 스크립트 | **제외** | 경쟁사마다 HTML 구조가 다르고 SERP 순위 변동마다 파싱이 깨질 수 있어 유지보수 부담 대비 인사이트가 불확실 |
| 경량 피드백 위젯(Upstash Redis) | **제외** | "백엔드/DB 없음" 정체성(CLAUDE.md, ADR-005/008)과 정면 충돌. 정적 사이트에서 클라이언트가 Upstash REST API를 직접 호출하려면 읽기+쓰기 토큰을 `NEXT_PUBLIC_` 로 노출해야 해서 스팸/조작 위험도 있음 |
| 공유 가능한 결과카드 컴포넌트 | **제외** | 기술적으로는 프론트엔드 전용이라 깨끗하지만, 실제 공유→트래픽 전환이 검증되지 않았고 전체 tool 적용 시 디자인/구현 공수가 작지 않음 |
| 월간 Pruning 자동화 | **유지** (로드맵대로) | 사용자 판단 |
| 순차 타이틀/설명 A/B 테스트 | **완전 자동화로 격상** (생성+배포+비교까지) | title/description은 텍스트 메타데이터라 코드 생성과 리스크 성격이 다름 — 되돌리기 쉽고 버그 위험 없음. Phase 2-1의 21일 쿨다운 메커니즘을 그대로 재사용해 비교까지 자동화 가능. 단 과장 표현 금지 등 가드레일 필요 (Phase 2-2 참고) |

---

## 1. 트래픽 저조 원인 분석 (자동화 착수 전 선행 과제)

파이프라인을 만들기 전에, "왜 트래픽이 낮은가"를 영역별로 나눠서 진단해야 한다. 원인에 따라 자동화가 손댈 영역이 달라지기 때문.

| 영역 | 점검 포인트 |
|---|---|
| **SEO** | GSC 노출/클릭/순위, 타겟 키워드-콘텐츠 일치도, title/meta description, sitemap/robots.txt, 다국어 hreflang 설정 여부 |
| **UI** | 첫 화면 임팩트, 도구 접근성(클릭 동선), 로딩 속도, 모바일 반응형 |
| **UX** | 도구 사용 흐름의 직관성, 원하는 도구를 찾는 난이도, 이탈 지점(Clarity 세션 리플레이/히트맵으로 확인) |
| **콘텐츠** | 도구 설명의 충실도, 경쟁 사이트 대비 정보량, 신뢰도(FAQ, 사용법 등) 부족 여부 |
| **광고** | 광고 배치가 UX를 해치는지(과도한 광고로 이탈 유발), 광고 위치별 성과 |

→ Phase 1~2(데이터 수집/리포팅)에서 이 5개 영역을 각각 짚어낼 수 있도록 리포트 항목을 설계해야 함. **단, "광고" 영역은 수익 모델과 직결된 의사결정이라 AI가 자동으로 광고 배치를 바꾸지 않음** — 리포트에 관찰만 포함하고, 실제 조정은 사람이 직접 판단.

---

## 2. 전체 작업 순서 (Phase 0 → 4)

### Phase 0 — CI/CD 기반 공사 (선행 필수)

1. GitHub 저장소 정리 (브랜치 전략: `main` = 프로덕션)
2. GitHub Actions workflow 작성: `main` push/merge 시 → `next build`(static export) → EC2로 rsync/scp 배포 → nginx reload
3. **IndexNow 훅 추가**: 배포 스텝 마지막에 변경된 URL 목록을 Bing/Yandex IndexNow 엔드포인트로 즉시 전송 — 완전 자동, 비용 $0 (구글은 미지원, JobPosting/BroadcastEvent 전용 Indexing API 제외)
4. **구글 색인 보완**: 배포 직후 GSC API로 sitemap 재제출(ping). sitemap.xml 자체는 `app/sitemap.ts` 가 이미 자동 생성하므로 새로 만들 것은 ping 스크립트뿐. GSC `urlInspection` API로 색인 여부를 주기적으로 추적하는 로직은 Phase 1에 포함
5. EC2 SSH 접속용 키를 GitHub Secrets에 등록
6. 수동 배포 1회 테스트 → 자동 배포로 전환
7. **테스트 게이트**: 기존 Jest 유닛테스트를 PR마다 자동 실행하는 `test-gate.yml` 구축 (Public repo면 GitHub Actions 무제한 무료, Private면 월 2,000분 내에서 충분 — Playwright 없이 Jest만이라 시간 여유 있음)

**산출물**: `.github/workflows/deploy.yml`, `.github/workflows/test-gate.yml`, `scripts/notify-indexnow.ts`

---

### Phase 1 — 데이터 수집 자동화

1. GA4 Data API, GSC(Search Console) API, Clarity Data Export API 인증 설정 (서비스 계정 or OAuth)
2. **GSC 다차원(Dimension) 수집 (중요)**: 반드시 `[query, page, country, device]` 4가지 차원을 묶어서 수집 — 노출은 비영어권 국가에서 대량 발생하고 정작 타겟 국가(US/UK)의 CTR은 정상일 수도 있고, 모바일 미대응 tool이 모바일 노출에서 클릭을 못 받고 있을 수도 있음
3. **색인 상태 추적**: GSC `urlInspection` API로 신규/변경 페이지의 색인 여부를 주기적으로 확인 — Phase 0의 sitemap 재제출과 짝을 이뤄 "제출은 했는데 색인이 안 된" 페이지를 리포트에서 바로 식별
4. **GA4 커스텀 이벤트 설정 (중요)**: `tool_open`, `input_enter`, `convert_click`, `download_click` 등 tool별 사용 퍼널 이벤트를 추가 — 현재 `src/types/analytics.ts` 의 `AnalyticsEventName` 은 4개 값으로 고정돼 있어 확장이 필요함
5. 매일 1회 실행되는 GitHub Actions 크론 작업 작성 → 데이터를 JSON으로 수집
6. **데이터 저장 구조 분리 + 용량 관리**: 원본(raw)과 가공본(processed) 분리. raw는 최근 60일만 유지 후 자동 삭제, 오래된 기간은 주간/월간 집계 요약만 processed에 남김. SQLite 등 바이너리 DB 파일은 Git에 커밋하지 않는다 — 필요 시 Turso 같은 외부 무료 티어 검토
7. **액션 로그 기록**: PR/Commit/Merge/Deploy 이력은 Git 히스토리에 이미 있으므로 재저장하지 않음. `/data/action-log-{연도}.json`(연도별로 파일 분리 — 리포트/전략재검토 프롬프트가 최근 몇 개월치만 읽으면 되므로, 파일을 나눠두면 히스토리가 몇 년 쌓여도 매번 읽는 양이 늘지 않는다)에는 Git에 없는 메타데이터만: AI가 이 액션을 추천한 이유, CTR 개선 목표, 실험 ID, 대상 쿼리/키워드, 참조 커밋 SHA
8. 인증 정보는 전부 GitHub Secrets에 저장 (repo에 직접 커밋 금지)

**산출물**: `scripts/collect-analytics.ts`, `scripts/process-analytics.ts`, `scripts/log-action.ts`, `scripts/check-indexing-status.ts`, `scripts/notify-gsc-reindex.ts`, `.github/workflows/collect-data.yml`, `/data/raw/*.json`, `/data/processed/*.json`, `/data/action-log.json`

---

### Phase 2 — 리포팅 자동화

1. 주 1회 크론이 `/data/processed` 최근 데이터를 모아 **Claude Sonnet 5**에 전달 (전략적 분석은 Sonnet, 반복적 생성 작업은 Haiku로 역할 분리)
2. "CTR 0인 페이지 Top10", "이탈률 높은 페이지", "인기 검색 쿼리인데 랭킹 낮은 것" 등 인사이트 리포트 생성
3. **국가/기기별 CTR 편차 분석**: 타겟 국가(US/UK 등)와 비타겟 국가의 CTR을 분리 분석, 모바일 vs 데스크톱 CTR 편차 tool 식별
4. **검색 의도(Intent) 분류 (규칙 기반 우선 + AI는 애매한 경우만)**: GSC 쿼리별로 tool/tutorial/comparison/problem-solving 분류 → "tool을 새로 만들지, 기존 페이지를 개선할지" 자동 판단. "convert", "compress", "calculator", "how to", "vs" 같은 명확한 패턴은 규칙으로 1차 분류, 애매한 것만 AI
5. **순위 추이**: GSC 쿼리별 일별 평균 순위(position)를 시계열로 비교해 7일/30일 변화 추적
6. **추가 아이디어 제안 필수화**: 발견된 문제뿐 아니라 새로운 아이디어(신규 콘텐츠 방향, 놓치고 있는 키워드, 벤치마킹할 경쟁 사례)도 매번 함께 제안
7. Slack Webhook 또는 이메일(Gmail App Password)로 발송, 원본은 `/data/reports/{연도}/{날짜}.md`로 보관(텍스트라 용량 부담은 적지만, 연도별 폴더로 나눠 탐색 편의성 확보)
8. **압축 히스토리 기록 (`/data/history.md`)**: 리포트 생성 시 "YYYY년 MM월 N주차: 핵심 지표 / 특이사항 / 시도한 개선 / 결과"를 3~5줄로 요약해 `/data/history.md` 끝에 append한다. 원본 리포트(7번)는 상세하지만 매번 전체를 프롬프트에 넣기엔 무겁고, `action-log`/`proposals.json`은 구조화 데이터라 "왜 그랬는지" 맥락이 약하다 — 이 파일은 주당 몇 줄만 쌓이므로 몇 년치가 쌓여도 수십 KB 수준이라 **매번 전체를 프롬프트에 그대로 넣을 수 있다**. 다음 주 리포트/spec 생성 시 이 파일 전체를 함께 입력해, "이미 시도했던 개선과 그 결과"를 AI가 참고하고 같은 진단·같은 제안을 반복하지 않도록 한다. 21일 쿨다운이 끝난 액션의 결과도 해당 주 항목에 갱신한다.
9. 이 단계에서는 코드/콘텐츠를 건드리지 않음 — 사람이 읽고 판단

**산출물**: `scripts/generate-report.ts`, `scripts/classify-intent.ts`, `.github/workflows/weekly-report.yml`

#### 2-1. 트래픽 정체 감지 & 전략 재검토

1. **정체 감지**: 매주 최근 4주 오가닉 세션/클릭 추이를 계산해 `/data/processed/trend.json`에 누적. "4주 연속 전주 대비 +5% 미만" 또는 "클릭수 하락 추세"가 감지되면 정체 상태로 플래그
2. **SEO 반영 시차 쿨다운 (필수)**: `action-log.json`의 각 액션에 대해 **실행 후 21일이 지나지 않은 변경은 "아직 효과 미반영"으로 간주**하고 실패로 판단하지 않음 — 이 21일 쿨다운 규칙은 아래 2-2(타이틀 A/B 테스트)에서도 그대로 재사용됨
3. **전략 재검토 리포트 (정체 감지 시에만 자동 트리거)**: `action-log.json`(21일 쿨다운 지난 것만) + 트래픽 추이를 Sonnet에 전달해 "무엇을 했는데도 왜 안 늘었는지" 분석
4. 원인을 구조적으로 나눠 제시: 콘텐츠 문제 / 키워드 선정 문제 / 기술적 문제(색인 누락, CWV) / 경쟁 심화 / 시즌성
5. 대안 전략까지 함께 제안 (예: "기존 tool 개선에 집중", "타겟 키워드 재설정")
6. 자동 실행 없이 사람에게 전달

**산출물**: `scripts/detect-stagnation.ts`, `scripts/generate-strategy-review.ts`, `.github/workflows/strategy-review.yml`

#### 2-2. 타이틀/설명 순차 A/B 테스트 자동화 (완전 자동화)

텍스트 메타데이터 변경이라 코드 생성보다 리스크가 훨씬 낮아, 생성부터 배포·비교까지 전 과정을 자동화한다.

1. 매주 리포트에서 CTR 최하위 N개 페이지를 자동 선정
2. Claude가 title/description 여러 버전을 생성. **가드레일**: 핵심 키워드/tool명 유지, 과장·단정적 표현("1위", "최고", "100% 정확") 금지, SERP 노출 길이 제한 준수
3. 후보 중 하나를 골라 커밋 → Phase 0 CI/CD로 자동 배포
4. `action-log.json`에 기록 (2-1의 21일 쿨다운 규칙 적용)
5. 21일 경과 후 자동으로 이전 CTR과 비교: 개선 → 유지, 악화/무변화 → 다음 후보 버전으로 자동 교체
6. 페이지당 최대 3회 시도 — 그래도 개선이 없으면 자동 시도를 멈추고 사람에게 플래그
7. 승인 절차 없이 진행하되, 매주 리포트에 "진행 중인 타이틀 실험" 섹션으로 사후 가시성 확보

**산출물**: `scripts/generate-title-variant.ts`, `scripts/run-title-experiment.ts` (2-1의 `detect-stagnation.ts` 쿨다운 로직 재사용)

---

### Phase 3 — 용어사전(Glossary) 자동 생성

> 원래 블로그 자동 포스팅 파이프라인이었으나, 세션 논의로 제외하고 훨씬 가벼운 Glossary로 대체했다. 블로그 파이프라인 자체를 완전히 포기한 건 아니고, Phase 1-2 데이터로 "콘텐츠 부족"이 실제 원인으로 확인되고 Glossary만으로는 부족하다고 판단될 때 재검토한다.

- **목적**: "JSON이란?", "Base64란?" 같은 정의형 콘텐츠. 트렌드를 좇지 않는 완전 정적 콘텐츠라 한 번 만들면 거의 영구적으로 유지되고, `DefinedTerm` 스키마로 리치 결과 노출도 가능. Tool 페이지들을 서로 연결하는 내부링크 허브 역할
- 블로그와 달리 트렌드 추적/원본성 체크/기술정확성 검증 같은 무거운 장치가 불필요 — 사실 기반 정의라 소스가 명확함
- **파이프라인**: Tool 키워드 갭 분석에서 용어 후보 추출 → Claude가 초안(한/영) 작성 → 마크다운/`DefinedTerm` 스키마 유효성 규칙 검사 → PR 생성 → 사람 승인 → 배포
- 최초 인프라(`/content/glossary/{lang}/{term}.mdx` 콘텐츠 레이어, 라우팅, 스키마 컴포넌트)는 "완전 신규 콘텐츠 타입 추가"이므로 Phase 4와 동일하게 harness로 사람과 논의해서 구축 — 이후 반복 생성만 자동화 파이프라인 대상

**산출물**: `scripts/generate-glossary-entry.ts`, `.github/workflows/weekly-glossary-publish.yml`, `/content/glossary/{lang}/*.mdx`

---

### Phase 4 — 기존 페이지 개선 / 신규 tool 리서치 (spec 생성까지만)

> AI는 코드를 직접 생성하지 않는다. 데이터 기반으로 "무엇을, 왜 바꿔야 하는지"에 대한 **상세 spec 문서**까지만 만들고, 실제 구현은 사람이 harness 세션에서 진행한다(CLAUDE.md rule 17과 동일 원칙).

> **모든 제안에 근거 명시 필수**: 이 phase가 생성하는 모든 spec(개선/신규 tool/신규 카테고리/Programmatic SEO)은 "무엇을 만들지"뿐 아니라 **"왜 이게 필요하다고 판단했는지"**를 반드시 함께 담는다 — 어떤 GSC 쿼리/트렌드 데이터/CTR/이탈률/키워드 검색량을 근거로 했는지 구체적으로 명시한다. 근거를 명시할 수 없는 제안은 애초에 spec으로 만들지 않고 리포트에서 제외한다.

> **중복 제안 방지 — `/data/proposals.json` 대조 필수**: spec을 새로 생성하기 전에 반드시 `/data/proposals.json`(제안 ID별 최초 제안일/상태)을 먼저 확인한다. 같은 문제(같은 페이지·같은 유형)에 대해 `pending` 상태인 제안이 이미 있으면 spec을 다시 만들지 않고, 주간 리포트에는 "N주째 대기 중" 한 줄 리마인더만 표시한다 — 그렇지 않으면 사람이 아직 검토도 안 했는데 매주 같은 내용을 새로 생성해서 AI 비용과 리포트 분량만 늘어난다. 새 제안이면 spec 생성 후 `proposals.json`에 `pending`으로 기록하고, 사람이 harness로 실제 구현하면 다음 리포트 주기에 `implemented`로 갱신한다. 명시적 "거절" 처리는 v1에서는 자동화하지 않는다 — 사람이 계속 무시하면 리마인더로만 남는 정도로 충분하다.

> **`/data/history.md` 참고 필수**: `proposals.json`이 "정확히 같은 제안"을 막는 기계적 대조라면, `history.md`(Phase 2 8번 참고 — 주차별 압축 요약)는 "이미 시도해봤던 접근과 그 결과"까지 감안하도록 spec 생성 프롬프트에 전체 내용을 함께 입력한다. 예: 지난달 이미 FAQ 보강을 시도했는데 CTR 개선이 없었다면, 이번 주 spec은 같은 방향을 반복 제안하지 않고 다른 원인(제목/스니펫 등)을 우선 검토하도록 한다.

1. Phase 2 리포트 기반으로 CTR/이탈률이 나쁜 페이지 후보를 추출
2. AI가 **개선 spec**을 작성: 무엇을 어떻게 바꿀지, 근거 데이터(어떤 쿼리/CTR/이탈률 때문인지), title/description/콘텐츠 구조 제안(한/영 모두)
3. **신규 tool 리서치 — SGE(AI Overview) 회피 우선순위 적용 (규칙 목록 우선 + AI는 애매한 경우만)**: 단위 변환, 진법 변환, 해시/인코딩 디코드 같은 알려진 zero-click 패턴은 규칙 목록으로 가중치 하향, 파일 업로드/다운로드·여러 파일 비교처럼 인터랙션이 필요한 아이디어에 가중치. 통과한 후보는 코드가 아니라 `docs/screens/{화면명}.md` 초안 형태의 **신규 tool spec**을 생성
4. **신규 카테고리 제안 (트렌드 기반)**: 신규 tool 후보를 리서치하는 과정에서, 기존 4개 카테고리(개발자/맥주/여행/육아) 중 어디에도 자연스럽게 속하지 않지만 최신 검색 트렌드(Google Trends 급상승, 키워드 검색량 증가 등)로 볼 때 뚜렷한 기회가 보이면, tool 하나가 아니라 **신규 카테고리 자체**를 제안 항목으로 포함한다. 신규 카테고리는 tool 추가보다 훨씬 큰 스코프 변경(CLAUDE.md rule 17 기준)이므로, spec에는 일반 신규 tool spec보다 더 많은 근거를 담는다: 왜 기존 카테고리로 흡수할 수 없는지, 트렌드/검색량 근거, 최소 몇 개 tool로 카테고리를 시작할 수 있는지, 예상 disclaimerType까지 포함
5. **Programmatic SEO 후보도 동일 흐름**: 검색 의도별 변형 페이지(JPG→PNG, PNG→JPG 등) 후보에 대해 기존 페이지와 콘텐츠 유사도가 70% 이상이면 spec 자체를 생성하지 않음(가드레일). 통과한 것만 "이 페이지만의 차별화 콘텐츠 계획"을 담은 spec 작성
6. 모든 spec은 주간 리포트에 "이번 주 개선/신규 제안" 섹션으로 포함되어 Slack/이메일로 전달 — 신규 카테고리 제안이 있는 주는 별도로 눈에 띄게 표시한다
7. 사람이 마음에 드는 spec을 골라 실제 Claude Code 세션에서 `/harness` 워크플로우로 구현 → PR → 승인 → 배포 (Phase 0 CI/CD 재사용). tool의 경우 테스트 게이트 통과가 승인의 전제조건
8. **FAQ + SoftwareApplication/WebApplication 스키마**: 자동 코드생성 스크립트로 별도로 두지 않고, 사람이 harness 세션에서 spec을 구현할 때 함께 생성. **단, `aggregateRating`(평점)은 넣지 않는다** — 진짜 평점 데이터를 관리할 백엔드가 없고, 가짜 평점은 Google 구조화 데이터 정책 위반 리스크

**산출물**: `scripts/generate-improvement-spec.ts`, `scripts/generate-tool-research-spec.ts`, `scripts/check-page-similarity.ts`, `scripts/check-proposal-duplicate.ts`, `/data/proposals.json`

---

## 3. Tool 기능 검증 자동화

블로그는 틀려도 글 하나로 끝나지만, **tool은 결과가 틀리면 사용자가 잘못된 값을 그대로 신뢰하고 쓰게 되는 문제**라 리스크 성격이 다르다. 단, Phase 4가 "spec까지만" 생성하고 실제 코드는 사람이 harness에서 작성하므로, 아래 게이트는 **사람이 만든 PR에 그대로 적용되는 기존 CI 체계**다.

### 3-1. 기능 정확성 검증 (Unit Test)
- 계산기/변환기 등은 **"입력값 → 정답값" 쌍(golden test set)**을 Jest로 자동 검증
- 신규 tool 구현 시 로직 코드와 테스트 코드를 반드시 함께 작성 (기존 TDD 원칙, CLAUDE.md rule 5)
- 엣지 케이스(0, 음수, 소수점, 빈 입력, 특수문자, 대용량 입력 등) 커버 필수
- 테스트 코드가 없는 tool PR은 자동 반려

### 3-2. 실제 동작 검증 (E2E 대체 — Playwright 제외)
- Playwright 전체 도입은 제외(브라우저 설치·캐싱·CI 분당 비용 대비 효용 낮음). 대신:
  - 하드코딩된 href/링크를 잡는 lint 규칙 검토 (이번 세션에서 고친 404 링크 버그가 대표 사례)
  - TypeScript strict 모드로 상당수의 연결 오류를 컴파일 타임에 방지
- 파일 업로드형 tool처럼 실사용 흐름 검증이 꼭 필요한 경우가 늘어나면, 그때 핵심 tool 몇 개만 최소 범위로 재검토

### 3-3. 배포 후 검증 (스모크 테스트 + 런타임 모니터링)
- 배포 직후 핵심 tool 페이지 URL이 정상 응답하는지 확인하는 가벼운 fetch 기반 스모크 테스트 (브라우저 자동화 없이)
- **Sentry(무료 티어)를 에러 모니터링 주 채널로 사용**: Clarity는 세션 리플레이·행동 분석, Sentry는 JS 예외/API 실패/런타임 에러로 역할 분리
- 월간 정리(Section 6) 리포트에 "정기 회귀 테스트 실패 목록" 포함

### 3-4. CI 게이트 구조

```
사람이 harness로 PR 생성 (Phase 4 spec을 보고 직접 구현, 또는 자잘한 수정)
  → Unit Test 자동 실행 (Jest)
  → 실패 시 PR에 "테스트 실패" 코멘트 자동 남기고 머지 차단
  → 통과해야만 사람 승인 단계로 진입
  → 승인 후 배포 → 배포 직후 스모크 테스트
```

Phase 4가 spec만 생성하므로 AI가 직접 PR을 여는 경우는 없다 — 위 게이트는 사람이 harness로 만드는 모든 PR(spec 기반 구현이든 자잘한 수정이든)에 동일하게 적용된다.

---

## 4. 추가로 분석해야 할 항목

Phase 1(원인 분석)에 아래 항목들을 추가로 포함한다.

| 항목 | 설명 | 방법 |
|---|---|---|
| **검색 의도(Intent) 분류** | GSC 쿼리를 tool/tutorial/comparison/problem-solving으로 분류해 "Tool을 만들지, 기존 페이지를 고칠지" 자동 판단 | AI 분류 (Phase 2에 포함) |
| **Tool 사용 퍼널** | 검색 유입은 되는데 실제 tool 사용까지 이어지는지 (`tool_open`→`convert_click`→`download_click`) | GA4 커스텀 이벤트 (Phase 1에 포함) |
| **경쟁사/키워드 갭 분석** | 유사 tool 사이트가 받는 트래픽 키워드 중 우리 사이트에 없는 것 파악 | Google 자동완성, "People also ask", Google Trends 비교 (무료) |
| **검색 순위 추이** | 키워드별 순위가 오르는지 내리는지 7일/30일 단위로 추적 | GSC 일별 평균 position 데이터 활용 |
| **Core Web Vitals / 속도** | 페이지 속도는 구글 랭킹 요소. 변환기/계산기류 tool은 JS가 무거워지기 쉬움 | GSC "핵심 웹 지표" 리포트를 주간 리포트에 포함 |
| **깨진 링크 / 크롤링 이슈** | 404, 리다이렉트 체인, sitemap 누락은 SEO 직접 타격 | GSC "페이지 색인 생성" 리포트 + 자체 크롤링 체커 |
| **브랜드 검색량** | 브랜드명 자체 검색량 추이로 인지도/신뢰도 성장 여부 추적 | GSC 쿼리 필터링 (브랜드명 포함 쿼리) |

---

## 5. 추가 트래픽 증대 전략

> BitKitTools의 핵심 자산은 Tool 페이지이므로, 아래 전략도 **Tool 중심**을 우선으로 정렬했다. FAQ 스키마·용어사전·타이틀 A/B 테스트·Programmatic SEO는 이미 Phase 2-2/3/4에서 상세히 다뤘으므로 여기서는 다른 곳에 없는 항목만 남긴다.

- **Tool 페이지 콘텐츠 보강 (최우선)**: "사용법", "FAQ", "이런 경우에 사용하세요" 설명이 있는 페이지가 SEO에 유리. 스크린샷 추가 시 이미지 검색 유입도 발생
- **무료 디렉토리 등재 (백링크)**: Product Hunt, AlternativeTo, SaaSHub, Futurepedia 등 등재 후보를 AI가 매달 리서치해 리스트업 → 최종 제출은 사람이 진행
- 그 외 CTR/스키마/콘텐츠 전략은 → Phase 2-2(타이틀 A/B), Phase 3(용어사전), Phase 4(FAQ/스키마, Programmatic SEO) 참고

---

## 6. 사이트 비대화 방지 — Tool / 용어사전 Cut-off 기준

파이프라인이 계속 콘텐츠를 생성하면 사이트가 무거워지고, 저품질 페이지가 쌓이면 오히려 전체 사이트의 SEO 신뢰도를 깎아먹을 수 있다.

### Cut-off(정리) 대상 후보

| 기준 | 설명 |
|---|---|
| **트래픽 제로 페이지 (Tool)** | 게시 후 90일 이상 지났는데 GA4 세션이 거의 없는 tool 페이지 |
| **저성과 용어사전 항목** | 게시 후 일정 기간(예: 60일) 세션이 거의 없으면 정리 후보로 플래그 |
| **중복/유사 tool** | 기능이 거의 겹치는 tool이 여러 개 생겼을 때 — 통합하거나 하나로 리다이렉트 |
| **성능 대비 트래픽 낮은 tool** | 무거운 라이브러리를 쓰는데 사용자가 거의 없는 tool |
| **Core Web Vitals 악화 요인** | 특정 페이지가 전체 사이트 성능 점수를 깎고 있는 경우 |
| **품질 낮은 초기 자동생성 콘텐츠** | 파이프라인 초기에 생성됐지만 이후 기준으로 보면 품질이 낮은 항목 |

### 처리 프로세스 (자동화 + 사람 승인)

1. 매달 1회, 위 기준에 해당하는 페이지 후보 리스트를 AI가 자동 생성 (Phase 2 리포팅에 "정리 후보" 섹션으로 포함)
2. 사람이 리스트 검토 후 처리 방식 결정: 삭제+301 리다이렉트 / noindex 후 관찰 / 업데이트해서 재활용
3. 삭제/리다이렉트도 PR로 생성 → 사람 승인 → 자동 배포

---

## 7. 인프라 구성

```
GitHub Repo (bitkittools)
 ├─ prompts/
 │   ├─ report.md                    # Phase 2 주간 리포트용 Sonnet 프롬프트
 │   ├─ strategy-review.md            # 2-1 전략 재검토용 Sonnet 프롬프트 (21일 쿨다운 규칙 포함)
 │   ├─ title-variant.md              # 2-2 타이틀 A/B 후보 생성 프롬프트 (가드레일 포함)
 │   ├─ glossary-entry.md             # 용어사전 항목 생성 프롬프트
 │   ├─ improvement-spec.md           # 기존 페이지 개선 spec 생성 프롬프트
 │   └─ tool-research-spec.md         # 신규 tool spec 생성 프롬프트 (SGE 회피 규칙 포함)
 │
 ├─ .github/workflows/
 │   ├─ deploy.yml                    # Phase 0: main 브랜치 배포 + IndexNow 알림
 │   ├─ test-gate.yml                 # Phase 0: PR마다 Jest 테스트 게이트
 │   ├─ collect-data.yml               # Phase 1: 매일 데이터 수집 (GSC 4차원 포함)
 │   ├─ weekly-report.yml              # Phase 2: 주간 리포트 (정리 후보, 정체 감지, 타이틀 실험 현황 포함)
 │   ├─ weekly-glossary-publish.yml    # Phase 3: 주 1회 용어사전 발행 (한/영)
 │   ├─ lighthouse-ci.yml              # PR마다 성능 측정
 │   └─ monthly-pruning.yml            # 매달 정리(cut-off) 후보 리포트
 │
 ├─ scripts/
 │   ├─ notify-indexnow.ts          # 배포 시 변경 URL을 Bing/Yandex에 전송
 │   ├─ notify-gsc-reindex.ts       # 배포 시 GSC에 sitemap 재제출(ping)
 │   ├─ check-indexing-status.ts    # GSC urlInspection으로 색인 여부 추적
 │   ├─ collect-analytics.ts        # GA4/GSC(4차원)/Clarity API 호출
 │   ├─ process-analytics.ts        # raw → processed 가공
 │   ├─ log-action.ts               # 파이프라인 액션 기록
 │   ├─ classify-intent.ts          # GSC 쿼리 검색 의도 분류
 │   ├─ detect-stagnation.ts        # 트래픽 정체 감지 + 21일 쿨다운 판정 (title 실험도 재사용)
 │   ├─ generate-strategy-review.ts # 정체 시 전략 재검토 리포트 생성
 │   ├─ generate-report.ts          # Claude Sonnet으로 인사이트 + 아이디어 제안 생성
 │   ├─ generate-title-variant.ts   # 타이틀/설명 후보 생성 (가드레일 적용)
 │   ├─ run-title-experiment.ts     # 배포 → 21일 대기 → 비교 → 교체/유지 자동화
 │   ├─ generate-glossary-entry.ts  # 용어사전 항목 생성 (evergreen, DefinedTerm 스키마)
 │   ├─ generate-improvement-spec.ts    # 기존 페이지 개선 spec 생성 (코드 아님)
 │   ├─ generate-tool-research-spec.ts  # 신규 tool spec 생성 (코드 아님)
 │   ├─ check-page-similarity.ts    # Programmatic SEO 70% 유사도 가드레일
 │   ├─ check-proposal-duplicate.ts # spec 생성 전 proposals.json 대조 — 이미 pending인 제안은 재생성하지 않음
 │   ├─ check-broken-links.ts       # 깨진 링크/리다이렉트 체커
 │   ├─ find-pruning-candidates.ts  # 트래픽 낮은 페이지 탐지
 │   └─ run-smoke-tests.ts          # 배포 직후 핵심 tool URL 응답 확인 (fetch 기반, 브라우저 자동화 없음)
 │
 ├─ tests/
 │   └─ unit/{tool}.test.ts        # Jest — golden test set + 엣지 케이스
 │
 ├─ data/
 │   ├─ raw/                       # 원본 API 응답 (최근 60일만 유지, 자동 삭제)
 │   ├─ processed/                 # AI 분석 입력용 가공 데이터 + 장기 집계 요약 (trend.json 등)
 │   ├─ reports/{연도}/{날짜}.md   # 생성된 주간/전략 리포트, 개선/신규 spec — 연도별 폴더로 분리
 │   ├─ proposals.json             # 제안 ID별 최초 제안일/상태(pending/implemented) — 중복 spec 생성 방지
 │   ├─ history.md                 # 주차별 3~5줄 압축 요약(지표/특이사항/시도한 개선/결과) — 매주 append, 용량 작아 항상 전체를 프롬프트에 포함
 │   └─ action-log-{연도}.json     # AI 결정 메타데이터만 기록 (이유/목표/실험ID/대상 쿼리 + 참조 커밋 SHA), 연도별 분리
 │
 ├─ content/
 │   └─ glossary/
 │       ├─ en/{term}.mdx
 │       └─ ko/{term}.mdx
 │
 └─ app/                        # 기존 Next.js App Router 구조 (next-intl 라우팅 그대로 유지)
```

> **프롬프트 관리 원칙**: 모든 AI 프롬프트는 스크립트 안에 문자열로 박아두지 않고 `prompts/*.md`로 분리. 버전/변경 이력은 별도 시스템 없이 Git 커밋 히스토리가 담당. 대표 사례 몇 개를 골든 샘플로 남겨 프롬프트 수정 시 비교하는 가벼운 방식으로 충분.

**실행 환경**: 별도 서버 불필요. 전부 **GitHub Actions 크론** 위에서 Node.js 스크립트로 실행 → 결과를 repo에 커밋하거나 PR/리포트 생성 → 기존 EC2/Nginx는 "정적 파일 서빙"만 담당.

**필요한 GitHub Secrets 목록**:
| Secret | 용도 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 호출 |
| `GA4_SERVICE_ACCOUNT_JSON` | GA4 Data API 인증 |
| `GSC_SERVICE_ACCOUNT_JSON` | Search Console API 인증 |
| `CLARITY_API_KEY` | Clarity Data Export |
| `SENTRY_DSN` | 에러 모니터링 (무료 티어) |
| `INDEXNOW_KEY` | Bing/Yandex IndexNow 인증키 (무료 발급) |
| `SLACK_WEBHOOK_URL` (선택) | 리포트 발송 |
| `EC2_SSH_KEY`, `EC2_HOST` | 배포 |

---

## 8. 비용 정리 (월 예상)

| 항목 | 방법 | 최소 | 평균 | 최대 |
|---|---|---|---|---|
| CI/CD | GitHub Actions (Public 무제한 / Private 월 2,000분 무료) | $0 | $0 | $0 |
| 데이터 수집 | GA4/GSC/Clarity API 무료 쿼터 | $0 | $0 | $0 |
| 주간 분석 리포트 | Claude Sonnet 5, 주 1회 | 340원 | 640원 | 약 1,500원 |
| 타이틀 A/B 후보 생성 | Claude Sonnet, 주 1회(가드레일 검토 포함) | 100원 | 250원 | 약 500원 |
| 용어사전 텍스트 생성 | Claude Haiku 4.5, 주 1회(한/영) | 200원 | 400원 | 약 1,000원 |
| 개선/신규 tool spec 생성 | Claude Sonnet, Phase 4 진행 시에만 발생(코드 생성 없어 비용 낮음) | 0원 | 150원 | 약 500원 |
| 에러 모니터링 | Sentry 무료 티어 | $0 | $0 | $0 |
| 데이터 저장 | Git repo 내 JSON/MDX 파일 | $0 | $0 | $0 |
| **합계** | | **약 640원** | **약 1,440원** | **약 3,500원** |

> 블로그 파이프라인(Haiku 텍스트 생성 + Unsplash 이미지 + 원본성 체크 재생성) 제외로 v1 대비 비용이 다소 낮아졌다. Phase 4가 코드가 아닌 spec만 생성해 토큰 사용량도 줄었다.

---

## 9. 이번 작업의 실제 착수 순서 (v2 확정)

**1개월차 — "왜 안 크는지 알기"**
1. Phase 0: GitHub Actions 배포 워크플로우(+ IndexNow 훅, GSC ping) + Jest 테스트 게이트 구축
2. Phase 1: 데이터 수집 스크립트 (GA4/GSC 4차원/Clarity + Tool 사용 퍼널 이벤트 + 액션 로그) — raw/processed 구조로 저장
3. Phase 2: 주간 리포트 자동화 (검색 의도 분류, 국가/기기별 CTR 편차, 순위 추이, 5개 원인 영역 분류, 추가 아이디어 제안, 정리 후보, 트래픽 정체 감지+전략 재검토 포함)

**2개월차 — "현재 자산 개선"**
4. Phase 2-2: 타이틀/설명 A/B 테스트 완전 자동화 (21일 쿨다운 재사용)
5. Phase 4: 개선/신규 tool spec 자동 생성 (코드 생성 없음) — 사람이 마음에 드는 spec을 골라 직접 harness로 구현
6. 확장 자동화: Lighthouse CI, 깨진 링크 체커

**3개월차 — "확장"**
7. Phase 3: 용어사전(Glossary) 자동 생성 (최초 콘텐츠 인프라는 harness로 사람과 함께 구축, 이후 반복 생성 자동화)
8. Phase 4 확장: Programmatic SEO 후보에 대해 70% 유사도 가드레일 통과 시 spec 생성
9. 월간 정리(cut-off) 자동화: `find-pruning-candidates.ts` + `monthly-pruning.yml`

> 보류: 블로그 자동 포스팅 전체 파이프라인, 경쟁사 페이지 구조 분석 스크립트, 경량 피드백 위젯(Upstash), 공유 결과카드 컴포넌트, Playwright E2E, 자체 벤치마크 콘텐츠, GEO 최적화(llms.txt), 오픈소스 CLI 공개, Changelog 페이지 — 필요 시 추후 재검토

---

## 10. 착수 전 확인할 우려 사항

| 우려 | 내용 | 대응 |
|---|---|---|
| Clarity Data Export API 제공 범위 | 세션 리플레이/히트맵은 API로 안 나오고 집계 지표만 제공될 수 있음 | 착수 전 API 문서로 실제 제공 필드 확인 |
| GSC `urlInspection` 쿼터 | 계정당 일일 약 2,000회 제한 | 신규/변경 페이지만 검사하도록 스코프 유지 |
| Anthropic API 과금 폭주 위험 | 워크플로우 버그(재시도 폭주 등)로 예상보다 호출량 증가 가능 | Anthropic 콘솔에 월 지출 한도(spend limit) 설정 |
| 타이틀 실험 자동 커밋 | 승인 없이 main에 직접 커밋·배포됨 | 커밋 메시지 컨벤션 분리(`chore(title-experiment): ...`), branch protection 봇 예외 확인 |
| 데이터 커밋의 배포 트리거 오발 | raw/processed 데이터 커밋마다 배포 워크플로우가 불필요하게 돌 수 있음 | `deploy.yml` 트리거에서 `/data/**` `paths-ignore` 처리 |
| 서비스 계정 권한 과다 부여 | GA4/GSC 서비스 계정에 필요 이상 권한 부여 위험 | 최소 권한 원칙(GA4는 뷰어 등) |
| Public repo 데이터 노출 | `action-log.json`/processed 데이터가 경쟁자에게도 공개될 수 있음 | Private 유지 시 Actions 분당 한도 관리 |
| 기대치 정렬 | 이 파이프라인은 "제안 자동화"이지 "자동 성장"이 아님 — 실제 구현은 항상 사람이 harness로 진행 | 착수 전 이 기대치를 다시 확인 |
| 자동 생성 콘텐츠 품질 드리프트 | 매주 자동 생성되는 한/영 콘텐츠(용어사전, 타이틀)를 매번 검수 안 할 가능성 | 월 1회 정도 샘플 검수 루틴 권장 |

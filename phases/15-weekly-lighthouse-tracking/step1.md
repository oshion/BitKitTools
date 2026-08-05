# Step 1: report-integration

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step 산출물과 기존 리포트 생성 흐름을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/collect-lighthouse.ts`, `/scripts/lib/lighthouseThreshold.ts` (이전 step 산출물)
- `/scripts/generate-report.ts` (이 파일의 프롬프트 구성 방식, `data/reports/{연도}/{날짜}.md` 저장 로직을 그대로 따른다)
- `/.github/workflows/weekly-report.yml` (여기에 새 스텝을 추가한다)
- `/scripts/lib/formatSlackBlocks.ts` (`## ` 제목 단위로 섹션을 나눠 Slack 블록으로 변환하는 로직 — 이 step에서 추가하는 섹션도 자동으로 Slack에 노출됨을 이해하라)

## 작업

### 1. `scripts/generate-report.ts` 수정

- 실행일 기준 `data/processed/lighthouse-{YYYY-MM-DD}.json`을 읽는다(없으면 — 아직 이 step이 처음 실행되기 전이거나 `collect-lighthouse.ts`가 실패한 경우 — 성능 섹션 없이 리포트를 계속 생성한다, 에러로 취급하지 않는다).
- 파일이 있으면 `findScoresBelowThreshold(scores, 90)`(이전 step의 순수 함수, threshold는 여기서 90으로 명시 전달)로 미달 항목을 계산한다.
- **미달 항목이 하나라도 있으면, AI 프롬프트에 맡기지 않고 리포트 본문에 결정론적으로(코드로 직접) `## ⚠️ 성능 경고` 섹션을 추가한다** — AI가 프롬프트 지시를 놓쳐서 경고가 누락되는 걸 방지하기 위함이다. 형식 예:
  ```markdown
  ## ⚠️ 성능 경고

  다음 페이지가 Lighthouse 90점 미만입니다:
  - /beer/bac-calculator/: performance 78점
  - /baby/growth-percentile/: accessibility 85점
  ```
  이 섹션은 AI 호출 전에 미리 만들어서 최종 리포트 문자열에 삽입한다(`===REPORT===`로 받은 AI 응답 뒤나 적절한 위치에 이어붙이기).
- 미달 항목이 없으면 이 섹션 자체를 만들지 않는다(불필요한 노이즈 방지).
- **AI 프롬프트에도 원본 점수 데이터를 포함**시켜서, AI가 "추가 아이디어 제안" 섹션 등에서 성능 개선을 근거 있게 언급할 수 있게 한다(예: 특정 페이지 성능이 낮으면 원인 후보를 짧게 짚어주는 식). 리포트 작성 지시 목록에 항목을 하나 추가하라: "Lighthouse 점수 데이터가 있으면 성능이 낮은 페이지의 원인 후보(무거운 JS, 이미지 최적화 부족 등)를 짧게 언급"

### 2. `.github/workflows/weekly-report.yml` 연동

"Run report generation" 스텝 **이전에** 새 스텝을 추가한다(리포트 생성이 이 데이터를 읽어야 하므로 순서가 중요):
```yaml
      - name: Collect Lighthouse scores
        run: npx tsx scripts/collect-lighthouse.ts
```
이 스텝은 특별한 시크릿이 필요 없다(운영 사이트를 공개 URL로 직접 감사하는 것이므로).

기존 "Commit report data" 스텝의 `git add` 대상에 `data/processed/lighthouse-*.json`을 추가한다 — Phase 13에서 이미 존재 여부를 체크하는 for 루프 구조로 되어 있으니 그 목록에 항목만 추가하면 된다.

### 3. `deploy.yml` 트리거 오발 방지 재확인

새로 추가되는 `data/processed/lighthouse-*.json` 경로가 `deploy.yml`의 `paths-ignore: data/**` 패턴에 이미 포함되는지 확인하라(포함될 것이다 — 확인만 하고 수정하지 마라).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

`data/processed/lighthouse-{date}.json`이 없는 상태에서 `generate-report.ts`를 실행해도(단, `ANTHROPIC_API_KEY` 등 다른 필수 조건은 이 step의 검증 범위 밖이니 기존 방식대로 lint/build로 문법 확인 수준까지만) 크래시하지 않는 구조인지 코드 리뷰로 확인한다. **이 step에서도 로컬 Chrome 실행 관련 명령을 시도하지 마라**(step 0과 동일한 이유).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 성능 경고 섹션이 AI 판단이 아니라 코드로 결정론적으로 삽입되는가?
   - 미달 항목이 없을 때 불필요한 섹션을 만들지 않는가?
   - `lighthouse-{date}.json`이 없을 때 리포트 생성 자체가 실패하지 않는가?
   - `weekly-report.yml`에서 "Collect Lighthouse scores"가 "Run report generation"보다 먼저 실행되는가?
   - `git add` 목록에 새 데이터 경로가 안전하게(존재 여부 체크와 함께) 추가됐는가?
3. 이 step이 phase의 마지막 step이므로, 전체 완료 후 `npm run lint && npm test && npm run build`를 한 번 더 실행해 phase 전체가 정상 동작하는지 최종 확인한다.
4. 결과에 따라 `phases/15-weekly-lighthouse-tracking/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 성능 경고 섹션 삽입 여부를 AI 프롬프트 지시에만 의존하지 마라 — 반드시 코드로 결정론적으로 보장하라.
- 로컬에서 Chrome을 실행하는 명령을 시도하지 마라.
- `deploy.yml`을 불필요하게 수정하지 마라(확인만 하고 실제로 안 걸러지는 게 확인될 때만 수정).
- 기존 테스트를 깨뜨리지 마라.

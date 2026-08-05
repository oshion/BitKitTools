# Step 1: lighthouse-ci

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트 구조와 이전 step의 결과물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.github/workflows/test-gate.yml` (이전 step에서 "Check broken internal links" 스텝이 추가됨 — 이 뒤에 이번 step의 스텝을 추가한다)
- `/src/lib/config/tools-config.ts` (대표로 측정할 페이지 URL 목록을 뽑기 위해 카테고리/슬러그 구조 확인)
- `bitkittools-ai-automation-roadmap.md`의 "3-3. 배포 후 검증" 및 "4. 추가로 분석해야 할 항목" 중 Core Web Vitals 관련 부분

## 배경

`output: 'export'`(`next.config.mjs`) 정적 사이트이므로 Lighthouse CI는 빌드 산출물(`out/`)을 로컬 정적 서버로 띄워 감사(audit)한다. **지금 단계에서는 게이트(기준 미달 시 PR 실패)가 아니라 정보성 리포트로만 동작시킨다** — 아직 우리 사이트의 실제 점수 기준선(baseline)이 없는 상태에서 임의의 임계값으로 PR을 막으면 오탐이 잦을 수 있다. 기준이 안정화되면 이후에 게이트로 격상하는 걸 별도로 검토한다.

## 작업

### 1. 최신 공식 사용법 확인 — 반드시 먼저 조사할 것

`@lhci/cli`(Lighthouse CI)의 최신 공식 문서(GitHub `GoogleChrome/lighthouse-ci` 또는 npm 페이지)를 WebFetch 등으로 확인해서 다음을 파악하라:
- 현재 안정적으로 사용 가능한 `@lhci/cli` 최신 버전과 기본 사용법(`lhci autorun`)이 조사 시점 기준으로 여전히 유효한지
- `staticDistDir` 옵션으로 정적 빌드 산출물을 직접 감사할 수 있는지, 아니면 별도로 서버를 띄워야 하는지
- `upload.target: 'temporary-public-storage'`가 여전히 계정 없이 사용 가능한 옵션인지(공식 문서에서 확인)

조사 결과와 최종 설정 근거를 설정 파일 상단 주석에 남겨라.

### 2. 설정 파일 작성

프로젝트 루트에 `.lighthouserc.json` (또는 조사 결과 권장되는 형식)을 작성한다:
- `ci.collect`: `staticDistDir: './out'` 사용. 감사 대상 URL은 전체 페이지가 아니라 **대표 페이지 4~6개**로 제한한다(카테고리별 대표 tool 1개씩 + 홈페이지) — 매 PR마다 16개 이상 tool 페이지를 전부 감사하면 CI 시간이 과도하게 늘어난다. `trailingSlash: true` 규칙에 맞는 URL 형식(`/beer/bac-calculator/index.html` 등 `staticDistDir` 모드의 실제 요구 형식은 공식 문서로 확인)을 사용하라.
- `ci.assert`: 실패 조건을 걸지 않는다(이번 단계는 정보성 리포트) — `assertions`를 비워두거나, 명시적으로 항상 통과하도록 구성한다. Lighthouse의 PWA 관련 카테고리는 이 사이트가 PWA가 아니므로 감사 대상에서 제외하는 프리셋(`lighthouse:no-pwa` 등, 조사 결과에 따라 실제 존재하는 프리셋명 사용)을 검토하라.
- `ci.upload`: `target: 'temporary-public-storage'`로 설정해 계정 없이 리포트 URL을 받는다.

### 3. `package.json`

`@lhci/cli`를 devDependencies에 추가한다(`npm install --save-dev @lhci/cli`).

### 4. `.github/workflows/test-gate.yml` 연동

"Check broken internal links" 스텝 뒤에 추가한다:
```yaml
      - name: Lighthouse CI
        run: npx lhci autorun
        continue-on-error: true
```
`continue-on-error: true`를 명시해, 이 스텝 자체가 실패(예: 일시적 네트워크 문제로 업로드 실패)해도 PR 전체를 막지 않도록 한다 — 정보성 리포트라는 설계 의도와 일치시킨다.

## Acceptance Criteria

```bash
npm run build
npx lhci autorun
npm run lint
npm test
npm run build
```

로컬에서 `npx lhci autorun`이 실제로 실행되어 감사 결과(및 가능하다면 리포트 URL)를 출력하는지 확인한다. 완전한 CI 환경 재현은 로컬에서 어려울 수 있으므로, 최소한 설정 파일 문법 오류 없이 lhci가 실행을 시도하고 각 대표 페이지에 대해 결과를 리턴하는지까지 확인하면 충분하다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 최신 공식 문서를 실제로 조사했는가(추측으로 설정 파일을 작성하지 않았는가)? 조사 근거가 주석에 남아있는가?
   - 지금 단계에서 게이트가 아니라 정보성 리포트로만 동작하는가(assert 실패로 PR을 막지 않는가)?
   - 대표 페이지 몇 개로만 범위를 제한해 CI 시간을 과도하게 늘리지 않았는가?
   - `continue-on-error: true`로 이 스텝의 실패가 PR 전체를 막지 않도록 했는가?
3. 이 step이 phase의 마지막 step이므로, 전체 완료 후 `npm run lint && npm test && npm run build`를 한 번 더 실행해 phase 전체가 정상 동작하는지 최종 확인한다.
4. 결과에 따라 `phases/14-lighthouse-and-broken-links/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 조사 없이 예전 기억이나 추측으로 `@lhci/cli` 설정 문법을 작성하지 마라 — 반드시 최신 공식 문서를 확인하라.
- 이 단계에서 성능 점수 기준으로 PR을 실패시키는 게이트를 만들지 마라(다음에 별도로 논의할 사항).
- 모든 tool 페이지를 다 감사하지 마라 — CI 시간 낭비다. 대표 페이지로 제한하라.
- 기존 테스트를 깨뜨리지 마라.

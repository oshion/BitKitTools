# Step 0: broken-link-checker

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 빌드 산출물 구조와 CI 게이트 관례를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/next.config.mjs` (또는 `.js`/`.ts`) — `output: 'export'`, `trailingSlash: true` 확인
- `/.github/workflows/test-gate.yml` (이 워크플로우의 build 스텝 뒤에 이번 step에서 만드는 체크를 연동한다)
- `/scripts/notify-indexnow.ts` (정규식 기반 HTML/XML 파싱 스타일 참고 — 이 프로젝트는 무거운 HTML 파서 라이브러리를 추가하지 않고 정규식으로 충분히 처리하는 관례를 따른다)

## 배경

`npm run build`는 `output: 'export'` + `trailingSlash: true` 설정에 따라 각 라우트를 `out/{경로}/index.html` 형태로 생성한다(예: `/beer/bac-calculator/` → `out/beer/bac-calculator/index.html`). 정적 에셋(`favicon.ico`, `robots.txt`, `sitemap.xml` 등 확장자가 있는 파일)은 `out/{경로}` 그대로 존재한다. 이번 세션 초반에 실제로 `json-to-sql↔json-formatter`, `homebrew→hydrometer` 등 하드코딩된 잘못된 내부 링크 버그가 있었던 적이 있다 — 이 체커는 그런 종류의 회귀를 PR 단계에서 자동으로 잡기 위한 것이다.

## 작업

`scripts/check-broken-links.ts`를 작성한다.

### 핵심 로직 (순수 함수로 분리 — `scripts/lib/checkBrokenLinks.ts`)

```typescript
export interface BrokenLink {
  /** out/ 기준 상대 경로의 HTML 파일 (링크가 발견된 페이지) */
  sourceFile: string
  /** 깨진 것으로 판단된 href 원본 값 */
  href: string
}

/**
 * htmlFiles: out/ 디렉토리 상대 경로 → HTML 문자열 내용의 Map.
 * existingPaths: out/ 안에 실제로 존재하는 모든 파일의 상대 경로 Set
 *   (예: "beer/bac-calculator/index.html", "favicon.ico" 등 — 슬래시는 '/'로 통일).
 * 두 인자 모두 파일시스템에 의존하지 않는 순수 데이터라 유닛 테스트가 쉽다.
 */
export function findBrokenLinks(
  htmlFiles: Map<string, string>,
  existingPaths: Set<string>
): BrokenLink[]
```

**href 추출**: 각 HTML 문자열에서 `<a href="...">` 패턴을 정규식으로 추출한다(`href='...'` 홑따옴표 형태도 처리).

**대상에서 제외할 href**:
- `#`로 시작하는 순수 앵커(`#section`)
- `mailto:`, `tel:`, `javascript:` 스킴
- 외부 링크 — `http://` 또는 `https://`로 시작하되 호스트가 `bitkittools.com`(또는 `www.bitkittools.com`)가 아닌 경우. 외부 URL은 네트워크 호출 없이 스킵한다(CI 안정성 — 서드파티 사이트 다운/레이트리밋으로 우리 PR이 막히면 안 됨).
- `bitkittools.com` 자체 도메인의 절대 URL은 내부 링크로 취급해 아래 검증 대상에 포함한다(호스트 부분을 제거하고 경로만 비교).

**내부 경로 해석 규칙** (`href` → `existingPaths`에서 찾을 키로 정규화):
1. `?쿼리`, `#해시` 부분은 제거하고 경로만 사용한다.
2. 경로의 마지막 세그먼트에 `.`(확장자)이 있으면 정적 에셋으로 간주 — 경로 그대로(맨 앞 `/` 제거) `existingPaths`에서 찾는다.
3. 확장자가 없으면 라우트로 간주 — 끝에 슬래시가 없으면 붙이고, `{경로}index.html`을 `existingPaths`에서 찾는다 (예: `/beer/` → `beer/index.html`, `/` → `index.html`).
4. 위 규칙으로 못 찾으면 `BrokenLink`로 기록한다.

**호출부(CLI)**: `out/` 디렉토리를 재귀적으로 스캔해 모든 `.html` 파일을 읽어 `htmlFiles` Map을 만들고, `out/` 안의 모든 파일 상대경로로 `existingPaths` Set을 만든 뒤 `findBrokenLinks`를 호출한다. `out/` 디렉토리가 없으면(빌드 전 상태) 명확한 에러 메시지와 함께 `process.exit(1)`.

**출력**: 발견된 `BrokenLink`를 전부 콘솔에 나열하고, 1개 이상이면 `process.exit(1)`(PR을 막는 게이트), 0개면 성공 메시지와 함께 정상 종료.

### `.github/workflows/test-gate.yml` 연동

기존 "Build" 스텝 뒤에 새 스텝을 추가한다:
```yaml
      - name: Check broken internal links
        run: npx tsx scripts/check-broken-links.ts
```

### 테스트

`scripts/lib/__tests__/checkBrokenLinks.test.ts`에서 `findBrokenLinks`를 다음 케이스로 검증한다:
- 정상적으로 존재하는 내부 링크는 통과
- 존재하지 않는 내부 링크는 `BrokenLink`로 기록
- 외부 도메인 링크는 검사 대상에서 제외
- `#anchor`, `mailto:`, `tel:` 링크는 제외
- 확장자 있는 정적 에셋 경로(`/favicon.ico` 등)와 트레일링 슬래시 라우트 경로(`/beer/` 등) 둘 다 올바르게 해석되는지
- 쿼리스트링/해시가 붙은 내부 링크(`/beer/bac-calculator/?ref=x`)도 경로만 추출해 올바르게 검증되는지

## Acceptance Criteria

```bash
npm run build
npx tsx scripts/check-broken-links.ts
npm run lint
npm test
```

빌드된 `out/`을 대상으로 실제로 실행해 현재 사이트에 깨진 내부 링크가 없는지(0개) 확인한다 — 만약 실제로 깨진 링크가 발견되면 그 결과를 그대로 두고 별도 버그로 보고하라(이 step에서 다른 파일의 링크를 임의로 고치지 마라 — 스코프 밖).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 외부 링크에 네트워크 호출을 하지 않는가?
   - 무거운 HTML 파서 패키지를 추가하지 않고 정규식 기반으로 처리했는가(프로젝트 관례)?
   - `trailingSlash: true` 규칙에 맞게 라우트/에셋 경로 해석이 정확한가?
   - 순수 함수(`findBrokenLinks`)와 파일시스템 접근(CLI 진입점)이 분리돼 테스트 가능한가?
3. 결과에 따라 `phases/14-lighthouse-and-broken-links/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 외부 URL에 실제 HTTP 요청을 보내지 마라 — CI 불안정의 원인이 된다.
- HTML 파서 라이브러리(cheerio 등)를 새로 추가하지 마라 — 정규식으로 충분하다.
- 이 step에서 실제로 발견된 깨진 링크를 몰래 고치지 마라 — 체커를 만드는 것만이 스코프다.
- 기존 테스트를 깨뜨리지 마라.

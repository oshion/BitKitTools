# Step 0: collect-lighthouse

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트 구조와 기존 관례를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.lighthouserc.json` (Phase 14에서 만든 PR용 설정 — `staticDistDir`로 로컬 빌드를 감사하는 방식. **이번 step은 이것과 다르게 운영 사이트(https://bitkittools.com)를 직접 감사한다** — 대표 페이지 목록은 이 파일과 동일하게 유지)
- `/scripts/lib/detectStagnation.ts`의 `readTrend`/`writeTrend` 함수 (파일 없으면 기본값 반환, 디렉토리 자동 생성하는 롤링 데이터 파일 관례 참고)
- `/package.json` (`@lhci/cli`가 이미 devDependencies에 있음 — Phase 14에서 설치됨)

## 배경 — 반드시 숙지할 것

**이 개발 PC(Windows, 회사 보안 정책 적용)는 headless Chrome 프로세스 실행이 내부 보안 정책(EDR/백신)에 의해 차단된다.** Phase 14에서 이걸 모르고 로컬에서 `npx lhci autorun`을 직접 실행하려다가 두 번이나 알 수 없는 이유로 멈췄고, 원인을 나중에야 파악했다(`.lighthouseci/`에 설정 파일만 생기고 실제 감사 결과가 전혀 생성되지 않음 — Chrome 실행 시점에서 막힘). **이번 step에서는 절대 같은 실수를 반복하지 마라 — 로컬에서 실제로 Chrome을 띄우는 명령을 실행하지 마라.**

## 작업

### 1. 최신 공식 문서로 `@lhci/cli collect` 명령 확인

`staticDistDir` 없이 **실제 URL 목록만으로 감사**하는 방법(`lhci collect --url=... --url=...` 또는 `.lighthouserc.json`과 별도의 설정 파일 방식)을 공식 문서(GoogleChrome/lighthouse-ci)로 확인하라. `lhci autorun`은 `upload`까지 포함된 전체 파이프라인이라 이번 용도(로컬 파일로 결과만 저장)엔 `lhci collect`만 쓰는 게 적합한지도 함께 확인하라.

### 2. `scripts/collect-lighthouse.ts` 작성

CLI 진입점(`npx tsx scripts/collect-lighthouse.ts`)이며, 내부적으로 `lhci collect`를 자식 프로세스로 실행한다(`child_process.execFileSync` 또는 `spawnSync` — 프로젝트 관례상 무거운 SDK 대신 직접 프로세스 실행).

**감사 대상 URL** (`.lighthouserc.json`과 동일한 5개, 운영 도메인으로 교체):
```
https://bitkittools.com/
https://bitkittools.com/developer/json-formatter/
https://bitkittools.com/travel/flight-delay-compensation/
https://bitkittools.com/beer/bac-calculator/
https://bitkittools.com/baby/growth-percentile/
```

**흐름**:
1. `lhci collect --url=<각 URL>`을 실행해 `.lighthouseci/lhr-*.json`에 원본 감사 결과를 생성한다(`numberOfRuns: 1`, `onlyCategories: performance,accessibility,best-practices,seo`, `chromeFlags: --no-sandbox --disable-gpu --disable-dev-shm-usage` — `.lighthouserc.json`과 동일 플래그 사용).
2. `.lighthouseci/` 안의 `lhr-*.json` 파일들을 읽어 각 파일의 `finalUrl`(또는 `requestedUrl`)과 `categories.{performance,accessibility,best-practices,seo}.score`(0~1 범위)를 추출한다.
3. 순수 함수로 분리한 임계값 판정 로직을 만든다(`scripts/lib/lighthouseThreshold.ts`):
   ```typescript
   export interface PageLighthouseScore {
     url: string
     performance: number // 0-100 정수로 반올림
     accessibility: number
     bestPractices: number
     seo: number
   }

   export interface FlaggedCategory {
     url: string
     category: 'performance' | 'accessibility' | 'bestPractices' | 'seo'
     score: number
   }

   /** score(0-100)가 threshold 미만인 (url, category) 쌍을 전부 반환 */
   export function findScoresBelowThreshold(
     scores: PageLighthouseScore[],
     threshold: number
   ): FlaggedCategory[]
   ```
   `threshold` 기본값은 호출부(다음 step)에서 **90**으로 넘긴다(이 함수 자체에 하드코딩하지 마라 — 나중에 조정 가능하게).
4. 결과를 `data/processed/lighthouse-{YYYY-MM-DD}.json`(실행일 기준, 날짜별 파일 — `trend.json`처럼 롤링 누적이 아니라 `processed/{date}.json`처럼 날짜별 스냅샷)에 저장한다:
   ```json
   {
     "date": "2026-08-12",
     "scores": [ { "url": "...", "performance": 87, "accessibility": 95, "bestPractices": 92, "seo": 100 }, ... ]
   }
   ```

### 3. 에러 처리

- `lhci collect` 자체가 실패하면(네트워크 오류, 사이트 다운 등) 명확한 에러 로그와 함께 `process.exit(1)` — 이 실패는 숨기지 않는다(다음 step에서 이 데이터가 없으면 리포트에 성능 섹션이 빠지므로 원인을 알아야 함).
- 5개 URL 중 일부만 실패해도 나머지는 정상 저장하고, 실패한 URL은 로그로만 남긴다(전체를 막지 않음).

### 4. 테스트

`scripts/lib/__tests__/lighthouseThreshold.test.ts`에서 `findScoresBelowThreshold`를 검증한다:
- 모든 점수가 threshold 이상이면 빈 배열
- 특정 카테고리만 threshold 미만이면 그 카테고리만 포함
- 여러 페이지에 걸쳐 여러 카테고리가 미달이면 전부 포함
- threshold 값을 바꿔도(예: 50 vs 90) 정확히 그 값 기준으로 판정하는지(경계값 포함 여부 명확히: score < threshold만 미달로 판정, score === threshold는 통과)

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

**로컬에서 `scripts/collect-lighthouse.ts`를 실제로 실행하지 마라** — Chrome을 띄우므로 이 PC에서 막힌다(위 배경 설명 참고). AC는 위 lint/test/build로 충분하다. `lhci collect`의 정확한 CLI 옵션 문법은 공식 문서 조사로 확인하고, 실제 동작 여부는 다음 step에서 워크플로우 연동 후 GitHub Actions에서 라이브로 검증한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 로컬에서 Chrome을 실행하는 명령을 시도하지 않았는가?
   - `lhci collect` CLI 옵션을 공식 문서로 확인했는가(추측 금지)?
   - 임계값 판정이 순수 함수로 분리되어 테스트 가능한가?
   - 일부 URL 실패가 전체를 막지 않는가?
3. 결과에 따라 `phases/15-weekly-lighthouse-tracking/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 로컬에서 Chrome을 실제로 실행하는 어떤 명령도 실행하지 마라(`lhci collect`, `lhci autorun` 등 포함) — 이 PC 보안 정책에 막혀 프로세스가 멈춘다.
- threshold 값(90)을 이 step의 순수 함수에 하드코딩하지 마라 — 인자로 받아라.
- 기존 테스트를 깨뜨리지 마라.

# Step 1: title-variant-generation

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 "2-2. 타이틀/설명 순차 A/B 테스트 자동화" — 특히 가드레일(핵심 키워드 유지, 과장 표현 금지, SERP 길이 제한)과 "프롬프트 지시 + 코드 검증 이중 적용" 원칙
- `/scripts/generate-report.ts` — Anthropic API 호출 패턴을 그대로 따른다: `fetch` + `ANTHROPIC_API_URL`/`ANTHROPIC_API_VERSION`/`MODEL`('claude-sonnet-5') 상수, 응답 실패/빈 응답 처리(`process.exit(1)`), 프롬프트를 스크립트 안에 인라인 문자열로 두는 방식(별도 `prompts/*.md` 파일을 새로 만들지 않는다 — 로드맵 문서의 prompts/ 디렉토리는 아직 미착수 상태이고 실제 코드베이스는 인라인 방식을 쓰고 있다. 이 관례를 따른다)
- `/scripts/lib/anthropicResponse.ts` (`extractAnthropicText`)
- `/src/types/tool.ts` (`LocalizedText` — title/description은 en/ko 쌍)
- 이전 step 산출물: `/scripts/lib/detectCtrAnomalies.ts`의 인터페이스만 확인(이번 step에서 직접 호출하지는 않지만, 다음 step에서 이 스크립트에 어떤 입력이 들어올지 이해하기 위해)

## 작업

### 1. `scripts/lib/validateTitleVariant.ts` (순수 함수)

AI가 생성한 title/description 후보가 가드레일을 지켰는지 **코드로** 검증한다. 프롬프트로 지시하는 것과 별개로 반드시 코드 게이트를 둔다.

```typescript
import type { LocalizedText } from '../../src/types/tool'

export interface TitleVariant {
  title: LocalizedText
  description: LocalizedText
}

export interface ValidationResult {
  valid: boolean
  violations: string[]  // 사람이 읽을 수 있는 위반 사유. 재생성 프롬프트에 그대로 피드백할 수 있는 문장으로 작성
}

/** SERP 노출 기준 대략적 상한 — 상수로 분리, 필요시 조정 */
export const MAX_TITLE_LENGTH = 60
export const MAX_DESCRIPTION_LENGTH = 155

/** 과장·단정적 표현 금지 목록 — 한/영 모두. 상수로 분리해 나중에 추가하기 쉽게 */
export const BANNED_PATTERNS: RegExp[]

/**
 * title/description 각각 길이 초과, 금지 표현 포함 여부를 검사하고,
 * requiredKeywords(예: tool명)가 en/ko title 어느 쪽에도 전혀 없으면 위반으로 기록한다.
 */
export function validateTitleVariant(
  variant: TitleVariant,
  requiredKeywords: { en: string; ko: string }
): ValidationResult
```

### 2. `scripts/generate-title-variant.ts`

CLI 스크립트가 아니라 **다음 step(`run-title-experiment.ts`)이 함수로 호출하는 모듈**로 만든다(Phase 13의 `generate-report.ts`처럼 독립 실행 스크립트가 아니라, `export`된 함수를 오케스트레이션 스크립트가 가져다 쓰는 형태 — 다음 step에서 이렇게 쓸 것이므로 이 구조를 전제로 설계하라).

```typescript
export interface TitleVariantRequest {
  page: string                 // slug 등 식별자
  currentTitle: LocalizedText
  currentDescription: LocalizedText
  requiredKeywords: { en: string; ko: string }
  ctrEvidence: string          // 이 페이지가 왜 후보로 뽑혔는지, 프롬프트에 근거로 포함할 짧은 설명
}

/**
 * Claude를 호출해 title/description 후보를 N개(2~3개) 생성하고,
 * 각각 validateTitleVariant로 검증한다. 위반이 있으면 위반 사유를
 * 프롬프트에 피드백해 최대 2회까지 재생성한다. 그래도 통과하는 후보가
 * 하나도 없으면 빈 배열을 반환한다(예외를 던지지 않는다 — 호출부가
 * "이번 주 이 페이지는 스킵"으로 판단할 수 있게).
 */
export async function generateTitleVariants(
  request: TitleVariantRequest,
  apiKey: string
): Promise<TitleVariant[]>
```

**파싱은 반드시 별도 순수 함수로 분리하라** (`parseVariantsFromResponse(text: string): TitleVariant[]` 같은 형태) — API 응답 텍스트를 구조화된 후보 배열로 바꾸는 로직을 fetch 호출과 분리해야 실제 네트워크 호출 없이 파싱 로직을 테스트할 수 있다. 응답 형식은 `generate-report.ts`의 `===REPORT===`/`===END===` 구분자 패턴처럼 명확한 구분자를 프롬프트에서 강제하라(JSON을 그대로 시키면 이스케이프 문제로 깨지기 쉬우니, 구분자 기반 형식을 권장하되 최종 판단은 구현 시 확인).

빈 응답, API 에러는 `generate-report.ts`와 동일하게 명확한 에러 로그와 함께 처리한다.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `scripts/lib/__tests__/validateTitleVariant.test.ts`에서 최소: 정상 케이스(위반 없음), 길이 초과, 금지 표현 포함, 키워드 누락, 여러 위반 동시 발생 케이스를 검증하는지 확인한다.
3. `parseVariantsFromResponse` 같은 파싱 순수 함수가 실제 API 호출 없이 테스트되는지 확인한다(fetch를 mock하거나, 파싱 로직 자체를 완전히 분리했는지).
4. 결과에 따라 `phases/16-title-ab-test-automation/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `prompts/title-variant.md` 같은 별도 프롬프트 파일을 만들지 마라 — 기존 코드베이스 관례(스크립트 안에 인라인)를 따른다.
- 실제 `ANTHROPIC_API_KEY`로 진짜 네트워크 호출을 하는 테스트를 만들지 마라 — fetch는 반드시 mock 하거나, 파싱/검증 로직을 fetch와 분리해 그 부분만 테스트하라.
- 가드레일 위반 시 예외를 던져 전체 워크플로우를 죽이지 마라 — 해당 페이지만 스킵하고 빈 배열/로그로 처리해라.
- 기존 테스트를 깨뜨리지 마라.

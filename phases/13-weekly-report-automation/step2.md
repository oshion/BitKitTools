# Step 2: intent-classification

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트 구조와 이전 step의 산출물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/lib/aggregateWeeklyReport.ts` (이전 step 산출물 — 이 step은 별도 모듈이지만 같은 `scripts/lib/` 아래 나란히 위치)
- `/scripts/lib/googleAuth.ts` (이 프로젝트의 기존 fetch 기반 외부 API 호출 스타일 — Anthropic API 호출도 동일한 스타일로 raw `fetch()` 사용, SDK 패키지 추가하지 않음)

## 배경

로드맵 요건: GSC 쿼리를 `tool`/`tutorial`/`comparison`/`problem-solving`으로 분류해 "Tool을 새로 만들지, 기존 페이지를 개선할지" 판단하는 데 쓴다. 비용과 속도를 위해 **규칙 기반 1차 분류를 우선**하고, 애매한 것만 AI에 묻는다.

## 작업

`scripts/lib/classifyIntent.ts`를 작성한다.

### 시그니처

```typescript
export type SearchIntent = 'tool' | 'tutorial' | 'comparison' | 'problem-solving'
export type IntentClassification = SearchIntent | 'ambiguous'

export function classifyIntentRuleBased(query: string): IntentClassification

export async function classifyAmbiguousQueries(
  queries: string[],
  apiKey: string
): Promise<Map<string, SearchIntent | 'ambiguous'>>
```

### `classifyIntentRuleBased` 규칙

대소문자 무관, 한/영 쿼리 모두 대상(이 사이트는 EN/KO 이중 언어). 아래 패턴에 해당하면 즉시 분류하고, 어디에도 해당하지 않으면 `'ambiguous'`를 반환한다:

- `'tool'`: "calculator", "converter", "generator", "decoder", "formatter", "checker", "계산기", "변환기", "생성기", "디코더" 포함
- `'tutorial'`: "how to", "tutorial", "guide", "사용법", "방법" 포함
- `'comparison'`: " vs ", "vs.", "compare", "비교", "차이" 포함
- `'problem-solving'`: "fix", "error", "not working", "안됨", "안돼", "오류", "문제" 포함

패턴 우선순위(한 쿼리가 여러 패턴에 매칭될 경우 위 목록 순서대로 첫 매칭을 채택)를 코드 주석으로 명시하라.

### `classifyAmbiguousQueries` (AI 폴백)

- 입력받은 쿼리 목록 중 규칙 기반으로 분류 안 된(`ambiguous`) 것들을 **한 번의 Anthropic API 호출로 배치 처리**한다(쿼리마다 개별 호출하지 않음 — 비용/속도 문제).
- Anthropic Messages API를 raw `fetch()`로 호출한다:
  - `POST https://api.anthropic.com/v1/messages`
  - 헤더: `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`, `content-type: application/json`
  - `model: 'claude-sonnet-5'`
  - 프롬프트: 쿼리 목록을 번호 매겨 제시하고, 각각을 `tool`/`tutorial`/`comparison`/`problem-solving`/`ambiguous` 중 하나로 분류해 **쿼리 문자열을 key로 하는 JSON 객체**로만 응답하도록 지시한다(예: `{"쿼리1": "tool", "쿼리2": "ambiguous"}`). 다른 설명 텍스트 없이 JSON만 출력하도록 명시하라.
- 응답 파싱은 관대하게(lenient) 처리한다 — 모델이 JSON 앞뒤에 텍스트를 덧붙이는 경우를 대비해 정규식으로 `{...}` 블록만 추출 후 `JSON.parse`. **파싱 실패 시 전체를 크래시시키지 말고, 해당 쿼리들을 모두 `'ambiguous'`로 유지한 Map을 반환**한다(fail-soft — 다음 step의 리포트 생성 전체를 막으면 안 됨).
- `queries`가 빈 배열이면 API를 호출하지 않고 빈 Map을 즉시 반환한다.
- API 호출 자체가 실패(네트워크 오류, 4xx/5xx)해도 마찬가지로 크래시하지 말고 빈 Map(또는 전부 ambiguous)을 반환하고 `console.error`로 로그만 남긴다.

### 테스트

`scripts/lib/__tests__/classifyIntent.test.ts`에 `classifyIntentRuleBased`를 각 카테고리별 실제 쿼리 예시(영/한 혼합)로 테스트한다. `classifyAmbiguousQueries`는:
- 빈 배열 입력 시 API를 호출하지 않고 즉시 빈 Map을 반환하는지 (`global.fetch`를 `jest.spyOn`으로 감시해 호출되지 않았음을 확인)
- `global.fetch`를 mock해서 정상 JSON 응답 시 올바르게 파싱되는지
- `global.fetch`를 mock해서 API 실패(reject 또는 non-ok response) 시 크래시 없이 fallback 값을 반환하는지

를 검증한다. 실제 네트워크 호출은 테스트에서 발생하지 않아야 한다(전부 mock).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 규칙 기반 분류가 먼저 시도되고, 애매한 것만 AI로 넘어가는가?
   - 애매한 쿼리들이 쿼리당 1회씩이 아니라 **한 번의 배치 호출**로 처리되는가?
   - API 실패/파싱 실패가 전체 프로세스를 크래시시키지 않는가(fail-soft)?
   - `ANTHROPIC_API_KEY`를 하드코딩하지 않고 호출자(다음 step)로부터 인자로 받는가?
   - 테스트가 실제 네트워크 호출 없이 전부 mock으로 처리됐는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 쿼리 하나마다 API를 개별 호출하지 마라 — 비용 낭비다. 반드시 배치로 묶어라.
- `@anthropic-ai/sdk` 같은 별도 패키지를 추가하지 마라 — 이 프로젝트는 `googleAuth.ts`/`notify-indexnow.ts`처럼 raw `fetch()` 스타일을 유지한다.
- API 키를 코드에 하드코딩하지 마라.
- 기존 테스트를 깨뜨리지 마라.

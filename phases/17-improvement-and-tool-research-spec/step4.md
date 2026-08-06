# Step 4: programmatic-seo-spec

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 "Phase 4" 섹션 6번 항목("Programmatic SEO 후보도 동일 흐름")
- `/src/types/tool.ts`(`ToolConfig`, `LocalizedText`, `ToolFaqItem`)
- 이전 step 산출물: `/scripts/lib/toolResearchMatching.ts`(`UnmatchedQuery`), `/scripts/lib/proposalTracking.ts`

## 배경 — 유사도를 언제 검사하는가

"70% 유사도 이상이면 spec을 안 만든다"는 규칙은 **AI가 만든 초안(draft) content**를 검사 대상으로 삼아야 의미가 있다 — 단순히 "JPG→PNG를 PNG→JPG로 라벨만 바꾼" 게으른 결과물은 당연히 원본과 90% 이상 겹칠 것이고, 그게 바로 이 가드레일이 걸러내야 할 대상이다. 따라서 순서는: (1) 후보 선정 → (2) AI에게 "기존 페이지와 달라야 한다"고 명시적으로 지시해 초안(title/description/FAQ) 생성 → (3) 그 초안을 기존 페이지 콘텐츠와 비교해 유사도 검사 → (4) 통과한 것만 최종 spec 문서 생성. 초안 생성 없이 미리 "이 아이디어가 겹칠지"를 예측하려 하지 마라 — 실제로 만들어봐야 알 수 있다.

## 작업

### 1. `scripts/lib/checkPageSimilarity.ts` (순수 함수)

```typescript
/**
 * 두 텍스트를 단어 토큰 집합으로 만들어 Jaccard 유사도(교집합/합집합)를 계산한다.
 * 대소문자 무시, 공백 기준 토큰화로 시작해도 된다(정교한 형태소 분석 불필요 —
 * 이 프로젝트는 en/ko 혼용이라 완벽한 언어 처리보다 "명백히 겹치는지"를
 * 걸러내는 실용적 근사치면 충분하다).
 */
export function computeJaccardSimilarity(textA: string, textB: string): number  // 0~1

/** threshold(기본 0.7) 이상이면 false(가드레일 실패 = spec 생성 안 함) */
export function passesSimilarityGuardrail(
  draftText: string,
  existingText: string,
  threshold?: number
): boolean
```

### 2. `scripts/generate-programmatic-seo-spec.ts`

```typescript
export interface ProgrammaticSeoCandidate {
  variantQuery: string      // 예: "png to jpg converter"
  relatedTool: ToolConfig   // 이미 존재하는 유사 tool (예: jpg-to-png-converter)
  evidence: string
}

/**
 * 이전 step의 UnmatchedQuery 목록에서, 완전히 무관한 쿼리(step 3이 이미 신규 tool
 * 후보로 다룸)가 아니라 **기존 tool의 keywords와 상당 부분 겹치지만 정확히 매칭되지는
 * 않는** 쿼리(포맷/방향이 반대인 경우 등)를 찾아 후보로 만든다. 판정 기준(예: 토큰
 * 겹침 비율 몇 % 이상)은 구현 시 정하되 상수로 분리하라.
 */
export function findNearMissQueries(
  unmatchedQueries: UnmatchedQuery[],
  tools: ToolConfig[]
): ProgrammaticSeoCandidate[]

export interface ProgrammaticSeoDraft {
  title: LocalizedText
  description: LocalizedText
  faqHighlights: string[]  // 차별화 포인트가 되는 FAQ 주제 목록(en)
}

/**
 * Claude에게 candidate.relatedTool의 실제 title/description/FAQ를 함께 제공하고,
 * "이것과 달라야 한다 — 라벨만 바꾸지 말고 이 변형만의 고유한 사용 맥락/FAQ를
 * 만들어라"라고 명시적으로 지시해 초안을 생성한다.
 */
export async function draftProgrammaticSeoVariant(
  candidate: ProgrammaticSeoCandidate,
  apiKey: string
): Promise<ProgrammaticSeoDraft>

/**
 * draft(title.en + description.en + faqHighlights를 이어붙인 텍스트)와
 * candidate.relatedTool의 실제 콘텐츠(title.en + description.en + faq 질문들)를
 * passesSimilarityGuardrail로 비교한다. 실패하면 **1회만** "더 차별화하라"는
 * 피드백과 함께 재생성을 시도하고, 그래도 실패하면 이 후보는 조용히 스킵한다
 * (스킵은 정상 동작 — 에러 아님).
 */
export async function draftAndValidateVariant(
  candidate: ProgrammaticSeoCandidate,
  apiKey: string
): Promise<ProgrammaticSeoDraft | null>

/** 통과한 draft로 최종 spec 텍스트("이 페이지만의 차별화 콘텐츠 계획" 포함)를 생성한다. */
export async function generateProgrammaticSeoSpec(
  candidate: ProgrammaticSeoCandidate,
  draft: ProgrammaticSeoDraft,
  apiKey: string
): Promise<string>
```

proposalTracking 중복 체크는 다른 spec 타입과 동일하게 적용한다(`type: 'programmatic-seo'`, `target`은 `variantQuery` 또는 안정적으로 파생한 slug).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `scripts/lib/__tests__/checkPageSimilarity.test.ts` 최소 케이스: 완전히 동일한 텍스트(1.0), 완전히 무관한 텍스트(0에 가까움), threshold 경계값, `passesSimilarityGuardrail`의 true/false 반환이 threshold 방향과 맞는지(유사도가 threshold **이상**이면 false).
3. `findNearMissQueries`가 완전 무관 쿼리와 완전 매칭 쿼리 둘 다 제외하고 "부분 겹침"만 후보로 뽑는지 테스트로 확인한다.
4. `draftAndValidateVariant`의 재시도 로직(1회 재시도 후 실패 시 null)이 실제 API 호출 없이 mock으로 테스트되는지 확인한다.
5. 결과에 따라 `phases/17-improvement-and-tool-research-spec/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 유사도 검사를 AI 초안 생성 전에("이 아이디어는 겹칠 것 같다") 추측으로 대체하지 마라 — 반드시 실제로 생성된 draft 텍스트를 검사한다.
- 유사도 재시도를 무한정 반복하지 마라 — 1회로 제한한다.
- 실제 API 호출 테스트를 만들지 마라.
- 기존 테스트를 깨뜨리지 마라.

# Step 2: quiz-logic

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/fun-chiikawa-personality-test.md` ("성격 유형 산출", "캐릭터 매칭" 섹션 — 동점 규칙 포함)
- `/docs/ARCHITECTURE.md`
- 이전 step 산출물: `src/types/chiikawa-quiz.ts`, `src/lib/config/chiikawaQuestions.ts`, `src/lib/config/chiikawaCharacters.ts`, `src/lib/config/personalityTypeLabels.ts` 와 그 테스트
- `src/lib/utils/temperamentQuiz.ts`, `src/lib/utils/temperamentQuiz.test.ts` (비슷한 순수 채점 유틸 형식 참고)

## 작업

`src/lib/utils/chiikawaQuiz.ts`에 순수 함수(React·브라우저 API 의존 없음)를 만든다. 채점표와 기준 답안은 **데이터 파일에서 읽는다** — 이 파일에 다시 적지 않는다.

TDD: `src/lib/utils/chiikawaQuiz.test.ts`를 먼저 작성하라.

### 시그니처

```ts
import type { AnswerLetter, PersonalityType, ChiikawaCharacterId } from '@/types/chiikawa-quiz'

/** answers[i] = Q(i+1)의 응답. 길이 24, 모두 A~D가 아니면 RangeError */
export function scorePersonalityType(answers: readonly AnswerLetter[]): PersonalityType

export type CharacterMatch = {
  id: ChiikawaCharacterId
  matches: number      // 0~8
  similarity: number   // matches / 8 * 100 (예: 87.5)
}

/** 16명 전체를 순위대로 정렬해 반환 */
export function rankCharacters(answers: readonly AnswerLetter[]): CharacterMatch[]

export type ChiikawaResult = {
  personalityType: PersonalityType
  top: CharacterMatch[]   // 상위 3명, top[0]이 최종 결과
}

export function getChiikawaResult(answers: readonly AnswerLetter[]): ChiikawaResult
```

### 반드시 지킬 규칙 (스펙 그대로)

- **성격 유형은 Q1~Q16(인덱스 0~15)만, 캐릭터는 Q17~Q24(인덱스 16~23)만 사용한다.** 서로의 응답이 결과에 영향을 주면 안 된다.
- 성격 유형: 각 문항의 `scoring.letters[응답]`을 축별로 집계해 많은 쪽 글자. 2:2 동점이면 E/I는 Q1, S/N은 Q7, T/F는 Q3, J/P는 Q4에서 고른 응답의 글자. 결과 순서는 EI-SN-TF-JP.
- 캐릭터: 기준 답안(`answerKey`)과 문항별 일치 1점, 총 8점. 정렬은 (1) 점수 내림차순, (2) 동점이면 **Q24에서 사용자 응답과 기준 답이 일치하는 캐릭터 우선**, 그래도 같으면 Q23, Q22 … Q17 순으로 같은 비교 반복, (3) 끝까지 같으면 `CHIIKAWA_CHARACTERS` 배열 순서.
- 입력 배열을 변경하지 않는다(순수 함수).

### 테스트

- 축별 집계 기본 케이스, 각 축의 2:2 동점 케이스(동점 기준 문항의 응답이 결과를 결정하는지).
- 독립성: Q17~Q24만 바꾸면 성격 유형이 그대로, Q1~Q16만 바꾸면 캐릭터 순위가 그대로.
- **전수 검사 — 각 축 50:50**: 축마다 해당 4문항의 4⁴=256가지 조합에서 두 글자가 각각 정확히 128번 나온다.
- **각 캐릭터의 기준 답안으로 Q17~Q24를 답하면 그 캐릭터가 1위**이고 similarity 100.
- 동점 정렬: 점수가 같은 두 캐릭터가 Q24 일치 여부로 갈리는 케이스, Q24가 같고 Q23으로 갈리는 케이스를 직접 구성해 검증.
- similarity 계산(예: 7개 일치 → 87.5), `top` 길이 3, `rankCharacters` 길이 16·중복 없음.
- **전수 검사 — 매칭 분포**: Q17~Q24의 4⁸=65,536가지 조합 전부에 대해 1위 캐릭터를 집계했을 때, 16명 모두 1위로 나오는 조합이 있고 각 캐릭터의 1위 비율이 3%~12% 범위다(설계 시 계산 값 4.6%~8.9%). 테스트가 2초 이상 걸리면 1위만 계산하는 내부 경로를 쓰는 등 최적화한다.
- 잘못된 입력(길이 23, 'E' 같은 값)은 RangeError.

## Acceptance Criteria

```bash
npm run lint && npm test && npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 순수 유틸이 `src/lib/utils/`에 있는가? (CLAUDE.md 규칙 7)
   - 채점표·기준 답안을 이 파일에 중복 정의하지 않았는가?
3. 결과에 따라 `phases/18-fun-chiikawa-personality-test/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "export 함수 시그니처와 전수 검사 결과(1위 비율 범위) 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 전수 검사가 실패한다고 테스트 기준(3%~12%, 50:50, 쌍별 차이 ≥3)을 느슨하게 바꾸거나 데이터 파일의 기준 답안·채점표를 임의로 고치지 마라. 이유: 이 값들은 스펙에서 사용자와 확정한 것이다. 실패하면 구현 버그부터 의심하고, 데이터 자체의 문제라면 `blocked`로 보고하라.
- 동점 처리를 "Q24부터 응답 글자를 사전순 비교"처럼 다르게 해석하지 마라. 이유: 스펙이 "사용자 응답과 기준 답이 일치하는 캐릭터 우선"으로 명확히 정했다.
- 컴포넌트·페이지를 만들지 마라. 이유: 다음 step의 범위다.
- 기존 테스트를 깨뜨리지 마라.

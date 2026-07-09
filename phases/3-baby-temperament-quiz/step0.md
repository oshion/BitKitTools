# Step 0: quiz-logic-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/baby-temperament-quiz.md` (이 phase 전체의 1차 스펙 — 반드시 전체를 정독하라. 연령 구간, 4개 축과 근거, 문항 구조, 16개 페르소나, 육아 팁, 금지사항이 전부 이 문서에 있다)
- `/docs/ARCHITECTURE.md` (레이어 규칙 — `lib/config/`는 정적 데이터, `lib/utils/`는 순수 함수)
- `/CLAUDE.md` (CRITICAL 규칙 5: TDD, 6: `any` 금지, 9: Configuration-driven, 12: YMYL 신중 처리)
- `src/lib/config/growthStandards.ts`, `src/lib/config/sleepGuidelines.ts` (정적 데이터 파일에 출처를 주석으로 명시하는 기존 컨벤션 확인용)
- `src/lib/utils/growthPercentile.ts`, `src/lib/utils/sleepSchedule.ts` (순수 함수 스타일 확인용)

**이 step은 UI를 전혀 만들지 않는다.** 데이터/로직 레이어만 구현하며, 다음 step(`quiz-component`)이 이 step의 산출물을 import해서 사용한다.

## 작업

### 1. `lib/config/temperamentQuestions.ts` (정적 데이터)

```ts
export type AgeBand = 'infant' | 'toddler' | 'preschooler' // 4~12개월 / 13~36개월 / 37~84개월
export type Axis = 'activity' | 'social' | 'adaptability' | 'reactivity'
export type QuestionOption = { pole: string; label: { en: string; ko: string } }
export type TemperamentQuestion = {
  id: string
  axis: Axis
  ageBand: AgeBand
  prompt: { en: string; ko: string }
  options: [QuestionOption, QuestionOption]
}

export const TEMPERAMENT_QUESTIONS: TemperamentQuestion[]
```

- 각 `ageBand`마다 정확히 **20문항**(축당 5문항 — `activity`/`social`/`adaptability`/`reactivity` 각 5개씩)을 작성한다. 축의 두 극(pole)은 다음으로 고정한다: `activity`→`'active'|'calm'`, `social`→`'social'|'shy'`, `adaptability`→`'flexible'|'cautious'`, `reactivity`→`'expressive'|'mellow'`.
- 문항 예시 표현은 연령대별로 자연스럽게 달라야 한다 — `infant`(영아기)는 "낯선 사람을 보면", "새로운 장난감을 주면" 같은 관찰 가능한 행동, `preschooler`(유치원기)는 "새 유치원 반에 가면", "친구와 놀다가 뜻대로 안 되면" 같은 더 복잡한 상황을 쓴다.
- **모든 문항은 "정답이 없는 질문" 톤을 유지한다.** 두 선택지 중 어느 쪽도 부정적으로 들리지 않게 both-positive 어휘로 작성하라(예: "낯선 사람을 보면 바로 웃으며 다가간다" vs "낯선 사람을 보면 부모 뒤로 숨었다가 천천히 다가간다" — 둘 다 정상적인 행동 묘사이지 결함 묘사가 아니다).
- EN/KO 완전한 문장으로 작성한다(플레이스홀더 금지).
- 3개 연령 구간 × 20문항 = 총 60개 `TemperamentQuestion` 항목.

### 2. `lib/config/temperamentPersonas.ts` (정적 데이터)

```ts
export type PersonaCode = string // 'active-social-flexible-expressive' 형태, 축 순서 고정: activity-social-adaptability-reactivity
export type TemperamentPersona = {
  code: PersonaCode
  emoji: string
  name: { en: string; ko: string } // "형용사 + 명사" 패턴
  description: { en: string; ko: string } // 2~3문장
  tips: { en: string[]; ko: string[] } // 각 2~3개
  colorHue: number // 0~359, 16개가 겹치지 않도록 균등 분배(예: 인덱스 × 22.5)
}

export const TEMPERAMENT_PERSONAS: TemperamentPersona[]
export function getPersonaByCode(code: string): TemperamentPersona | undefined
```

- `activity`(`active`|`calm`) × `social`(`social`|`shy`) × `adaptability`(`flexible`|`cautious`) × `reactivity`(`expressive`|`mellow`)의 **2⁴=16개 조합 전부**를 빠짐없이 정의한다. `code`는 `` `${activity}-${social}-${adaptability}-${reactivity}` `` 형식으로 4개 축 값을 이 순서로 연결한다.
- 이름은 "형용사+명사" 패턴이며 모든 유형이 동등하게 긍정적이어야 한다(예: 🧭 "명랑한 모험가"/"Cheerful Adventurer", 🌙 "느긋한 관찰자"/"Laid-back Observer" — screens 문서의 예시 4개를 참고해 나머지 12개를 같은 톤으로 완성하라). 어떤 유형도 다른 유형보다 우월/열등하게 들리면 안 된다.
- `tips`는 Thomas & Chess의 **"goodness of fit"** 개념에 근거해 "이렇게 하면 더 잘 통해요" 톤으로만 작성한다. "부족하다/고쳐야 한다" 같은 결핍-교정형 문구, 발달 지연을 시사하는 문구, 교육법/학습지 처방은 **절대 금지**한다.
- `colorHue`는 16개 유형이 색상환에서 겹치지 않도록 각기 다른 값을 가져야 한다(step3에서 유형별 카드 배경색으로 사용됨 — 이 step에서는 값만 정의하면 되고 실제 렌더링은 다루지 않는다).

### 3. `lib/utils/temperamentQuiz.ts` (순수 함수)

```ts
import type { Axis } from '@/lib/config/temperamentQuestions'

export type AxisResult = {
  activity: 'active' | 'calm'
  social: 'social' | 'shy'
  adaptability: 'flexible' | 'cautious'
  reactivity: 'expressive' | 'mellow'
}
export type QuizAnswer = { axis: Axis; pole: string }

export function scoreQuiz(answers: QuizAnswer[]): AxisResult
export function getPersonaCode(result: AxisResult): string
```

- `scoreQuiz`는 축별로 어느 극(pole)이 더 많이 선택됐는지 집계해 `AxisResult`를 반환한다(축당 5문항이 홀수이므로 정상적인 20문항 응답에서는 동점이 발생하지 않는다. 다만 함수 자체는 입력 개수를 가정하지 말고 방어적으로 다수결로 계산하며, 극단적으로 동점인 입력이 와도 크래시하지 않고 결정적으로(예: 알파벳 순 등) 하나를 선택해 반환하라).
- `getPersonaCode`는 `AxisResult`를 `lib/config/temperamentPersonas.ts`의 `code` 형식과 동일한 문자열로 변환한다(축 순서: activity-social-adaptability-reactivity).

### 4. 테스트

- `lib/utils/temperamentQuiz.test.ts`: `scoreQuiz`가 다양한 응답 조합(전부 한쪽 극, 3:2로 갈리는 경우 등)에서 올바르게 집계하는지, `getPersonaCode`가 올바른 코드 문자열을 만드는지 테스트한다. **가장 중요한 테스트**: `AxisResult`의 가능한 16개 조합 전부에 대해 `getPersonaCode`로 만든 코드가 `TEMPERAMENT_PERSONAS`(`getPersonaByCode`)에 실제로 존재하는지, 그리고 각 페르소나의 `tips` 배열 길이가 2 이상인지 검증한다(2⁴ 조합을 코드로 순회하며 `expect(getPersonaByCode(code)).toBeDefined()` 형태로 전부 확인).
- `lib/config/temperamentQuestions.test.ts`: 3개 `ageBand` 각각 정확히 20문항인지, 축별로 정확히 5문항씩인지, 각 문항의 `options`가 해당 축의 유효한 두 극과 정확히 일치하는지 검증한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `TEMPERAMENT_PERSONAS`에 16개 코드가 전부 존재하는지, 각 `tips`가 비어있지 않은지 테스트로 확인한다.
3. `TEMPERAMENT_QUESTIONS`가 3구간 × 20문항 = 60개이고 축 분배가 정확한지 확인한다.
4. 육아 팁 문구에 "부족하다", "고쳐야 한다", "학습지", "교정" 등 결핍-교정형 어휘가 없는지 grep으로 확인한다.
5. 결과에 따라 `phases/3-baby-temperament-quiz/index.json`의 `step 0`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 요약 — 파일 목록, 16개 페르소나 이름 목록, 축/극 정의를 다음 step에서 바로 쓸 수 있도록 구체적으로 기록"`
   - 실패/blocked 처리는 `2-baby-height-predictor/step0.md`와 동일한 기준을 따른다.

## 금지사항

- UI 컴포넌트나 `page.tsx`를 만들지 마라 — 이 step은 데이터/로직 레이어로 한정한다.
- 16개 페르소나 중 일부를 빠뜨리거나 플레이스홀더 텍스트로 남기지 마라 — 전부 완성된 EN/KO 문장이어야 한다.
- 육아 팁에 발달 지연을 시사하거나 처방적인 문구를 쓰지 마라 — goodness of fit 톤만 허용한다.
- 문항 선택지 중 어느 한쪽이라도 부정적으로 들리게 작성하지 마라.
- `any` 타입을 쓰지 마라(CLAUDE.md rule 6).
- 기존 테스트를 깨뜨리지 마라.

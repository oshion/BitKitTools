# Step 1: quiz-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/fun-chiikawa-personality-test.md` (**1차 스펙 — 채점표·기준 답안·이모지/대표색·안내 문구의 정본**)
- `/phases/18-fun-chiikawa-personality-test/source-content.md` (기획서 원문 — 소개 문구, 24문항 KO 원문, 캐릭터 16명 KO 데이터, 결과 문장 예시)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `src/types/tool.ts` (`LocalizedText`), `src/types/` 의 기존 타입 파일 구성
- `src/lib/config/temperamentPersonas.ts`, `src/lib/config/temperamentQuestions.ts`, `src/lib/config/temperamentQuestions.test.ts` (비슷한 퀴즈 데이터 파일의 형식 참고)
- 이전 step 산출물: `src/types/tool.ts`(`ToolCategory`에 `fun` 추가됨)

## 작업

치이카와 성격 테스트의 **데이터 파일과 타입**만 만든다. 채점 로직은 다음 step(quiz-logic)에서 만든다.

TDD: 아래 "테스트"를 먼저 작성하고 실패를 확인한 뒤 데이터를 채워라.

### 1. `src/types/chiikawa-quiz.ts`

시그니처 수준(필드 이름은 바꿔도 되지만 의미는 유지):

```ts
import type { LocalizedText } from './tool'

export type AnswerLetter = 'A' | 'B' | 'C' | 'D'
export type PersonalityAxis = 'EI' | 'SN' | 'TF' | 'JP'
export type PersonalityLetter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
export type PersonalityType = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`
export type ChiikawaCharacterId =
  | 'chiikawa' | 'hachiware' | 'usagi' | 'momonga' | 'kurimanju' | 'shisa' | 'rakko' | 'kani'
  | 'anoko' | 'dekatsuyo' | 'ode' | 'pochette-armor' | 'labor-armor' | 'ramen-armor'
  | 'pajama-party' | 'kabutomushi'

export type ChiikawaQuestion = {
  number: number                     // 1~24
  text: LocalizedText
  options: Record<AnswerLetter, LocalizedText>
  /** Q1~Q16만: 이 문항이 집계되는 축과 선택지별 글자 (스펙의 수정 채점표) */
  scoring?: { axis: PersonalityAxis; letters: Record<AnswerLetter, PersonalityLetter> }
}

export type LocalizedList = { en: string[]; ko: string[] }

export type ChiikawaCharacter = {
  id: ChiikawaCharacterId
  name: LocalizedText
  emoji: string
  /** Tailwind 색조 이름 (예: 'pink') — 중복 검사용 */
  color: string
  /** 완성된 Tailwind 클래스 문자열 — 동적 조합 금지 */
  cardClassName: string              // 예: 'bg-pink-300/15 border-pink-300/40'
  nameClassName: string              // 예: 'text-pink-200'
  /** OG 이미지 배경 등 Tailwind 밖에서 쓸 hex 색 */
  ogColor: string
  officialUrl: string
  fanType: PersonalityType           // 원문 "팬 설정 성격 유형"
  tagline: LocalizedText             // 한 줄 소개
  coreTraits: LocalizedText          // 핵심 성향(성격 분석)
  strengths: LocalizedList
  cautions: LocalizedList
  relationships: LocalizedList
  compatibleIds: ChiikawaCharacterId[]
  learnFromIds: ChiikawaCharacterId[]
  /** Q17~Q24 기준 답안 8개 (스펙의 수정 기준 답안 표) */
  answerKey: readonly AnswerLetter[]
}
```

### 2. `src/lib/config/chiikawaQuestions.ts`

- `export const CHIIKAWA_INTRO: { title: LocalizedText; body: LocalizedText }` — KO는 source-content.md 1장 원문, EN은 번역.
- `export const CHIIKAWA_QUESTIONS: ChiikawaQuestion[]` — 24개. **KO 문구는 source-content.md 2장 원문 그대로**(Q23은 이미 변경된 문구). EN은 자연스러운 영어로 번역한다(직역보다 퀴즈다운 문장).
- Q1~Q16의 `scoring`은 스펙 "성격 유형 산출" 표(수정안, 굵은 칸 반영된 값)를 그대로 옮긴다. Q17~Q24는 `scoring` 없음.

### 3. `src/lib/config/chiikawaCharacters.ts`

- `export const CHIIKAWA_OFFICIAL_SITE = 'https://chiikawa-info.jp/'`
- `export const CHIIKAWA_CHARACTERS: ChiikawaCharacter[]` — 16명, **스펙 표의 번호 순서**(이 순서가 매칭 동점 처리의 마지막 기준이 된다).
- `export function getChiikawaCharacter(id: string): ChiikawaCharacter | undefined`
- 각 필드:
  - `answerKey`: 스펙 "캐릭터 매칭" 표의 **수정된** Q17~Q24 값 (원 기획서 원안 값이 아니다).
  - `fanType`, `coreTraits`, `strengths`/`cautions`/`relationships`, `compatibleIds`/`learnFromIds`: source-content.md 3장 원문에서 옮긴다. 원문은 짧은 키워드이므로 KO는 source-content.md 4장 예시처럼 "~해요" 체 문장 2~3개로 풀어 쓰되 원문 의미를 벗어나지 않는다. "카니"는 `kani`, 갑옷씨들은 각 id로 매핑한다.
  - `tagline`: 한 줄 소개를 새로 쓴다(치이카와는 원문 예시 “작은 마음도 소중하게 여기는 다정한 사람”을 그대로 쓴다). 원작 줄거리 스포일러를 넣지 않는다.
  - `emoji`, `color`: 스펙 "이모지 + 대표색" 표 그대로. 클래스는 `bg-{color}-300/15 border-{color}-300/40`, `text-{color}-200` 형태의 **완성된 문자열**을 캐릭터마다 직접 적는다. `ogColor`는 같은 색조의 Tailwind 팔레트 hex(어두운 OG 배경에 쓸 700~900 단계 중 하나)를 적는다.
  - `officialUrl`: 16명 모두 `CHIIKAWA_OFFICIAL_SITE`. (캐릭터별 공식 페이지는 사용자가 나중에 확인해 교체한다.)
  - `name.en`: 공식 영문 표기가 확인된 이름(Chiikawa, Hachiware, Usagi, Momonga, Kurimanju, Shisa, Rakko 등)은 그대로, 갑옷씨 3명·카니(후루혼야)·파자마 파티즈는 로마자 표기 + 자연스러운 영어(예: "Pochette Armor-san", "Kani (Furuhonya)", "Pajama Party")로 쓴다. 사용자가 phase 완료 후 검수한다.

### 4. `src/lib/config/personalityTypeLabels.ts`

- `export const PERSONALITY_TYPE_LABELS: Record<PersonalityType, LocalizedText>` — 16개 4글자 유형 각각의 한 줄 설명. 예: ISFJ → KO `세심하고 따뜻한 배려형` / EN `Caring Protector`. KO는 "형용사 + ~형" 패턴, EN은 2~3단어 별칭으로 통일한다. 공인 검사의 공식 유형명(예: "The Defender" 등 상업 서비스의 명칭)을 베끼지 말고 직접 쓴다.

### 5. 테스트 (`src/lib/config/chiikawaQuestions.test.ts`, `src/lib/config/chiikawaCharacters.test.ts`)

- 문항: 24개, number 1~24 연속, 모든 문항이 A~D 선택지를 EN/KO 비어 있지 않게 가짐. Q1~Q16만 `scoring` 보유, 축별 4문항씩. **모든 scoring 문항이 축 양쪽 글자 2:2** (예: EI 문항이면 E 2개·I 2개). Q23 KO 문구가 `친구들이 나를 한마디로 표현한다면?`.
- 스펙 채점표 회귀 검사: Q10 B=I, Q7 C=N, Q3 D=T (원안에서 바뀐 칸).
- 캐릭터: 16명, id 중복 없음, 순서가 스펙 표 순서와 같음, 모든 LocalizedText/리스트가 EN/KO 비어 있지 않음, `answerKey` 길이 8.
- 스펙 기준 답안 회귀 검사: 16명의 `answerKey`를 스펙 표 문자열(예: chiikawa `AAADAAAA`, ramen-armor `DCDBDADD`)과 비교.
- **모든 캐릭터 쌍의 기준 답안이 최소 3문항 이상 다름.**
- `color` 16개 중복 없음, `purple`/`violet`/`indigo`/`fuchsia` 없음. `cardClassName`/`nameClassName`이 자기 `color`를 포함. `ogColor`가 `#` hex.
- `compatibleIds`·`learnFromIds`가 모두 존재하는 id이고 자기 자신을 가리키지 않음.
- `officialUrl`이 모두 `https://chiikawa-info.jp/`로 시작.
- `PERSONALITY_TYPE_LABELS`에 16개 유형이 모두 있고 EN/KO 비어 있지 않음. 모든 캐릭터 `fanType`이 그 16개 중 하나.
- **노출 문구에 "MBTI" 없음**: 이 세 데이터 파일의 모든 문자열 값(EN/KO)을 재귀로 모아 `/mbti/i`가 없는지 검사.

## Acceptance Criteria

```bash
npm run lint && npm test && npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 타입은 `src/types/`, 데이터는 `src/lib/config/`에 있는가? (CLAUDE.md 규칙 7)
   - `any`를 쓰지 않았는가? (규칙 6)
3. 결과에 따라 `phases/18-fun-chiikawa-personality-test/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "생성한 파일·export 이름·EN 이름 표기 결정 등 다음 step에 필요한 정보 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 기획서 원안의 채점표·기준 답안을 쓰지 마라. 이유: 원안은 E/S/F로 치우치고 일부 캐릭터 쌍이 1문항만 달라 늘 함께 나온다. 스펙 문서의 수정안이 정본이다.
- 노출 문구(제목·문항·결과·라벨)에 "MBTI"라는 단어를 쓰지 마라. 이유: Myers-Briggs Foundation의 등록 상표라 스펙에서 노출을 금지했다. "성격 유형" / "personality type"으로 쓴다.
- 캐릭터 이미지 URL·이미지 파일·로고를 데이터에 넣지 마라. 이유: 권리자 라이선스가 없다(스펙 "알려진 리스크"). 이모지와 대표색만 쓴다.
- `bg-${color}-300/15`처럼 클래스 문자열을 조합하지 마라. 이유: Tailwind는 소스에 그대로 적힌 클래스만 생성하므로 조합된 클래스는 스타일이 빠진다.
- 원작 줄거리 스포일러(특정 에피소드 사건, 캐릭터의 정체 등)를 설명에 넣지 마라. 이유: 기획서 기본 사양.
- 이 step에서 채점 함수·컴포넌트·페이지를 만들지 마라. 이유: 다음 step의 범위다.
- 기존 테스트를 깨뜨리지 마라.

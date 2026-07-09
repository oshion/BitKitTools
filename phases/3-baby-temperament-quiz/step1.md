# Step 1: quiz-component

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 step 산출물을 파악하라:

- `/docs/screens/baby-temperament-quiz.md` (이 phase 전체의 1차 스펙 — "UI 구성 / 애니메이션", "공유 기능", "상태", "Analytics 이벤트", "금지사항" 섹션을 특히 꼼꼼히 읽어라)
- `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 1: Server/Client 컴포넌트 구분, 8: 툴 격리, 12: YMYL 신중 처리)
- `src/lib/config/temperamentQuestions.ts`, `src/lib/config/temperamentPersonas.ts`, `src/lib/utils/temperamentQuiz.ts` (이전 step 산출물 — **반드시 실제 export된 타입/함수 시그니처를 정확히 확인한 뒤 import해서 써라**, 이 문서에 적힌 시그니처와 실제 코드가 다르면 실제 코드를 따른다)
- `src/hooks/useAnalyticsEvent.ts` — `sendEvent(name, payload?)`의 `name`은 `AnalyticsEventName`(`'tool_open' | 'calculate' | 'copy_result' | 'share'`)으로 제한되어 있다. 이 툴에서는 `tool_open`(마운트 시), `calculate`(퀴즈 완료/결과 노출 시 — screens 문서의 "Quiz Complete"에 해당), `share`(공유 클릭 시)를 사용한다. **`src/types/analytics.ts`의 공유 타입에 새 이벤트 이름을 추가하지 마라** — 기존 4개 값 안에서 매핑한다.
- `src/app/globals.css`의 `animate-fade-in` keyframe(재사용할 것)
- `src/components/tools/sleep-schedule/SleepScheduleTool.tsx`의 `handleShare` 함수(공유 패턴 — `navigator.share`/`navigator.clipboard` 폴백 구조를 그대로 따른다)
- `src/hooks/useLocalStorage.ts` (이 툴은 LocalStorage를 쓰지 않지만, 존재를 확인해 실수로 쓰지 않도록 한다)

**이 step은 `page.tsx`나 `tools-config.ts`를 건드리지 않는다.** 오직 `components/tools/temperament-quiz/TemperamentQuizTool.tsx`(및 필요하면 같은 폴더 내 보조 파일)만 만든다. 다음 step(`tools-config-page`)이 이 컴포넌트를 페이지에 연결한다.

## 작업

### `components/tools/temperament-quiz/TemperamentQuizTool.tsx` ('use client')

아래 흐름을 전부 구현한다:

1. **연령 구간 선택**: `infant`(4~12개월) / `toddler`(13~36개월) / `preschooler`(37~84개월) 중 선택하는 UI. **0~3개월에 해당하는 선택지도 노출**하되, 선택 시 퀴즈로 진행하지 않고 "이 시기는 아직 기질 차이가 뚜렷하게 나타나기 전이에요. 생후 4개월 이후에 다시 해보세요!" 안내 문구만 보여준다(컴포넌트 자체는 정상 렌더링, 라우트 차원의 404 처리가 아니다).
2. **문항 플로우**: 선택한 연령 구간의 20문항(`temperamentQuestions.ts`에서 필터링)을 1개씩 카드로 보여주며 상단에 진행률 바(예: "7 / 20")를 표시한다. 답변 선택 시 별도의 "다음" 버튼 없이 부드러운 슬라이드 또는 페이드 전환으로 바로 다음 문항으로 넘어간다. 각 답변은 `{ axis, pole }` 형태로 내부 state 배열에 누적한다.
3. **로딩 애니메이션**: 20번째 문항 응답 직후, 실제 채점(`scoreQuiz`)은 즉시 끝나지만 500~800ms 동안 캐릭터가 통통 튀는 등 귀여운 로딩 연출을 보여준 뒤 결과 카드로 전환한다.
4. **결과 계산**: 누적된 20개 응답을 `scoreQuiz(answers)`에 넘겨 `AxisResult`를 얻고, `getPersonaCode(result)`로 페르소나 코드를 구한 뒤 `getPersonaByCode(code)`로 페르소나 데이터를 조회한다.
5. **결과 카드**:
   - 이모지(`persona.emoji`) + 유형 이름(`persona.name[locale]`)을 크게 표시.
   - 설명(`persona.description[locale]`) 2~3문장.
   - 육아 팁(`persona.tips[locale]`) 리스트 형태로 표시.
   - 상시 노출 안내문구: "이 유형은 Thomas & Chess의 기질 연구 개념을 재미있게 재구성한 것이며, 임상적 진단이 아닙니다"(EN/KO 번역).
   - `animate-fade-in`으로 카드 진입 + confetti 또는 이모지 등장 등 아기자기한 장식 애니메이션 추가(이 컴포넌트 전용으로 구현, 다른 툴 폴더에서 import하지 않는다 — rule 8).
   - `window.matchMedia('(prefers-reduced-motion: reduce)')`가 참이면 장식 애니메이션과 로딩 딜레이를 생략하고 결과를 즉시 표시한다.
6. **공유 버튼**: 클릭 시 URL을 `` `${SITE_URL}${localeHref(locale, '/baby/temperament-quiz/result/' + persona.code)}` `` 형태로 만든다(`src/lib/utils/locale-href.ts`의 `localeHref` 헬퍼와 `NEXT_PUBLIC_SITE_URL` 환경변수를 사용 — 다른 툴 페이지들의 `SITE_URL` 상수 패턴을 참고하라). **이 URL 경로(`/baby/temperament-quiz/result/{code}`)는 다음다음 step(`persona-og-images`)에서 실제로 생성된다 — 지금은 문자열만 정확히 만들면 되고, 아직 그 라우트가 없어도 이 step의 AC에는 영향이 없다.** `navigator.share`(title/text/url) 우선 사용, 미지원 시 `navigator.clipboard.writeText(url)` 폴백 — `sleep-schedule`의 `handleShare`와 동일 구조. **원시 응답 20개나 부모가 입력한 어떤 정보도 URL에 포함하지 않는다 — URL에는 페르소나 코드만 들어간다.** 클릭 시 `sendEvent('share')`.
7. **애널리틱스**: 컴포넌트 마운트 시 `sendEvent('tool_open')`, 결과 카드가 처음 노출되는 시점에 `sendEvent('calculate', { ageBand })`(개인 식별 정보 없이 연령 구간만 payload에 포함 가능).
8. **다시 하기**: 결과 카드에 "다시 테스트하기" 버튼을 두어 연령 선택 단계로 돌아갈 수 있게 한다(응답은 LocalStorage에 저장하지 않으므로 컴포넌트 내부 state만 초기화하면 된다).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 0~3개월 선택 시 퀴즈가 진행되지 않고 안내 문구만 노출되는지 코드로 확인한다.
3. 20문항 전부 응답 후 결과가 `scoreQuiz`/`getPersonaCode`/`getPersonaByCode`를 정확히 거쳐 나오는지 확인한다.
4. 공유 URL 문자열에 부모 입력값이나 응답 데이터가 전혀 포함되지 않고 페르소나 코드만 포함되는지 확인한다.
5. `prefers-reduced-motion` 처리가 구현됐는지 확인한다.
6. `AnalyticsEventName` 공유 타입을 수정하지 않았는지 확인한다(`git diff src/types/analytics.ts`가 비어있어야 한다).
7. 결과에 따라 `phases/3-baby-temperament-quiz/index.json`의 `step 1`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "TemperamentQuizTool.tsx 산출물 요약 — 공유 URL 패턴, 사용한 애니메이션 방식 등 다음 step에 필요한 정보 포함"`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- `page.tsx`나 `tools-config.ts`를 수정하지 마라 — 이 step은 컴포넌트로 한정한다.
- `src/types/analytics.ts`의 `AnalyticsEventName`에 새 값을 추가하지 마라 — 기존 4개(`tool_open`/`calculate`/`copy_result`/`share`) 안에서 매핑한다.
- 결과를 "정상/비정상", "우수/열등" 등으로 서열화해서 표시하지 마라.
- 육아 팁을 결핍-교정형 톤으로 다시 쓰지 마라 — `temperamentPersonas.ts`에 있는 문구를 그대로 표시한다.
- 응답 데이터를 LocalStorage나 URL에 저장/노출하지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.

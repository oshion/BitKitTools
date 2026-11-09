# Step 3: quiz-component

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/fun-chiikawa-personality-test.md` ("결과 화면", "진행 화면 요구사항", "공유", "안내 문구", "디자인", "Analytics 이벤트" 섹션)
- `/phases/18-fun-chiikawa-personality-test/source-content.md` (시작 화면 소개 문구, 결과 문장 예시)
- `/docs/UI_GUIDE.md` (다크 테마, 색 규칙, 안티패턴)
- 이전 step 산출물: `src/types/chiikawa-quiz.ts`, `src/lib/config/chiikawaQuestions.ts`, `src/lib/config/chiikawaCharacters.ts`, `src/lib/config/personalityTypeLabels.ts`, `src/lib/utils/chiikawaQuiz.ts`
- `src/components/tools/temperament-quiz/TemperamentQuizTool.tsx`, `TemperamentQuizTool.test.tsx` (같은 형태의 퀴즈 컴포넌트 — 진행·공유·분석 이벤트·`prefers-reduced-motion` 처리 패턴을 따른다)
- `src/hooks/useAnalyticsEvent.ts`, `src/types/analytics.ts`
- `src/lib/utils/locale-href.ts`, `src/i18n/routing.ts`

## 작업

### 1. `src/lib/utils/koreanParticle.ts`

```ts
/** 이름 뒤에 붙을 '와'/'과'를 고른다. 문자열의 마지막 한글 음절 받침 유무로 판단(괄호·공백 등 비한글은 건너뜀) */
export function withAndParticle(name: string): string   // '치이카와' → '치이카와와', '곰' → '곰과'
```

테스트: 받침 없음/있음, `카니(후루혼야)`(→ `카니(후루혼야)와`), 한글이 없는 문자열(→ `와(과)`를 붙임).

### 2. `src/components/tools/chiikawa-personality-test/FanMadeNotice.tsx`

- **Server Component로도 쓸 수 있게** `'use client'` 없이, props `{ locale: 'en' | 'ko' }`.
- 스펙 "안내 문구" 4줄(KO 원문 그대로 + EN 번역)을 작은 회색 글씨 목록으로 보여준다. EN에서 상표 문장은 `This quiz is not affiliated with MBTI® or any other licensed psychological assessment and is not a diagnostic tool.` 형태로 쓴다(이 고지 문장만 "MBTI®" 표기를 허용한다).
- 공식 사이트(`CHIIKAWA_OFFICIAL_SITE`) 링크를 함께 둔다(`target="_blank" rel="noopener"`).
- 이후 step의 툴 페이지 본문·결과 공유 페이지에서도 이 컴포넌트를 재사용한다.

### 3. `src/components/tools/chiikawa-personality-test/ChiikawaPersonalityTestTool.tsx` (`'use client'`)

Props: `{ locale?: Locale }` (기본 `'en'`). UI 문구는 temperament 퀴즈처럼 컴포넌트 안에 EN/KO 객체로 둔다.

화면 흐름(상태는 메모리에만 — LocalStorage 미사용):

1. **시작**: `CHIIKAWA_INTRO` 제목·본문, "24문항 · 약 3분" 안내, 시작 버튼.
2. **문항**: 한 화면에 한 문항. 상단에 `n / 24` + 진행 바(`role="progressbar"`, `aria-valuenow`). 4개 선택지 버튼 — 클릭하면 응답을 저장하고 다음 문항으로 이동(24번째면 결과로). 이전 문항 버튼(1번 문항에서는 숨기거나 비활성) — 돌아가면 이전 응답이 선택 상태로 보이고, 다른 선택지를 누르면 덮어쓴다.
3. **결과** (`getChiikawaResult(answers)` 사용) — 스펙 "결과 화면" 순서 그대로:
   1. 1위 캐릭터의 `cardClassName` 카드: 아주 큰 이모지(`aria-hidden`), "당신과 가장 닮은 치이카와 친구는?" / "Your Chiikawa match is…", 캐릭터 이름(`nameClassName`, 결과 화면에서 가장 큰 글자), 공식 사이트 링크 "공식 사이트에서 {이름} 보기 →" / "See {name} on the official site →" (`officialUrl`, `target="_blank" rel="noopener"`)
   2. **나의 성격 유형**: 계산한 4글자 + `PERSONALITY_TYPE_LABELS` 한 줄 설명
   3. **{캐릭터}의 성격 유형(팬 설정)**: `fanType` 4글자 + 작은 글씨 "공식 설정이 아닌 제작자 추정이에요" / "A fan-made guess, not official". 2와 시각적으로 구분되어 혼동되지 않게 한다.
   4. 한 줄 소개(`tagline`) → 성격 분석(`coreTraits`) → 나의 강점 → 주의하면 좋을 점 → 인간관계 스타일
   5. 나와 잘 맞는 캐릭터 / 서로 배울 점이 있는 캐릭터 (이모지 + 이름 칩)
   6. 닮은 캐릭터 TOP 3: 순위, 이모지, 이름, 유사도 % (87.5처럼 소수 그대로)
   7. 버튼: 다시 테스트하기(모든 응답 초기화 → 시작 화면), 결과 공유하기
   8. `<FanMadeNotice locale={locale} />`
4. **공유**: URL = `` `${SITE_URL}${localeHref(locale, `/fun/chiikawa-personality-test/result/${top[0].id}`)}` `` (캐릭터 id만 — 응답·성격 유형 미포함). 문구 KO: `나는 치이카와 친구 중 ${withAndParticle(이름)} 가장 닮았대! 내 성격 유형은 ${유형}! 너는 어떤 캐릭터와 닮았을까?`, EN: `I'm most like ${name} among the Chiikawa friends! My personality type is ${type}. Which character are you?`. `navigator.share` 우선, 없으면 `navigator.clipboard.writeText(문구 + ' ' + URL)` 후 "링크를 복사했어요" / "Link copied" 알림(`role="status"`). share 취소(AbortError)는 무시.
5. **Analytics** (`useAnalyticsEvent`, 기존 `AnalyticsEventName`만 사용): `tool_open`(마운트 1회), `input_enter`(첫 응답 1회), `calculate`(결과 표시, payload `{ character: id, type }`), `share`.

디자인(스펙 "디자인"): 사이트 다크 테마 위에서 **테스트 카드 내부만** 파스텔 포인트(핑크·민트·하늘 계열)와 둥근 버튼(`rounded-2xl` 등). 보라/인디고 금지. 모바일 우선 — 선택지 버튼은 세로로 쌓이는 넓은 터치 영역. 문항 전환 애니메이션을 넣는다면 `prefers-reduced-motion`이면 생략한다.

### 4. 테스트 (`ChiikawaPersonalityTestTool.test.tsx`, `FanMadeNotice.test.tsx`)

- 시작 → 첫 문항 표시, 진행률 `1 / 24`.
- 선택 시 다음 문항, 이전 버튼으로 돌아가면 기존 응답이 선택 상태, 다른 답으로 덮어쓰기.
- 특정 캐릭터의 기준 답안으로 Q17~Q24를 답하면 결과에 그 캐릭터 이름·이모지·TOP 3가 나오고, "나의 성격 유형"과 "팬 설정" 두 영역이 각각 다른 4글자를 정확히 표시(Q1~Q16을 그 캐릭터 `fanType`과 다른 유형이 나오게 구성).
- 다시 테스트하기 → 시작 화면, 다시 시작하면 1번 문항에 선택된 답이 없음.
- 공유: `navigator.share` mock이 `/fun/chiikawa-personality-test/result/{id}/`를 포함한 URL로 호출됨, share 미지원 시 clipboard 호출 + 복사 알림. KO 공유 문구에 `와 가장 닮았대`가 포함.
- 공식 사이트 링크 `target="_blank"`, `rel`에 `noopener`.
- 결과 화면 렌더 텍스트에 `MBTI`가 FanMadeNotice의 고지 문장 외에는 없음(고지 영역을 제외한 텍스트로 검사).
- `sendEvent`가 `tool_open`, `input_enter`, `calculate`, `share`로 호출됨.
- `img` 요소가 없음(캐릭터 이미지 금지).

## Acceptance Criteria

```bash
npm run lint && npm test && npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 컴포넌트는 `src/components/tools/chiikawa-personality-test/`, 순수 함수는 `src/lib/utils/`에 있는가?
   - 다른 툴의 컴포넌트·상태를 가져다 쓰지 않았는가? (CLAUDE.md 규칙 8)
   - `'use client'`는 `ChiikawaPersonalityTestTool.tsx`에만 있는가? (규칙 1)
3. 결과에 따라 `phases/18-fun-chiikawa-personality-test/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "컴포넌트 props, 공유 URL 패턴, FanMadeNotice 위치 등 다음 step에 필요한 정보 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 응답을 LocalStorage·URL 쿼리에 저장하지 마라. 이유: 스펙이 메모리 상태만 쓰기로 정했고, 공유 URL에는 캐릭터 id만 담는다.
- 카카오 SDK·이미지 저장(캔버스 캡처 등)을 넣지 마라. 이유: 스펙에서 범위 밖으로 정했다.
- 캐릭터 이미지·`<img>`·외부 이미지 URL을 쓰지 마라. 이유: 권리자 라이선스가 없다.
- 클래스 문자열을 조합하지 마라(`bg-${color}-…`). 이유: Tailwind가 생성하지 못한다 — 데이터의 `cardClassName`/`nameClassName`을 그대로 쓴다.
- 결과에 "당신은 ~한 사람입니다"처럼 단정·진단하는 표현을 쓰지 마라. 이유: 재미용 콘텐츠이며 진단이 아니라고 고지한다 — "~한 편이에요", "~할 수 있어요" 톤을 쓴다.
- `AnalyticsEventName`에 새 이벤트를 추가하지 마라. 이유: 기존 이벤트로 충분하고 GA4 보고서 정의를 바꾸지 않기 위해서다.
- 이 step에서 페이지(`app/`)나 `tools-config.ts`를 수정하지 마라. 이유: 다음 step의 범위다.
- 기존 테스트를 깨뜨리지 마라.

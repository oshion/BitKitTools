# Screen: Baby Temperament Type Quiz

## URL
- 퀴즈 본체: `/baby/temperament-quiz` (EN), `/ko/baby/temperament-quiz` (KO)
- 결과 공유 미리보기(정적, 코드별 16종): `/baby/temperament-quiz/result/{code}` (EN), `/ko/baby/temperament-quiz/result/{code}` (KO) — "공유 기능" 섹션 참고

## 공통 콘텐츠 구조
Title → Tool(연령 선택 → 퀴즈 → 결과) → Description → How To Use → Example → FAQ → Disclaimer(`general`) → Related Tools.

## 목적
아기의 평소 행동 패턴에 대한 20문항에 답하면, Thomas & Chess의 기질(Temperament) 연구 차원을 재구성한 4개 축을 기반으로 16가지 재미있는 "성향 유형"(형용사+명사+이모지) 중 하나를 보여준다. **진단 도구가 아니라 오락/공유 목적의 성향 테스트**이며, 발달선별검사(ASQ, K-DST 등)와 명확히 구분되어야 한다.

## 연령 구간 (3개, 각기 다른 20문항 세트)
- 영아기 (4~12개월)
- 유아기 (13~36개월)
- 유치원기 (37~84개월)
- 연령 선택 UI에서 0~3개월을 선택하면: "이 시기는 아직 기질 차이가 뚜렷하게 나타나기 전이에요. 생후 4개월 이후에 다시 해보세요!" 안내만 표시하고 테스트 진행은 비활성화한다(페이지 자체는 정상 노출, 404 아님).
- 세 구간은 완전히 별도의 20문항 세트를 가진다(문항 예시 표현이 연령별로 달라야 자연스러움 — 영아기는 "낯선 사람을 보면", 유치원기는 "새 유치원 반에 가면" 같은 식).

## 근거 (Thomas & Chess, 1977, New York Longitudinal Study)
9개 원 차원(활동 수준, 규칙성, 접근-회피, 적응력, 반응 강도, 반응 역치, 기분의 질, 주의산만성, 지속성)을 4개 축으로 재구성한다:

| 축 | 원 차원 근거 | 양극 (EN / KO) |
|---|---|---|
| 활동성 | Activity level, Distractibility | Active / 활발한 ↔ Calm / 차분한 |
| 사회성 | Approach–Withdrawal | Social / 사교적인 ↔ Shy / 수줍은 |
| 적응력 | Adaptability | Flexible / 유연한 ↔ Cautious / 신중한 |
| 감정반응 | Intensity of reaction, Threshold of responsiveness | Expressive / 감성적인 ↔ Mellow / 담담한 |

이 매핑은 원 연구의 임상적 프레임(예: "Difficult child")을 그대로 쓰지 않고 **항상 긍정적/중립적 어휘로 재구성**한다. 본문/FAQ에 출처(Thomas A, Chess S. *Temperament and Development*, 1977)를 명시한다.

## 문항 구조
- 연령 구간별 20문항(축당 5문항 — 홀수라 동점이 발생하지 않음)
- 각 문항은 2지선다이며, 선택지 하나가 해당 축의 한쪽 극에 +1을 준다
- 문항 예시(유아기, 적응력 축): "새로운 장소에 가면?" → A) "금방 적응하고 놀기 시작한다"(Flexible) / B) "한동안 부모 옆에서 지켜본다"(Cautious)
- 3개 연령 구간 × 20문항 × EN/KO 전체 문구는 **harness 구현 단계에서 작성**한다 — 이 문서는 프레임워크와 예시만 정의한다. 구현 시 반드시 "정답이 없는 질문"이라는 톤을 유지하고, 어느 한쪽 선택지도 부정적으로 들리지 않도록 both-positive 어휘로 작성한다.

## 결과 로직 (`lib/utils/temperamentQuiz.ts`)
```ts
export type Axis = 'activity' | 'social' | 'adaptability' | 'reactivity'
export type AxisResult = {
  activity: 'active' | 'calm'
  social: 'social' | 'shy'
  adaptability: 'flexible' | 'cautious'
  reactivity: 'expressive' | 'mellow'
}
export type QuizAnswer = { axis: Axis; pole: string }

export function scoreQuiz(answers: QuizAnswer[]): AxisResult
export function getPersonaCode(result: AxisResult): string // e.g. 'active-social-flexible-expressive'
```
- `lib/config/temperamentPersonas.ts`: 16개 조합 → `{ code, emoji, name: { en, ko }, description: { en, ko }, tips: { en: string[], ko: string[] } }` 정적 데이터 테이블. 축 4개 × 2극 조합(2⁴=16)을 전부 정의해야 하며 누락 시 결과 화면이 깨지므로, 유닛 테스트로 16개 코드 전부가 테이블에 존재하고 각 코드에 `tips`가 2~3개씩 채워져 있는지 검증한다.

## 16개 페르소나 예시 (전체는 구현 단계에서 확정)
- `active-social-flexible-expressive` → 🧭 명랑한 모험가 / Cheerful Adventurer
- `calm-shy-cautious-mellow` → 🌙 느긋한 관찰자 / Laid-back Observer
- `calm-shy-flexible-expressive` → 🎨 수줍은 예술가 / Shy Artist
- `active-social-cautious-mellow` → 🧩 신중한 리더 / Careful Leader
- (나머지 12개는 동일한 "형용사+명사+이모지" 패턴으로 구현 단계에서 완성 — 모든 유형은 동등하게 긍정적으로 서술)

## 유형별 육아 팁 (goodness of fit 근거)
결과 카드에 유형별 2~3개의 짧은 육아 팁을 추가한다. 근거는 Thomas & Chess가 온도 이론에 이어 제안한 **"goodness of fit"** 개념(양육 방식을 아이의 타고난 기질에 맞추면 더 좋은 상호작용으로 이어진다는 이론)이다. **이것은 발달 지연을 교정하는 처방이 아니라, 모든 정상적인 기질에 공통적으로 적용되는 양육 팁이라는 점을 항상 전제한다.**

- 팁은 항상 "OO한 아이에게는 이렇게 하면 더 잘 통해요" 톤을 유지하고, "이 아이는 부족하니 이렇게 고쳐야 한다"는 뉘앙스를 절대 쓰지 않는다.
- 예시(신중가/Cautious 축이 강한 유형): "새로운 상황에 적응할 시간을 충분히 주고 조급해하지 마세요", "낯선 활동을 시작하기 전에 미리 설명해주면 안정감을 느껴요".
- 예시(활발한/Active 축이 강한 유형): "활동적인 놀이를 충분히 섞어주면 에너지를 건강하게 발산할 수 있어요", "가만히 앉아있어야 하는 활동 전후로 몸을 움직일 시간을 주세요".
- 예시(수줍은/Shy 축이 강한 유형): "새로운 사람을 만나기 전에 미리 마음의 준비를 시켜주고, 잘 적응했을 때 긍정적으로 표현해주세요".
- 모든 팁 문구는 실제 구현 단계에서 16개 유형 × 2~3개씩 EN/KO로 작성한다.

## 페르소나 이미지 (`opengraph-image.tsx` 방식 재사용, 전용 정적 라우트)
16개 유형마다 시각적으로 구분되는 "타입 카드" 이미지를 만든다. 손그림 일러스트가 아니라, 이번 세션에서 사이트 공통 OG 이미지를 만들 때 쓴 `next/og`의 `ImageResponse`(`src/app/[locale]/opengraph-image.tsx` 참고)와 동일한 기법으로 **코드 기반 카드**를 생성한다.

- 유형별 카드 = 유형 고유 배경색(4개 축 조합에서 결정적으로 파생되는 색상 팔레트, 예: activity+social 조합 → hue, adaptability+reactivity 조합 → 채도/명도 — 16개가 서로 겹치지 않게 시각적으로 구분) + 장식용 배경 패턴(도형) + 큰 이모지 + 유형 이름.
- **Next.js의 `opengraph-image` 파일 컨벤션은 라우트 세그먼트 단위로 생성되며 쿼리스트링을 읽지 않는다.** 따라서 유형별 이미지를 실제 공유 미리보기(카카오톡 등)에 노출하려면 쿼리파라미터가 아니라 **전용 정적 라우트**가 필요하다 — 아래 "공유 기능"의 `/baby/temperament-quiz/result/[code]` 라우트를 참고. `src/app/[locale]/baby/temperament-quiz/result/[code]/opengraph-image.tsx`에 이미지 생성 코드를 두고, `generateStaticParams`로 16개 코드 전부를 정적 생성한다.

## UI 구성 / 애니메이션
- **연령 선택** → (0~3개월이면 안내문구만, 진행 불가) → **문항 카드**를 1개씩 순서대로 보여주며 상단에 진행률 바 표시. 답변 선택 시 부드러운 슬라이드/페이드 전환으로 다음 문항 자동 진입(별도 "다음" 버튼 없이 즉시 전환).
- 마지막 문항 응답 후, 실제 계산은 즉시 끝나지만 **귀여운 로딩 애니메이션**(예: 캐릭터가 통통 튀는 모션, 500~800ms)을 보여준 뒤 결과 카드를 노출한다.
- 결과 카드 등장 시 confetti 또는 이모지 등장 애니메이션 등 아기자기한 연출을 적용한다(`animate-fade-in` 기반 + 추가 장식 애니메이션, 이 툴 전용으로 구현하고 다른 툴 폴더에서 import하지 않는다 — rule 8).
- 결과 카드: 유형 타입 카드 이미지(또는 이모지 배경) + 유형 이름을 크게 표시 + 2~3문장 설명 + **유형별 육아 팁 2~3개**(리스트 형태) + 상시 노출 안내문구("이 유형은 Thomas & Chess의 기질 연구 개념을 재미있게 재구성한 것이며, 임상적 진단이 아닙니다").
- `prefers-reduced-motion: reduce` 사용자는 장식 애니메이션 없이 결과를 즉시 표시한다.

## 공유 기능 (바이럴 루프) — 전용 정적 라우트 `/baby/temperament-quiz/result/[code]`
- 새 라우트: `src/app/[locale]/baby/temperament-quiz/result/[code]/page.tsx` (EN: `/baby/temperament-quiz/result/{code}`, KO: `/ko/baby/temperament-quiz/result/{code}`). `generateStaticParams`는 `routing.locales × 16개 페르소나 코드`의 전체 조합을 반환해 정적으로 전부 빌드한다(다른 툴 페이지들이 `routing.locales`만 반환하는 것과 달리, 여기서는 `locale`과 `code`를 함께 반환해야 한다 — 기존 페이지들처럼 개별 파일에서 명시적으로 전체 조합을 만드는 방식을 따른다).
- 이 페이지는 **퀴즈를 진행하지 않고** 결과 미리보기만 보여준다: 해당 코드의 이모지/유형 이름/설명/육아 팁(전부 `temperamentPersonas.ts`에서 조회) + "당신의 아기는 어떤 유형일까요? 테스트 시작하기" CTA 버튼(클릭 시 `/baby/temperament-quiz`로 이동해 정상적으로 연령 선택부터 퀴즈 진행).
- 같은 라우트 세그먼트에 `opengraph-image.tsx`를 두어(`generateStaticParams`는 `page.tsx`와 동일하게 코드 전체) 유형별 타입 카드 PNG를 정적 생성한다 — 카카오톡 등에 링크를 공유하면 해당 유형의 카드 이미지가 썸네일로 뜬다.
- 퀴즈 결과 카드의 Share 버튼은 이 라우트의 절대 URL(`${SITE_URL}${localeHref(safeLocale, '/baby/temperament-quiz/result/' + code)}`)을 생성해 `navigator.share`(Web Share API) 우선 사용, 미지원 시 `navigator.clipboard`로 폴백 — `height-predictor`/`sleep-schedule`과 동일한 공유 패턴.
- 원시 응답(20개 문항 답변)은 URL의 어디에도 포함하지 않는다 — URL 경로에 노출되는 것은 페르소나 코드(예: `active-social-flexible-expressive`)뿐이다.

## tools-config 항목
- `id`/`slug`: `temperament-quiz`
- `category: 'baby'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'`
- Disclaimer 문구: "이 테스트는 재미를 위한 콘텐츠이며 의학적·심리학적 진단이 아닙니다. 아이의 발달이나 행동에 대해 걱정되는 부분이 있다면 소아과 전문의와 상담하세요."
- 키워드 자기잠식 확인: `growth-percentile`(신체 백분위), `sleep-schedule`(수면 스케줄), `height-predictor`(성인 키 예측)와 목적이 전혀 다름(성향/기질 테스트) — 자기잠식 없음
- FAQ 예:
  - "이 테스트는 실제 발달 검사인가요?" → "아니오"로 시작, ASQ/K-DST 같은 임상 선별검사가 아니며 진단 목적이 아님을 명확히 설명
  - "결과가 매번 다르게 나올 수 있나요?" → 아기의 행동이 시간에 따라 변하거나 부모가 다르게 답하면 결과도 달라질 수 있다는 점을 설명
  - "Thomas & Chess 기질 이론이 무엇인가요?" → 1977년 뉴욕종단연구(NYLS)의 9개 기질 차원 개념을 간단히 소개, 이 테스트는 그중 4개 축을 재미 요소로 재구성했다는 점을 명시

## 상태
- 응답은 세션 내에서만 유지하며 LocalStorage에 저장하지 않는다(매번 새로 하는 것 자체가 재미 요소이므로 opt-in 저장 기능 자체를 만들지 않는다 — `growth-percentile`/`height-predictor`와 다른 정책).

## Analytics 이벤트
`Tool Open`, `Quiz Start`(연령 구간 선택 시), `Quiz Complete`, `Share`

## 금지사항
- 결과를 "정상/비정상", "우수/열등" 등으로 서열화하지 않는다 — 16개 유형은 모두 동등하게 긍정적/중립적으로 서술한다.
- "이 유형이니까 이런 문제가 있다/부족하다/고쳐야 한다"는 식의 결핍-교정형 문구를 쓰지 않는다. 육아 팁은 **goodness of fit 개념에 기반한 "이렇게 하면 더 잘 통해요" 톤만 허용**하며, 발달 지연 시사·교육법 처방(예: "이 유형은 OO 학습지가 필요해요")은 일체 금지한다.
- 임상 발달선별검사(ASQ, K-DST 등)로 오인될 수 있는 표현("진단", "검사 결과 이상 없음", "정상 발달" 등)을 사용하지 않는다 — 반드시 "재미", "참고", "성향" 같은 표현을 쓴다.
- 공유 URL에 페르소나 코드 외의 정보(응답자의 실제 20개 문항 응답, 아기 이름 등)를 노출하지 않는다.
- 0~3개월 구간에서 억지로 문항을 만들어 테스트를 진행시키지 않는다 — 반드시 안내문구로 대체한다.

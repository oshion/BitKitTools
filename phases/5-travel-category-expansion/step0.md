# Step 0: tool-layover-connection-calculator

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 기존 travel 툴의 코드 패턴을 파악하라:

- `/docs/screens/travel-layover-connection-calculator.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. **"스코프 결정" 섹션이 특히 중요하다: 이 문서 작성 시점에는 공항별 MCT 분 단위 값이나 연결유형별 기본값이 확정되어 있지 않다 — 이 step에서 직접 신뢰 가능한 출처로 확인하고 확정해야 한다**)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 2 — 외부 API 호출 금지, 정적 데이터 테이블로만 구현. 규칙 9 configuration-driven 툴 관리)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (파일에서 `flight-delay-compensation` 항목 검색 — 구조 참고용, 아직 수정하지 마라. 그 수정은 step2에서 진행한다)
- `src/lib/config/flightCompensationRules.ts` — 정적 규정/데이터 테이블을 별도 `lib/config/*.ts` 파일로 분리하고 출처(URL, 인용)를 주석/필드로 명시하는 기존 컨벤션을 그대로 따르기 위해 참고하라
- `src/lib/utils/flightDelayCompensation.ts`, `src/lib/utils/flightDelayCompensation.test.ts` — 정적 config를 참조하는 순수 함수 + 테스트 패턴 참고
- `src/components/tools/flight-delay-compensation/FlightDelayCompensationTool.tsx` — 다단계 입력 폼(버튼그룹 선택형) UI 패턴 참고
- `src/hooks/useAnalyticsEvent.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/app/[locale]/travel/flight-delay-compensation/page.tsx` — Server Component 페이지 패턴을 그대로 재사용하라(`generateMetadata`의 `openGraph.images` 필드 포함)

## 작업

### 1. 공항 MCT 데이터 조사 및 확정 (반드시 이 step에서 직접 수행)

**절대 임의의 분 단위 숫자를 지어내지 마라.** 아래 순서로 진행한다:

1. IATA "Recommended Practice 1670 (Minimum Connecting Times)" 및 각 대형 허브 공항(인천 ICN, 나리타/하네다 NRT/HND, 창이 SIN, 히스로 LHR, 프랑크푸르트 FRA, 애틀랜타 ATL, 오헤어 ORD, 두바이 DXB 등 주요 국제선 환승 허브 30~50개)의 **공식 발표 자료 또는 신뢰할 수 있는 항공업계 출처**에서 MCT 분 단위 값을 확인한다.
2. 확인한 값과 출처(공항명, URL 또는 문헌명)를 `lib/config/airportMctData.ts`에 함께 기록한다. 출처를 특정할 수 없는 공항은 목록에서 제외한다(추측으로 채우지 않는다) — 최종 목록이 30개에 못 미치더라도 출처 없는 값보다는 낫다.
3. 목록에 없는 공항을 위한 연결유형별 기본값(국내→국내/국내→국제/국제→국내/국제→국제)도 업계에서 통용되는 일반 권장치를 신뢰 가능한 출처로 확인한 뒤 확정한다.
4. 이 데이터 소싱 과정과 최종 출처 목록을 `phases/5-travel-category-expansion/index.json`의 이 step `summary`에 요약으로 남겨라 — 다음 step들이 참고할 수 있어야 한다.

### 2. `lib/config/airportMctData.ts` (정적 데이터, CLAUDE.md rule 2 — 외부 API 아님)

```ts
export type ConnectionType =
  | 'domestic-domestic'
  | 'domestic-international'
  | 'international-domestic'
  | 'international-international'

export type AirportMctEntry = {
  code: string // IATA 3-letter code
  name: { en: string; ko: string }
  mctMinutesByConnectionType: Partial<Record<ConnectionType, number>>
  sourceName: string
  sourceUrl?: string
}

export const AIRPORT_MCT_DATA: AirportMctEntry[]
export const DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE: Record<ConnectionType, number>
```

### 3. `lib/utils/layoverCalculator.ts` (순수 함수, TDD)

**먼저 테스트를 작성한 뒤 구현하라(CLAUDE.md rule 5).**

```ts
export function evaluateLayoverTime(input: {
  airportCode: string
  connectionType: ConnectionType
  availableMinutes: number
}): { mctMinutes: number; verdict: 'comfortable' | 'tight' | 'below-mct'; isKnownAirport: boolean }
```

- `airportCode`가 `AIRPORT_MCT_DATA`에 있으면 해당 공항의 `mctMinutesByConnectionType[connectionType]`을 사용하고 `isKnownAirport: true`. 없거나 해당 연결유형 값이 없으면 `DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE[connectionType]`을 사용하고 `isKnownAirport: false`.
- `verdict`: `availableMinutes < mctMinutes`이면 `'below-mct'`, `availableMinutes >= mctMinutes * 1.5`이면 `'comfortable'`, 그 사이는 `'tight'`(임계값 1.5배는 합리적 기본값 — 조정 가능하되 근거를 주석에 남겨라).
- `lib/utils/layoverCalculator.test.ts`: 알려진 공항/모르는 공항 각각, 4가지 연결유형, 3가지 verdict 경계값을 포함해 최소 12개 이상의 테스트를 작성한다.

### 4. `components/tools/layover-connection-calculator/LayoverConnectionCalculatorTool.tsx` (Client Component)

- 입력: 환승 공항(검색 가능한 드롭다운 — `AIRPORT_MCT_DATA`에서 필터링, 목록에 없으면 자유 입력 가능하게 하고 이 경우 일반 권장치가 적용됨을 안내) → 연결 유형(4종 라디오/버튼그룹, 자동 추론 없이 사용자가 직접 선택) → 보유 환승시간(분 또는 시간:분 입력)
- 결과: `verdict`를 크고 명확한 단일 텍스트 라벨로 표시(`text-4xl` 급 — 숫자가 아니라 상태 라벨이므로 다른 툴들의 `text-5xl` 숫자 강조와는 다른 방식). **신호등식 초록/빨강 색상 대비를 쓰지 마라** — 중립 색상 + 굵은 텍스트로만 구분한다. 그 아래 "권장 최소환승시간: N분" 보조 정보.
- 알려진 공항이면 `sourceName`/`sourceUrl`을 결과 근처에 출처로 표시. 모르는 공항이면 "이 공항은 데이터베이스에 없어 일반 권장치를 사용합니다" 안내 배지.
- `verdict === 'below-mct'`일 때도 "놓칩니다"처럼 단정하지 말고 "권장 최소시간보다 짧습니다, 서두르세요" 수준으로 표현한다.
- `useAnalyticsEvent`로 `tool_open`, `calculate` 전송.

### 5. `tools-config.ts`에 항목 추가

```ts
{
  id: 'layover-connection-calculator',
  slug: 'layover-connection-calculator',
  category: 'travel',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: ['layover calculator', 'connection time calculator', 'minimum connection time calculator', 'mct calculator', ...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, screens 문서 "tools-config 항목" 참고 */ ],
  relatedToolIds: ['flight-delay-compensation'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/default-en.png',
  status: 'testing',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

`flight-delay-compensation`의 기존 `relatedToolIds`는 이 step에서 건드리지 마라 — step2에서 상호 링크를 추가한다.

### 6. 페이지 (`src/app/[locale]/travel/layover-connection-calculator/page.tsx`, Server Component)

`flight-delay-compensation/page.tsx` 패턴을 그대로 따른다. `generateMetadata`의 `openGraph`에 반드시 `images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`를 포함하라.

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → LayoverConnectionCalculatorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(general)
→ RelatedTools(ToolCardGrid + getRelatedTools('layover-connection-calculator')) → AdSlot(footer)
```

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `evaluateLayoverTime`의 단위 테스트(알려진/모르는 공항, 4가지 연결유형, 3가지 verdict)가 통과하는지 확인한다.
3. `airportMctData.ts`의 모든 항목에 `sourceName`이 채워져 있는지(출처 없는 항목이 없는지) 확인한다.
4. `/travel/layover-connection-calculator`(EN/KO)가 정상 빌드되는지, `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
5. 결과 화면에 "충분합니다/놓칩니다" 같은 단정적 문구나 초록/빨강 신호등식 색상이 없는지 확인한다.
6. 외부 API 호출이 전혀 없는지(전부 정적 데이터 기반인지) 코드로 확인한다(rule 2).
7. 결과에 따라 `phases/5-travel-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약 + MCT 데이터 소싱한 공항 수/출처 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: 신뢰할 수 있는 MCT 출처를 30개 이상 확보하지 못함) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 존재하지 않는 공항별 MCT 수치를 임의로 만들어내지 마라 — 반드시 신뢰 가능한 출처를 확인하고 `sourceName`/`sourceUrl`과 함께 기록한다. 출처를 못 찾은 공항은 목록에서 제외한다.
- "충분합니다/놓칩니다"처럼 결과를 보장하는 단정적 문구를 쓰지 마라 — 항상 참고 정보 톤을 유지한다.
- 실시간 항공편/공항 혼잡도 API를 연동하지 마라(rule 2 위반) — 전부 정적 데이터 기반.
- `verdict` 표시에 신호등식(초록=안전/빨강=위험) 색상 대비를 쓰지 마라.
- `flight-delay-compensation`의 기존 `relatedToolIds` 배열을 이 step에서 건드리지 마라(step2에서 처리).
- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.

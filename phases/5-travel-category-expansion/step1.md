# Step 1: tool-jetlag-recovery-calculator

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 기존 travel 툴의 코드 패턴을 파악하라:

- `/docs/screens/travel-jetlag-recovery-calculator.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. **"출력/로직" 섹션의 `estimatedRecoveryDays` 계수와 "동쪽이 더 어렵다"는 통념은 이 문서 작성 시점에는 근사치일 뿐이며, 이 step에서 신뢰 가능한 수면의학 자료로 검증 후 확정해야 한다**)
- `/docs/screens/travel-layover-connection-calculator.md` (`relatedToolIds`로 상호 연결되는 대상 — step0에서 이미 구현되어 있어야 한다. 아직 없다면 이 step은 `blocked` 처리하라)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 11 면책조항 필수 검토 — 이 툴은 `disclaimerType: 'general'`이지만 수면/기분장애 관련 경미한 안전 문구를 추가로 넣는 예외 케이스다)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (파일에서 `flight-delay-compensation`, `layover-connection-calculator` 항목 검색 — 구조 참고용, 아직 수정하지 마라. 상호링크는 step2에서 진행한다)
- `src/lib/utils/flightDelayCompensation.ts` — 정적 config 기반 순수 함수 + 테스트 패턴 참고
- `src/components/tools/flight-delay-compensation/FlightDelayCompensationTool.tsx`
- `src/hooks/useAnalyticsEvent.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/app/[locale]/travel/flight-delay-compensation/page.tsx` — Server Component 페이지 패턴을 그대로 재사용하라

## 작업

### 1. 회복일수 계수 검증 (반드시 이 step에서 직접 수행)

screens 문서의 계수(서쪽 `timezonesCrossed × 0.5일`, 동쪽 `timezonesCrossed × 0.67일`)는 근사치로 제시된 것이다. 신뢰할 수 있는 수면의학 자료(예: 학술 문헌, NIH/수면의학회 공개 자료)로 "동쪽 이동이 서쪽 이동보다 시차 적응이 더 어렵다"는 통념과 대략적인 계수 범위를 검증하라. 정확히 일치하는 계수를 찾지 못하더라도, **적어도 "동쪽이 더 오래 걸린다"는 방향성 자체는 검증된 근거로 뒷받침되어야 한다.** 검증 결과와 사용한 계수, 출처를 `lib/utils/jetlagCalculator.ts` 상단 주석에 명시하고, 정밀한 학술 계수를 찾지 못했다면 "일반적으로 알려진 근사치"라고 정직하게 서술하라(존재하지 않는 정밀 논문을 지어내지 마라).

### 2. `lib/utils/jetlagCalculator.ts` (순수 함수, TDD)

**먼저 테스트를 작성한 뒤 구현하라(CLAUDE.md rule 5).**

```ts
export function calculateJetlag(input: {
  originUtcOffsetHours: number
  destinationUtcOffsetHours: number
}): { timezonesCrossed: number; direction: 'eastward' | 'westward' | 'none'; estimatedRecoveryDays: number }
```

- `timezonesCrossed`: 두 오프셋 차이의 절댓값. 단, 12시간을 초과하면 `24 - |diff|`로 보정한다(경도상 실제 최단 방향을 근사).
- `direction`: 목적지가 출발지보다 동쪽이면 `'eastward'`, 서쪽이면 `'westward'`, 오프셋이 같으면 `'none'`. 이 판정이 지구가 둥글기 때문에 항상 자명하지 않다는 점을 FAQ에 근사임을 명시한다(위 "경쟁사 리서치 요약"/screens 문서 참고).
- `estimatedRecoveryDays`: `timezonesCrossed`에 방향별 계수를 곱해 계산(위 "회복일수 계수 검증"에서 확정한 계수 사용). `direction === 'none'`이면 0을 반환한다.
- `lib/utils/jetlagCalculator.test.ts`: 동쪽/서쪽/오프셋 동일 각각의 정상 케이스, 12시간 초과 보정 케이스, 회복일수가 방향에 따라 다르게 계산되는지 확인하는 케이스를 포함해 최소 10개 이상의 테스트를 작성한다.

### 3. `components/tools/jetlag-recovery-calculator/JetlagRecoveryCalculatorTool.tsx` (Client Component)

- 입력: 출발지 시간대 / 도착지 시간대(도시 검색 드롭다운 또는 UTC 오프셋 직접 입력 — MVP는 UTC 오프셋 직접 입력만으로도 충분하며 도시 드롭다운은 선택적으로 추가), (선택) 평소 취침/기상 시각.
- 결과: 예상 회복일수를 큰 숫자로(`text-5xl font-bold text-[#f59e0b] tabular-nums`), 이동 방향(동/서) 배지.
- **일자별 가이드(정적 템플릿)**: 3~5일치 일반 가이드를 방향(동/서)별로 다르게 세로 타임라인 형태로 나열한다(아코디언이 아니라 타임라인 UI — screens 문서 디자인 방향 참고). **개인 맞춤 정밀 빛노출 스케줄(시각 단위)은 만들지 마라** — 일반적 수준의 가이드 텍스트로 제한한다.
- `useAnalyticsEvent`로 `tool_open`, `calculate` 전송.

### 4. `tools-config.ts`에 항목 추가

Disclaimer는 일반 `general` 문구에 더해 이 툴 전용 문단을 페이지 본문에 추가로 노출한다(공통 `<DisclaimerBanner disclaimerType="general" />`는 그대로 두고, 그 근처에 별도 문단으로): "수면장애나 기분장애가 있다면 빛노출 습관을 크게 바꾸기 전 전문의와 상담하세요."

```ts
{
  id: 'jetlag-recovery-calculator',
  slug: 'jetlag-recovery-calculator',
  category: 'travel',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, screens 문서 "tools-config 항목" 참고 — "왜 동쪽이 더 힘든가" FAQ 필수 포함, 출처 서술 */ ],
  relatedToolIds: ['flight-delay-compensation', 'layover-connection-calculator'],
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

`flight-delay-compensation`/`layover-connection-calculator`의 기존 `relatedToolIds`는 이 step에서 건드리지 마라 — step2에서 상호 링크를 정리한다.

### 5. 페이지 (`src/app/[locale]/travel/jetlag-recovery-calculator/page.tsx`, Server Component)

`flight-delay-compensation/page.tsx` 패턴을 그대로 따른다. `generateMetadata`의 `openGraph`에 반드시 `images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`를 포함하라.

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → JetlagRecoveryCalculatorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → 이 툴 전용 안전 문단(위 확인) + DisclaimerBanner(general)
→ RelatedTools(ToolCardGrid + getRelatedTools('jetlag-recovery-calculator')) → AdSlot(footer)
```

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `calculateJetlag`의 단위 테스트(동쪽/서쪽/동일, 12시간 초과 보정)가 통과하는지 확인한다.
3. `/travel/jetlag-recovery-calculator`(EN/KO)가 정상 빌드되는지, `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
4. "이 가이드만 따르면 시차 적응이 보장된다"는 식의 단정적 표현이 없는지 확인한다.
5. 시각 단위의 정밀 빛노출 스케줄(Timeshifter 수준)이 만들어지지 않았는지 확인한다 — 정적 일자별 텍스트 가이드 수준인지.
6. 수면장애/기분장애 관련 안전 문구가 페이지 본문에 실제로 노출되는지 확인한다.
7. 결과에 따라 `phases/5-travel-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약 + 회복일수 계수 검증 결과/출처 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: step0 미완료로 `layover-connection-calculator`가 존재하지 않음) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Timeshifter 수준의 시각 단위 정밀 빛노출 스케줄을 만들지 마라 — 스코프를 일반 가이드 텍스트로 제한한다.
- 회복일수 계수나 "동쪽이 더 어렵다"는 통념을 검증 없이 확정 수치로 제시하지 마라 — 신뢰 가능한 자료로 확인 후 출처와 함께 기록한다. 존재하지 않는 정밀 논문을 지어내지 마라.
- "이 방법을 따르면 시차 적응이 보장된다"는 식의 단정적 표현을 쓰지 마라.
- `flight-delay-compensation`/`layover-connection-calculator`의 기존 `relatedToolIds` 배열을 이 step에서 건드리지 마라(step2에서 처리).
- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.

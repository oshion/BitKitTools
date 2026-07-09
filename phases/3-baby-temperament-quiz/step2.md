# Step 2: tools-config-page

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 step 산출물을 파악하라:

- `/docs/screens/baby-temperament-quiz.md` (이 phase 전체의 1차 스펙 — "tools-config 항목", "근거" 섹션 특히)
- `/docs/ARCHITECTURE.md` (tools-config 스키마)
- `/CLAUDE.md` (CRITICAL 규칙 9: Configuration-driven, 11: 면책조항 필수 검토, 15: SEO 메타데이터 자동 생성)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/tools/temperament-quiz/TemperamentQuizTool.tsx` (이전 step 산출물 — export 형태를 확인하고 import해서 페이지에 연결하라)
- `src/app/[locale]/baby/growth-percentile/page.tsx`, `src/app/[locale]/baby/sleep-schedule/page.tsx` (페이지 구조 패턴 — 동일하게 따른다)
- `src/app/[locale]/baby/growth-percentile/page.tsx`의 `generateMetadata` 안 `openGraph` 블록에서 **`images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`** 필드를 확인하라 — 이번 세션에 사이트 전역으로 추가된 컨벤션이다. 새로 만드는 `page.tsx`의 `openGraph`에도 동일하게 포함해야 한다.

## 작업

### 1. `tools-config.ts`에 항목 추가

```ts
{
  id: 'temperament-quiz',
  slug: 'temperament-quiz',
  category: 'baby',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 4개, 아래 참고 */ ],
  relatedToolIds: ['growth-percentile', 'sleep-schedule'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/temperament-quiz.png',
  status: 'testing',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

- `disclaimerType`은 `'general'`이다(진단 도구가 아닌 오락/참고 콘텐츠 — screens 문서 참고). `DisclaimerBanner`는 이미 `general` 타입을 지원하므로 별도 컴포넌트 수정은 필요 없다. `src/lib/i18n/messages/en.json`/`ko.json`의 `disclaimer.general` 문구가 이 툴에 맞는 일반적인 톤인지 확인하고, 너무 다르면(예: 계산기류에 맞춰진 문구라 성향 테스트에 안 맞으면) 이 페이지 본문에 screens 문서의 disclaimer 문구("이 테스트는 재미를 위한 콘텐츠이며 의학적·심리학적 진단이 아닙니다...")를 별도 문단으로 추가하는 것도 고려하라.
- FAQ에는 반드시 다음을 포함한다(완성된 EN/KO 문장으로):
  - "이 테스트는 실제 발달 검사인가요?" → "아니오"로 시작, ASQ/K-DST 같은 임상 선별검사가 아니며 진단 목적이 아님을 명확히 설명
  - "결과가 매번 다르게 나올 수 있나요?" → 아기 행동 변화나 응답 차이에 따라 결과가 달라질 수 있음을 설명
  - "Thomas & Chess 기질 이론이 무엇인가요?" → 1977년 뉴욕종단연구(NYLS)의 9개 기질 차원 개념 소개, 이 테스트는 그중 4개 축을 재구성했다는 점 명시
  - "몇 살부터 할 수 있나요?" → 생후 4개월부터 가능하며, 그 이전은 기질 차이가 뚜렷하지 않아 지원하지 않는다는 점 설명
- `growth-percentile`과 `sleep-schedule`의 기존 `relatedToolIds` 배열에 `'temperament-quiz'`를 상호 추가하라.

### 2. 페이지 (`src/app/[locale]/baby/temperament-quiz/page.tsx`, Server Component)

`growth-percentile`/`sleep-schedule` 페이지의 공통 패턴을 그대로 따르되, `generateMetadata`의 `openGraph`에 **반드시** 아래 필드를 포함하라:

```ts
openGraph: {
  title: `${tool.title[safeLocale]} — BitKitTools`,
  description: tool.description[safeLocale],
  url: canonical,
  siteName: 'BitKitTools',
  type: 'website',
  images: [{ url: `${SITE_URL}/og/default-${safeLocale}.png`, width: 1200, height: 630 }],
},
```

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → TemperamentQuizTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(general)
→ RelatedTools(ToolCardGrid + getRelatedTools('temperament-quiz')) → AdSlot(footer)
```

**How To Use 방향**: "1) 아기의 연령 구간을 선택한다(4개월 미만은 이용 불가) 2) 20개 문항에 순서대로 응답한다 3) 결과로 나온 성향 유형과 육아 팁을 확인한다 4) 마음에 들면 결과를 친구에게 공유한다".

**Example 콘텐츠**: 실제 페르소나 하나(`temperamentPersonas.ts`에서 하나 선택, 예: "명랑한 모험가")를 예시로 들어 어떤 응답 패턴이면 이 유형이 나오는지 간단히 설명하는 문단 1개.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `/baby/temperament-quiz`(EN/KO)이 정상 빌드되는지 확인하고, 빌드 결과물(`out/`)에서 해당 페이지의 `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
3. `disclaimerType: 'general'`이 정확히 반영됐는지, FAQ 4개가 완성된 문장으로 들어갔는지 확인한다.
4. `growth-percentile`/`sleep-schedule`의 `relatedToolIds`에 `temperament-quiz`가 상호 추가됐는지 확인한다.
5. 홈페이지(`/`, `/ko`)와 `/baby` 카테고리 페이지를 빌드해 `temperament-quiz`가 정상 노출되는지, `sitemap.xml`에 포함되는지 확인한다.
6. 결과에 따라 `phases/3-baby-temperament-quiz/index.json`의 `step 2`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "tools-config 항목 및 page.tsx 산출물 요약"`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라(사이트 전역 컨벤션).
- disclaimerType을 `general`이 아닌 다른 값으로 바꾸지 마라(screens 문서에서 명시적으로 결정된 값이다).
- FAQ나 설명 문구에 "진단", "검사 결과 이상 없음", "정상 발달" 등 임상 선별검사로 오인될 수 있는 표현을 쓰지 마라.
- 다른 카테고리(developer/travel/beer) 툴의 FAQ/설명 문구를 복붙하지 마라 — `temperament-quiz` 고유의 콘텐츠로 작성한다.
- 기존 테스트를 깨뜨리지 마라.

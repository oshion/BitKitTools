# Step 7: tool-baby-sleep-schedule

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/baby-sleep-schedule.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마, 면책조항 시스템)
- `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 12: YMYL 콘텐츠 신중 처리)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`, `src/hooks/useLocalStorage.ts`
- `src/app/[locale]/baby/growth-percentile/` (이전 step 산출물 — 페이지 구조 패턴 확인용, 이 step이 `1-mvp-tools` task의 마지막 step이므로 전체 홈/카테고리 페이지가 8개 툴 전부로 채워지는지도 함께 확인)

## 작업

### 1. `lib/config/sleepGuidelines.ts` (정적 데이터)

연령 구간(신생아~24개월)별 권장 낮잠 횟수, wake window(깨어있는 시간) 길이, 총 수면 시간을 정적 데이터로 정의한다. 일반적으로 통용되는 소아수면 가이드라인 출처를 주석으로 명시한다.

### 2. `lib/utils/sleepSchedule.ts` (순수 함수)

```ts
export type SleepInput = { ageMonths: number; wakeUpTime: string; lastNapEndTime?: string }
export function calculateSleepSchedule(input: SleepInput): { naps: Array<{ start: string; end: string }>; bedtime: string }
```

`sleepGuidelines.ts`의 연령 구간 데이터를 참조해 오늘의 낮잠/취침 타임라인을 계산한다.

### 3. `components/tools/sleep-schedule/SleepScheduleTool.tsx` (Client Component)

- 개월수/주령, 오늘 기상 시각 입력, (선택) 마지막 낮잠 종료 시각
- 결과를 시각적 타임라인(막대/타임라인 컴포넌트)으로 표시
- "일반적 가이드라인이며 개별 아기 상태에 따라 다를 수 있음" 문구 상시 노출
- 연령 구간이 바뀌면 해당 구간의 일반적 패턴 요약 텍스트를 입력 옆에 표시
- 최근 입력값(개월수, 기상 시각)은 `useLocalStorage`로 저장 가능하되, `growth-percentile` 툴과 동일하게 **opt-in 방식**(기본값 off)으로 한다 — 아동 관련 정보이므로 사용자에게 명시적으로 안내한다.
- `useAnalyticsEvent`로 `tool_open`, `calculate`, `share`(타임라인 공유) 전송 — 개인 식별 가능한 입력값은 payload에 포함하지 않는다.

### 4. `tools-config.ts`에 항목 추가

```ts
{
  id: 'sleep-schedule',
  slug: 'sleep-schedule',
  category: 'baby',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['growth-percentile'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/sleep-schedule.png',
  status: 'testing',
  disclaimerType: 'medical',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ 방향: "Wake window란?", "낮잠을 안 자려고 하면 어떻게 하나요?"(일반적인 팁 + 지속되면 소아과 상담 권장으로 답변), "월령이 바뀌면 언제 스케줄을 조정해야 하나요?" — 실제 완성 문장으로.

### 5. 페이지 (`src/app/[locale]/baby/sleep-schedule/page.tsx`, Server Component)

콘텐츠 순서는 `tool-json-formatter` step 공통 패턴을 그대로 따른다:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → SleepScheduleTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(medical)
→ RelatedTools(ToolCardGrid + getRelatedTools('sleep-schedule')) → AdSlot(footer)
```

**How To Use 방향**: "1) 아기의 개월수(또는 주령)를 입력한다 2) 오늘 기상 시각을 입력한다 3) 필요시 마지막 낮잠 종료 시각을 입력한다 4) 오늘의 낮잠/취침 타임라인을 확인한다".

**Example 콘텐츠**: 연령대별(예: 4개월 vs 12개월) 낮잠 패턴 차이를 비교하는 정적 표 포함.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `calculateSleepSchedule`의 단위 테스트(여러 연령 구간)가 통과하는지 확인한다.
3. `/baby/sleep-schedule`(EN/KO)이 정상 빌드되는지 확인한다.
4. 특정 수면 문제(수면 퇴행, 야간 각성 등)에 대한 진단성 처방 문구가 없는지 확인한다.
5. LocalStorage 저장이 기본값 off(opt-in)인지 확인한다.
6. **이 task(`1-mvp-tools`)의 마지막 step이므로**, 홈 페이지(`/`, `/ko`)와 4개 카테고리 페이지를 직접 빌드해 8개 툴 전부가 `tools-config.ts` 기반으로 정상 노출되는지, `sitemap.xml`에 8개 툴 × 2개 locale URL이 전부 포함되는지 최종 확인한다.
7. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Baby Sleep Schedule Calculator 툴 완성. lib/config/sleepGuidelines.ts, lib/utils/sleepSchedule.ts, components/tools/sleep-schedule/, tools-config.ts에 항목 추가(disclaimerType: medical), app/[locale]/baby/sleep-schedule/page.tsx. growth-percentile과 상호 relatedToolIds 연결 완료. MVP 8개 툴 전체 완성 — 홈/카테고리/sitemap에서 8개 전부 확인됨."`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- 특정 수면 문제(수면 퇴행, 야간 각성 등)에 대한 의학적 처방/진단성 조언을 제공하지 마라 — 일반 가이드라인 수준으로 제한하고 전문가 상담으로 안내한다.
- 아기의 개인 정보(개월수, 기상 시각)를 사용자 동의 없이 LocalStorage에 자동 저장하지 마라 — opt-in 방식이어야 한다.
- 다른 툴 폴더를 import하지 마라.
- How To Use/FAQ/Example을 다른 툴과 동일한 문구로 복붙하지 마라.

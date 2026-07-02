# Step 4: analytics-cmp-integration

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (CRITICAL 규칙 4: 환경변수 보안)
- `/docs/ARCHITECTURE.md` (Analytics, 광고/CLS 방지 섹션)
- `/docs/ADR.md` (ADR-013: CMP 무료 서드파티 스크립트)
- `/BitKitTools-project-profile-v2.md` (Section 6-3 CMP, Section 7 광고 최적화, Section 11 Analytics)
- `src/app/layout.tsx`, `src/app/[locale]/layout.tsx` (Step 1 산출물)
- `src/components/ui/AdSlot.tsx` (Step 3 산출물 — 이 step에서 확장한다)

## 작업

### 1. 환경변수 자리 마련

`.env.example` 파일을 생성해 아래 키를 값 없이 나열한다 (실제 `.env`/`.env.local`은 이미 `.gitignore`로 제외되어 있다):

```
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GSC_VERIFICATION=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_CMP_SITE_ID=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
```

이 값들은 아직 실제 계정이 없으므로 전부 비어 있는 상태에서 빌드가 정상적으로 성공해야 한다.

### 2. CMP(쿠키 동의) 스크립트 삽입

`src/app/layout.tsx`(루트) 또는 `src/app/[locale]/layout.tsx`에 CMP 스크립트 삽입 지점을 만든다:

```ts
// components/analytics/ConsentManager.tsx (Client Component)
```

`NEXT_PUBLIC_CMP_SITE_ID`가 비어 있으면 스크립트를 로드하지 않는다(가드 처리). 값이 있을 때만 CookieYes(또는 대체 무료 CMP) 스크립트 태그를 삽입한다. Google Consent Mode v2 초기화(`gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ... })`)를 CMP 스크립트보다 먼저 실행되도록 배치한다.

### 3. GA4 / Search Console / Clarity 연동

```ts
// components/analytics/AnalyticsScripts.tsx (Client Component)
```

`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`가 있을 때만 각 스크립트를 로드한다. GA4는 CMP의 동의 이벤트를 구독해 `gtag('consent', 'update', {...})`로 동의 상태를 갱신하도록 연동한다(동의 전에는 비개인화 상태 유지).

### 4. `hooks/useAnalyticsEvent.ts`

```ts
export function useAnalyticsEvent(): {
  sendEvent: (name: 'tool_open' | 'calculate' | 'copy_result' | 'share', payload?: Record<string, string | number>) => void
}
```

`window.gtag`가 없으면(스크립트 미로딩·동의 전) 아무 동작도 하지 않는 안전한 no-op이어야 한다. `1-mvp-tools` task의 각 툴 컴포넌트가 이 훅을 사용한다.

### 5. `AdSlot` 확장 — Lazy Loading 광고 스크립트

`src/components/ui/AdSlot.tsx`(Step 3 산출물)를 확장해, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`가 있을 때만 `adsbygoogle` 스크립트를 뷰포트 진입 시점(IntersectionObserver 또는 `next/dynamic` lazy import)에 로드한다. 값이 없으면 지금처럼 스켈레톤 플레이스홀더만 유지한다(레이아웃/CLS는 이미 Step 3에서 고정됨).

## Acceptance Criteria

```bash
npm run build   # 환경변수가 전부 비어있는 상태에서도 에러 없이 성공해야 함
npm run lint
npm test
```

## 검증 절차

1. `.env`, `.env.local` 파일 없이(즉 모든 `NEXT_PUBLIC_*` 값이 undefined인 상태) 위 AC 커맨드를 실행해 정상 통과하는지 확인한다.
2. `useAnalyticsEvent`의 `sendEvent`가 `window.gtag`가 없는 환경(테스트 환경 등)에서 에러를 던지지 않는지 테스트로 확인한다.
3. CMP 동의 전에는 GA4/Clarity 스크립트 태그가 DOM에 삽입되지 않는지 확인한다.
4. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "CMP(ConsentManager)/GA4·Clarity(AnalyticsScripts)/useAnalyticsEvent 훅 추가, AdSlot에 Lazy 광고 로딩 연동. 전부 NEXT_PUBLIC_* 환경변수 미설정 시 안전하게 no-op. .env.example 생성."`
   - 실패/blocked 처리는 Step 0과 동일한 기준을 따른다.

## 금지사항

- 실제 AdSense/GA4/Clarity/CMP ID 값을 코드에 하드코딩하지 마라. 이유: 아직 해당 계정들이 승인/생성되지 않았고(`TODO.md` 참고), 값은 배포 시점에 서버 환경변수로 주입되어야 한다.
- 사용자 동의(Consent Mode) 이전에 광고/분석 스크립트가 로드되게 하지 마라. 이유: `BitKitTools-project-profile-v2.md` Section 6-3 위반이며 EEA/UK 트래픽에서 법적 리스크가 된다.
- `useAnalyticsEvent`의 payload에 개인 식별 가능한 값(입력값 원본 등)을 담지 마라. 이유: `docs/screens/*.md`의 여러 툴(BAC, Baby 등)이 이 훅을 사용하는데, 민감 정보가 analytics로 새 나가면 안 된다.

# Step 0: event-type-and-hook-test

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/src/types/analytics.ts`
- `/src/hooks/useAnalyticsEvent.ts`
- `/src/hooks/useAnalyticsEvent.test.ts`

이 프로젝트는 GA4 이벤트로 `tool_open`/`calculate`/`copy_result`/`share` 4개를 이미 쓰고 있다. 이번 phase의 목적은 "tool 페이지를 열기만 했는지" vs "실제로 입력을 시작했는지"를 구분하는 신호(`input_enter`)를 추가하는 것이다. `convert_click`/`download_click`은 각각 기존 `calculate` 이벤트와 중복되거나 현재 대응하는 기능이 없어 추가하지 않기로 결정됐다 — 이 step 및 이후 step들에서 그 두 이벤트를 추가하지 마라.

## 작업

- `src/types/analytics.ts`의 `AnalyticsEventName` 유니온 타입에 `'input_enter'`를 추가한다.
- `src/hooks/useAnalyticsEvent.test.ts`에 기존 테스트 패턴(`it('calls window.gtag with event name and payload when gtag is available', ...)` 등)과 동일한 스타일로 `input_enter` 이벤트 발행을 검증하는 테스트를 최소 1개 추가한다.

`input_enter`의 의미: 사용자가 tool 페이지에서 **처음으로** 입력 필드와 상호작용한 순간(예: 첫 `onChange`/입력값 변경) 딱 한 번만 발생해야 하는 이벤트다. 이 step은 타입/훅 테스트만 다루고, 실제 tool 컴포넌트에 이 이벤트를 심는 작업은 이후 step 1~4(카테고리별)에서 진행한다 — 이 step에서 tool 컴포넌트 파일을 수정하지 마라.

## Acceptance Criteria

```bash
npm run build
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `AnalyticsEventName`에 `'input_enter'`만 추가됐는가? (`convert_click`/`download_click`은 추가하지 않았는가?)
   - 기존 4개 이벤트 값을 변경/제거하지 않았는가?
3. 결과에 따라 `phases/9-ga4-input-enter-event/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 step에서 `src/components/tools/**` 아래 tool 컴포넌트를 수정하지 마라. 이유: 스코프가 이후 step들로 나뉘어 있다.
- `convert_click`, `download_click` 이벤트를 추가하지 마라. 이유: `calculate`와 중복되거나(convert_click) 현재 대응하는 기능이 없다(download_click) — 사용처 없는 코드를 만들지 않는다.
- 기존 테스트를 깨뜨리지 마라.

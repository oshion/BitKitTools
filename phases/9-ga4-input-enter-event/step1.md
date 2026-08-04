# Step 1: instrument-developer-tools

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/src/types/analytics.ts` (이전 step에서 `'input_enter'` 추가됨)
- `/src/hooks/useAnalyticsEvent.ts`
- `/src/components/tools/password-generator/PasswordGeneratorTool.tsx`
- `/src/components/tools/jwt-decoder/JwtDecoderTool.tsx`
- `/src/components/tools/json-to-sql/JsonToSqlTool.tsx`
- `/src/components/tools/json-formatter/JsonFormatterTool.tsx`

## 작업

개발자 카테고리 4개 tool 컴포넌트 각각에 `input_enter` 이벤트를 계측한다: `PasswordGeneratorTool.tsx`, `JwtDecoderTool.tsx`, `JsonToSqlTool.tsx`, `JsonFormatterTool.tsx`.

각 컴포넌트마다:

- 사용자가 **처음으로** 의미 있는 입력을 하는 지점(예: 텍스트 입력 필드의 첫 `onChange`, 옵션 토글의 첫 변경 등 — 컴포넌트마다 가장 이른 사용자 입력 지점을 판단해서 고른다)에서 `sendEvent('input_enter')`를 호출한다.
- **정확히 한 번만** 발생해야 한다 — `useRef<boolean>(false)`로 "이미 발생시켰는지" 가드를 두고, 이벤트를 보내기 전에 체크 후 `true`로 설정한다. 이미 `true`면 재발생시키지 않는다.
- 컴포넌트가 이미 다른 이벤트(`tool_open`, `calculate` 등)를 어떤 패턴으로 호출하고 있는지 먼저 확인하고, 그 기존 패턴(예: `useAnalyticsEvent()` 훅 임포트 위치, `sendEvent` 호출 스타일)을 그대로 따른다.
- 각 tool에 대해 "입력 시작 시 `input_enter`가 정확히 한 번만 발생하고, 이후 추가 입력에는 재발생하지 않는다"를 검증하는 컴포넌트 테스트를 최소 1개씩 추가한다(React Testing Library `render`/`fireEvent` + `window.gtag` mock 패턴 — `src/hooks/useAnalyticsEvent.test.ts`의 mock 설정 방식을 참고).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 4개 tool 전부에 `input_enter`가 정확히 한 번만 발생하도록 가드가 걸려 있는가?
   - 각 tool마다 이 동작을 검증하는 테스트가 추가됐는가?
   - 기존 `tool_open`/`calculate`/`copy_result`/`share` 이벤트 호출 로직을 건드리지 않았는가?
3. 결과에 따라 `phases/9-ga4-input-enter-event/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 step에서 beer/travel/baby 카테고리 tool을 수정하지 마라(다음 step들의 스코프).
- `input_enter`가 키 입력마다 반복 발생하게 만들지 마라 — 반드시 컴포넌트당 1회로 제한한다.
- 기존 이벤트 호출 로직이나 기존 테스트를 깨뜨리지 마라.

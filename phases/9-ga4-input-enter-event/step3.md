# Step 3: instrument-travel-tools

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 이전 step들의 계측 패턴을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/src/types/analytics.ts`
- `/src/hooks/useAnalyticsEvent.ts`
- 이전 step에서 계측된 `/src/components/tools/bac-calculator/BacCalculatorTool.tsx` 를 열어서 `input_enter` 계측 패턴(가드 방식, 테스트 작성 방식)을 확인한다.
- `/src/components/tools/visa-requirement-checker/VisaRequirementCheckerTool.tsx`
- `/src/components/tools/layover-connection-calculator/LayoverConnectionCalculatorTool.tsx`
- `/src/components/tools/jetlag-recovery-calculator/JetlagRecoveryCalculatorTool.tsx`
- `/src/components/tools/flight-delay-compensation/FlightDelayCompensationTool.tsx`

## 작업

여행 카테고리 4개 tool 컴포넌트 각각에 `input_enter` 이벤트를 계측한다: `VisaRequirementCheckerTool.tsx`, `LayoverConnectionCalculatorTool.tsx`, `JetlagRecoveryCalculatorTool.tsx`, `FlightDelayCompensationTool.tsx`.

이전 step들과 동일한 패턴을 따른다:

- 각 컴포넌트에서 사용자가 **처음으로** 의미 있는 입력을 하는 지점에 `sendEvent('input_enter')`를 호출한다(드롭다운 선택, 날짜 입력, 국가 선택 등 tool마다 첫 입력 지점이 다를 수 있으니 각 컴포넌트를 직접 확인해서 판단한다).
- `useRef<boolean>(false)` 가드로 컴포넌트당 **정확히 한 번만** 발생하도록 한다.
- `VisaRequirementCheckerTool.tsx`는 `disclaimerType: 'legal'`이 적용된 YMYL 성격 tool이다 — `input_enter` 계측이 기존 `DisclaimerBanner` 렌더링이나 `unknown` 상태 처리 로직에 영향을 주지 않도록 순수하게 이벤트 발행 로직만 추가한다.
- 각 tool마다 "입력 시작 시 `input_enter`가 정확히 한 번만 발생" 테스트를 최소 1개씩 추가한다.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 4개 tool 전부에 `input_enter` 1회 발생 가드가 걸려 있는가?
   - `VisaRequirementCheckerTool.tsx`의 기존 disclaimer/unknown 상태 처리 로직이 그대로 유지되는가?
   - 각 tool마다 검증 테스트가 추가됐는가?
3. 결과에 따라 `phases/9-ga4-input-enter-event/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 step에서 developer/beer/baby 카테고리 tool을 수정하지 마라.
- `VisaRequirementCheckerTool.tsx`의 disclaimer 표시 로직이나 `unknown` 안전 폴백 로직을 변경하지 마라.
- `input_enter`가 컴포넌트당 1회를 넘어 반복 발생하게 만들지 마라.
- 기존 테스트를 깨뜨리지 마라.

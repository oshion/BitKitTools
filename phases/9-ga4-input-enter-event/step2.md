# Step 2: instrument-beer-tools

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 이전 step의 계측 패턴을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/src/types/analytics.ts`
- `/src/hooks/useAnalyticsEvent.ts`
- 이전 step에서 계측된 `/src/components/tools/password-generator/PasswordGeneratorTool.tsx` 또는 `/src/components/tools/json-formatter/JsonFormatterTool.tsx` 중 하나를 열어서 `input_enter` 계측 패턴(가드 방식, 테스트 작성 방식)을 확인한다.
- `/src/components/tools/standard-drinks-calculator/StandardDrinksCalculatorTool.tsx`
- `/src/components/tools/hydrometer-temperature-correction/HydrometerCorrectionTool.tsx`
- `/src/components/tools/homebrew-recipe-calculator/HomebrewRecipeCalculatorTool.tsx`
- `/src/components/tools/bac-calculator/BacCalculatorTool.tsx`

## 작업

맥주 카테고리 4개 tool 컴포넌트 각각에 `input_enter` 이벤트를 계측한다: `StandardDrinksCalculatorTool.tsx`, `HydrometerCorrectionTool.tsx`, `HomebrewRecipeCalculatorTool.tsx`, `BacCalculatorTool.tsx`.

이전 step(개발자 카테고리)에서 사용한 것과 동일한 패턴을 따른다:

- 각 컴포넌트에서 사용자가 **처음으로** 의미 있는 입력을 하는 지점에 `sendEvent('input_enter')`를 호출한다.
- `useRef<boolean>(false)` 가드로 컴포넌트당 **정확히 한 번만** 발생하도록 한다.
- 기존 이벤트 호출 스타일(훅 임포트 위치, `sendEvent` 사용 패턴)을 그대로 따른다.
- **`BacCalculatorTool.tsx`는 특히 주의**: 이 tool은 `BacSafetyWarning.tsx`와 함께 ADR-014에 따라 config로 끌 수 없는 고정 안전장치가 적용된 컴포넌트다. `input_enter` 계측이 이 안전장치 로직(상시 노출 경고 배너 등)에 영향을 주지 않도록 순수하게 이벤트 발행 로직만 추가한다.
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
   - `BacCalculatorTool.tsx`의 기존 안전장치 로직(경고 배너 등)이 그대로 유지되는가?
   - 각 tool마다 검증 테스트가 추가됐는가?
3. 결과에 따라 `phases/9-ga4-input-enter-event/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 step에서 developer/travel/baby 카테고리 tool을 수정하지 마라.
- `BacCalculatorTool.tsx`의 안전장치(경고 배너, 표현 제한 로직)를 약화시키거나 우회하지 마라. 이유: ADR-014에 따라 의도적으로 config로 끌 수 없게 고정된 로직이다.
- `input_enter`가 컴포넌트당 1회를 넘어 반복 발생하게 만들지 마라.
- 기존 테스트를 깨뜨리지 마라.

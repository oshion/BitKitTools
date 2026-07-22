# Step 2: flight-delay-compensation-enhancements

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이 툴의 기존 구현과 이번 확장 스펙을 완전히 파악하라:

- `/docs/screens/travel-flight-delay-compensation.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. **"혼란 유형별 계산 로직 차이" 섹션이 이 step의 핵심이다. 특히 미국 DOT 탑승거부 상한액은 이 문서에도 아직 확정되어 있지 않다 — 반드시 14 CFR § 250.5 원문(eCFR, https://www.law.cornell.edu/cfr/text/14/250.5)에서 직접 재확인해서 하드코딩하라. 웹 검색 요약만 보고 값을 정하지 마라(문서 내 경고 참고: 출처마다 $675/$1,350 vs $1,075/$2,150 등 다른 값이 나왔다)**)
- `/docs/screens/travel-layover-connection-calculator.md`, `/docs/screens/travel-jetlag-recovery-calculator.md` (이 step에서 상호 링크를 거는 대상 툴 — step0/step1에서 이미 구현되어 있어야 한다. 아직 없다면 이 step은 `blocked` 처리하라)
- `/CLAUDE.md` (CRITICAL 규칙 12 YMYL 콘텐츠 신중 처리 — 이 툴은 `disclaimerType: 'legal'`)
- `src/lib/config/flightCompensationRules.ts` — **기존 구현을 완전히 이해한 뒤 확장하라. 기존 `EU261`/`US_DOT`의 지연/취소 관련 필드나 로직을 절대 변경하지 마라(하위 호환 유지, 기존 테스트를 깨뜨리면 안 된다) — 탑승거부는 완전히 새로운 필드/함수로 추가한다**
- `src/lib/utils/flightDelayCompensation.ts`, `src/lib/utils/flightDelayCompensation.test.ts`
- `src/components/tools/flight-delay-compensation/FlightDelayCompensationTool.tsx` — **`handleShare`가 폼 상태를 URL 쿼리파라미터로 인코딩하는 기존 패턴을 확인하라(민감 정보 아님, 개인식별정보 아님 — 이 패턴을 신규 필드에도 일관되게 확장한다)**
- `src/app/[locale]/travel/flight-delay-compensation/page.tsx`
- `src/lib/config/tools-config.ts`의 `flight-delay-compensation`, `layover-connection-calculator`, `jetlag-recovery-calculator` 항목

## 작업

### 1. 미국 DOT 탑승거부 상한액 재확인 (반드시 이 step에서 직접 수행)

14 CFR § 250.5 원문에서 현재 유효한 상한액을 확인하라(denied boarding compensation: 200%/400% of one-way fare, 각각 상한액 있음 — 물가연동으로 주기적으로 갱신되므로 원문에서 현재 유효값을 반드시 확인). 확인한 값과 확인 날짜, 출처 URL을 `flightCompensationRules.ts`에 주석과 데이터 필드로 함께 기록하라.

### 2. `lib/config/flightCompensationRules.ts` 확장

- `FlightDelayInput`에 이미 있는 필드는 건드리지 말고, 미국 DOT 탑승거부 전용 상수를 새로 추가한다:

```ts
export type UsDeniedBoardingRule = {
  minDelayHours: number
  /** 편도 운임 대비 % */
  farePercentage: number
  /** 상한액(USD) — 반드시 14 CFR § 250.5 원문에서 확인한 현재 유효값 */
  capUsd: number
  note: { en: string; ko: string }
}

export const US_DENIED_BOARDING_RULES: {
  domestic: UsDeniedBoardingRule[] // 1~2시간 / 2시간 초과
  international: UsDeniedBoardingRule[] // 1~4시간 / 4시간 초과
  sourceName: string
  sourceUrl: string
  verifiedAt: string // ISO 날짜, 이 step 실행일
}
```

### 3. `lib/utils/flightDelayCompensation.ts` 확장 (기존 파일 수정)

**먼저 새 동작에 대한 테스트를 `flightDelayCompensation.test.ts`에 추가한 뒤 구현하라(CLAUDE.md rule 5). 기존 EU261/US_DOT 지연·취소 테스트는 값 변경 없이 그대로 통과해야 한다.**

```ts
export type DisruptionType = 'delay' | 'cancellation' | 'denied-boarding'

export type FlightDelayInput = {
  regulation: RegulationType
  disruptionType: DisruptionType // 신규 필드, 기본값 없음 — 호출부에서 항상 명시
  distanceCategory: DistanceCategory
  delayHours: number
  reason: 'airline-fault' | 'force-majeure'
}

export function estimateDeniedBoardingCompensationUs(
  fareAmount: number,
  currency: string,
  delayHours: number,
  isInternational: boolean
): CompensationEstimate
```

- `estimateCompensation`은 `disruptionType`에 따라 분기한다:
  - EU261 + (`delay` | `cancellation` | `denied-boarding`) → **세 가지 모두 기존 거리기반 정액표 로직을 그대로 사용**(EU261은 탑승거부에 불가항력 항변을 인정하지 않으므로, `denied-boarding`이면 `reason`과 무관하게 `force-majeure` 면제 분기를 타지 않게 한다 — 이 부분이 기존 로직과 다른 유일한 지점이다).
  - US_DOT + (`delay` | `cancellation`) → 기존 "eligible: false, 정부 의무 보상 없음" 로직 그대로 유지(변경 금지).
  - US_DOT + `denied-boarding` → `estimateDeniedBoardingCompensationUs`로 별도 경로 위임(거리기반이 아니라 편도 운임 기반).
- `estimateDeniedBoardingCompensationUs`: `delayHours`와 `isInternational`에 따라 `US_DENIED_BOARDING_RULES`에서 해당 구간을 찾아 `fareAmount × farePercentage`를 계산하되 `capUsd`로 상한을 씌운다. `eligible: true`(1시간 미만 지연은 보상 대상 아님 — `eligible: false`로 처리).
- `flightDelayCompensation.test.ts`에 추가할 테스트: EU261 탑승거부가 force-majeure 사유여도 보상 대상인지(EU261은 탑승거부에 불가항력 항변 불인정), US_DOT 탑승거부의 운임 기반 계산이 상한액을 넘지 않는지, US_DOT 지연/취소가 기존과 동일하게 `eligible: false`인지 등 최소 8개 이상.

### 4. `components/tools/flight-delay-compensation/FlightDelayCompensationTool.tsx` 확장

- **혼란 유형 선택(신규)**: 규정 선택 다음 단계로 지연/취소/탑승거부 3개 버튼그룹을 추가한다.
- 조합에 따라 입력 필드를 동적으로 전환한다:
  - US_DOT + `denied-boarding`: 거리 구간 선택 대신 **편도 운임(통화 + 금액) 입력**을 노출한다. 지연시간 슬라이더는 "대체편으로 최종 도착이 얼마나 늦었는지"로 라벨을 바꿔 재사용한다. 사유(불가항력/항공사귀책) 선택지는 숨긴다(탑승거부에는 이 선택지가 없다).
  - 그 외 조합: 기존 거리 구간 선택 UI를 그대로 사용.
  - 전환 시 레이아웃이 갑자기 점프하지 않도록 부드러운 전환 처리(`animate-fade-in` 재사용, 새 keyframe 만들지 마라).
- 지연 사유가 불가항력이면 결과 카드 톤을 중립/경고로 전환하되(기존 동작), **탑승거부는 이 불가항력 예외가 적용되지 않는다는 점을 결과에 함께 문장으로 설명**한다.
- `handleShare`의 URL 쿼리파라미터 인코딩에 `disruptionType`(및 US_DOT 탑승거부일 때 `fareAmount`/`currency`)을 기존 패턴과 동일하게 추가한다.
- `useAnalyticsEvent`는 기존과 동일하게 `tool_open`/`calculate`/`share`.

### 디자인 — 크고 깔끔하게 (신규)

- 예상 보상액을 결과 카드의 유일한 큰 초점으로: 현재 `text-3xl`로 되어 있는 것을 `text-5xl`로 키운다. eligible 여부/사유는 그 아래 보조 텍스트로.

### 5. `tools-config.ts` 수정

- `flight-delay-compensation` 항목: `relatedToolIds`에 `'layover-connection-calculator'`, `'jetlag-recovery-calculator'`를 추가. 제목/설명 문구를 "delay"만이 아니라 "delay, cancellation, or denied boarding"을 명시적으로 언급하도록 갱신. 키워드에 `flight cancellation compensation calculator`, `delayed flight compensation`, `eu261 compensation table` 추가. FAQ에 "취소된 항공편도 보상받을 수 있나요?", "탑승거부(오버부킹)도 이 계산기로 확인할 수 있나요?" 신규 추가(기존 FAQ 유지).
- `layover-connection-calculator`, `jetlag-recovery-calculator` 항목의 `relatedToolIds`에 이미 `'flight-delay-compensation'`이 들어있는지 확인한다(step0/step1에서 넣어뒀어야 한다 — 없다면 이 step에서 추가한다). 세 항목이 서로 상호 링크되어야 한다.

### 6. `src/app/[locale]/travel/flight-delay-compensation/page.tsx` 수정

- 필요시 Description/How To Use 섹션에 혼란 유형 선택 관련 안내를 추가한다. 기존 `generateMetadata`의 `openGraph.images` 필드는 이미 있으므로 건드리지 않는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 기존 `flightDelayCompensation.test.ts`의 EU261/US_DOT 지연·취소 테스트가 값 변경 없이 그대로 통과하는지(회귀 없음) 확인한다.
3. 신규 탑승거부 관련 테스트(EU261 불가항력 항변 불인정, US_DOT 운임기반 상한액)가 통과하는지 확인한다.
4. `US_DENIED_BOARDING_RULES`에 14 CFR § 250.5 확인 날짜(`verifiedAt`)와 출처 URL이 실제로 기록되어 있는지 확인한다 — 비어있거나 placeholder면 안 된다.
5. UI에서 US_DOT + 탑승거부 조합일 때만 편도 운임 입력이 노출되고, 그 외 조합에서는 이 입력이 렌더링되지 않는지 확인한다.
6. `/travel/flight-delay-compensation`(EN/KO)이 정상 빌드되는지 확인한다.
7. `tools-config.ts`에서 세 travel 툴(`flight-delay-compensation`/`layover-connection-calculator`/`jetlag-recovery-calculator`)이 서로 `relatedToolIds`로 상호 연결됐는지 확인한다.
8. 결과에 따라 `phases/5-travel-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약 + 14 CFR § 250.5 확인 결과(상한액, 확인일) 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: step0/step1 미완료, § 250.5 원문 확인 불가) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- **미국 DOT 탑승거부 상한액을 웹 검색 요약만 보고 하드코딩하지 마라** — 반드시 14 CFR § 250.5 원문에서 현재 유효한 금액을 재확인한다.
- EU261과 미국 DOT의 탑승거부 계산 로직을 뒤섞지 마라 — 완전히 다른 계산 경로로 분리 구현한다.
- 미국 DOT의 "지연/취소는 정부 의무 보상 대상이 아니다"라는 기존 로직을 이 step에서 실수로 바꾸지 마라(기존 동작 유지, 탑승거부만 신규 경로 추가).
- EU261 탑승거부에 불가항력 면제 로직을 적용하지 마라(EU261은 오버부킹에 불가항력 항변을 인정하지 않는다 — 지연/취소와 다른 지점).
- "보상 지급 확정" 같은 단정적 문구를 쓰지 마라.
- 기존 `estimateCompensation` 함수 시그니처를 깨는 방식으로(기존 필드 제거 등) 변경하지 마라 — `disruptionType` 필드 추가만 허용된다.
- 기존 테스트를 깨뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).

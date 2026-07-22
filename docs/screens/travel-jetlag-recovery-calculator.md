# Screen: Jet Lag Recovery Calculator

## URL
`/travel/jetlag-recovery-calculator` (EN), `/ko/travel/jetlag-recovery-calculator` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`general`) → Related Tools.

## 목적
출발지/도착지 시차와 이동 방향(동/서)을 입력하면 예상 시차적응 소요일수와 일자별 일반적인 조정 가이드를 보여준다.

## 경쟁사 리서치 요약 (설계 근거)
- 약한 경쟁사는 "시차 1일당 회복 1일" 같은 단일 숫자만 준다 — 이 수준으로만 만들면 시장에서 차별화가 안 된다.
- 강한 경쟁사(Timeshifter)는 정밀한 시간대별 빛노출/수면 스케줄까지 개인화해서 제공하지만, 이건 사실상 수면의학 프로토콜 수준의 복잡도이고 상업적 유료 서비스 영역이다 — **이 정도까지 이 프로젝트에서 재현하지 않는다**(과도한 스코프이자, 빛노출 타이밍을 잘못 안내하면 실제로 역효과가 날 수 있어 리스크도 있음).
- **이 프로젝트가 택할 중간 지점**: 단일 숫자보다는 낫지만 Timeshifter만큼 정밀하지는 않은, "일자별 일반 가이드 3~5일치 텍스트 팁" 수준으로 스코프를 잡는다.

## 입력
- 출발지 시간대 / 도착지 시간대 (도시 검색 드롭다운 또는 UTC 오프셋 직접 입력)
- 이동 방향은 두 시간대 값에서 자동 계산(동쪽/서쪽 판정 로직 필요 — 지구가 둥글어서 항상 자명하지 않음, 아래 로직 참고)
- (선택) 평소 취침/기상 시각 — 있으면 가이드 문구를 조금 더 구체화, 없어도 일반 가이드 제공

## 출력/로직 (`lib/utils/jetlagCalculator.ts`)
```ts
export function calculateJetlag(input: {
  originUtcOffsetHours: number
  destinationUtcOffsetHours: number
}): { timezonesCrossed: number; direction: 'eastward' | 'westward' | 'none'; estimatedRecoveryDays: number }
```
- `timezonesCrossed`: 두 오프셋의 차이(절댓값), 단 12시간을 초과하면 반대 방향으로 도는 게 더 짧다고 가정해 `24 - |diff|`로 보정(경도상 실제 이동 방향과 시차 차이가 항상 일치하지 않음에 유의 — 단순화된 근사임을 FAQ에 명시)
- `direction`: 동쪽 이동이 서쪽 이동보다 적응이 더 어렵다는 것이 일반적으로 알려진 통념(체내시계를 앞당기기 어려움) — `estimatedRecoveryDays` 계산 시 동쪽 이동에 약간 더 큰 계수를 곱한다(예: 서쪽 `timezonesCrossed × 0.5일`, 동쪽 `timezonesCrossed × 0.67일` — **정확한 계수와 이 통념 자체의 학술 근거는 harness 구현 단계에서 신뢰할 수 있는 수면의학 자료로 검증 후 확정한다. 이 문서 작성 시점에는 근사치로만 제시한다.**)

## UI 구성
- 입력 폼: 출발지/도착지 (도시 검색 또는 UTC 오프셋)
- 결과: **예상 회복일수를 큰 숫자로**(`text-5xl` 급), 이동 방향(동/서) 배지
- **일자별 가이드(신규 콘텐츠, 정적 템플릿)**: "1일차: 무리해서 일정 잡지 말고 목적지 시각에 맞춰 취침/기상 시도", "2~3일차: 서쪽 이동이면 아침 햇빛, 동쪽 이동이면 아침 햇빛 노출을 늦추는 게 일반적으로 도움" 같은 3~5일치 일반 가이드를 방향(동/서)별로 다르게 보여준다. **개인 맞춤 정밀 빛노출 스케줄(시각 단위)은 만들지 않는다** — 일반적 수준의 가이드 텍스트로 제한한다.

### 디자인 방향 — 크고 깔끔하게
- 회복일수 숫자가 결과의 유일한 큰 초점, 일자별 가이드는 카드 아래 타임라인/체크리스트 형태로 깔끔하게 나열(아코디언보다는 세로 타임라인이 "여정" 느낌에 더 맞음)

## tools-config 항목
- `id`/`slug`: `jetlag-recovery-calculator`
- `category: 'travel'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'`
- Disclaimer 문구에 일반 문구 외에 한 줄 추가: "수면장애나 기분장애가 있다면 빛노출 습관을 크게 바꾸기 전 전문의와 상담하세요"(빛노출 타이밍이 일부 질환에 영향을 줄 수 있다는 점을 보수적으로 반영 — `general`이지만 가벼운 안전 문구를 추가하는 예외 케이스)
- `relatedToolIds: ['flight-delay-compensation', 'layover-connection-calculator']`
- FAQ 예:
  - "왜 동쪽으로 갈 때가 서쪽보다 더 힘든가요?" → 체내시계를 앞당기는 것이 늦추는 것보다 어렵다는 일반적으로 알려진 원리 설명(출처 명시)
  - "이 가이드만 따르면 시차 적응이 보장되나요?" → "아니오"로 시작, 개인차가 크다는 점 명시

## Analytics 이벤트
`Tool Open`, `Calculate`

## 금지사항
- Timeshifter 수준의 시각 단위 정밀 빛노출 스케줄을 만들지 않는다 — 스코프를 일반 가이드 텍스트로 제한한다(위 "경쟁사 리서치 요약" 참고).
- 회복일수 계수나 "동쪽이 더 어렵다"는 통념을 검증 없이 확정 수치로 제시하지 않는다 — harness 구현 시 신뢰 가능한 수면의학 자료로 확인 후 출처와 함께 기록한다.
- "이 방법을 따르면 시차 적응이 보장된다"는 식의 단정적 표현을 쓰지 않는다.

# Screen: Baby Sleep Schedule / Nap Time Calculator

## URL
`/baby/sleep-schedule` (EN), `/ko/baby/sleep-schedule` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`medical`) → Related Tools.

## 목적
아기의 개월수/주령과 기상 시각을 입력하면 연령대별 권장 낮잠 횟수·시간, 다음 낮잠/취침 권장 시각을 계산해 보여준다.

## 입력
- 개월수 또는 주령 (신생아~24개월 범위, 연령 구간별 권장 수면 패턴이 다름)
- 오늘 기상 시각
- (선택) 마지막 낮잠 종료 시각 — 다음 낮잠 시각 재계산용

## 출력/로직 (`lib/utils/sleepSchedule.ts`)
- 연령 구간별 권장 수면 패턴(낮잠 횟수, wake window 길이)은 `lib/config/sleepGuidelines.ts`에 정적 데이터로 관리
- `calculateSleepSchedule(input: SleepInput): { naps: Array<{ start: string; end: string }>; bedtime: string }`

## UI 구성
- 입력 즉시 오늘의 낮잠/취침 타임라인을 시각적 타임라인(막대/타임라인 컴포넌트)으로 표시
- "일반적 가이드라인이며 개별 아기 상태에 따라 다를 수 있음" 문구 상시 노출
- 연령 구간이 바뀌면 슬라이더/입력 옆에 해당 구간의 일반적 패턴 요약 텍스트 표시

## tools-config 항목
- `category: 'baby'`, `disclaimerType: 'medical'`, `aiOverviewResistance: 'high'`
- Disclaimer 문구: "일반적 가이드라인이며 개별 아기의 상태에 따라 다를 수 있습니다. 소아과 상담을 권장합니다."
- FAQ 예: "Wake window란?", "낮잠을 안 자려고 하면 어떻게 하나요? (일반 팁 + 지속 시 소아과 상담 권장)"

## 상태
- 최근 입력값(개월수, 기상 시각)은 `useLocalStorage`로 저장 가능 — 매일 재사용하는 툴 특성상 재방문율에 유리. 아동 관련 정보 저장은 사용자에게 명시적으로 안내.

## Analytics 이벤트
`Tool Open`, `Calculate`, `Share`(타임라인 공유)

## 금지사항
- 특정 수면 문제(수면 퇴행, 야간 각성 등)에 대한 의학적 처방/진단성 조언을 제공하지 않는다 — 일반 가이드라인 수준으로 제한하고 전문가 상담으로 안내한다.

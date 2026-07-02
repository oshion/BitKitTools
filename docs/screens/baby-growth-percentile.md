# Screen: Baby Growth Percentile Calculator

## URL
`/baby/growth-percentile` (EN), `/ko/baby/growth-percentile` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`medical`) → Related Tools.

## 목적
아기의 나이(개월), 성별, 체중, 키를 입력하면 WHO/CDC 성장 기준표 대비 백분위(percentile)를 계산해 보여준다.

## 입력
- 성별 (남/여 — 기준표가 성별로 분리됨)
- 나이 (개월, 0~60개월 범위)
- 체중 (kg)
- 키/신장 (cm)
- 기준표 선택 (WHO / CDC — 지역에 따라 권장 기준이 다름, 기본값은 locale에 따라 WHO 우선)

## 출력/로직 (`lib/utils/growthPercentile.ts`)
- WHO/CDC 성장 기준 데이터 테이블은 `lib/config/growthStandards.ts`에 정적 데이터로 관리 (LMS 파라미터 기반, 외부 API 아님)
- `calculatePercentile(input: GrowthInput, standard: 'WHO' | 'CDC'): { weightPercentile: number; heightPercentile: number }`

## UI 구성
- 입력 폼 → 결과: 체중/키 백분위를 각각 게이지 바로 표시 (숫자 + 시각화)
- 결과 카드 바로 아래 "이 결과는 참고용이며 실제 성장 평가는 소아과 전문의와 상담 필요" 상시 노출
- 기준 출처(WHO Child Growth Standards / CDC Growth Charts) 본문에 명시 및 링크

## tools-config 항목
- `category: 'baby'`, `disclaimerType: 'medical'`, `aiOverviewResistance: 'high'`
- Disclaimer 문구: "본 계산은 참고용이며 실제 성장 평가는 소아과 전문의와 상담이 필요합니다." + WHO/CDC 출처 명시
- FAQ 예: "WHO 기준과 CDC 기준의 차이는?", "백분위가 낮으면 문제가 있는 건가요? (아니오 — 전문의 상담 권장 문구로 연결)"

## 상태
- 최근 입력한 아기 정보(나이/체중/키)는 `useLocalStorage`로 저장 가능(재방문 시 자동 채움) — 민감한 아동 건강 정보이므로 저장 여부를 사용자에게 명시적으로 안내(옵트인 권장).

## Analytics 이벤트
`Tool Open`, `Calculate`

## 금지사항
- 백분위 낮음/높음에 대해 "정상"·"비정상" 같은 진단성 단정 표현을 사용하지 않는다 — 항상 "전문의 상담" 방향으로 안내한다.
- 출처 없이 임의의 성장 기준 데이터를 사용하지 않는다 — 반드시 WHO/CDC 공식 기준표 기반이어야 한다.

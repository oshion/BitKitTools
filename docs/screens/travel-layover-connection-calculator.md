# Screen: Layover / Connection Time Calculator

## URL
`/travel/layover-connection-calculator` (EN), `/ko/travel/layover-connection-calculator` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`general`) → Related Tools.

## 목적
환승 공항과 보유한 환승시간을 입력하면, 그 시간이 일반적으로 충분한지("여유로움" / "빠듯함" / "권장 최소환승시간 미만") 참고 정보를 보여준다. 실제 통과 가능 여부를 보장하는 도구가 아니라 계획 참고용임을 명확히 한다.

## 경쟁사 리서치 요약 (설계 근거)
- 약한 경쟁사(AgentCalc, Calculator Academy)는 사용자가 이미 MCT(최소환승시간)를 알고 있다는 전제로 숫자만 입력받는 얕은 도구 — 실사용성이 낮다.
- 강한 경쟁사(TravelVient)는 공항별 실제 MCT 데이터(112개+), 국내/국제 조합 4종, 터미널 이동/세관 대기시간까지 반영한다 — 이게 진짜 경쟁 기준이다.
- MCT는 업계에 실존하는 개념이다 — IATA가 "Recommended Practice 1670 (Minimum Connecting Times)"를 발행하고, 각 공항 당국도 자체 MCT를 공개 발표한다. 출처로 인용 가능.

## 스코프 결정 (신규 툴이므로 중요)
전체 세계 공항 MCT 데이터베이스를 처음부터 완비하는 건 유지보수 부담이 크다(공항마다 다르고 주기적으로 바뀜). **MVP 스코프**:
- 주요 공항 30~50개(국제선 환승 허브 위주 — 인천, 나리타, 창이, 히스로, 프랑크푸르트, 애틀랜타, 오헤어, 두바이 등)의 공식 발표 MCT 값을 정적 데이터로 수집한다. **정확한 분 단위 값은 harness 구현 단계에서 각 공항의 공식 발표 자료(공항 홈페이지, IATA 자료)를 직접 확인해서 출처와 함께 기록한다 — 이 문서 작성 시점에 임의의 숫자를 만들어 넣지 않는다.**
- 목록에 없는 공항은 국제선/국내선 조합별 일반 권장 최소값(업계 통용치, 예: 국내-국내 45분, 국내-국제 60분, 국제-국내 75분, 국제-국제 90~120분 — 이 기본값도 harness 구현 시 출처 확인 후 확정)으로 대체 계산하고 "이 공항은 데이터베이스에 없어 일반 권장치를 사용합니다"라고 명시한다.

## 입력
- 환승 공항 (검색 가능한 드롭다운 — 데이터베이스에 있는 공항 우선 노출, 없으면 자유 입력 후 일반 권장치 적용)
- 연결 유형: 국내→국내 / 국내→국제 / 국제→국내 / 국제→국제 (4종 라디오 선택 — 자동 추론하지 않고 사용자가 직접 선택, 국가 간 데이터 없이도 동작하게)
- 보유 환승시간 (분 또는 시간:분)

## 출력/로직 (`lib/utils/layoverCalculator.ts`)
```ts
export type ConnectionType = 'domestic-domestic' | 'domestic-international' | 'international-domestic' | 'international-international'
export function evaluateLayoverTime(input: {
  airportCode: string
  connectionType: ConnectionType
  availableMinutes: number
}): { mctMinutes: number; verdict: 'comfortable' | 'tight' | 'below-mct'; isKnownAirport: boolean }
```
- `mctMinutes`는 공항별 데이터베이스(`lib/config/airportMctData.ts`)에서 조회, 없으면 연결 유형별 기본값 사용(`isKnownAirport: false`로 표시)
- `verdict` 임계값(예: MCT 대비 1.5배 이상이면 comfortable) 기준은 harness 구현 단계에서 합리적으로 정하되, **"below-mct"일 때도 "놓친다"고 단정하지 않고 "권장 최소시간보다 짧습니다, 서두르세요"수준으로 표현한다**

## UI 구성
- 입력 폼: 공항 검색 → 연결 유형 선택 → 보유 시간 입력
- 결과: **verdict를 크고 명확한 단일 라벨로**(`text-5xl`까지는 아니고 큰 배지/타이틀 형태 — 숫자가 아니라 상태 라벨이라 다른 beer/baby 툴과는 강조 방식이 다름), 그 아래 "권장 최소환승시간: N분" 보조 정보
- 알려진 공항이면 출처(공항 공식 발표) 링크 노출, 모르는 공항이면 일반 권장치 사용 안내 배지

### 디자인 방향 — 크고 깔끔하게
- verdict 라벨은 색상보다 텍스트 자체를 크게("여유로움" 같은 한글 라벨 자체를 `text-4xl` 급으로) — 신호등식 색상 의존은 `UI_GUIDE.md` 안티패턴에 걸리지 않는 선에서(초록/빨강 신호등 자체는 피하고, 중립 색+굵은 텍스트로 구분)

## tools-config 항목
- `id`/`slug`: `layover-connection-calculator`
- `category: 'travel'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'`
- `relatedToolIds: ['flight-delay-compensation']`(같은 여행자 페르소나) — `flight-delay-compensation`에도 상호 추가
- 키워드: `layover calculator`, `connection time calculator`, `minimum connection time calculator`, `mct calculator` 등
- FAQ 예:
  - "MCT(최소환승시간)가 뭔가요?" → IATA 개념 설명
  - "이 결과를 못 믿고 놓치면 어떻게 되나요?" → 참고용이며 실제 통과시간은 터미널 혼잡도/보안검색 대기 등에 따라 달라질 수 있다는 점 강조
  - "제 공항이 목록에 없어요" → 일반 권장치가 적용된다는 점 설명

## Analytics 이벤트
`Tool Open`, `Calculate`

## 금지사항
- 존재하지 않는 공항별 MCT 수치를 임의로 만들어내지 않는다 — 반드시 harness 구현 시점에 공식 출처를 확인한다.
- "충분합니다/놓칩니다"처럼 결과를 보장하는 단정적 문구를 쓰지 않는다 — 항상 참고 정보 톤을 유지한다.
- 실시간 항공편/공항 혼잡도 API를 연동하지 않는다(rule 2 위반) — 전부 정적 데이터 기반.

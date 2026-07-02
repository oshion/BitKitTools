# Screen: Visa Requirement / Travel Insurance Checker

## URL
`/travel/visa-requirement-checker` (EN), `/ko/travel/visa-requirement-checker` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`legal`) → Related Tools.

## 목적
출발국 + 목적지 조합을 선택하면 비자 요건 요약(무비자/e-Visa/사전 비자 필요 등)과 추천 여행자보험 유형을 안내한다.

## 입력
- 출발국 선택 (여권 발급국 기준 드롭다운)
- 목적지국 선택
- 체류 목적(관광/비즈니스) 및 예정 체류일수 (선택적, 보험 추천 정교화용)

## 출력/로직 (`lib/utils/visaRequirementChecker.ts`)
- 국가 조합별 비자 요건 데이터는 `lib/config/visaRequirements.ts`에 정적 테이블로 관리 (외부 API 아님 — 실시간 정부 데이터 연동이 아님을 명확히 고지)
- `checkVisaRequirement(fromCountry: string, toCountry: string): { requirementType: 'visa-free' | 'e-visa' | 'visa-required' | 'unknown'; maxStayDays?: number; note: string }`

## UI 구성
- 국가 2개 선택 즉시 결과 카드 표시
- 결과 카드: 비자 요건 유형 배지(중립 색상, "승인 보장" 암시 금지) + 최대 체류일수 + 안내 문구
- 하단에 "최신 비자 규정은 관할 영사관에서 재확인" 상시 노출 문구
- 여행자보험 추천은 별도 카드로 일반적인 보장 항목 안내 (특정 상품 판매/제휴 링크는 이 화면 범위 밖, profile v2 Section 7-2 별도 검토)

## tools-config 항목
- `category: 'travel'`, `disclaimerType: 'legal'`, `aiOverviewResistance: 'high'` (국가 조합별 개인화 강함)
- Disclaimer 문구: "본 정보는 법률 자문이 아니며, 최신 비자 규정은 반드시 관할 영사관에서 재확인하시기 바랍니다."
- FAQ 예: "e-Visa와 무비자의 차이는?", "비자 요건은 얼마나 자주 바뀌나요?"

## 상태
- 최근 조회한 국가 조합은 `useLocalStorage`로 저장해 재방문 시 자동 채움 가능 (선택적 개인화).

## Analytics 이벤트
`Tool Open`, `Calculate`

## 금지사항
- 비자 요건 데이터를 실시간 정부 API처럼 보이게 표현하지 않는다. 이유: 실제로는 정적 테이블이며 최신성 한계가 있음을 사용자가 인지해야 법적 리스크가 줄어든다.
- "무비자 = 입국 보장"처럼 단정하지 않는다 — 입국 심사는 최종적으로 목적지국 재량임을 명시.

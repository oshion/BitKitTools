# Screen: JSON Formatter & Validator

## URL
`/developer/json-formatter` (EN), `/ko/developer/json-formatter` (KO)

## 공통 콘텐츠 구조
모든 툴 페이지는 Title → Tool → Description → How To Use → Example → FAQ → [Disclaimer] → Related Tools 순서를 따른다 (profile v2 Section 9). 이 화면은 `disclaimerType: general`이라 Disclaimer 섹션은 가벼운 일반 면책 수준으로 노출한다.

## 목적
개발자가 JSON 텍스트를 붙여넣으면 즉시 정렬(pretty-print)/압축하고, 문법 오류가 있으면 위치와 정확한 원문 컨텍스트를 짚어준다. 표준 JSON만 지원한다(주석 등 비표준 확장 문법은 지원하지 않음 — 아래 "검토했으나 보류" 참고).

## 입력
- 텍스트 영역 (JSON 원문 붙여넣기)
- 들여쓰기 폭 선택 (2 / 4 spaces, 기본 2)
- Format / Minify 모드 전환

## 출력/로직 (`lib/utils/jsonFormatter.ts`)
- `formatJson(input: string, indent: 2 | 4): { success: true; output: string } | { success: false; error: string; line?: number; errorContext?: string }`
- `minifyJson(input: string): { success: true; output: string } | { success: false; error: string; line?: number; errorContext?: string }`
- 표준 `JSON.parse`로 유효성 검증(비표준 문법 관용 처리 없음)
- `JSON.parse` 실패 시 에러 메시지, 가능하면 줄 번호, 그리고 에러 위치 앞뒤 약 20자를 잘라 공백을 정리한 컨텍스트 스니펫(`errorContext`)을 표시 — 콤마/따옴표 누락으로 여러 줄이 사실상 한 덩어리로 뭉개진 경우에도 정확히 어디가 깨졌는지 보여주기 위해 "줄 전체"가 아닌 "위치 기준 윈도우"를 사용

## 검토했으나 보류: `//`/`--`/`#` 줄 주석 허용
한때 `//`, `--`, `#` 줄 주석을 관용적으로 파싱 + Format 모드에서 주석을 원문 그대로 유지하는 옵션을 추가했다가 롤백했다. 줄 주석은 언어를 막론하고 "그 줄 끝까지"를 주석으로 삼는 게 표준 규칙인데, 실사용 입력 중 개행이 전혀 없는 한 줄짜리 JSON에 주석이 섞이면 `//` 뒤의 나머지 전체(닫는 괄호 포함)가 주석으로 먹혀 파싱 자체가 깨지는 문제가 있었다. 여러 줄로 작성된 입력에서는 정상 동작했지만, 실사용에서 더 흔한 "한 줄짜리 JSON + 인라인 주석" 케이스를 지원할 수 없어 기능 자체를 제거했다. 재도입한다면 한 줄 입력에서의 주석 종료 지점을 어떻게 정할지(휴리스틱은 오탐 위험 큼)부터 다시 설계해야 한다.

## UI 구성
- 좌: 입력 텍스트 영역 / 우: 결과 (모바일은 위/아래 스택)
- 에러 발생 시 결과 영역에 붉은색(`#ef4444`) 에러 카드로 대체, 메시지 아래에 에러 위치 컨텍스트 스니펫(`errorContext`) 노출
- 결과 영역(성공 시) 클릭 시 바로 복사 — 상단 "복사" 버튼과 동일하게 "Copied!" 피드백 공유
- "복사"/"다운로드(.json)" 버튼
- Format ↔ Minify 토글

## tools-config 항목
- `category: 'developer'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'`
- `schemaType: 'WebApplication'`, FAQ 예: "JSON이 유효하지 않다는 건 무슨 뜻인가요?", "포맷팅과 압축의 차이는?"

## 상태
- 컴포넌트 로컬 `useState`만. 입력값은 LocalStorage에 저장하지 않는다 — 민감한 JSON(토큰/개인정보 포함 응답)이 붙여넣어질 수 있음.

## Analytics 이벤트
`Tool Open`, `Calculate`(format/minify 실행 시), `Copy Result`

## 금지사항
- 입력된 JSON을 외부로 전송하지 않는다 — 전부 클라이언트에서 처리.

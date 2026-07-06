# Screen: JSON Formatter & Validator

## URL
`/developer/json-formatter` (EN), `/ko/developer/json-formatter` (KO)

## 공통 콘텐츠 구조
모든 툴 페이지는 Title → Tool → Description → How To Use → Example → FAQ → [Disclaimer] → Related Tools 순서를 따른다 (profile v2 Section 9). 이 화면은 `disclaimerType: general`이라 Disclaimer 섹션은 가벼운 일반 면책 수준으로 노출한다.

## 목적
개발자가 JSON 텍스트를 붙여넣으면 즉시 정렬(pretty-print)/압축하고, 문법 오류가 있으면 위치와 정확한 원문 컨텍스트를 짚어준다. `//`, `--`, `#` 줄 주석이 섞여 있어도(문자열 값 내부는 제외) 관용적으로 파싱하며, Format 모드에서는 주석을 제거할지 원문 그대로 유지할지 선택할 수 있다.

## 입력
- 텍스트 영역 (JSON 원문 붙여넣기)
- 들여쓰기 폭 선택 (2 / 4 spaces, 기본 2)
- Format / Minify 모드 전환
- "주석 유지" 체크박스 — **Format 모드 전용**. Minify는 결과가 한 줄로 압축되므로 줄 주석(`//`/`--`/`#`)을 남기면 그 뒤 나머지가 전부 주석으로 먹혀 결과가 깨진 JSON이 된다. 따라서 Minify는 항상 주석을 제거한다.

## 출력/로직 (`lib/utils/jsonFormatter.ts`)
- `formatJson(input: string, indent: 2 | 4, options?: { preserveComments?: boolean }): { success: true; output: string } | { success: false; error: string; line?: number; errorContext?: string }`
- `minifyJson(input: string): { success: true; output: string } | { success: false; error: string; line?: number; errorContext?: string }` (옵션 없음 — 항상 주석 제거)
- 파싱 전 `//`, `--`, `#` 줄 주석을 제거(문자열 리터럴 내부는 보존)한 뒤 `JSON.parse` 수행해 유효성 검증
- `preserveComments: true`인 경우, 검증 통과 후 별도의 토큰화 기반 재인덴트 로직으로 원문 주석을 원래 위치(같은 줄 트레일링 vs 자체 줄)에 유지한 채 들여쓰기만 다시 계산해 출력. 값 자체를 `JSON.stringify`로 재생성하지 않으므로 원본 리터럴 표기(숫자 표기 등)도 그대로 보존됨
- `JSON.parse` 실패 시 에러 메시지, 가능하면 줄 번호, 그리고 에러 위치 앞뒤 약 20자를 잘라 공백을 정리한 컨텍스트 스니펫(`errorContext`)을 표시 — 콤마/따옴표 누락으로 여러 줄이 사실상 한 덩어리로 뭉개진 경우에도 정확히 어디가 깨졌는지 보여주기 위해 "줄 전체"가 아닌 "위치 기준 윈도우"를 사용

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

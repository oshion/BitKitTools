# Screen: JSON Formatter & Validator

## URL
`/developer/json-formatter` (EN), `/ko/developer/json-formatter` (KO)

## 공통 콘텐츠 구조
모든 툴 페이지는 Title → Tool → Description → How To Use → Example → FAQ → [Disclaimer] → Related Tools 순서를 따른다 (profile v2 Section 9). 이 화면은 `disclaimerType: general`이라 Disclaimer 섹션은 가벼운 일반 면책 수준으로 노출한다.

## 목적
개발자가 JSON 텍스트를 붙여넣으면 즉시 정렬(pretty-print)/압축하고, 문법 오류가 있으면 위치를 짚어준다.

## 입력
- 텍스트 영역 (JSON 원문 붙여넣기)
- 들여쓰기 폭 선택 (2 / 4 spaces, 기본 2)
- Format / Minify 모드 전환

## 출력/로직 (`lib/utils/jsonFormatter.ts`)
- `formatJson(input: string, indent: 2 | 4): { success: true; output: string } | { success: false; error: string; line?: number }`
- `minifyJson(input: string): { success: true; output: string } | { success: false; error: string }`
- `JSON.parse` 실패 시 에러 메시지와 가능하면 줄 번호를 표시

## UI 구성
- 좌: 입력 텍스트 영역 / 우: 결과 (모바일은 위/아래 스택)
- 에러 발생 시 결과 영역에 붉은색(`#ef4444`) 에러 카드로 대체
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

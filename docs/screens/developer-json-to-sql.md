# Screen: JSON to SQL Converter

## URL
`/developer/json-to-sql` (EN), `/ko/developer/json-to-sql` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`none`/`general`) → Related Tools.

## 목적
JSON(단일 객체 또는 배열)을 붙여넣으면 SQL INSERT문(선택적으로 CREATE TABLE문 포함)으로 변환한다. MSSQL / MySQL·MariaDB / Oracle / PostgreSQL 4개 방언을 지원한다.

## 경쟁사 리서치 요약 (설계 근거)
- 조사한 경쟁 도구 대부분은 MySQL/PostgreSQL/SQLite/SQL Server 조합이고, Oracle까지 지원하는 곳은 SQLite를 끼워넣은 5종 조합뿐이었다. **"MSSQL+MySQL+Oracle+PostgreSQL, SQLite 없이"라는 정확히 이 4개 조합은 시장에 없다** — 이게 이 툴의 차별점이다.
- 중첩 JSON(nested object/array)은 업계 표준적으로 플래튼하지 않고 JSON/JSONB(또는 방언에 텍스트) 컬럼에 그대로 저장한다 — 이 프로젝트도 동일하게 따른다.
- 컬럼 타입은 다들 자동 추론만 하고 수동 오버라이드 UI는 없었다 — 있으면 차별화 포인트지만 스코프가 커지므로 이번 MVP에서는 자동 추론만 하고, 수동 타입 오버라이드는 향후 확장 후보로 `docs/tech-debt-tracker.md`에 남긴다.
- "클라이언트에서만 처리, 서버로 전송 안 됨"은 경쟁사들도 신뢰 신호로 쓰는 문구이고 이 프로젝트 아키텍처와 정확히 일치한다 — 명시적으로 강조한다.

## 입력
- JSON 텍스트 영역 (단일 객체 또는 배열 — 단일 객체는 1행짜리 배열로 자동 취급)
- 방언 선택: MSSQL / MySQL·MariaDB / Oracle / PostgreSQL (버튼 그룹)
- 테이블명 (직접 입력, 기본값 없음 — 필수 입력)
- 출력 모드: `INSERT만` / `CREATE TABLE + INSERT` / `CREATE TABLE만`
- 배치 옵션: `한 줄에 INSERT 1개` / `여러 행을 하나의 INSERT VALUES로 묶기`(배치 크기 조절 가능, 기본 100행)

## 출력/로직 (`lib/utils/jsonToSql.ts`)
```ts
export type SqlDialect = 'mssql' | 'mysql' | 'oracle' | 'postgres'
export type OutputMode = 'insert-only' | 'create-and-insert' | 'create-only'

export function convertJsonToSql(input: {
  json: unknown
  tableName: string
  dialect: SqlDialect
  outputMode: OutputMode
  batchSize?: number // undefined/1 = one INSERT per row
}): { success: true; sql: string } | { success: false; error: string }
```

### 핵심 로직 요구사항 (반드시 정확해야 함)
- **입력 검증**: 유효한 JSON이 아니면 즉시 실패 반환 — UI에서 "JSON Formatter에서 먼저 정리하세요" 안내 + 링크로 이어진다(아래 "JSON Formatter 연동" 참고). 이 컴포넌트 자체는 관용적 JSON 파싱을 시도하지 않는다(표준 `JSON.parse`만 사용, `json-formatter`와 동일 원칙).
- **타입 추론**: JS 값 타입(`string`/`number`/`boolean`/`null`/객체/배열)을 방언별 컬럼 타입으로 매핑한다. 정수/실수 구분, 문자열은 길이 기반 VARCHAR 타입(예: 넉넉한 기본 길이 또는 최대 관측값 기준), `null`은 nullable 컬럼으로 처리, 중첩 객체/배열은 방언별 JSON 저장 타입(예: PostgreSQL `JSONB`, MySQL `JSON`, Oracle는 `CLOB` 또는 `JSON`(버전에 따라 다름 — 구현 시 확인), MSSQL은 `NVARCHAR(MAX)`)으로 매핑한다.
- **식별자 인용 규칙(방언별로 다름, 절대 섞으면 안 됨)**: MySQL/MariaDB는 백틱(`` ` ``), PostgreSQL/Oracle은 큰따옴표(`"`), MSSQL은 대괄호(`[]`). 테이블명/컬럼명 전부 이 규칙을 따라 인용한다.
- **리터럴 포맷팅(방언별로 다름)**: `NULL` 표기, boolean 표현(방언에 따라 `TRUE/FALSE`, `1/0`, `'Y'/'N'` 등 상이 — 각 방언의 표준 방식을 따른다), 문자열 이스케이프(작은따옴표 이중화 등), 날짜/타임스탬프 문자열은 있는 그대로 문자열 리터럴로 넣는다(자동 날짜 감지/변환은 스코프 밖).
- **배치 INSERT**: `batchSize`가 설정되면 여러 행을 하나의 `INSERT ... VALUES (...), (...), ...` 문으로 묶는다(MSSQL/MySQL/PostgreSQL은 표준 지원, Oracle은 다중 행 VALUES 구문이 다르므로 — `INSERT ALL INTO ... SELECT * FROM dual` 형태 등 — 방언별로 실제 올바른 구문을 구현 단계에서 검증한다).

## UI 구성
- 입력 폼: JSON 붙여넣기 → 방언 선택 → 테이블명 → 출력모드 → 배치옵션
- 결과: 생성된 SQL을 코드 블록으로 표시(구문 강조까지는 스코프 밖, 단색 monospace로 충분) + 복사 버튼
- **"클라이언트에서만 처리됩니다 — JSON이 서버로 전송되지 않습니다"** 신뢰 문구를 입력 영역 근처에 명시적으로 배치(jwt.ms 스타일의 간결한 문구)

### 디자인 방향 — 크고 깔끔하게
- `json-formatter`와 동일한 좌(입력)/우(결과) 레이아웃을 재사용하되, 옵션(방언/테이블명/출력모드)은 입력 영역 위에 한 줄로 압축 배치해 산만해지지 않게 한다.
- 결과 SQL 코드 블록은 다른 툴들의 "큰 숫자 하나" 패턴과 다르게 텍스트 블록이 핵심 결과이므로, 코드 블록 자체를 카드의 시각적 중심으로 크고 여유 있게(`p-6` 이상, 넉넉한 line-height) 배치한다.

## JSON Formatter 연동 (양방향 연결)
- **JSON Formatter → 이 툴**: `json-formatter` 결과 영역에 "Convert to SQL" 버튼을 추가한다. 클릭 시 포맷된 JSON을 `sessionStorage`(URL 쿼리 파라미터 아님 — JSON에 민감한 데이터가 포함될 수 있으므로 URL에 노출하지 않는다)에 담아 이 페이지로 이동, 진입 시 자동으로 입력창에 채워진다.
- **이 툴 → JSON Formatter**: 입력한 JSON이 유효하지 않으면 에러 메시지와 함께 "JSON Formatter에서 먼저 정리하기" 링크를 노출한다(반대 방향은 sessionStorage 없이 단순 링크만 — 사용자가 다시 붙여넣는 것을 전제).
- `sessionStorage` 키는 이 두 툴 전용 네임스페이스를 쓰고, 다른 툴 폴더에서 import하지 않는다(rule 8 — 컴포넌트/로직 공유 금지, 데이터 전달은 sessionStorage라는 브라우저 API를 통해서만 이루어지며 두 컴포넌트가 서로를 import하지 않는다).

## tools-config 항목
- `id`/`slug`: `json-to-sql`
- `category: 'developer'`, `disclaimerType: 'none'`, `aiOverviewResistance: 'high'`(자기 데이터 기반 반복 작업)
- `relatedToolIds: ['json-formatter']` — `json-formatter`에도 상호 추가
- 키워드: `json to sql converter`, `json to sql insert generator`, `json to mysql`, `json to postgresql`, `json to oracle sql`, `json to mssql` 등
- FAQ 예:
  - "중첩된 JSON(객체 안에 객체)은 어떻게 처리되나요?" → 별도 컬럼으로 쪼개지 않고 JSON/JSONB 타입 컬럼에 그대로 저장된다는 점 설명
  - "컬럼 타입은 어떻게 정해지나요?" → 값에서 자동 추론한다는 점, 필요시 생성된 SQL을 직접 수정해서 쓰면 된다는 점 안내
  - "Oracle과 다른 방언의 배치 INSERT 문법이 다른가요?" → 차이점 간단 설명

## 상태
- 컴포넌트 로컬 `useState`만. `sessionStorage`는 JSON Formatter와의 연동 전달용으로만 사용하고 영구 저장하지 않는다(탭을 닫으면 사라짐 — LocalStorage가 아님에 유의).

## Analytics 이벤트
`Tool Open`, `Calculate`, `Copy Result`

## 금지사항
- 입력된 JSON을 외부로 전송하지 않는다 — 전부 클라이언트에서 처리(json-formatter와 동일 원칙).
- 방언별 식별자 인용 규칙/리터럴 포맷을 섞어 쓰지 않는다 — 선택한 방언에 정확히 맞는 문법만 생성한다.
- JSON Formatter와 컴포넌트/로직을 공유하지 않는다(rule 8) — 데이터 전달은 sessionStorage로만.
- 관용적(비표준) JSON 파싱을 시도하지 않는다 — 유효하지 않으면 명확히 실패시키고 JSON Formatter로 안내한다.

# Step 2: json-formatter-enhancements

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이 툴의 기존 구현과 이번 확장 스펙을 완전히 파악하라:

- `/docs/screens/developer-json-formatter.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. "Convert to SQL" 버튼과 "검토했으나 보류" 섹션(줄 주석 지원을 재도입하지 말 것)이 특히 중요하다)
- `/docs/screens/developer-json-to-sql.md`의 "JSON Formatter 연동" 섹션 (이 step에서 발신 버튼을 추가할 대상 — step1에서 이미 수신부가 구현되어 있어야 한다. 아직 없다면 이 step은 `blocked` 처리하라)
- `src/lib/utils/jsonFormatter.ts`, `src/lib/utils/jsonFormatter.test.ts` — **이 step에서는 로직을 변경하지 않는다. 컴포넌트/설정 레이어만 수정한다**
- `src/components/tools/json-formatter/JsonFormatterTool.tsx` — 기존 Format/Minify 토글, 결과 영역, 복사/다운로드 버튼 패턴을 완전히 이해한 뒤 확장하라
- `src/components/tools/json-to-sql/JsonToSqlTool.tsx`(step1에서 생성됨) — **이 컴포넌트를 import하지 마라(rule 8). sessionStorage 키 이름만 동일한 문자열 리터럴로 맞춰서 참고하라**(step1 완료 시 `index.json`의 summary에 실제 사용한 키 이름이 기록되어 있을 것이다 — 그 값을 그대로 사용하라)
- `src/lib/config/tools-config.ts`의 `json-formatter`, `json-to-sql` 항목

## 작업

### 1. `components/tools/json-formatter/JsonFormatterTool.tsx` 확장

- **"Convert to SQL" 버튼(신규)**: 포맷 성공 시(`result.type === 'success'`) 결과 영역에 노출한다. 클릭 시:
  1. 포맷된 JSON 문자열(`result.output`)을 `sessionStorage`(URL 쿼리 아님)에 담는다. 키는 step1에서 `json-to-sql` 쪽이 실제로 읽는 것과 **정확히 동일한 문자열**을 사용해야 한다 — `src/components/tools/json-to-sql/JsonToSqlTool.tsx`를 읽고 확인하라.
  2. `/developer/json-to-sql`(현재 locale 유지, 예: KO면 `/ko/developer/json-to-sql`)로 이동한다.
  3. 이동 전 `sendEvent`는 기존 `calculate`/`copy_result` 이벤트 네이밍 규칙을 따르되, `AnalyticsEventName` 유니온 타입(`'tool_open' | 'calculate' | 'copy_result' | 'share'`, `src/hooks/useAnalyticsEvent.ts` 확인)을 **절대 확장하지 마라** — 새 이벤트 이름을 추가하지 말고 기존 4개 중 의미상 가장 가까운 것을 재사용한다.
- 기존 Format/Minify/복사/다운로드 동작은 전혀 변경하지 마라.

### 2. `tools-config.ts` 수정

- `json-formatter` 항목의 `relatedToolIds`에 `'json-to-sql'`을 추가한다.
- `json-to-sql` 항목(step1에서 생성됨)의 `relatedToolIds`에 이미 `'json-formatter'`가 들어있는지 확인한다(step1에서 이미 넣어뒀어야 한다 — 없다면 이 step에서 추가한다). 두 항목이 상호 링크되어야 한다.

### 3. `src/app/[locale]/developer/json-formatter/page.tsx` 수정(필요시)

- Description/How To Use 섹션에 "포맷된 결과를 SQL INSERT문으로 바로 변환할 수 있다"는 안내를 한두 문장 추가할 수 있다(선택 사항, 필수 아님).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. "Convert to SQL" 버튼 클릭 시 사용하는 `sessionStorage` 키 이름이 `JsonToSqlTool.tsx`의 수신부 키와 정확히 일치하는지 코드로 대조 확인한다.
3. `AnalyticsEventName` 유니온 타입(`src/hooks/useAnalyticsEvent.ts`)이 이 step에서 확장되지 않았는지(새 이벤트 이름이 추가되지 않았는지) 확인한다.
4. 기존 Format/Minify/복사/다운로드 동작에 회귀가 없는지(기존 `jsonFormatter.test.ts`가 그대로 통과하는지) 확인한다.
5. `/developer/json-formatter`(EN/KO)가 정상 빌드되는지 확인한다.
6. `tools-config.ts`에서 `json-formatter` ↔ `json-to-sql`이 `relatedToolIds`로 상호 연결됐는지 확인한다.
7. `JsonToSqlTool.tsx`를 import하지 않았는지(값만 문자열로 맞췄는지) 확인한다.
8. 결과에 따라 `phases/6-developer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(수정 파일 목록, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: step1 미완료로 `json-to-sql`이 존재하지 않음) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `jsonFormatter.ts`의 기존 로직(관용적 파싱 없음, `//`/`--`/`#` 줄 주석 미지원)을 이 step에서 재도입하지 마라 — screens 문서 "검토했으나 보류" 섹션에 이미 롤백된 이유가 남아있다.
- `AnalyticsEventName` 유니온 타입에 새 이벤트 이름을 추가하지 마라 — 기존 4개(`tool_open`/`calculate`/`copy_result`/`share`) 중에서만 선택한다.
- `sessionStorage` 대신 URL 쿼리 파라미터로 JSON을 전달하지 마라 — 민감한 데이터가 포함될 수 있다.
- `JsonToSqlTool.tsx`를 import하지 마라(rule 8) — sessionStorage 키 문자열만 일치시킨다.
- 기존 테스트를 깨뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).

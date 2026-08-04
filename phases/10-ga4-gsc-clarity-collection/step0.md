# Step 0: analytics-auth-and-ga4

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 기존 스크립트 스타일을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/package.json`
- `/scripts/notify-indexnow.ts` (이 프로젝트의 스크립트 스타일 참고 — 무거운 SDK 대신 가벼운 fetch 기반, env var로 시크릿 주입, 실패 시 명확한 로그)
- `/SERVICE-SETUP.md` ("1. Google Analytics 4", "2. Google Search Console" 섹션 — GSC가 **도메인 속성**으로 인증돼 있다는 점 확인)

이 프로젝트는 GA4 Data API + Search Console API 호출을 위한 서비스 계정을 이미 만들어뒀다. GitHub Secrets에 `GOOGLE_SERVICE_ACCOUNT_JSON`(서비스 계정 키 JSON 전체 문자열), `GA4_PROPERTY_ID`(GA4 속성 숫자 ID)가 등록되어 있다.

## 작업

**의존성**: `google-auth-library` npm 패키지를 devDependency가 아닌 일반 dependency로 추가한다(`npm install google-auth-library`) — 이 패키지만으로 서비스 계정 JWT 인증이 가능하다. `googleapis` 같은 무거운 전체 API 클라이언트 패키지는 추가하지 않는다 — REST 엔드포인트를 직접 `fetch`로 호출하는 이 프로젝트의 기존 스타일을 따른다.

**인증 유틸**: `scripts/lib/googleAuth.ts`를 만든다. `google-auth-library`의 `GoogleAuth`(또는 `JWT`) 클래스를 사용해 `process.env.GOOGLE_SERVICE_ACCOUNT_JSON`(JSON 문자열 — `JSON.parse` 필요)을 credentials로 삼고, scope는 `https://www.googleapis.com/auth/analytics.readonly`와 `https://www.googleapis.com/auth/webmasters.readonly` 둘 다 포함해서 access token을 발급받는 함수를 export한다(예: `getGoogleAccessToken(): Promise<string>`). 이 함수는 다음 step(GSC)에서도 재사용된다.

**GA4 Data API 호출**: `scripts/collect-analytics.ts`를 만든다.
- Google Analytics Data API(`https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY_ID}:runReport`)의 정확한 요청 body 스키마는 최신 공식 문서를 직접 찾아서 확인하라(WebFetch 등으로 `https://developers.google.com/analytics/devguide/reporting/data/v1` 계열 문서 확인 권장 — 스키마를 추측해서 하드코딩하지 마라).
- 요청 내용: 어제 날짜(`yesterday`) 하루치 데이터. dimension으로 `pagePath`와 `eventName`을 포함하고, metric으로 `sessions`, `eventCount`를 요청해 페이지별 세션 수와 이벤트별(`tool_open`/`input_enter`/`calculate`/`copy_result`/`share`) 발생 횟수를 함께 가져온다.
- Authorization 헤더에 위 인증 유틸에서 받은 access token을 `Bearer` 토큰으로 사용한다.
- 결과를 `/data/raw/ga4-{YYYY-MM-DD}.json`(어제 날짜 기준)에 저장한다. `data/raw/` 디렉토리가 없으면 생성한다.
- `GOOGLE_SERVICE_ACCOUNT_JSON` 또는 `GA4_PROPERTY_ID` 환경변수가 없으면, 이 스크립트의 핵심 기능이 동작할 수 없으므로 명확한 에러 메시지를 출력하고 `process.exit(1)`로 종료한다(IndexNow 스크립트와 달리 이건 데이터 파이프라인의 핵심 기능이라 조용히 스킵하면 안 된다).

이 step은 GA4 부분만 다룬다. GSC/Clarity 호출은 다음 step들에서 같은 파일에 이어서 추가한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
```

`GOOGLE_SERVICE_ACCOUNT_JSON`/`GA4_PROPERTY_ID` 없이 로컬에서 스크립트를 실행하면 명확한 에러 메시지와 함께 exit code 1로 종료하는지 확인한다(실제 API 키가 없는 로컬 환경에서는 이 정도까지만 검증 가능 — 실제 GA4 응답 성공 여부는 실제 크론 실행에서만 검증된다).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `google-auth-library`만 추가했는가(`googleapis` 같은 무거운 패키지를 추가하지 않았는가)?
   - 서비스 계정 JSON을 파일에 하드코딩하지 않았는가? (CLAUDE.md rule 4)
   - GA4 Data API 요청 body 스키마를 실제 공식 문서를 확인해서 작성했는가(추측으로 작성하지 않았는가)?
   - 필수 환경변수 누락 시 명확한 에러로 종료하는가?
3. 결과에 따라 `phases/10-ga4-gsc-clarity-collection/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 서비스 계정 JSON 값이나 GA4 property ID를 파일에 하드코딩하지 마라.
- `googleapis` 패키지를 추가하지 마라. 이유: 프로젝트의 경량 fetch 기반 스크립트 스타일과 어긋나고 불필요하게 무겁다.
- 이 step에서 GSC/Clarity 호출 로직을 추가하지 마라(다음 step들의 스코프).
- 기존 테스트를 깨뜨리지 마라.

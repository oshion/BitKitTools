# Screen: JWT Decoder

## URL
`/developer/jwt-decoder` (EN), `/ko/developer/jwt-decoder` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`none`/`general`) → Related Tools.

## 목적
JWT(JSON Web Token)를 붙여넣으면 Header/Payload를 즉시 디코딩해서 보여주고, 표준 클레임(`exp`, `iat`, `nbf`, `iss`, `aud`, `sub` 등)을 사람이 읽기 쉬운 설명과 함께 표시한다.

## 경쟁사 리서치 요약 (설계 근거)
- jwt.io(사실상 업계 표준 레퍼런스)는 원문 JSON + 서명 검증 + 인코더까지 제공하지만, "브라우저를 벗어나지 않는다"는 트러스트 메시지를 본문에 강조하지 않는다.
- jwt.ms(Microsoft)는 "Enter token below (it never leaves your browser):"라는 간결한 문구로 신뢰를 명시하고, 클레임을 표(타입/값/설명)로 보여주는 패턴을 쓴다 — **이 프로젝트가 따를 패턴**.
- logto.io도 "Your data is 100% private — JWT is fully decoded and encoded directly on your device."라는 유사한 문구를 쓴다.
- 사람이 읽을 수 있는 클레임 설명(예: `exp: 2026-08-01 14:00 UTC 만료`)은 이제 여러 경쟁사가 공통으로 제공하는 **기본 기대치**이지 차별화 요소가 아니다 — 반드시 포함해야 한다.
- 서명 검증(비밀키/공개키로 valid/invalid 확인)과 JWT 인코더는 강한 경쟁사들이 갖춘 기능이지만 스코프가 커진다 — 이번 MVP에서는 **디코딩 전용**으로 범위를 좁히고, 서명 검증/인코더는 향후 확장 후보로 `docs/tech-debt-tracker.md`에 남긴다.

## 입력
- JWT 토큰 붙여넣기 (텍스트 영역 또는 단일 입력 필드 — 실제 토큰은 개행 없는 한 줄이 일반적이므로 단일 입력에 가깝게 디자인하되 긴 토큰이 잘리지 않게 자동 줄바꿈 표시)

## 출력/로직 (`lib/utils/jwtDecoder.ts`)
```ts
export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string // base64url 그대로, 검증하지 않음(MVP 스코프 아님)
}
export function decodeJwt(token: string): { success: true; decoded: DecodedJwt } | { success: false; error: string }

export type ClaimExplanation = { key: string; value: unknown; explanation: string }
export function explainStandardClaims(payload: Record<string, unknown>, locale: 'en' | 'ko'): ClaimExplanation[]
```
- `decodeJwt`는 base64url 디코딩만 수행(점 3개로 구분된 세그먼트 파싱, header/payload는 JSON.parse) — **서명 검증은 하지 않는다**(MVP 스코프 아님, 아래 금지사항 참고).
- `explainStandardClaims`는 표준 등록 클레임(`exp`, `iat`, `nbf`, `iss`, `aud`, `sub`, `jti`)이 payload에 존재하면 사람이 읽을 수 있는 설명을 생성한다. 시간 관련 클레임(`exp`/`iat`/`nbf`)은 유닉스 타임스탬프를 로컬 날짜/시간으로 변환해서 보여주고, `exp`는 현재 시각과 비교해 "만료됨"/"유효함" 상태도 함께 표시한다(이건 서명 검증이 아니라 단순 시간 비교이므로 MVP에 포함 가능 — 서명 유효성과 혼동되지 않도록 라벨을 명확히 구분한다: "만료 시각 지남" 같은 표현을 쓰고 "서명 검증됨"류 표현은 쓰지 않는다).

## UI 구성
- 입력: JWT 토큰 붙여넣기 필드, **"토큰은 브라우저를 벗어나지 않습니다"** 신뢰 문구를 입력 필드 바로 아래 명시(jwt.ms 스타일 간결한 문구)
- 결과: Header JSON / Payload JSON을 각각 코드 블록으로 표시 + 그 아래 "클레임 설명" 표(클레임명 / 값 / 설명, `explainStandardClaims` 결과)
- `exp` 클레임이 있으면 "만료 시각 지남" 또는 "만료까지 N일 남음" 배지를 눈에 띄게 표시(서명 검증 아님을 명확히 라벨링)
- 유효하지 않은 토큰(점 3개로 구분 안 됨, base64url 디코딩 실패, JSON 파싱 실패) 입력 시 명확한 에러 메시지

### 디자인 방향 — 크고 깔끔하게
- Header/Payload 코드 블록을 나란히(데스크톱) 또는 세로로(모바일) 배치, `json-formatter`와 비슷한 좌우 레이아웃 언어를 재사용하되 컴포넌트 자체는 공유하지 않는다(rule 8).
- 클레임 설명 표는 촘촘한 표보다 여백 있는 리스트 형태로 — "크고 깔끔하게" 방향에 맞게 클레임 하나하나가 명확히 구분되도록.

## tools-config 항목
- `id`/`slug`: `jwt-decoder`
- `category: 'developer'`, `disclaimerType: 'none'`, `aiOverviewResistance: 'high'`
- 키워드: `jwt decoder`, `jwt token decoder`, `decode jwt online`, `jwt claims viewer` 등
- FAQ 예:
  - "이 토큰이 실제로 유효한지(서명이 맞는지) 확인할 수 있나요?" → "아니오, 현재는 디코딩만 지원합니다"로 시작, 서명 검증은 향후 계획임을 안내
  - "제 토큰이 서버로 전송되나요?" → "아니오"로 시작, 전부 브라우저 내에서 처리된다는 점 강조
  - "exp가 지났다고 나오는데 무슨 뜻인가요?" → 토큰의 선언된 만료 시각이 현재 시각보다 과거라는 뜻이며, 이것이 서명 유효성과는 별개라는 점 설명

## 상태
- 컴포넌트 로컬 `useState`만. 토큰은 민감한 인증 정보이므로 LocalStorage/sessionStorage 어디에도 저장하지 않는다.

## Analytics 이벤트
`Tool Open`, `Calculate`(디코딩 실행 시) — 토큰 값 자체는 이벤트 payload에 절대 포함하지 않는다.

## 금지사항
- 입력된 토큰을 외부로 전송하지 않는다 — 전부 클라이언트에서 처리.
- **서명 검증 기능을 이번 스코프에 포함하지 않는다** — "서명이 유효합니다/무효합니다" 같은 문구를 절대 표시하지 않는다(만료 시각 비교와 혼동 금지).
- 토큰 값을 LocalStorage/sessionStorage에 저장하지 않는다(json-formatter보다 더 엄격 — 인증 토큰은 특히 민감하다).
- `json-formatter`/`json-to-sql`과 컴포넌트/로직을 공유하지 않는다(rule 8).

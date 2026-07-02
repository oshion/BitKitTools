# Screen: Password Generator

## URL
`/developer/password-generator` (EN), `/ko/developer/password-generator` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → [Disclaimer] → Related Tools. `disclaimerType: general` — "생성된 비밀번호는 브라우저에만 존재하며 서버로 전송되지 않는다"는 신뢰 문구를 일반 면책 톤으로 포함.

## 목적
길이/문자 조합 옵션에 따라 안전한 비밀번호를 즉시 생성하고 강도를 시각적으로 표시한다.

## 입력
- 길이 슬라이더 (8~64, 기본 16)
- 문자 조합 체크박스: 대문자 / 소문자 / 숫자 / 특수문자
- "유사 문자 제외"(`0`/`O`, `1`/`l` 등) 옵션

## 출력/로직 (`lib/utils/passwordGenerator.ts`)
- `generatePassword(options: PasswordOptions): string` — `crypto.getRandomValues` 기반 CSPRNG 사용 (Math.random 금지 — 보안 도구이므로)
- `estimatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong'` — 엔트로피 기반 추정

## UI 구성
- 생성된 비밀번호 큰 모노스페이스 텍스트 + 복사 버튼
- 강도 게이지 (진행도 바 애니메이션, 체류시간 빌딩 요소)
- 옵션 변경 시 즉시 재생성

## tools-config 항목
- `category: 'developer'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'` ("실행 자체가 결과물"이라 AI 대체 불가)
- FAQ 예: "생성된 비밀번호는 저장되나요?", "안전한 비밀번호 길이는 얼마인가요?"

## 상태
- 로컬 `useState`만. 생성된 비밀번호는 LocalStorage/analytics에 절대 기록하지 않는다.

## Analytics 이벤트
`Tool Open`, `Calculate`(재생성 시), `Copy Result` — 단, 비밀번호 값 자체는 이벤트 payload에 포함하지 않는다.

## 금지사항
- `Math.random()`으로 비밀번호를 생성하지 않는다. 이유: 예측 가능성으로 인한 보안 취약점 — 반드시 `crypto.getRandomValues` 사용.
- 생성된 비밀번호 값을 어떤 형태로도 로깅/전송하지 않는다.

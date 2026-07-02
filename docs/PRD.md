# PRD: BitKitTools.com

## 목표
개발자·여행자·맥주 애호가·육아 부모를 위한 마이크로 계산기/유틸리티를 SEO와 AI Overview 시대에 살아남는 구조로 제공해 Google AdSense 광고 수익을 창출하는 무관리형(서버리스) 유틸리티 플랫폼.

## 사용자
구글 검색(예: "BAC calculator", "flight delay compensation calculator", "baby growth percentile")으로 특정 니즈를 갖고 유입되는 한국어/영어권 사용자. 로그인 없이 즉시 도구를 쓰고 이탈하거나, 관련 툴을 탐색하며 체류한다. 일부 툴(BAC, Baby)은 민감한 개인/건강 맥락에서 사용되므로 신뢰도(출처 명시)가 이탈률에 직접 영향을 준다.

## 핵심 기능
1. **Configuration-driven 홈/카테고리/SEO** — `lib/config/tools-config.ts` 하나로 모든 툴의 메타데이터를 관리하고, 홈/카테고리/사이트맵/RSS/관련 Tool/검색/OG 이미지가 전부 이 데이터로 동적 생성된다.
2. **카테고리별 마이크로 툴 8종 (MVP)** — 아래 표 참조. 전부 외부 API 없이 클라이언트에서 즉시 계산되는 순수 함수형 도구.
3. **한/영 다국어 라우팅 (as-needed prefix)** — EN 기본(prefix 없음) `/{category}/{tool-slug}`, KO는 `/ko/{category}/{tool-slug}`.
4. **광고 플레이스홀더 레이아웃** — 모든 툴 페이지에 CLS 방지용 고정 `min-height` 광고 슬롯 5곳(Header 아래/결과 아래/본문 중간/FAQ 위/Footer 위).
5. **LocalStorage 기반 사용자 설정 유지** — 최근 사용 Tool, 즐겨찾기, 마지막 입력값. 개인정보처리방침에 고지 필수.
6. **법적 필수 페이지** — `/privacy-policy`, `/terms`, `/about`, `/contact`, 루트 `ads.txt`.
7. **면책조항(Disclaimer) 시스템** — `disclaimerType`에 따라 공통 `<DisclaimerBanner>` 컴포넌트로 medical/legal/financial/general 문구를 일관되게 노출.
8. **Schema.org 구조화 데이터** — Tool 페이지(WebApplication), FAQ(FAQPage), 탐색(BreadcrumbList) 자동 생성 — AI Overview 인용 대응.
9. **Analytics/모니터링 훅** — GA4, GSC, Microsoft Clarity 연동 + Tool Open/Calculate/Copy Result/Share 커스텀 이벤트.

## MVP 대상 툴 (카테고리 4개 × 2개, 8종)

| 카테고리 | slug | 툴 | disclaimerType | AI 대체 저항력 |
|---|---|---|---|---|
| Developer | `json-formatter` | JSON Formatter & Validator | general | high |
| Developer | `password-generator` | Password Generator | general | high |
| Travel | `flight-delay-compensation` | Flight Delay Compensation Calculator | legal | high |
| Travel | `visa-requirement-checker` | Visa Requirement / Travel Insurance Checker | legal | high |
| Beer | `bac-calculator` | BAC Calculator (Blood Alcohol Concentration) | medical | high |
| Beer | `homebrew-recipe-calculator` | Homebrew Recipe & ABV/Dilution Calculator | general | high |
| Baby | `growth-percentile` | Baby Growth Percentile Calculator | medical | high |
| Baby | `sleep-schedule` | Baby Sleep Schedule / Nap Time Calculator | medical | high |

> 8종 모두 외부 API·서버 호출 없이 순수 클라이언트 계산으로 완결되어 Static Export와 완전히 호환된다. 선정 기준(AI Overview 대체 저항력/예상 CPC/트래픽 볼륨/법적 리스크 관리 가능 여부) 상세 → [BitKitTools-project-profile-v2.md](../BitKitTools-project-profile-v2.md) Section 13.

## MVP 제외 사항
- 로그인/회원가입, 백엔드 DB, 결제 기능
- Currency Converter — Google SERP 자체 통화 변환기 내장으로 클릭 유입 구조적으로 낮음 (profile v2 Section 13)
- 숙취 회복시간 계산기, 알코올 칼로리 계산기 — 단순 사실 질의형이라 AI Overview 대체 위험 높아 후순위
- Server-Side Rendering(SSR), ISR — Static Export만 사용
- 실시간 외부 API가 필요한 도구 전반 — MVP 8종은 전부 정적 데이터/순수 계산으로 설계됨
- 사용자 계정 간 데이터 동기화 (LocalStorage는 기기/브라우저 단위)

## 법적/컴플라이언스 요건 (MVP 필수)
- `/privacy-policy`, `/terms`, `/about`, `/contact`, `ads.txt` — AdSense 심사 전 필수
- EEA/UK 트래픽 대상 Consent Mode v2 (무료 CMP 스크립트 연동)
- BAC Calculator는 표준 medical disclaimer 이상의 강화된 안전장치 UX 규칙 적용 (profile v2 Section 13-5)
- 상세 → [BitKitTools-project-profile-v2.md](../BitKitTools-project-profile-v2.md) Section 6

## 디자인
- 다크모드 고정 — "도구/대시보드"처럼 보여야 하며 마케팅 랜딩 느낌 배제
- 무채색 베이스 + 포인트 컬러 1가지, AI 슬롭 안티패턴 회피
- 좌측 정렬 기본, 애니메이션은 최소한(진행도 바, 결과 값 전환)만 허용
- 상세 컬러/컴포넌트 스펙 → [UI_GUIDE.md](UI_GUIDE.md)

# Screens: 법적 필수 정적 페이지

AdSense 심사 및 컴플라이언스를 위해 MVP 출시 전 반드시 존재해야 하는 4개 정적 페이지 + `ads.txt` (profile v2 Section 6-1).

## 공통 사항
- 전부 `app/[locale]/{page}/page.tsx`로 구현, 순수 정적 콘텐츠(계산 로직 없음)
- Zustand/LocalStorage 상태 없음
- 하단 푸터에서 모든 페이지 링크 필수 노출

---

## `/privacy-policy`
`/privacy-policy` (EN), `/ko/privacy-policy` (KO)

**목적**: AdSense/GA4/Microsoft Clarity 쿠키 사용 고지 + LocalStorage 사용 고지.

**필수 포함 내용**:
- 수집하는 정보: 쿠키(광고/분석), LocalStorage(최근 사용 Tool, 즐겨찾기, 마지막 입력값)
- 사용하는 제3자 서비스 목록: Google AdSense, Google Analytics 4, Google Search Console, Microsoft Clarity, CMP 벤더(예: CookieYes)
- CMP를 통한 동의 철회 방법 안내
- BAC/Baby 등 민감 카테고리 툴의 입력값이 서버로 전송되지 않고 브라우저에만 존재한다는 점 명시 (신뢰도 확보)

---

## `/terms`
`/terms` (EN), `/ko/terms` (KO)

**목적**: 이용약관. 계산 결과의 정확성 미보장, 면책 범위 등을 법적 문서 형태로 통합 고지 (개별 툴의 `DisclaimerBanner`는 요약 수준, 이 페이지가 전체 법적 근거).

---

## `/about`
`/about` (EN), `/ko/about` (KO)

**목적**: AdSense 심사 시 사이트 신뢰도 평가 요소. 서비스 소개, 운영 목적, 카테고리 구성(개발자/여행/맥주/육아) 설명.

---

## `/contact`
`/contact` (EN), `/ko/contact` (KO)

**목적**: AdSense 심사 시 사이트 신뢰도 평가 요소. 이메일 주소 또는 문의 폼(Static Export이므로 폼 제출은 mailto: 링크 또는 외부 폼 서비스(Formspree 등) 연동 — 자체 백엔드 없음).

---

## `public/ads.txt`
**목적**: Google AdSense 필수 파일. `app/[locale]/` 라우팅과 무관하게 항상 `도메인루트/ads.txt`로 서빙되어야 하므로, next-intl 라우팅 밖 `public/` 디렉토리에 정적 파일로 직접 배치한다 (ARCHITECTURE.md 참고).

## 금지사항
- 4개 법적 페이지를 `[locale]` 라우팅 밖에 두지 않는다 — hreflang이 걸린 정상 페이지로 취급되어야 한다 (단, `ads.txt`는 예외).
- 이 페이지들에 계산기 UI를 넣지 않는다 — 순수 정적 콘텐츠로 유지한다.

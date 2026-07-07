# 외부 서비스 설정 현황

BitKitTools.com 운영에 필요한 외부 서비스 계정을 왜 만들었는지, 실제 값은 어디 있는지, 모니터링은 어디서 하는지 정리한 색인이다.

> **실제 ID/토큰 값은 이 문서에 적지 않는다.** 이 파일은 git에 커밋되지만 `.env.production`/`.env.local`은 `.gitignore` 대상이라, 값 자체는 항상 그 파일들에서만 확인한다.

---

## 1. Google Analytics 4 (GA4)

- **왜**: 페이지뷰, 체류시간, 트래픽 소스 등 정량적 사용자 행동 데이터 수집. profile v2 "모니터링 프로세스"의 월 단위 리뷰(Tool별 페이지뷰/체류시간)에 쓰는 기본 데이터.
- **값**: `NEXT_PUBLIC_GA_ID` (`.env.production`)
- **모니터링**: https://analytics.google.com → BitKitTools 속성
- **동작 조건**: CookieYes에서 사용자가 "analytics" 카테고리에 동의해야 실제로 수집 시작 (Google Consent Mode v2, `src/components/analytics/AnalyticsScripts.tsx`).

## 2. Google Search Console (GSC)

- **왜**: 검색 노출수/클릭수, 색인 상태 확인. AI Overview 영향 감지(노출 유지+클릭 하락 패턴), sitemap 제출.
- **값**: 없음 — Route53 DNS TXT 레코드로 **도메인 속성** 인증 완료. `NEXT_PUBLIC_GSC_VERIFICATION`(HTML 태그 방식용 env var)은 사용하지 않음.
- **모니터링**: https://search.google.com/search-console → `bitkittools.com` 도메인 속성

## 3. Microsoft Clarity

- **왜**: 세션 리플레이/히트맵으로 사용자가 실제 UI에서 어떻게 행동하는지(rage click, dead click 등) 정성적으로 파악 — GA4가 못 보여주는 "왜"를 보기 위함. 완전 무료라 비용 부담 없음. 필수는 아니고 UX 개선용 참고 도구.
- **값**: `NEXT_PUBLIC_CLARITY_ID`
- **모니터링**: https://clarity.microsoft.com → BitKitTools 프로젝트
- **동작 조건**: GA4와 동일하게 CookieYes 동의 후에만 로드됨.

## 4. CookieYes (CMP, 쿠키 동의 관리)

- **왜**: EEA/UK/스위스 트래픽 대상 Google Consent Mode v2 연동이 AdSense 정책상 의무 사항. 안 하면 해당 지역 광고가 비개인화로 전환되거나 계정 전체가 정책 위반 리스크에 노출됨.
- **값**: `NEXT_PUBLIC_CMP_SITE_ID`
- **모니터링/설정**: https://app.cookieyes.com → 배너 문구/레이아웃(Banner 선택함)/동의 로그 확인
- **플랜**: Free (월 5,000 pageviews, 스캔 100페이지/월 5회 한도). 초과 시 유료 전환 검토.
- **주의**: 대시보드의 "Try Pro for free" 배너는 무시 — 누르지 않는 한 현재 Free 플랜에 영향 없음.

## 5. Google AdSense

- **왜**: 광고 수익 창출 — 프로젝트 핵심 비즈니스 모델.
- **값**: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` — **아직 미설정**. 사이트 배포(라이브) 후 가입 예정.
- **모니터링**: https://www.google.com/adsense
- **관련 파일**: `public/ads.txt` — 가입 후 발급받는 pub-ID로 교체 필요.
  - ⚠️ 형식 차이 주의: `ads.txt`는 `pub-XXXXXXXXXXXXXXXX`(접두어 없음), env var는 `ca-pub-XXXXXXXXXXXXXXXX`(`ca-` 포함).

## 6. AWS Route53 (도메인/DNS)

- **왜**: `bitkittools.com` 도메인 등록 및 DNS 관리 (서버 IP 연결용 A 레코드, GSC 인증용 TXT 레코드 등).
- **모니터링**: AWS Console → Route53 → Hosted zones

---

## env 파일 우선순위 주의

Next.js 로딩 우선순위: `.env.local` > `.env.production` > `.env`. **로컬에서 배포용 `npm run build`를 돌릴 때 `.env.local`에 값이 남아있으면 `.env.production` 값을 덮어쓴다.** 배포 직전 실제 빌드 전엔 `.env.local`을 비우거나 지우고 빌드할 것.

## 남은 작업

- [ ] 서버(EC2 + Nginx + SSL) 세팅 및 `out/` 배포
- [ ] 배포 후 GSC에 sitemap.xml 제출
- [ ] Google AdSense 가입 (사이트 라이브 후)
- [ ] `public/ads.txt`에 실제 pub-ID 반영
- [ ] `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 채우고 최종 재빌드·재배포

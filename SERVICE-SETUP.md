# 외부 서비스 설정 현황

BitKitTools.com 운영에 필요한 외부 서비스 계정을 왜 만들었는지, 실제 값은 어디 있는지, 모니터링은 어디서 하는지 정리한 색인이다.

> **실제 ID/토큰 값은 이 문서에 적지 않는다.** 이 파일은 git에 커밋되지만 `.env.production`/`.env.local`은 `.gitignore` 대상이라, 값 자체는 항상 그 파일들에서만 확인한다.

---

## 1. Google Analytics 4 (GA4)

- **왜**: 페이지뷰, 체류시간, 트래픽 소스 등 정량적 사용자 행동 데이터 수집. profile v2 "모니터링 프로세스"의 월 단위 리뷰(Tool별 페이지뷰/체류시간)에 쓰는 기본 데이터.
- **값**: `NEXT_PUBLIC_GA_ID` (`.env.production`)
- **모니터링**: https://analytics.google.com → BitKitTools 속성
- **동작 조건**: Google CMP(아래 4번)에서 사용자가 analytics storage에 동의해야 실제로 수집 시작 (Google Consent Mode v2, `src/components/analytics/AnalyticsScripts.tsx`).

## 2. Google Search Console (GSC)

- **왜**: 검색 노출수/클릭수, 색인 상태 확인. AI Overview 영향 감지(노출 유지+클릭 하락 패턴), sitemap 제출.
- **값**: 없음 — Route53 DNS TXT 레코드로 **도메인 속성** 인증 완료. `NEXT_PUBLIC_GSC_VERIFICATION`(HTML 태그 방식용 env var)은 사용하지 않음.
- **모니터링**: https://search.google.com/search-console → `bitkittools.com` 도메인 속성
- **상태**: sitemap.xml 제출 완료.

## 3. Microsoft Clarity

- **왜**: 세션 리플레이/히트맵으로 사용자가 실제 UI에서 어떻게 행동하는지(rage click, dead click 등) 정성적으로 파악 — GA4가 못 보여주는 "왜"를 보기 위함. 완전 무료라 비용 부담 없음. 필수는 아니고 UX 개선용 참고 도구.
- **값**: `NEXT_PUBLIC_CLARITY_ID`
- **모니터링**: https://clarity.microsoft.com → BitKitTools 프로젝트
- **동작 조건**: GA4와 동일하게 Google CMP 동의 후에만 로드됨.

## 4. Google CMP (AdSense "Privacy & messaging")

- **왜**: EEA/UK/스위스 트래픽 대상 Google Consent Mode v2 연동이 AdSense 정책상 의무 사항. 안 하면 해당 지역 광고가 비개인화로 전환되거나 계정 전체가 정책 위반 리스크에 노출됨.
- **이력**: 처음엔 서드파티 CMP인 CookieYes(무료 티어)로 구현했으나(`docs/ADR.md` ADR-013), 월 5,000 pageviews 무료 한도를 신경 쓰고 싶지 않아 Google 자체 CMP로 전환함(ADR-015). AdSense 계정에 이미 연결된 광고 태그를 그대로 배너 배포 채널로 쓰기 때문에 별도 site ID/env var가 필요 없음 — `NEXT_PUBLIC_ADSENSE_CLIENT_ID`(5번 항목)의 pub-ID를 그대로 재사용.
- **설정 위치**: AdSense → Privacy & messaging → "2가지 선택사항(동의/옵션 관리)" 메시지 사용 중.
- **모니터링/문구 변경**: https://www.google.com/adsense → Privacy & messaging 탭
- **구현 코드**: `src/components/analytics/ConsentManager.tsx`(메시지 스크립트 삽입), `src/components/analytics/AnalyticsScripts.tsx`(`window.googlefc.callbackQueue`로 동의 상태 구독)
- **한도**: 없음 (CookieYes 무료 플랜과 달리 pageview 상한 없음)

## 5. Google AdSense

- **왜**: 광고 수익 창출 — 프로젝트 핵심 비즈니스 모델.
- **값**: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (`ca-pub-...` 형식)
- **모니터링**: https://www.google.com/adsense
- **관련 파일**: `public/ads.txt` — 실제 pub-ID 반영 완료.
  - ⚠️ 형식 차이 주의: `ads.txt`는 `pub-XXXXXXXXXXXXXXXX`(접두어 없음), env var는 `ca-pub-XXXXXXXXXXXXXXXX`(`ca-` 포함).
- **상태**: 가입 완료, ads.txt 방식으로 사이트 소유권 확인 완료. Google 심사 대기 중(새 사이트는 2~4주 소요될 수 있음).
- **주의**: "광고" 탭의 Auto ads는 켜지 않음 — `AdSlot.tsx`로 광고 위치 5곳을 직접 고정 배치(CLS 방지)하는 설계라 Auto ads와 충돌 가능.

## 6. AWS Route53 (도메인/DNS)

- **왜**: `bitkittools.com` 도메인 등록 및 DNS 관리 (서버 IP 연결용 A 레코드, GSC 인증용 TXT 레코드 등).
- **모니터링**: AWS Console → Route53 → Hosted zones

---

## env 파일 우선순위 주의

Next.js 로딩 우선순위: `.env.local` > `.env.production` > `.env`. **로컬에서 배포용 `npm run build`를 돌릴 때 `.env.local`에 값이 남아있으면 `.env.production` 값을 덮어쓴다.** 배포 직전 실제 빌드 전엔 `.env.local`을 비우거나 지우고 빌드할 것. (지금은 `.env.local` 자체가 없는 상태 — 필요해지면 다시 만들 것.)

## 배포 현황

- `bitkittools.com` / `www.bitkittools.com` HTTPS로 라이브 (AWS EC2 + Nginx + Let's Encrypt)
- Nginx `try_files`를 SPA용(`/index.html` 폴백)에서 static export용(`=404` + `error_page 404 /404.html`)으로 수정 완료 — 존재하지 않는 URL이 정상적으로 404 반환
- 카테고리 4개 페이지(`/developer`, `/travel`, `/beer`, `/baby`) + `app/not-found.tsx` + `app/global-error.tsx` 전부 배포 반영됨

## 남은 작업

- [ ] Google AdSense 심사 결과 대기
- [ ] 승인 후 실제 광고 노출 확인, RPM 모니터링 시작
- [ ] (선택) Auto ads 도입 여부는 승인 후 별도 검토

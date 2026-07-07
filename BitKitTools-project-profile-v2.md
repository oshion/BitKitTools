# Project Profile - BitKitTools.com (v2.1)

> 본 문서는 초안(v1) 대비 광고 수익 극대화, AdSense 승인 요건, AI Overview 대응, YMYL/법적 리스크 관리 관점에서 개정된 버전입니다.

> **v2.1 개정 사항** (하네스 재세팅 논의 중 확정된 결정 사항 반영)
> 1. **URL locale 정책 확정**: v2 초안에서 Section 3(prefix 있음)과 Section 12(prefix 없음)가 불일치했음. Static Export는 middleware 기반 자동 언어 리다이렉트가 불가능하므로, **"as-needed" 방식**(기본 언어 EN은 prefix 없음, KO만 `/ko/` prefix)으로 통일. Section 3 URL 예시를 이에 맞춰 수정함.
> 2. **CMP(쿠키 동의) 구현 방식 확정**: 무료 서드파티 CMP 스크립트(예: CookieYes 무료 티어)로 Google Consent Mode v2 연동 (Section 6-3). → *배포 후 AdSense 가입 과정에서 Google 자체 CMP로 전환(`docs/ADR.md` ADR-015), 아래 Section 6-3도 갱신됨.*
> 3. **BAC Calculator 안전장치 강화**: 음주운전 판단으로 오인될 법적 리스크가 커서 일반 medical disclaimer보다 강한 UX 규칙을 추가함 (Section 13-5).

---

# 1. 프로젝트 개요 및 목표

* **서비스명:** BitKitTools.com
* **정체성:** 개발자, 여행자, 애주가, 육아 부모를 위한 다양한 마이크로 계산기와 유틸리티를 제공하는 웹 플랫폼
* **비즈니스 모델:** Google AdSense 기반 광고 수익 극대화
* **핵심 철학**

  * 서버 비용이 거의 없는 정적 사이트
  * 빠른 속도(Core Web Vitals 최적화)
  * SEO 중심 설계
  * 유지보수가 쉬운 구조
  * 새로운 Tool을 쉽게 추가 가능한 확장성
  * **AI Overview(제로클릭 검색) 시대에 살아남을 수 있는 Tool 설계**
  * **법적/정책 리스크를 사전에 차단하는 구조**

---

# 2. 기술 스택 및 아키텍처

## Framework

* Next.js (App Router)
* Static Export 기반
* 모든 페이지는 가능한 정적 HTML 생성
* SEO 친화적인 구조

## Deployment

* AWS EC2 + Nginx
* 또는 SEO에 적합한 정적 호스팅 방식

## Backend

* 사용하지 않음

## Database

* 사용하지 않음

## Client Storage

유저 설정이 필요한 경우 LocalStorage 사용

예)

* 최근 사용 Tool
* 즐겨찾기
* 마지막 입력값

> ⚠️ LocalStorage도 개인정보처리방침 고지 대상에 포함해야 함 (Section 6-1 참고)

---

# 3. 다국어(i18n)

영어권 광고 RPM 확보를 위해 다국어 지원

지원 언어

* English
* Korean

URL 구조 (as-needed locale prefix — 기본 언어 EN은 prefix 없음, Section 12 URL 정책과 동일)

```
/developer/json-formatter               ← EN (기본, prefix 없음)
/travel/flight-delay-compensation       ← EN (기본)
/beer/bac-calculator                    ← EN (기본)
/baby/growth-percentile                 ← EN (기본)

/ko/developer/json-formatter            ← KO
/ko/travel/flight-delay-compensation    ← KO
/ko/beer/bac-calculator                 ← KO
/ko/baby/growth-percentile              ← KO
```

> Static Export는 요청 시점 언어 감지(middleware)가 불가능하므로, 크롤러·직접 URL 접근 모두 기본 언어(EN)가 항상 고정 응답되는 구조가 필요함. "always prefix + 루트 client redirect" 방식은 초기 렌더 시 언어 깜빡임/크롤러 인덱싱 지연 리스크가 있어 채택하지 않음.

모든 페이지는

* hreflang
* canonical
* x-default

자동 생성

> ⚠️ 번역은 기계 번역 그대로 노출 금지. 최소한 검수를 거쳐 자연스러운 문장으로 게시 (얇은 콘텐츠/저품질 콘텐츠 판정 리스크 방지)

---

# 4. 프로젝트 구조

## Configuration Driven

Tool 목록은 하드코딩 금지

하나의 설정 파일에서 관리

예)

```
tools-config.ts
```

각 Tool은 다음 메타데이터를 가진다.

* id
* slug
* category
* language
* title
* description
* keywords
* Schema Type
* FAQ
* Related Tools
* 광고 슬롯 정보
* OG Image
* **status: "testing" | "validated" | "underperforming"** (트래픽 모니터링용, Section 11 참고)
* **disclaimer_type: "none" | "general" | "medical" | "financial" | "legal"** (Section 6-2 참고)
* **ai_overview_resistance: "high" | "medium" | "low"** (Tool 기획 시 자체 평가, Section 5-3 참고)

홈 화면 / 카테고리 / 사이트맵 / 검색 / 관련 Tool / RSS / SEO Metadata

모두 해당 설정 파일을 기반으로 자동 생성

---

## Tool 독립성

각 Tool은 독립 컴포넌트, 공통 상태 공유 금지

새로운 Tool 추가 시 `Tool Component + Metadata 추가` 만으로 동작하도록 설계

---

# 5. SEO 설계

## 5-1. 필수 요소 (자동 생성)

* title / description / keywords
* canonical / hreflang
* Open Graph / Twitter Card
* sitemap.xml / robots.txt / rss.xml
* 시맨틱 태그(h1/h2/h3) 철저히 준수

## 5-2. Schema.org

* Tool 페이지 → WebApplication
* FAQ → FAQPage
* Breadcrumb → BreadcrumbList

> AI Overview 인용 확률을 높이는 핵심 요소이므로 빠짐없이 적용 (Section 5-3 참고)

## 5-3. AI Overview 대응 전략 (신규)

2026년 기준 Google AI Overview는 전체 검색의 13~48%(쿼리 유형에 따라 상이)에 노출되며, 정보성/단순 사실형 쿼리는 30~40%의 유기적 트래픽 감소를 겪고 있음. Tool 기획 단계에서 다음을 반드시 검토:

* **AI 대체 저항력 평가**: 결과가 사용자 고유의 입력값(개인 데이터, 여러 변수 조합)에 좌우되는 Tool은 AI가 일반화된 답변으로 대체하기 어려움 → 우선순위 상위
  * 예: BAC Calculator(성별·체중·주량·시간 조합), Flight Delay Compensation(노선·지연시간·규정 조합) → 저항력 높음
  * 예: 단순 사실 질의형("숙취는 몇 시간 가나요") → 저항력 낮음, 후순위
* **네이티브 SERP 위젯 회피**: Google이 검색결과 화면에 자체 계산기를 이미 내장한 카테고리(통화 변환, 단위 변환 등)는 신규 Tool 기획 시 피할 것
* **FAQPage/HowTo Schema 필수 적용**: AI Overview 인용 확률과 인용 시 클릭률(+35%)을 높이는 유일한 통제 가능 요소
* **GSC 모니터링**: 노출수는 유지되나 클릭수만 하락하는 패턴 발견 시 AI Overview 영향으로 판단하고 콘텐츠 차별화 대응 (Section 11 참고)

## 5-4. 내부 링크

모든 Tool 하단에 Related Tools / Same Category / Popular Tools / Recently Added 자동 표시

## 5-5. 키워드 자기잠식 방지 (신규)

Tool 추가 시 기존 Tool과 타겟 키워드가 중복되지 않는지 사전 체크. 유사 의도 키워드로 페이지가 여러 개 생기면 서로 순위를 깎아먹을 수 있음.

---

# 6. 법적 요건 및 컴플라이언스 (신규 섹션)

> 서버에 사용자 데이터를 저장하지 않더라도, AdSense·GA4·Clarity 등 제3자 트래킹 기술을 사용하는 순간 아래 요건은 예외 없이 필수임.

## 6-1. 필수 정적 페이지

* `/privacy-policy` — AdSense/GA4/Clarity 쿠키 사용 고지, LocalStorage 사용 고지 포함
* `/terms` — 이용약관
* `/about`, `/contact` — AdSense 심사 시 사이트 신뢰도 평가 요소
* `ads.txt` — AdSense 필수 파일, 루트에 배치

## 6-2. Tool별 면책조항(Disclaimer) 정책 — 지속 관리 항목

**모든 신규 Tool 추가 시 면책조항 필요 여부를 반드시 검토하고, 필요한 경우 문구를 추가한다. 이는 1회성 작업이 아니라 Tool을 추가할 때마다 반복되는 필수 체크 항목이다.**

### 면책조항 유형 (tools-config.ts의 `disclaimer_type`과 매핑)

| 유형 | 대상 Tool 예시 | 문구 방향 |
|---|---|---|
| `medical` | BAC Calculator, Baby Growth Percentile Calculator, Baby Sleep Schedule Calculator | "본 계산 결과는 의학적 조언이 아니며 참고용입니다. 실제 건강/의료 판단은 반드시 의사·소아과 전문의와 상담하시기 바랍니다." + 근거 기준 출처 명시(WHO/CDC 등) |
| `legal` | Flight Delay Compensation Calculator, Visa Requirement Checker | "본 계산 결과는 법률 자문이 아니며, 실제 보상/비자 요건은 항공사·영사관·관련 기관의 최신 규정을 반드시 확인하시기 바랍니다." |
| `financial` | (향후 금융 계열 Tool 추가 시) | "본 계산은 투자/재무 자문이 아니며 참고용입니다." |
| `general` | JSON Formatter, Password Generator, Homebrew Recipe Calculator | 낮은 리스크지만 "결과의 정확성을 보장하지 않으며 최종 확인은 사용자 책임" 수준의 일반 면책 |

### 운영 원칙

* 신규 Tool PR/작업 체크리스트에 **"면책조항 유형 결정 → 문구 삽입 → 법적 검토(선택)"** 항목을 고정 포함
* YMYL(Your Money or Your Life) 성격이 있는 Tool(의료, 법률, 재무)은 공통 `<DisclaimerBanner disclaimerType="medical" />` 같은 재사용 컴포넌트로 관리하여 문구 일관성 유지 및 법규 변경 시 일괄 수정 가능하도록 설계
* 각 언어(EN/KO) 버전 모두 별도로 문구 검수 (번역 품질이 곧 법적 방어력에 영향)
* 출처/기준(WHO, CDC, 각국 법령 등)이 있는 계산은 반드시 출처를 본문에 명시하여 신뢰도와 AdSense 심사 통과율을 동시에 높임

## 6-3. 동의관리(CMP) / 쿠키 배너

* EEA/UK 트래픭 대상 Google Consent Mode v2 적용 필수
* 미적용 시 EU 트래픽 광고가 비개인화로 전환되어 RPM 급락 및 법적 리스크 발생 가능
* **구현 방식**: AdSense "Privacy & messaging"에서 제공하는 Google 자체 CMP(동의/옵션 관리 2가지 선택 메시지)로 Consent Mode v2를 연동한다(`docs/ADR.md` ADR-015). 처음엔 무료 서드파티 CMP(CookieYes)로 구현했으나, AdSense 계정에 이미 연결된 광고 태그를 그대로 배포 채널로 재사용할 수 있어 별도 계정/pageview 한도 없이 완전 무료인 Google 자체 CMP로 전환했다.

## 6-4. 지역별 콘텐츠 제한 리스크

주류(맥주) 카테고리는 일부 국가(이슬람권 등)에서 광고 자체가 제한되거나 접근이 차단될 수 있음. 다국어 확장 시 해당 지역 트래픽 비중을 모니터링.

---

# 7. 광고 최적화

Google AdSense Manual Ads 기준

* CLS 방지를 위해 광고 위치마다 Placeholder 확보(`min-height` 필수)
* 광고 영역: Header 아래 / Tool 결과 아래 / 본문 중간 / FAQ 위 / Footer 위
* 광고 Lazy Loading 적용, Core Web Vitals 저하 금지
* 모바일 앵커 광고 등 모바일 전용 포맷 검토 (모바일 트래픽 비중이 높을 것으로 예상되는 카테고리부터 우선 적용)

## 7-1. AdSense 승인 전략

* 초기 신청은 콘텐츠가 충실한 MVP Tool(8개) + 필수 법적 페이지만으로 진행
* 얇은 콘텐츠 대량 상태로 신청 시 반려 가능성 높음 → 승인 후 확장 단계에서 대량 생산 진행

## 7-2. 수익 다각화 (검토 사항)

* 여행 카테고리는 항공/보험/비자대행 제휴(Affiliate) 링크 결합 검토 — 동일 트래픽 대비 RPM 상승 가능

---

# 8. UX

모든 계산은 Client Side, 실시간 반영, Server 요청 없음

슬라이더 / 체크박스 / 애니메이션 / 진행도 등 인터랙션 적극 활용 (체류시간 증가 목적)

---

# 9. 콘텐츠 구성

모든 Tool 페이지는 동일한 구조

```
Title
Tool
Description
How To Use
Example
FAQ
[면책조항 - 해당 유형에 한함]
Related Tools
```

* 단순 계산기만 제공하지 말고 검색엔진과 AI가 이해 가능한 설명 콘텐츠 포함
* How To Use / FAQ는 템플릿 치환이 아니라 Tool별 실질적으로 차별화된 문장/예시로 작성 (Helpful Content 기준 및 얇은 콘텐츠 페널티 회피 목적)

---

# 10. Core Web Vitals

목표: CLS < 0.1 / LCP < 2.5s / INP 최적화

적용: Lazy Loading / Dynamic Import / Image Optimization / Font Optimization / Prefetch / Preconnect

---

# 11. Analytics & 트래픽 모니터링 (확장)

## 필수 적용

* Google Analytics 4
* Google Search Console
* Microsoft Clarity

## 커스텀 이벤트

* Tool Open / Calculate / Copy Result / Share

## 모니터링 프로세스 (신규, 지속 운영)

* **월 단위 리뷰**: Tool별 페이지뷰, 평균 체류시간, AdSense URL 채널 기준 페이지별 RPM
* **분기 단위 정리 룰**: 3개월 이상 세션 기준치 미달 + RPM 하위 20% → 신규 확장 우선순위 제외 또는 noindex 검토
* **AI Overview 영향 감지**: GSC에서 노출수 유지 + 클릭수 하락 패턴 확인 시 해당 페이지 콘텐츠 차별화/schema 보강 대응
* **터진 Tool 확장 신호**: 예상보다 성과 좋은 Tool은 같은 카테고리 내 유사 Tool 추가 검토
* tools-config.ts의 `status` 필드로 결과를 태깅하여 향후 자동화 기반 마련

---

# 12. URL 정책

모든 URL: 소문자 / kebab-case / 영구 유지

```
/developer/json-formatter
/developer/password-generator
/travel/flight-delay-compensation
/travel/visa-requirement-checker
/beer/bac-calculator
/beer/homebrew-recipe-calculator
/baby/growth-percentile
/baby/sleep-schedule
```

---

# 13. MVP 카테고리 및 Tool (개정)

> 아래 8개 Tool로 MVP를 구성한다. 선정 기준: (1) AI Overview 대체 저항력, (2) 예상 CPC, (3) 예상 트래픽 볼륨, (4) 카테고리별 법적 리스크 관리 가능 여부.

## Developer

### 1. JSON Formatter & Validator
* 기능: JSON Format / Minify / Validation / Copy / Download
* 선정 이유: 사용자 고유 데이터 기반 결과라 AI 대체 불가. 트래픽 볼륨 최상위
* disclaimer_type: `general`

### 2. Password Generator
* 기능: 길이/문자 조합 옵션, 강도 표시, Copy
* 선정 이유: "실행 자체가 결과물"이라 AI가 대체 불가. 보안/VPN 계열 CPC 양호
* disclaimer_type: `general`

## Travel

### 3. Flight Delay Compensation Calculator
* 기능: 노선, 지연시간, 적용 규정(EU261/미국 등) 선택 → 예상 보상 범위 계산
* 선정 이유: 다변수 개인화 결과, 법률/보험 인접 키워드로 CPC 최상위권
* disclaimer_type: `legal` — "실제 보상 여부는 항공사 및 관할 규정 확인 필요" 문구 필수

### 4. Visa Requirement / Travel Insurance Checker
* 기능: 출발국+목적지 조합 기반 비자 요건/추천 여행자보험 정보 안내
* 선정 이유: 조합별 개인화 강함, 비자대행/보험 광고 CPC 높음
* disclaimer_type: `legal` — "최신 비자 규정은 반드시 관할 영사관에서 재확인" 문구 필수
* ※ Currency Converter는 제외 — Google이 SERP에 자체 통화 변환기를 내장하고 있어 구조적으로 클릭 유입이 낮음

## Beer

### 5. BAC Calculator (Blood Alcohol Concentration)
* 기능: 성별, 체중, 술 종류, 마신 양, 시간 → 예상 혈중 알코올 농도 계산
* 선정 이유: 다변수 개인화로 AI 대체 불가. 법률/보험 인접 CPC 높음
* disclaimer_type: `medical` — "의료 정보가 아닌 참고용이며, 실제 운전 가능 여부와 무관함" 강조 문구 필수 (음주운전 관련 오인 방지 차원에서 특히 신중하게 작성)
* **강화된 안전장치 (UX 규칙, 필수)**:
  1. 결과 화면에 상시 노출되는 경고 배너: "이 결과는 운전 가능 여부를 판단하는 근거로 사용할 수 없습니다. 음주 후에는 절대 운전하지 마세요." — 배너를 닫거나 숨길 수 없게 한다.
  2. "안전", "운전 가능", "OK" 등 통과/합격을 암시하는 시각적 표시(초록불, 체크 아이콘 등)를 절대 사용하지 않는다 — 숫자 값만 중립적으로 표시.
  3. 결과 임계값과 무관하게 항상 동일한 경고 문구를 노출한다 (임계값 이하일 때 경고를 약화하지 않음).
  4. Section 6-2의 표준 `medical` disclaimer 문구에 더해, 위 1~3번을 이 Tool 전용 추가 규칙으로 `components/tools/bac-calculator/`에 하드코딩 수준으로 강제한다 (config로 끌 수 없게).

### 6. Homebrew Recipe & ABV/Dilution Calculator
* 기능: 배치 사이즈, 초기/최종 비중 입력 → 도수/희석 계산
* 선정 이유: 자기 레시피 기반 계산이라 AI 대체 저항력 강함. 홈브루 장비/재료 CPC 양호
* disclaimer_type: `general`
* ※ 기존 후보였던 "숙취 회복시간 계산기", "알코올 칼로리 계산기"는 단순 사실 질의형이라 AI Overview 대체 위험이 높아 후순위로 조정

## Baby (신규 카테고리)

### 7. Baby Growth Percentile Calculator
* 기능: 아기 나이, 성별, 체중, 키 입력 → WHO/CDC 기준 백분위 계산
* 선정 이유: 개인화된 결과라 AI 대체 불가, 재방문율 높음, 분유/유아 모니터링 제품 CPC 양호
* disclaimer_type: `medical` — "본 계산은 참고용이며 실제 성장 평가는 소아과 전문의와 상담 필요" 문구 필수, WHO/CDC 출처 명시

### 8. Baby Sleep Schedule / Nap Time Calculator
* 기능: 개월수/주령 입력 → 권장 낮잠·기상 시간표 제공
* 선정 이유: 개인화된 시간표로 AI 대체 불가, 체크 빈도 높아 재방문 유도, 수면교육 제품 CPC 양호
* disclaimer_type: `medical` — "일반적 가이드라인이며 개별 아기의 상태에 따라 다를 수 있음, 소아과 상담 권장" 문구 필수

---

# 14. 확장성

향후 카테고리 추가를 고려하여, 새로운 Tool은 Component + Metadata 추가만으로 홈/카테고리/검색/SEO/사이트맵/관련 Tool/RSS/OG/메뉴가 모두 자동 생성되도록 설계한다.

**신규 Tool 추가 시 필수 체크리스트:**

1. AI 대체 저항력 평가 (`ai_overview_resistance`)
2. 예상 CPC/트래픽 볼륨 리서치
3. 키워드 자기잠식 여부 확인 (Section 5-5)
4. 면책조항 유형 결정 및 문구 작성 (Section 6-2) — **매 Tool마다 반복 필수**
5. YMYL 성격이면 출처(공식 기관 기준) 명시
6. FAQ/How To Use 콘텐츠 차별화 작성 (템플릿 치환 금지)
7. EN/KO 양 언어 문구 검수

---

# 15. 개발 원칙

* TypeScript Strict Mode
* ESLint 적용
* 재사용 가능한 컴포넌트 설계 (특히 `DisclaimerBanner` 등 법적 문구 컴포넌트)
* 하드코딩 최소화
* SEO 우선 + AI Overview 대응 우선
* 성능 우선
* 접근성(ARIA) 준수
* 모바일 퍼스트 반응형 UI
* 모든 Tool은 독립적으로 동작하며 서로 의존하지 않는다
* **법적 리스크 검토는 1회성이 아닌 Tool 추가 시마다 반복되는 상시 프로세스로 취급한다**

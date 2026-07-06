# BitKitTools.com

개발자, 여행자, 맥주 애호가, 육아 부모를 위한 마이크로 계산기/유틸리티를 제공하는 종합 웹 플랫폼. 완전 정적(Static Export) 사이트로 백엔드/DB/로그인이 없으며, Google AdSense 광고 수익을 목적으로 한다. AI Overview(제로클릭 검색) 시대 대응과 YMYL(의료/법률) 리스크 관리를 설계 단계부터 반영한다.

> 프로젝트 요건 원본 → [BitKitTools-project-profile-v2.md](BitKitTools-project-profile-v2.md)

---

## 문서 맵 (여기서 시작하라)

| 문서 | 내용 |
|------|------|
| [BitKitTools-project-profile-v2.md](BitKitTools-project-profile-v2.md) | 비즈니스 요건 원본 (SEO/법적/광고 전략 포함) |
| [docs/USAGE.md](docs/USAGE.md) | 템플릿 사용법 — 프로젝트 시작부터 실행까지 |
| [docs/PRD.md](docs/PRD.md) | 전체 화면 목록 및 MVP 범위 |
| [docs/screens/](docs/screens/) | 화면별 상세 스펙 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 디렉토리 구조, 데이터 흐름, 레이어 규칙 |
| [docs/ADR.md](docs/ADR.md) | 기술 선택 근거 및 트레이드오프 |
| [docs/UI_GUIDE.md](docs/UI_GUIDE.md) | 디자인 시스템, 안티패턴 |
| [docs/tech-debt-tracker.md](docs/tech-debt-tracker.md) | 알려진 기술 부채 목록 — 새 작업 전 반드시 확인 |

---

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, **Static Export** — `output: 'export'`)
- **언어**: TypeScript strict mode
- **스타일링**: Tailwind CSS
- **국제화**: next-intl, **as-needed locale prefix** (EN 기본=prefix 없음, KO만 `/ko/...`)
- **상태관리**: Zustand — **사이트 전역 UI 상태(다크모드 등)에 한정.** 툴 간 데이터 공유 금지
- **로컬 저장소**: LocalStorage (최근 사용 Tool, 즐겨찾기, 마지막 입력값 — 반드시 개인정보처리방침에 고지)
- **CMP(쿠키 동의)**: 무료 서드파티 CMP 스크립트(예: CookieYes 무료 티어) + Google Consent Mode v2
- **테스트**: Jest + React Testing Library
- **패키지 매니저**: npm
- **배포**: AWS EC2 + Nginx (정적 파일 서빙)
- **백엔드/DB**: 없음
- **Analytics**: GA4, Google Search Console, Microsoft Clarity

---

## CRITICAL 규칙

1. **서버/클라이언트 컴포넌트 구분** — `'use client'`는 반드시 필요한 경우(상태, 이벤트, 브라우저 API)에만 사용한다. 기본은 Server Component.

2. **외부 API 호출 원칙 금지, 예외는 클라이언트 직접 fetch** — Static Export에서는 `app/api/` 라우트 핸들러가 동작하지 않는다. 모든 툴은 원칙적으로 외부 API 없이 순수 클라이언트 계산/정적 데이터 테이블로 만든다. 실시간 외부 데이터가 반드시 필요한 예외 툴만 API 키 불필요한 공개 API를 `lib/api/{도메인}.ts`에 캡슐화해 직접 fetch한다. MVP 8종은 전부 이 예외에 해당하지 않는다.

3. **`app/api/` 라우트 핸들러 사용 금지** — Static Export와 호환되지 않는다.

4. **환경변수 보안** — 서버 전용 시크릿은 `NEXT_PUBLIC_` 접두사 없이 사용한다. 클라이언트에 노출되면 안 되는 값에 절대 `NEXT_PUBLIC_`을 붙이지 않는다.

5. **TDD** — 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성한다.

6. **타입 안전성** — `any` 타입 사용 금지. 타입을 알 수 없는 경우 `unknown`을 사용하고 타입 가드로 좁힌다.

7. **컴포넌트 파일 구조** — 컴포넌트는 `components/`에, 타입은 `types/`에, 순수 유틸 함수는 `lib/utils/`에만 둔다. `app/` 폴더에는 페이지와 레이아웃만.

8. **컴포넌트/툴 격리** — 각 툴(`components/tools/{tool-slug}/`)은 완전히 독립된 컴포넌트다. 툴 간 전역 상태 공유 금지. 새 툴 추가는 새 컴포넌트 + `tools-config.ts` 항목 추가만으로 끝나야 한다.

9. **Configuration-driven 툴 관리** — 모든 툴의 메타데이터(`id`, `slug`, `category`, `title`, `description`, `keywords`, `schemaType`, `faq`, `relatedTools`, `adSlots`, `ogImage`, `status`, `disclaimerType`, `aiOverviewResistance`)는 `lib/config/tools-config.ts` 단일 파일로 관리한다. 홈/카테고리/사이트맵/RSS/관련 Tool은 전부 이 데이터로 동적 생성한다. 하드코딩 금지. 스키마 상세 → [ARCHITECTURE.md](docs/ARCHITECTURE.md)

10. **인증 없음** — 로그인/회원가입/세션 기능을 만들지 않는다.

11. **면책조항(Disclaimer) 필수 검토** — 신규 툴 추가 시 `disclaimerType`(`none`/`general`/`medical`/`financial`/`legal`)을 반드시 결정하고, `medical`/`legal`/`financial`인 경우 공통 `<DisclaimerBanner disclaimerType="..." />` 컴포넌트로 문구를 노출한다. 이는 1회성이 아니라 **툴을 추가할 때마다 반복되는 필수 체크**다. 상세 정책 → [BitKitTools-project-profile-v2.md](BitKitTools-project-profile-v2.md) Section 6-2.

12. **YMYL 콘텐츠 신중 처리** — 의료/법률/재무 성격 툴(BAC Calculator, Baby Growth/Sleep Calculator, Flight Delay/Visa Checker)은 출처(WHO/CDC/관련 법령 등)를 본문에 명시하고, 결과 화면에 단정적 판단(예: "안전", "운전 가능")을 암시하는 표현을 절대 사용하지 않는다. BAC Calculator는 추가 UX 규칙이 있다 → profile v2 Section 13-5.

13. **에러 처리** — 외부 fetch를 사용하는 예외적인 툴은 반드시 try/catch로 감싸고, 실패 시 사용자에게 명확한 에러 UI를 보여준다.

14. **광고 영역 CLS 방지** — 광고 슬롯은 반드시 `min-height`가 고정된 `components/ui/AdSlot.tsx`를 통해서만 배치한다.

15. **SEO 메타데이터 자동 생성** — 각 툴 페이지는 `tools-config.ts` 데이터를 기반으로 title/description/keywords/canonical/hreflang/OG/Schema.org(JSON-LD)를 `generateMetadata`로 자동 생성한다. 수동으로 개별 페이지에 하드코딩하지 않는다.

16. **버그 리포트 대응** — 사용자가 실제 에러 로그(브라우저 콘솔, 터미널, 빌드 출력 원문)를 붙여넣으면: (1) 원인이 명확하고 간단히 고칠 수 있으면 `/harness` step 설계 없이 바로 수정하고 `npm run lint && npm test && npm run build`로 검증한다. (2) 범위가 크거나 설계 논의가 필요해 지금 당장 고치지 않기로 하면, 반드시 `docs/tech-debt-tracker.md`의 "활성 부채"에 ID/영역/내용/심각도/발견일을 기록한다 — 대화로만 남기지 않는다.

17. **기존 기능 수정 시 경로 판단** — 이미 완성된 툴/화면을 고쳐달라는 요청을 받으면 범위에 따라 둘 중 하나를 택한다:
    - **자잘한 수정**(문구, 로직 한두 줄, UI 디테일 등 독립된 AC가 필요 없는 수준) → harness 거치지 않고 지금 세션에서 바로 논의 → 필요시 `docs/screens/{화면명}.md` 갱신 → TDD(테스트 먼저, rule 5) → Edit → `npm run lint && npm test && npm run build` 검증 → 커밋.
    - **스펙이 실질적으로 바뀌는 확장**(새 입력/출력, 새 disclaimer 판단, 별도 AC로 검증할 만한 작업 단위) → `docs/screens/{화면명}.md`를 먼저 갱신 → `/harness`로 새 step 설계(기존 step을 pending으로 되돌리지 않고, 해당 phase에 새 step을 추가하거나 신규 phase 생성) → `execute.py`로 실행.
    - 기존 step을 `pending`으로 되돌려 재실행하는 것은 **실패 복구 전용**이다 (step 파일에 원래 지시문이 그대로 남아있어 새 요구사항이 반영되지 않는다). 완성된 기능의 변경 요청에는 사용하지 않는다.

> 아키텍처 상세 규칙 → [ARCHITECTURE.md](docs/ARCHITECTURE.md)
> 기술 선택 이유 → [ADR.md](docs/ADR.md)
> 비즈니스/법적/SEO 요건 원본 → [BitKitTools-project-profile-v2.md](BitKitTools-project-profile-v2.md)

---

## 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 정적 빌드 (output: 'export' → out/ 디렉토리 생성)
npm run lint     # ESLint
npm run test     # 테스트
```

---

## 개발 원칙

- 커밋 메시지: conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- 신규 Tool 추가 체크리스트(AI 대체 저항력, CPC/트래픽 리서치, 키워드 자기잠식 확인, 면책조항, 출처 명시, FAQ 차별화, EN/KO 검수) → profile v2 Section 14

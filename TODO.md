# TODO — BitKitTools.com 기본 세팅 진행 현황 (v2 기준)

## 완료된 작업

- [x] `.claude/settings.json` — Circuit Breaker hook 추가
- [x] `scripts/execute.py` — `docs/**/*.md` glob 수정
- [x] `scripts/hooks/*.sh` — no-op 버그 수정, `PostToolUseFailure` 이벤트 전환
- [x] `phases/` — index.json (빈 배열) + example-phase 템플릿
- [x] `docs/USAGE.md` — 템플릿 사용법 문서
- [x] `BitKitTools-project-profile-v2.md` — v1 대비 개정판 반영, 하네스 재세팅 논의 중 발견한 모순 수정(URL locale 정책, CMP 구현 방식, BAC Calculator 안전장치) → v2.1로 개정 완료
- [x] `CLAUDE.md` — v2 요건(4카테고리, disclaimer 시스템, Schema.org, CMP) 반영해 CRITICAL 규칙 15개로 재작성
- [x] `docs/PRD.md` — MVP 8개 툴(개발자2·여행2·맥주2·육아2) + 법적 필수 페이지 확정
- [x] `docs/ARCHITECTURE.md` — `tools-config.ts` 확장 스키마, as-needed locale prefix, DisclaimerBanner, Schema.org 컴포넌트, ads.txt/sitemap/rss 자동 생성 구조 반영
- [x] `docs/ADR.md` — ADR-001~014 (기존 10개 + locale prefix, Schema.org, CMP, BAC 안전장치 4개 추가)
- [x] `docs/UI_GUIDE.md` — 광고 슬롯 5자리 규격, DisclaimerBanner/BAC 전용 경고 배너 스타일 추가
- [x] `docs/screens/` — 홈 + MVP 8개 툴 + 법적 페이지 4종, 총 10개 파일로 재작성 (v1의 6개 툴 screens는 삭제)
- [x] `docs/tech-debt-tracker.md` — 신규 생성, 활성 부채 없음 (v2에서도 구조 변경 불필요)

---

## 남은 작업

### 개발 시작 전
- [x] `git init` + `origin` 연결(`https://github.com/oshion/BitKitTools.git`) + 첫 커밋/푸시 완료
- [ ] `/harness` 실행 → `phases/` 실제 phase 자동 생성. 특히 Phase 0(project-setup)에 다음이 반드시 포함되어야 함:
  - Next.js Static Export + next-intl(`as-needed` prefix) 초기 설정
  - `tools-config.ts` 확장 스키마 (ARCHITECTURE.md 참고) 타입 정의
  - `DisclaimerBanner`, `AdSlot`, `components/seo/*` 공통 컴포넌트 스캐폴딩
  - CMP 스크립트(CookieYes 등) 삽입 지점
  - `public/ads.txt` 플레이스홀더
- [ ] `execute.py` 실행 → 코드 자동 작성
- [ ] `/review` 실행 → 규칙 기반 리뷰 (disclaimer 누락, `any` 타입, mock/app-api 직접 접근 등)

> 전체 사용법은 [docs/USAGE.md](docs/USAGE.md) 참고.

---

## MVP 8개 툴 요약

| 카테고리 | slug | disclaimerType |
|---|---|---|
| developer | `json-formatter` | general |
| developer | `password-generator` | general |
| travel | `flight-delay-compensation` | legal |
| travel | `visa-requirement-checker` | legal |
| beer | `bac-calculator` | medical (+ 전용 강화 경고 배너, ADR-014) |
| beer | `homebrew-recipe-calculator` | general |
| baby | `growth-percentile` | medical |
| baby | `sleep-schedule` | medical |

---

## 참고 / 특히 주의할 점

- **BAC Calculator**는 표준 disclaimer로 부족한 YMYL 리스크가 있어 config로 끌 수 없는 전용 UX 규칙이 있다 (`docs/screens/beer-bac-calculator.md`, ADR-014). `/harness` step 설계 시 이 규칙을 반드시 별도 step 또는 명시적 지시로 포함할 것.
- URL은 EN 기본(prefix 없음) / KO만 `/ko/` prefix (as-needed). 루트 도메인은 서버가 없어 언어 자동 감지가 불가능함을 항상 전제할 것.
- `tools-config.ts`의 `status`/`popular`/`addedAt`은 GA4/GSC 월간 리뷰 결과를 사람이 수동 반영하는 정적 필드다 — 실시간 랭킹으로 오해하지 말 것.
- `ads.txt`는 `[locale]` 라우팅 밖 `public/`에 위치해야 도메인 루트로 서빙된다.
- **광고수익 극대화 재검증 결과 (screens 리뷰, 미반영 상태로 보류)**: `docs/screens/`의 8개 툴 화면 스펙은 개념 수준까지만 작성돼 있고, 아래 4가지가 화면별로 구체화돼 있지 않다. `/harness` step 설계 시 각 툴 step 지시문에 직접 채워 넣을 것 (screens 문서 자체는 수정하지 않기로 결정됨):
  1. 광고 슬롯(header/result/mid-content/above-faq/footer) 5곳의 화면 내 실제 배치 위치
  2. 툴 페이지 하단 "Related Tools / Same Category / Popular Tools / Recently Added" 내부링크 섹션 구성 (profile v2 Section 5-4, 페이지뷰·광고 노출수 직결)
  3. How To Use / Example 섹션의 툴별 실제 콘텐츠 방향 (템플릿 치환 금지 — thin content로 인한 AdSense 반려/SEO 순위 하락 리스크)
  4. 체류시간 인터랙션이 상대적으로 부족한 JSON Formatter / Visa Checker / BAC Calculator에 슬라이더·애니메이션 등 보강 검토

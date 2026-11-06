# Screen: Fun Category (재미 카테고리 신설)

## 배경
기존 4개 카테고리(developer/travel/beer/baby)에 이어 가벼운 성격 테스트·퀴즈류를 담는 5번째 카테고리를 만든다. 첫 콘텐츠는 [fun-chiikawa-personality-test.md](fun-chiikawa-personality-test.md).

2026-11-06 사용자와 확정: slug `fun`, 표시명 EN "Fun" / KO "재미".

## URL
- `/fun` (EN), `/ko/fun` (KO) — 기존 카테고리와 같이 `app/[locale]/fun/page.tsx` 리터럴 디렉토리 (동적 `[category]` 아님)

## 변경 지점 (Configuration-driven — 카테고리 목록은 `TOOL_CATEGORIES` 단일 소스)
| 위치 | 변경 |
|------|------|
| `types/tool.ts` | `ToolCategory`에 `'fun'` 추가 |
| `lib/config/tools-config.ts` | `TOOL_CATEGORIES`에 `'fun'` 추가 (순서: 마지막) |
| `lib/i18n/messages/{en,ko}.json` | `nav.fun` ("Fun" / "재미"), `categoryPage.description.fun` (아래 문구) |
| `app/[locale]/fun/page.tsx` | 기존 카테고리 페이지(`docs/screens/category-page.md`)와 동일 구조 — H1, 설명, `ToolCardGrid`, `SchemaBreadcrumb` |
| 홈 / Nav / Footer / 사이트맵 | `TOOL_CATEGORIES`를 순회하므로 코드 수정 없이 자동 노출 — 회귀 테스트로 확인만 |

카테고리 설명 문구(초안):
- EN: "Light, fun personality tests and quizzes — answer a few questions and share your result. For entertainment only, not a diagnosis."
- KO: "가볍게 즐기는 성격 테스트와 퀴즈 — 몇 가지 질문에 답하고 결과를 친구에게 공유해 보세요. 재미를 위한 콘텐츠이며 진단이 아닙니다."

## 디자인
- 사이트 공통 다크 테마 유지(`docs/UI_GUIDE.md`). 카테고리 페이지는 다른 카테고리와 동일한 레이아웃.
- 파스텔·둥근 카드 같은 카테고리 고유 톤은 **테스트 본체 안에서만** 쓴다(테스트 스펙 참고).

## 수용 기준
- `/fun`, `/ko/fun` 정적 생성, title `{Fun|재미} — BitKitTools`, canonical·hreflang 기존 카테고리와 동일 패턴
- Nav·Footer·홈 카테고리 섹션·사이트맵에 fun 노출 (EN/KO)
- 기존 4개 카테고리 페이지·툴 페이지 회귀 없음

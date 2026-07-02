# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다 — 마케팅 랜딩 페이지가 아니라 계산기/유틸리티 대시보드.
2. 속도가 기능이다 — 입력 즉시 결과가 반영되어야 하며, 불필요한 로딩 상태를 만들지 않는다.
3. 광고는 방해 요소가 아니라 레이아웃의 일부다 — 콘텐츠와 명확히 구분하되 CLS 없이 고정된 자리에 배치한다.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | `#0a0a0a` |
| 카드 | `#141414` |
| 카드 hover | `#1a1a1a` |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | `text-white` |
| 본문 | `text-neutral-300` |
| 보조 | `text-neutral-400` |
| 비활성 | `text-neutral-500` |

### 데이터/시맨틱 색상
| 용도 | 값 |
|------|------|
| 긍정/성공 | `#22c55e` |
| 부정/에러 | `#ef4444` |
| 중립/기본 | `#525252` |
| 포인트(계산 결과 강조) | `#f59e0b` (amber) — 보라/인디고 회피, "숫자가 강조되는 계산기" 느낌 |

## 컴포넌트
### 카드
```
rounded-lg bg-[#141414] border border-neutral-800 p-6
```
카드 모서리는 `rounded-lg`로 통일하되, 홈의 툴 카드와 결과 표시 카드는 시각적으로 구분되도록 border 두께/색을 달리한다 (모든 카드를 동일하게 만들지 않는다).

### 버튼
```
Primary: rounded-lg bg-white text-black hover:bg-neutral-200
Text:    text-neutral-500 hover:text-neutral-300
```

### 입력 필드
```
rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 focus:border-neutral-600
```

### 광고 슬롯 (`components/ui/AdSlot.tsx`)
CLS 방지를 위해 IAB 표준 사이즈 기준 `min-height`를 고정한다. 툴 페이지는 아래 5개 위치(`tools-config.ts`의 `adSlots`)를 기본으로 한다.

| 위치 (`AdSlotConfig.position`) | 규격 | min-height |
|------|------|-----------|
| `header` (Header 아래) | 반응형 리더보드 | `min-h-[90px]` (모바일 `min-h-[50px]`) |
| `result` (결과 아래) | 미디엄 렉탱글 | `min-h-[250px]` |
| `mid-content` (본문 중간) | 인피드 | `min-h-[280px]` |
| `above-faq` (FAQ 위) | 인피드 | `min-h-[250px]` |
| `footer` (Footer 위) | 반응형 리더보드 | `min-h-[90px]` |

로딩 전에는 `bg-neutral-900 border border-dashed border-neutral-800` 스켈레톤을 표시한다. 광고 스크립트는 Lazy Load로 삽입한다.

### 면책조항 배너 (`components/ui/DisclaimerBanner.tsx`)
`disclaimerType`별로 톤을 구분하되 과도하게 위협적이지 않게 한다.

```
공통 베이스: rounded-lg border px-4 py-3 text-sm leading-relaxed
- general:   border-neutral-800 bg-neutral-900 text-neutral-400
- medical:   border-amber-900/50 bg-amber-950/20 text-amber-200
- legal:     border-amber-900/50 bg-amber-950/20 text-amber-200
- financial: border-amber-900/50 bg-amber-950/20 text-amber-200
```

**BAC Calculator 전용 경고 배너**(표준 DisclaimerBanner와 별도, 항상 노출·닫기 불가):
```
rounded-lg border-2 border-red-900/60 bg-red-950/30 text-red-200 px-4 py-3 text-sm font-medium
```
초록색/체크 아이콘 등 "통과·안전"을 암시하는 색상·아이콘은 이 툴 어디에도 사용하지 않는다.

## 레이아웃
- 전체 너비: `max-w-5xl`
- 정렬: 좌측 정렬 기본. 중앙 정렬 금지 (히어로 섹션 없음)
- 간격: `gap-3~4`, 섹션 간 `space-y-8`
- 툴 페이지 구조: `<h1>` 툴 이름 → 입력 영역 → 결과 영역(가장 눈에 띄게) → 상단 광고 슬롯 → 설명/FAQ(SEO 콘텐츠) → 하단 광고 슬롯

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 (`<h1>`) | `text-4xl font-semibold text-white` |
| 섹션 제목 (`<h2>`) | `text-xl font-medium text-white` |
| 카드 제목 | `text-sm font-medium text-neutral-400` |
| 결과 값 강조 | `text-3xl font-bold text-[#f59e0b]` |
| 본문 | `text-sm text-neutral-300 leading-relaxed` |

## 애니메이션
- `fade-in` (0.4s) — 결과 값이 갱신될 때
- `slide-up` (0.5s) — 페이지 최초 진입 시 카드 등장 (1회만, 스크롤마다 반복 금지)
- 진행도 바 채워지기 — 도수/칼로리처럼 범위가 있는 값에 한해, 결과 영역 안에서만 사용
- 그 외 모든 애니메이션(글로우, 파티클, 무한 반복 모션) 금지

## 아이콘
- SVG 인라인, `strokeWidth 1.5`, 24×24 기본
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다 — 카테고리 카드에서는 아이콘을 텍스트 옆에 바로 배치

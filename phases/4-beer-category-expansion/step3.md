# Step 3: homebrew-recipe-calculator-enhancements

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이 툴의 기존 구현과 이번 확장 스펙을 완전히 파악하라:

- `/docs/screens/beer-homebrew-recipe-calculator.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. `calculateAbv`의 `formula` 파라미터, "출처 표기 원칙", 공식 선택 토글 UI, Hydrometer Temperature Correction Calculator 링크, "크고 깔끔하게" 디자인 방향이 전부 이 문서에 있다)
- `/docs/screens/beer-hydrometer-temperature-correction.md` (이 step에서 상호 링크를 거는 대상 툴 — step0에서 이미 구현되어 있어야 한다. 아직 없다면 이 step은 `blocked` 처리하라)
- `src/lib/utils/homebrewCalculator.ts`, `src/lib/utils/homebrewCalculator.test.ts` — **기존 구현을 완전히 이해한 뒤 확장하라. `calculateAbv`는 현재 `(og, fg) => number` 시그니처다. 아래 지시대로 시그니처를 바꾸되, 기존 호출부(`HomebrewRecipeCalculatorTool.tsx`)도 함께 업데이트해서 빌드가 깨지지 않게 하라**
- `src/components/tools/homebrew-recipe-calculator/HomebrewRecipeCalculatorTool.tsx`
- `src/app/[locale]/beer/homebrew-recipe-calculator/page.tsx`
- `src/lib/config/tools-config.ts`의 `homebrew-recipe-calculator` 항목(파일에서 `id: 'homebrew-recipe-calculator'`로 검색)과 `hydrometer-temperature-correction` 항목(step0에서 생성됨)

## 작업

### 1. `lib/utils/homebrewCalculator.ts` 수정 — `calculateAbv` 시그니처 변경

**먼저 테스트를 `homebrewCalculator.test.ts`에 추가/수정한 뒤 구현하라(CLAUDE.md rule 5). 기존 `standard` 공식 테스트 케이스는 값이 그대로 유지되어야 한다(회귀 없음).**

```ts
export type AbvFormula = 'standard' | 'high-gravity'

export function calculateAbv(og: number, fg: number, formula: AbvFormula = 'standard'): number
```

- `formula === 'standard'`(기존 유지): `ABV = (OG − FG) × 131.25`
- `formula === 'high-gravity'`(신규): `ABV = (76.08 × (OG − FG) / (1.775 − OG)) × (FG / 0.794)`
- `og <= fg`이면 두 공식 모두 0을 반환한다(기존 가드 유지).
- 기본값을 `'standard'`로 둬서 이 함수를 호출하는 다른 코드가 있다면 하위 호환을 유지한다(현재는 `HomebrewRecipeCalculatorTool.tsx` 한 곳뿐이지만 명시적으로 인자를 넘기도록 그 호출부도 업데이트하라).
- 테스트 추가: `high-gravity` 공식의 정상 케이스(OG 1.070 이상 시나리오), `og <= fg`일 때 두 공식 모두 0, 저비중(OG 1.050 근처)에서 두 공식의 결과 차이가 작다는 것을 확인하는 케이스 등 최소 6개 이상.

### 2. `components/tools/homebrew-recipe-calculator/HomebrewRecipeCalculatorTool.tsx` 확장

- **공식 선택 토글(신규)**: "표준(선형)" / "고비중(비선형 보정)" 버튼 그룹(세그먼트 컨트롤 형태, 드롭다운 아님 — screens 문서 디자인 방향 참고). `og`가 1.070 이상이면 `high-gravity`를 **기본 제안**하되, **자동으로 강제 전환하지 마라** — 사용자가 직접 전환해야 한다. 결과에 현재 어느 공식을 썼는지 작은 라벨로 항상 표시한다.
- 공식 전환 시 `calculateAbv(og, fg, formula)` 호출에 선택된 `formula`를 전달하도록 기존 호출부를 수정한다.
- 결과 카드 하단의 공식 출처 문구를 갱신: 표준 공식은 기존 문구 유지, 고비중 공식은 "고비중 맥주(barleywine, imperial stout 등)에서 더 정확하다고 알려진 비선형 보정식 — 브루잉 커뮤니티에서 널리 통용되는 공식이며 정밀 학술 출처는 명확하지 않음"이라고 정직하게 서술한다(존재하지 않는 논문을 지어내지 마라).
- **Hydrometer Temperature Correction 링크(신규)**: OG/FG 비중 입력 필드 근처에 "온도 보정이 필요하신가요? → Hydrometer Temperature Correction Calculator" 링크를 추가한다(`/beer/hydrometer-temperature-correction`로 이동하는 단순 링크, import 아님).

### 디자인 — 크고 깔끔하게 (신규)

- ABV(%) 값을 결과 카드의 유일한 큰 초점으로: 현재 `text-4xl`로 되어 있는 것을 `text-5xl`로 키운다. 공식 선택 라벨/희석 결과는 보조 정보로 작게 배치해 시각적 위계를 분명히 한다.
- 공식 토글은 버튼 그룹(세그먼트 컨트롤) 형태로 — 드롭다운보다 클릭 한 번으로 전환되는 편을 택한다(`BacCalculatorTool.tsx`의 성별 선택 버튼 그룹 패턴을 참고해도 좋다, import는 하지 않는다).

### 3. `tools-config.ts` 수정

- `homebrew-recipe-calculator` 항목의 `relatedToolIds`에 `'hydrometer-temperature-correction'`을 추가한다.
- `hydrometer-temperature-correction` 항목(step0에서 생성됨)의 `relatedToolIds`에 이미 `'homebrew-recipe-calculator'`가 들어있는지 확인한다(step0에서 이미 넣어뒀어야 한다 — 없다면 이 step에서 추가한다). 이렇게 두 항목이 상호 링크되어야 한다.
- 키워드 보강: 기존 "abv calculator", "homebrew calculator" 외에 `hydrometer`, `specific gravity`, `og fg calculator`, `original gravity final gravity` 등을 EN 키워드 배열에 추가한다(GSC 노출 검색어 반영).
- FAQ에 다음 항목을 신규 추가한다(기존 FAQ는 유지): **"표준 공식과 고비중 공식은 언제 다르게 써야 하나요?"** → OG 1.070을 기준으로 설명, 저비중 맥주에서는 두 공식 차이가 미미하다는 점도 언급하는 답변.

### 4. `src/app/[locale]/beer/homebrew-recipe-calculator/page.tsx` 수정

- 필요시 Description/How To Use 섹션에 공식 선택 관련 안내를 추가한다. 기존 `generateMetadata`의 `openGraph.images` 필드는 이미 있으므로 건드리지 않는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 기존 `homebrewCalculator.test.ts`의 `standard` 공식 테스트가 값 변경 없이 그대로 통과하는지(회귀 없음), 신규 `high-gravity` 테스트가 통과하는지 확인한다.
3. `og`가 1.070 이상일 때 UI가 `high-gravity`를 기본 제안하되 자동 강제 전환은 하지 않는지(사용자가 토글로 직접 바꿔야 하는지) 확인한다.
4. 결과에 현재 사용 중인 공식이 어느 것인지 항상 라벨로 표시되는지 확인한다.
5. 고비중 공식 출처 설명에 존재하지 않는 정밀 학술 논문 인용이 없는지 확인한다.
6. `/beer/homebrew-recipe-calculator`(EN/KO)가 정상 빌드되는지 확인한다.
7. `tools-config.ts`에서 `homebrew-recipe-calculator` ↔ `hydrometer-temperature-correction`이 `relatedToolIds`로 상호 연결됐는지 확인한다.
8. 결과에 따라 `phases/4-beer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(수정 파일 목록, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: step0 미완료로 `hydrometer-temperature-correction`이 존재하지 않음) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `og`가 1.070 이상이라고 해서 `high-gravity` 공식으로 자동 강제 전환하지 마라 — 사용자가 어떤 공식으로 계산했는지 항상 알 수 있어야 한다(기본 제안만 허용).
- 존재하지 않는 정밀 학술 논문을 고비중 공식의 출처로 지어내지 마라 — "브루잉 커뮤니티에서 널리 통용되는 비선형 보정식"이라고 정직하게 서술한다.
- `BacCalculatorTool.tsx`나 `hydrometerCorrection.ts`를 import하지 마라(rule 8, 툴 격리) — 링크만 연결한다.
- 기존 `calculateAbv(og, fg)` 2-인자 호출 결과값(`standard` 공식 결과)을 변경하지 마라 — 새 `formula` 파라미터는 기본값 `'standard'`로 하위 호환을 유지한다.
- 기존 테스트를 깨뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).

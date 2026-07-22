# Step 2: bac-calculator-enhancements

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이 툴의 기존 구현과 이번 확장 스펙을 완전히 파악하라:

- `/docs/screens/beer-bac-calculator.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. **"⚠️ 법적 리스크 — 반드시 숙지" 섹션은 선택이 아니라 필수 규칙이다.** `hoursUntilZeroPercent` 출력, BAC 구간표, Widmark 공식 명시, "크고 깔끔하게" 디자인 방향이 전부 이 문서에 있다)
- `/CLAUDE.md` (CRITICAL 규칙 12 YMYL 콘텐츠 신중 처리 — BAC Calculator는 profile v2 Section 13-5에 추가 UX 규칙이 있다고 명시된 툴이다)
- `/docs/ADR.md`의 ADR-014 (BAC Calculator 안전장치 근거)
- `src/lib/utils/bacCalculator.ts`, `src/lib/utils/bacCalculator.test.ts` — **기존 구현을 완전히 이해한 뒤 확장하라. 기존 함수 시그니처나 반환 필드를 제거/변경하지 마라(하위 호환 유지, 기존 테스트를 깨뜨리면 안 된다)**
- `src/components/tools/bac-calculator/BacCalculatorTool.tsx`, `BacSafetyWarning.tsx`
- `src/app/[locale]/beer/bac-calculator/page.tsx`
- `src/lib/config/tools-config.ts`의 `bac-calculator` 항목(파일에서 `id: 'bac-calculator'`로 검색)
- `src/components/ui/DisclaimerBanner.tsx`

## 작업

### 1. `lib/utils/bacCalculator.ts` 확장 (기존 파일 수정)

**먼저 새 동작에 대한 테스트를 `bacCalculator.test.ts`에 추가한 뒤 구현하라(CLAUDE.md rule 5). 기존 테스트는 그대로 통과해야 한다.**

`calculateBac`의 반환 타입에 `hoursUntilZeroPercent: number`를 추가한다:

```ts
export function calculateBac(input: BacInput): {
  bacPercent: number
  hoursUntilZeroPercent: number
  isEstimateOnly: true
}
```

- `hoursUntilZeroPercent`은 현재 `bacPercent`가 고정 분해율(`ELIMINATION_RATE = 0.015`, 기존 상수 재사용)로 0%에 도달하기까지 남은 시간이다: `bacPercent / ELIMINATION_RATE`. `bacPercent`가 이미 0이면 0을 반환한다.
- **이 필드는 오직 0%(완전 대사)까지의 시간만 계산한다.** 국가별 법정 한도(0.03%, 0.08% 등)까지의 시간을 계산하는 함수나 파라미터는 절대 추가하지 마라 — 아래 "금지사항" 참고.
- 소수점 1자리로 반올림한다.
- 테스트 추가 항목: BAC가 0일 때 `hoursUntilZeroPercent === 0`, 일반적인 케이스에서 값이 양수인지, 계산값이 `bacPercent / 0.015`와 일치하는지 최소 4개 이상.

### 2. `components/tools/bac-calculator/BacCalculatorTool.tsx` 확장

- 결과 카드에 `hoursUntilZeroPercent`를 BAC(%) 값보다 작은 보조 정보로 표시한다(예: BAC는 `text-5xl`로 키우고, 남은 시간은 그 아래 `text-sm` 정도의 라벨 — 아래 "디자인" 항목 참고). 라벨 문구는 반드시 중립적으로: "예상 0% 도달까지 남은 시간: {hoursUntilZeroPercent}시간" 형태로 하고, "그때 운전하세요"류 문구를 암시하지 마라.
- **BAC 구간별 참고표(신규)**: 결과 카드 아래, 새 섹션으로 BAC 구간별 일반적인 신체 영향을 설명하는 표를 추가한다. 신뢰 가능한 의학/보건 자료(NIAAA, CDC 등 공개 자료 기준)를 참고해 구간과 서술을 작성하되, **표 안 어디에도 "이 구간이면 운전 가능/안전"류 문구를 넣지 마라** — 순수하게 "이 정도 농도에서 일반적으로 나타나는 신체 반응"만 서술한다(예: 0.02~0.03% 미세한 온기·기분 변화, 0.08%+ 판단력·운동조절 저하, 0.30%+ 이상 의식 저하 위험 등). 계산된 현재 BAC 값이 속한 구간을 강조하되 **색상으로 안전/위험을 암시하지 말고** 굵게/테두리 등 단순 하이라이트만 사용한다.
- **Widmark 공식 명시(신규)**: 결과 카드 또는 그 근처에 실제 Widmark 공식을 수식 형태로 텍스트에 노출한다(이미 `bacCalculator.ts` 주석에 있는 공식을 화면에도 보여준다). 기존에는 disclaimer에 "공식 출처 명시"만 있었고 실제 수식은 없었다 — 이번에 추가한다.
- 기존 안전장치는 절대 약화시키지 마라: `BacSafetyWarning`은 그대로 유지, 색상/아이콘으로 안전/위험 등급을 암시하지 않는 원칙 유지, 경고 배너에 닫기 버튼 추가 금지.

### 디자인 — 크고 깔끔하게 (신규)

- BAC(%) 값을 결과 카드에서 **가장 크고 단일한 시각적 초점**으로 만든다. 현재 `text-4xl`로 되어 있는 것을 `text-5xl`로 키운다(`UI_GUIDE.md` 기본값보다 한 단계 큰, 다른 beer 툴 신규/개선분과 동일한 수준).
- `hoursUntilZeroPercent`는 BAC(%) 값보다 확실히 작게, 같은 카드 안에 나란히 두되 시각적 위계를 명확히 분리한다.
- 음주 항목 입력 리스트가 늘어나도 카드가 산만해지지 않도록 각 항목을 한 줄로 압축 유지, 여백은 `space-y-4` 이상 유지.
- BAC 구간표는 촘촘한 표보다 여백 있는 리스트/카드 형태로, 현재 값이 속한 구간이 한눈에 보이게 배치한다.

### 3. `tools-config.ts`의 `bac-calculator` 항목 수정

- `relatedToolIds`에 `'standard-drinks-calculator'`를 추가한다(이 슬러그의 실제 툴은 이미 step1에서 생성되어 있어야 한다 — 만약 step1이 아직 완료되지 않았다면 이 step은 `blocked` 처리하고 사유를 남겨라).
- FAQ에 다음 항목을 신규 추가한다(기존 FAQ는 유지하고 추가만 한다): **"0%까지 남은 시간이 지나면 운전해도 되나요?"** → "아니오"로 시작, 이 값은 대사 속도 추정치일 뿐이며 개인차·오차가 크고 실제 판단력 회복과 직결되지 않는다는 점을 명확히 설명하는 답변.

### 4. `src/app/[locale]/beer/bac-calculator/page.tsx` 수정

- Description 섹션 또는 그 근처에 Widmark 공식을 본문에 수식으로 노출(위 컴포넌트 작업과 별개로, 서버 렌더링되는 정적 설명 텍스트에도 공식을 명시하면 SEO/E-E-A-T에 유리하다 — screens 문서 "Widmark 공식 명시" 참고).
- 기존 `generateMetadata`의 `openGraph.images` 필드는 이미 있으므로 건드리지 않는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 기존 `bacCalculator.test.ts`의 모든 테스트가 그대로 통과하는지, 신규 `hoursUntilZeroPercent` 테스트가 통과하는지 확인한다.
3. `hoursUntilZeroPercent` 계산에 국가별 법정 한도(0.03%, 0.08% 등) 관련 로직이 전혀 없는지 코드로 확인한다.
4. BAC 구간별 참고표에 "안전"/"운전 가능"류 판단성 문구나 초록색/체크 아이콘이 없는지 확인한다.
5. `BacSafetyWarning`이 여전히 조건 없이 항상 렌더링되는지, 닫기 버튼이 없는지 확인한다.
6. `/beer/bac-calculator`(EN/KO)가 정상 빌드되는지 확인한다.
7. `tools-config.ts`의 `bac-calculator.relatedToolIds`에 `standard-drinks-calculator`가 추가됐는지, 신규 FAQ 항목이 포함됐는지 확인한다.
8. 결과에 따라 `phases/4-beer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(수정 파일 목록, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: step1 미완료로 `standard-drinks-calculator`가 존재하지 않음) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- "운전 가능", "안전", "OK" 등 통과/합격을 암시하는 어떤 표현·색상·아이콘도 사용하지 마라.
- **"법정 한도까지 남은 시간" 같은 국가별 임계값 기반 카운트다운을 추가하지 마라** — 오직 0%까지의 시간만 계산한다.
- 경고 배너(`BacSafetyWarning`)를 닫거나 숨기는 UI를 추가하지 마라.
- 계산 결과값에 따라 경고 문구의 강도를 조절하지 마라(항상 동일 문구).
- BAC 구간별 참고표에 "이 구간이면 안전/운전 가능" 같은 판단성 문구를 넣지 마라 — 순수 신체 반응 서술로만 구성한다.
- 기존 `calculateBac` 함수의 시그니처를 깨는 방식으로(기존 필드 제거 등) 변경하지 마라 — 필드 추가만 허용된다.
- 기존 테스트를 깨뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).

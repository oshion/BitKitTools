# Step 3: persona-og-images

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 step 산출물을 파악하라:

- `/docs/screens/baby-temperament-quiz.md` (이 phase 전체의 1차 스펙 — "URL", "페르소나 이미지", "공유 기능" 섹션 특히)
- `src/lib/config/temperamentPersonas.ts` (이전 step 산출물 — `TEMPERAMENT_PERSONAS`, `getPersonaByCode`, `colorHue` 필드를 사용한다)
- `src/components/tools/temperament-quiz/TemperamentQuizTool.tsx` (이전 step 산출물 — Share 버튼이 만드는 URL 패턴 `/baby/temperament-quiz/result/{code}`와 정확히 일치하는 라우트를 이 step에서 만든다)
- `src/app/[locale]/opengraph-image.tsx` (이번 프로젝트에서 사이트 공통 OG 이미지를 `next/og`의 `ImageResponse`로 만든 예시 — **이 파일의 코드 구조를 그대로 참고해서** 페르소나별 카드 버전을 만들어라)
- `scripts/postbuild.mjs` (사이트 공통 OG 이미지를 빌드 후 고정 `.png` 경로로 복사하는 기존 로직 — **왜 필요한지**: `next/og`의 `opengraph-image` 파일 컨벤션은 확장자 없는 파일 + 빌드마다 바뀌는 캐시버스팅 해시 쿼리로 결과물을 만든다. Nginx는 확장자 없는 파일의 MIME 타입을 추론하지 못하고, 해시는 빌드마다 달라져 페이지 메타데이터에 하드코딩할 수 없다. 그래서 이 프로젝트는 빌드 후 실제 PNG 바이트를 고정된 `.png` 경로로 복사하고, `generateMetadata`에서 그 고정 경로를 명시적으로 참조하는 방식을 쓴다. **이 step에서도 동일한 패턴을 페르소나 16종에 대해 반복한다.**
- `src/app/[locale]/baby/growth-percentile/page.tsx` (페이지 구조 및 `generateMetadata` 패턴 참고)

## 작업

### 1. `src/app/[locale]/baby/temperament-quiz/result/[code]/page.tsx` (Server Component)

- `generateStaticParams()`: `routing.locales`와 `TEMPERAMENT_PERSONAS`의 `code` 전부를 교차해 `{ locale, code }[]` 전체 조합(2개 locale × 16개 code = 32개)을 반환한다. 이 프로젝트의 다른 페이지들이 `routing.locales`만 반환하는 것과 달리, 이 페이지는 **직접 전체 조합을 만들어 반환**해야 한다(중첩 세그먼트의 암묵적 병합에 의존하지 마라 — 명시적으로 작성한다).
- `generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> })`: `code`로 `getPersonaByCode(code)`를 조회한다(존재하지 않으면 `generateStaticParams`가 만든 경로가 아니므로 실질적으로 발생하지 않지만, 방어적으로 빈 메타데이터를 반환한다). title은 페르소나 이름을 포함(예: `` `${persona.name[safeLocale]} — BitKitTools` ``), canonical/hreflang은 `/baby/temperament-quiz/result/${code}` 경로 기준으로 만든다. `openGraph.images`는 **이 step에서 postbuild가 만들 고정 경로**를 참조한다: `` `${SITE_URL}/og/temperament/${code}-${safeLocale}.png` `` (아래 3번 참고).
- 페이지 본문: 결과 미리보기만 표시한다(퀴즈를 다시 진행하지 않는다) — 이모지 + 유형 이름 + 설명 + 육아 팁(전부 `persona`에서 조회) + "이 유형은 Thomas & Chess의 기질 연구 개념을 재미있게 재구성한 것이며, 임상적 진단이 아닙니다" 안내문구 + "당신의 아기는 어떤 유형일까요? 테스트 시작하기" CTA 버튼(`localeHref(safeLocale, '/baby/temperament-quiz')`로 이동).
- `SchemaBreadcrumb`을 포함하되, 이 페이지는 정식 카테고리/툴 목록에 노출되는 페이지가 아니므로(공유 전용 랜딩) `tools-config.ts`에 별도 항목을 추가하지 않는다. `sitemap.xml`에는 이 32개 URL을 포함하지 않는다(정적 파일이지만 SEO 대상이 아니라 공유 랜딩용이므로 — 포함하고 싶다면 이후 별도 논의).

### 2. `src/app/[locale]/baby/temperament-quiz/result/[code]/opengraph-image.tsx`

`src/app/[locale]/opengraph-image.tsx`(사이트 공통 버전)의 구조를 참고해 페르소나 전용 카드를 만든다:

- `generateStaticParams()`: 1번과 동일하게 `{ locale, code }[]` 전체 조합.
- `export const alt`, `size = { width: 1200, height: 630 }`, `contentType = 'image/png'`는 동일하게 유지.
- `export default async function Image({ params }: { params: Promise<{ locale: string; code: string }> })`: `code`로 페르소나를 조회해 `colorHue`를 배경색(예: `hsl(${colorHue}, 60%, 20%)` 같은 어두운 톤 — 사이트 다크 테마와 어울리게)으로 쓰고, 큰 이모지(`persona.emoji`)와 유형 이름(`persona.name[locale]`)을 카드 중앙에 배치한다. 사이트 공통 이미지와 톤을 맞추되(다크 배경, 밝은 텍스트), 유형마다 `colorHue`가 달라 시각적으로 구분되어야 한다.

### 3. `scripts/postbuild.mjs` 확장

기존 로직(EN 콘텐츠 루트 복사 + 사이트 공통 OG 이미지 고정 경로 복사) 뒤에 다음을 추가한다:

- `out/en/baby/temperament-quiz/result/` 디렉토리를 `readdir`로 읽어 하위 코드 슬러그 목록을 **동적으로** 얻는다(페르소나 목록을 이 스크립트에 하드코딩하지 마라 — `temperamentPersonas.ts`가 나중에 바뀌어도 이 스크립트가 깨지지 않도록 디렉토리 기반으로 발견한다).
- 각 코드 슬러그에 대해, `out/en/baby/temperament-quiz/result/{code}/opengraph-image`와 `out/ko/baby/temperament-quiz/result/{code}/opengraph-image`(확장자 없는 원본 파일)를 각각 `out/og/temperament/{code}-en.png`, `out/og/temperament/{code}-ko.png`로 복사한다(목적지 디렉토리가 없으면 `mkdir(..., { recursive: true })`로 먼저 만든다).
- 코드 슬러그 디렉토리가 존재하지 않는 경우(예: 이 step 이전에 빌드된 환경) 조용히 건너뛴다(`ENOENT` 무시하는 기존 패턴을 따른다).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다(빌드 시 `NEXT_PUBLIC_SITE_URL=https://bitkittools.com npm run build`로 실행해 절대 URL이 올바르게 잡히는지 확인하라 — 이전 세션에서 `metadataBase` 미설정 시 `localhost:3000`으로 잡히는 문제가 있었는데, 루트 `src/app/layout.tsx`에 이미 `metadataBase`가 설정되어 있으니 별도 조치 없이 정상 동작해야 한다).
2. `out/og/temperament/` 아래 32개(16코드×2locale) PNG 파일이 실제로 생성됐는지 확인한다(`file` 명령 등으로 PNG 포맷인지도 확인).
3. `out/baby/temperament-quiz/result/{임의의 code}/index.html`을 열어 `<meta property="og:image">`가 `/og/temperament/{code}-en.png`를 가리키는지 확인한다.
4. `out/ko/baby/temperament-quiz/result/{임의의 code}/index.html`도 동일하게 `-ko.png`를 가리키는지 확인한다.
5. 32개 라우트가 전부 정적으로 빌드됐는지(`npm run build` 출력의 라우트 목록) 확인한다.
6. `TemperamentQuizTool.tsx`의 공유 버튼이 만드는 URL과 이 step에서 만든 실제 라우트 경로가 정확히 일치하는지 대조한다.
7. 결과에 따라 `phases/3-baby-temperament-quiz/index.json`의 `step 3`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "결과 공유 랜딩 라우트 32개 + 페르소나별 OG 카드 이미지 32개, postbuild.mjs 확장 내용 요약"`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- 페르소나 코드 목록을 `postbuild.mjs`에 하드코딩하지 마라 — 반드시 `out/en/baby/temperament-quiz/result/` 디렉토리를 읽어 동적으로 얻는다.
- `/baby/temperament-quiz/result/{code}` 페이지에서 퀴즈를 다시 진행할 수 있게 만들지 마라 — 이 페이지는 결과 미리보기 + CTA 전용이다.
- 이 32개 URL을 `tools-config.ts`에 정식 툴 항목으로 추가하지 마라(공유 전용 랜딩이지 독립된 툴이 아니다).
- `openGraph.images`를 Next의 자동 파일 컨벤션 메타데이터(확장자 없는 해시 URL)에만 의존하지 마라 — 반드시 postbuild로 복사한 고정 `.png` 경로를 `generateMetadata`에서 명시적으로 참조한다(사이트 공통 이미지와 동일한 이유).
- 기존 테스트를 깨뜨리지 마라.

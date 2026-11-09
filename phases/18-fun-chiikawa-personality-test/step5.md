# Step 5: result-share-pages

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/fun-chiikawa-personality-test.md` ("URL", "공유", "공식 사이트 링크" 섹션)
- `src/app/[locale]/baby/temperament-quiz/result/[code]/page.tsx`, `src/app/[locale]/baby/temperament-quiz/result/[code]/opengraph-image.tsx` (**같은 패턴의 결과 공유 페이지 — 구조를 그대로 따른다**)
- `src/app/[locale]/opengraph-image.tsx` (사이트 공통 OG 이미지)
- `scripts/postbuild.mjs` (temperament 결과 OG를 고정 `.png` 경로로 복사하는 로직 — **왜 필요한지**: `next/og`의 `opengraph-image` 파일 컨벤션은 확장자 없는 파일 + 빌드마다 바뀌는 해시 쿼리를 만든다. Nginx는 확장자 없는 파일의 MIME 타입을 추론하지 못하고 해시는 메타데이터에 고정할 수 없다. 그래서 빌드 후 PNG를 고정 경로로 복사하고 `generateMetadata`에서 그 경로를 참조한다.)
- `src/app/sitemap.ts` (결과 페이지가 사이트맵에 들어가지 않는지 확인용)
- 이전 step 산출물: `src/lib/config/chiikawaCharacters.ts`, `src/lib/config/personalityTypeLabels.ts`, `src/components/tools/chiikawa-personality-test/ChiikawaPersonalityTestTool.tsx`(공유 URL 패턴), `FanMadeNotice.tsx`, `src/app/[locale]/fun/chiikawa-personality-test/page.tsx`

## 작업

### 1. `src/app/[locale]/fun/chiikawa-personality-test/result/[characterId]/page.tsx` (Server Component)

- `generateStaticParams()`: `routing.locales` × `CHIIKAWA_CHARACTERS`의 `id` 전체 조합(2 × 16 = 32)을 **직접** 반환한다.
- `generateMetadata`: `getChiikawaCharacter(characterId)`(없으면 `{}`). title KO `나와 닮은 치이카와 친구는 ${이름} — BitKitTools` / EN `${name} — Which Chiikawa Character Are You? | BitKitTools` 수준으로, description은 캐릭터 `tagline` + 테스트 안내. canonical/hreflang은 `/fun/chiikawa-personality-test/result/${characterId}/` 기준(trailing slash 포함, 기존 결과 페이지와 같은 방식). `openGraph.images`는 `` `${SITE_URL}/og/chiikawa/${characterId}-${safeLocale}.png` `` (1200×630). `robots`는 기존 temperament 결과 페이지와 같게 맞춘다.
- 본문: 캐릭터 프로필 미리보기만 — 대표색 카드(`cardClassName`) + 큰 이모지 + "친구가 공유한 결과예요" / "Your friend got…" + 이름(`nameClassName`) + 공식 사이트 링크("공식 사이트에서 {이름} 보기 →", `officialUrl`, `target="_blank" rel="noopener"`) + 팬 설정 성격 유형(`fanType` + 라벨, "제작자 추정" 표기) + 한 줄 소개·성격 분석·강점 + **"나도 테스트하기" CTA**(`localeHref(safeLocale, '/fun/chiikawa-personality-test')`) + `<FanMadeNotice />`.
- `SchemaBreadcrumb`(Home → 재미 → 테스트 → 캐릭터)를 포함한다.

### 2. `src/app/[locale]/fun/chiikawa-personality-test/result/[characterId]/opengraph-image.tsx`

- `generateStaticParams()` 1번과 동일, `size = { width: 1200, height: 630 }`, `contentType = 'image/png'`, `alt`.
- 카드 디자인: 배경은 캐릭터 `ogColor`(어두운 톤) + 약간 밝은 같은 색조의 장식 원, 중앙에 아주 큰 이모지와 캐릭터 이름(흰색/밝은 글자), 아래에 테스트 제목(`tools-config`의 title[locale]) 작게, 하단에 `bitkittools.com`. **캐릭터 그림은 넣지 않는다.**
- 이모지·한글 렌더링: 기존 temperament OG가 이모지와 한글을 어떻게 렌더하는지(폰트 로딩 방식 포함) 확인하고 같은 방식을 쓴다. 빌드 후 생성된 PNG를 직접 열어(Read 도구로 이미지 확인) 이모지와 한글이 네모(□)로 깨지지 않는지 확인한다. 🐿️·🛡️처럼 변형 선택자(U+FE0F)가 붙은 이모지도 확인한다.

### 3. `scripts/postbuild.mjs` 확장

- 기존 temperament 복사 로직 뒤에 같은 방식으로 추가: `out/en/fun/chiikawa-personality-test/result/`를 `readdir`로 읽어 id 목록을 **동적으로** 얻고, `out/{en,ko}/fun/chiikawa-personality-test/result/{id}/opengraph-image` → `out/og/chiikawa/{id}-{en,ko}.png`로 복사(`mkdir recursive`, `ENOENT` 무시).
- temperament 로직과 중복이 크면 `copyResultOgImages(resultSubPath, ogDirName)` 같은 내부 헬퍼로 묶어 두 곳에서 쓴다(동작이 바뀌지 않게 — temperament PNG 32개가 계속 생성되어야 한다).

### 4. 테스트

- 결과 페이지의 `generateStaticParams`가 32개 조합을 반환하고 모든 캐릭터 id를 포함한다(페이지 모듈을 import해 단위 테스트 — 다른 결과 페이지 테스트가 있으면 그 방식을 따른다).
- 컴포넌트 공유 URL 경로(`/fun/chiikawa-personality-test/result/{id}/`)와 라우트 디렉토리 이름이 일치한다는 것을 빌드 산출물로 검증(아래 AC).

## Acceptance Criteria

```bash
npm run lint && npm test && NEXT_PUBLIC_SITE_URL=https://bitkittools.com npm run build
test "$(ls out/og/chiikawa/*.png | wc -l)" -eq 32
test "$(ls out/og/temperament/*.png | wc -l)" -eq 32
test -f out/fun/chiikawa-personality-test/result/chiikawa/index.html && test -f out/ko/fun/chiikawa-personality-test/result/kabutomushi/index.html
grep -q "/og/chiikawa/usagi-en.png" out/fun/chiikawa-personality-test/result/usagi/index.html
grep -q "/og/chiikawa/usagi-ko.png" out/ko/fun/chiikawa-personality-test/result/usagi/index.html
! grep -q "chiikawa-personality-test/result" out/sitemap.xml
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `file out/og/chiikawa/chiikawa-ko.png`로 PNG인지 확인하고, `out/og/chiikawa/chiikawa-ko.png`, `momonga-en.png`, `labor-armor-ko.png`를 이미지로 열어 이모지·한글·색이 정상인지 눈으로 확인한다.
3. `ChiikawaPersonalityTestTool.tsx`가 만드는 공유 URL과 실제 생성된 `out/` 경로가 정확히 일치하는지 대조한다(locale prefix, trailing slash 포함).
4. 아키텍처 체크리스트:
   - 결과 페이지를 `tools-config.ts`에 툴로 등록하지 않았는가?
   - postbuild가 캐릭터 목록을 하드코딩하지 않고 디렉토리에서 발견하는가?
5. 결과에 따라 `phases/18-fun-chiikawa-personality-test/index.json`의 step 5를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "결과 라우트 32개·OG PNG 32개·postbuild 변경·이모지 렌더 확인 결과 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 결과 페이지에서 테스트를 다시 진행하게 만들지 마라. 이유: 공유 랜딩 전용 — 프로필 미리보기 + "나도 테스트하기" CTA만 둔다.
- 결과 URL에 성격 유형·응답을 넣지 마라. 이유: 스펙이 공유 URL에 캐릭터 id만 담기로 정했다.
- 결과 페이지 32개를 사이트맵·`tools-config.ts`에 넣지 마라. 이유: 공유 랜딩이지 독립된 툴·검색 대상이 아니다(기존 temperament 결과 페이지와 같은 정책).
- `openGraph.images`를 Next의 자동 파일 컨벤션 URL에만 의존하지 마라. 이유: 확장자 없는 해시 URL이라 Nginx MIME 문제와 빌드마다 바뀌는 해시 문제가 있다 — 고정 `.png` 경로를 명시한다.
- OG 이미지에 캐릭터 그림·외부 이미지를 넣지 마라. 이유: 권리자 라이선스가 없다.
- postbuild의 temperament 복사 동작을 깨뜨리지 마라. 이유: 이미 배포 중인 결과 공유 카드다.
- 기존 테스트를 깨뜨리지 마라.

# Step 4: tools-config-page

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/fun-chiikawa-personality-test.md` ("메타데이터", "콘텐츠 구조", "안내 문구" 섹션)
- `/docs/screens/tool-page.md`가 있으면 툴 페이지 공통 구조 (없으면 아래 참고 페이지를 정본으로 본다)
- `/docs/ARCHITECTURE.md`, `/BitKitTools-project-profile-v2.md` Section 6-2(면책조항)·Section 14(신규 툴 체크리스트)
- `src/types/tool.ts` (`ToolConfig` 필드), `src/lib/config/tools-config.ts`(특히 `temperament-quiz` 항목), `src/lib/config/tools-config.test.ts`
- `src/app/[locale]/baby/temperament-quiz/page.tsx` (**이 파일 구조를 그대로 따른다** — generateStaticParams/generateMetadata, ToolStage, Schema 3종, 본문 섹션, DisclaimerBanner, 관련 도구)
- `src/components/ui/ToolStage.tsx`, `src/components/ui/DisclaimerBanner.tsx`
- 이전 step 산출물: `src/components/tools/chiikawa-personality-test/ChiikawaPersonalityTestTool.tsx`, `FanMadeNotice.tsx`, `src/lib/config/chiikawaCharacters.ts`, `src/lib/config/personalityTypeLabels.ts`, `src/app/[locale]/fun/page.tsx`

## 작업

### 1. `src/lib/config/tools-config.ts`에 항목 추가

스펙 "메타데이터" 그대로:
- `id`/`slug`: `chiikawa-personality-test`, `category`: `fun`
- `title` KO `나와 닮은 치이카와 친구는? 16가지 성격 유형 테스트` / EN `Which Chiikawa Character Are You? 16-Type Personality Quiz`
- `description`: 스펙의 KO/EN 초안을 쓰고, 기존 테스트의 길이 규칙이 있으면 그 범위에 맞게 다듬는다.
- `keywords`: 스펙 목록 그대로 (KO/EN).
- `schemaType`: 기존 퀴즈와 같은 `'WebApplication'`
- `faq`: 4~5개, EN/KO. 예: 결과는 어떻게 정해지나요?(성격 유형은 1~16번, 캐릭터는 17~24번 문항으로 따로 계산), 공식 테스트인가요?(아니오 — 비공식 팬메이드), 성격 유형이 캐릭터의 공식 설정인가요?(아니오 — 제작자 추정), 결과를 공유할 수 있나요?, 답변이 저장되나요?(아니오 — 브라우저 메모리에서만 계산). 다른 툴 FAQ와 문구가 겹치지 않게 쓴다(profile v2 Section 14 FAQ 차별화).
- `relatedToolIds`: `[]` (같은 카테고리 툴이 생기면 추가 — 사용자 결정). 다른 툴의 `relatedToolIds`에도 이 툴을 넣지 않는다.
- `status`: `'testing'`, `disclaimerType`: `'general'`, `aiOverviewResistance`: `'medium'`
- `adSlots`, `ogImage` 등 나머지 필드는 `temperament-quiz` 항목과 같은 방식으로 채운다.

### 2. `src/app/[locale]/fun/chiikawa-personality-test/page.tsx` (Server Component)

`baby/temperament-quiz/page.tsx`와 같은 구조로 `CATEGORY = 'fun'`, `SLUG = 'chiikawa-personality-test'`. 스펙 "콘텐츠 구조" 순서:

1. H1(tool title) + 짧은 리드 문장
2. `<ToolStage>` 안에 `<ChiikawaPersonalityTestTool locale={safeLocale} />`
3. 이 테스트에 대하여 — 24문항, 성격 유형(1~16번)과 닮은 캐릭터(17~24번)를 따로 계산한다는 설명, 16명 캐릭터 이름 목록(이모지 + 이름, `CHIIKAWA_CHARACTERS`에서 생성)
4. 사용 방법 — 3~4단계
5. 결과 읽는 법 — 4축(E/I, S/N, T/F, J/P) 각각 한 문장 설명 + "나의 성격 유형"과 "캐릭터의 팬 설정 유형"이 다른 것이라는 설명 + TOP 3 유사도 계산 방식(8문항 중 일치 수)
6. FAQ (tools-config `faq` 렌더 + `SchemaFaqPage`)
7. `<DisclaimerBanner disclaimerType="general" … />`(기존 사용법 그대로) + `<FanMadeNotice locale={safeLocale} />`
8. 관련 도구(`getRelatedTools` — 비어 있으면 섹션을 렌더하지 않는 기존 동작 유지)

`generateMetadata`는 다른 툴 페이지와 동일한 방식(tools-config 기반 title/description/keywords/canonical/hreflang/OG — CLAUDE.md 규칙 15). OG 이미지는 사이트 공통 `/og/default-{locale}.png`를 쓴다(결과별 OG는 다음 step).

### 3. 테스트

- `tools-config.test.ts`: `chiikawa-personality-test` 항목이 `fun` 카테고리, `disclaimerType: 'general'`, `getToolsByCategory('fun')`에 포함됨. **이 항목의 title/description/keywords/faq 모든 문자열(EN/KO)에 `/mbti/i`가 없음.**
- 기존 tools-config 공통 테스트(필수 필드, 길이, FAQ EN/KO 등)가 새 항목에도 통과.

## Acceptance Criteria

```bash
npm run lint && npm test && npm run build
test -f out/fun/chiikawa-personality-test/index.html && test -f out/ko/fun/chiikawa-personality-test/index.html
grep -q 'rel="canonical" href="https://bitkittools.com/ko/fun/chiikawa-personality-test/"' out/ko/fun/chiikawa-personality-test/index.html
grep -q "/fun/chiikawa-personality-test/" out/sitemap.xml
grep -q 'href="/fun/chiikawa-personality-test/"' out/fun/index.html
! grep -qi "mbti" out/fun/chiikawa-personality-test/index.html || echo "check: MBTI only in the fan-made notice sentence"
```

(빌드는 `NEXT_PUBLIC_SITE_URL=https://bitkittools.com npm run build`로 실행해 절대 URL을 확인한다.)

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 마지막 AC 줄이 메시지를 출력하면 `grep -oi ".\{60\}mbti.\{60\}"`로 확인해, "MBTI"가 FanMadeNotice의 상표 고지 문장에만 있는지 확인한다. `<title>`, `<meta name="description">`, `<meta name="keywords">`, `og:*`, JSON-LD에 있으면 실패다.
3. `/fun/` 카테고리 페이지에 이 툴 카드가 보이고 "준비 중" 문구가 사라졌는지 확인한다.
4. 아키텍처 체크리스트:
   - 메타데이터를 페이지에 하드코딩하지 않고 tools-config에서 읽는가? (CLAUDE.md 규칙 9, 15)
   - 면책조항을 결정·노출했는가? (규칙 11)
5. 결과에 따라 `phases/18-fun-chiikawa-personality-test/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "tools-config 항목·페이지 경로·본문 섹션 구성 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- title·description·keywords·URL·FAQ에 "MBTI"를 쓰지 마라. 이유: 등록 상표라 스펙에서 노출을 금지했다(고지 문장만 예외).
- `relatedToolIds`에 아기 기질 테스트 등 다른 카테고리 툴을 넣지 마라. 이유: 사용자가 타깃 독자가 달라 연결하지 않기로 했다.
- `disclaimerType`을 `medical`/`legal`/`financial`로 올리지 마라. 이유: 오락용 콘텐츠로 `general` + 팬메이드 고지로 확정했다.
- 광고 슬롯을 새로 배치하지 마라. 이유: 현재 사이트 전체에서 광고 영역을 제거한 상태다 — 다른 툴 페이지와 같은 상태를 유지한다.
- 결과 공유 페이지(`result/[characterId]`)를 이 step에서 만들지 마라. 이유: 다음 step의 범위다.
- `public/rss.xml`을 되돌리지 마라. 이유: 이 step은 새 툴을 추가하므로 빌드가 RSS에 새 항목을 만들고, 이 저장소는 툴 추가·수정 커밋에 재생성된 `rss.xml`을 함께 커밋하는 관례다(`git log -- public/rss.xml`). 새 항목이 `https://bitkittools.com/fun/chiikawa-personality-test/`로 들어갔는지 확인한다.
- 기존 테스트를 깨뜨리지 마라.

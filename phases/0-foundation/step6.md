# Step 6: legal-pages

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/legal-pages.md` (이 step의 1차 스펙, 4개 페이지 + ads.txt 전부)
- `/BitKitTools-project-profile-v2.md` (Section 6-1)
- `src/components/layout/Footer.tsx` (Step 3 산출물 — 이미 링크가 걸려 있는지 확인)

## 작업

### 1. 4개 법적 정적 페이지

`docs/screens/legal-pages.md`에 정의된 필수 포함 내용을 그대로, EN/KO 각각 자연스러운 완성 문장으로 작성한다(기계 번역 그대로 게시 금지):

- `src/app/[locale]/privacy-policy/page.tsx` — 쿠키(AdSense/GA4/Clarity)·LocalStorage 사용 고지, 사용하는 제3자 서비스 목록(Google AdSense/GA4/GSC/Clarity/CMP 벤더), CMP를 통한 동의 철회 방법, BAC/Baby 등 민감 카테고리 입력값이 서버로 전송되지 않는다는 점
- `src/app/[locale]/terms/page.tsx` — 계산 결과 정확성 미보장, 전체 면책 범위
- `src/app/[locale]/about/page.tsx` — 서비스 소개, 카테고리 구성(개발자/여행/맥주/육아) 설명
- `src/app/[locale]/contact/page.tsx` — 이메일 주소 또는 `mailto:` 링크 (Static Export이므로 자체 폼 제출 백엔드 없음 — 필요시 외부 폼 서비스 연동은 이 step 범위 밖)

각 페이지는 `generateMetadata`로 최소한의 title/description을 설정한다. 계산 로직이나 상태 관리(Zustand/LocalStorage)는 사용하지 않는다.

### 2. `public/ads.txt`

플레이스홀더 파일을 생성한다:

```
# TODO: Google AdSense 승인 후 발급받은 실제 publisher ID로 교체할 것
# 형식 예: google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
```

`app/[locale]/` 라우팅과 무관하게 항상 `도메인루트/ads.txt`로 서빙되어야 하므로 반드시 `public/` 최상위에 위치시킨다.

### 3. Footer 링크 연결 확인

`src/components/layout/Footer.tsx`(Step 3 산출물)가 이미 4개 페이지 링크를 걸어뒀는지 확인하고, 실제 경로(`/privacy-policy`, `/ko/privacy-policy` 등)와 일치하는지 검증한다. 불일치하면 수정한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run build` 후 `out/ads.txt`가 도메인 루트 위치(locale prefix 없이)에 생성되는지 확인한다.
3. 4개 법적 페이지가 EN/KO 양쪽 경로로 정상 빌드되는지 확인한다.
4. Footer의 링크 4개가 실제 존재하는 경로를 가리키는지 확인한다.
5. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "privacy-policy/terms/about/contact 4개 법적 페이지(EN/KO) 및 public/ads.txt 플레이스홀더 생성 완료. Footer 링크 연결 확인."`
   - 실패/blocked 처리는 Step 0과 동일한 기준을 따른다. **주의**: `ads.txt`의 실제 publisher ID는 AdSense 계정 승인 후에만 얻을 수 있으므로, 이 step에서 실제 ID를 채우지 못하는 것은 `blocked`가 아니라 정상이다(플레이스홀더로 완료 처리한다).

## 금지사항

- 4개 법적 페이지에 계산기 UI나 상태 관리 로직을 넣지 마라. 이유: 순수 정적 콘텐츠로 유지해야 한다(`docs/screens/legal-pages.md` 금지사항).
- `ads.txt`를 `app/[locale]/` 라우팅 하위나 `src/app/`에 두지 마라. 이유: 반드시 `public/`에 위치해야 locale 라우팅과 무관하게 도메인 루트(`/ads.txt`)로 서빙된다.
- 4개 법적 페이지를 `[locale]` 라우팅 밖에 두지 마라(단, `ads.txt`는 예외). 이유: hreflang이 걸린 정상 페이지로 취급되어야 SEO에 반영된다.
- 번역 문구를 기계 번역 그대로 게시하지 마라.

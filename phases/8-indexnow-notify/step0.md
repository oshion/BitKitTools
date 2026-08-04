# Step 0: indexnow-notify

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 기존 배포 파이프라인을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.github/workflows/deploy.yml` (기존 배포 워크플로우 — 이 안에 새 스텝을 추가한다)
- `/src/app/sitemap.ts` (sitemap이 어떤 URL들로 구성되는지 — 빌드 시 `out/sitemap.xml`로 정적 생성됨)
- `/package.json` (`tsx`가 이미 devDependency로 설치돼 있음 — 새 패키지 설치 불필요)
- `/SERVICE-SETUP.md` ("7. Bing Webmaster Tools / IndexNow" 섹션 — 이 기능의 배경)

이 프로젝트는 `bitkittools.com`을 Bing Webmaster Tools에 등록하고 IndexNow 키를 발급받아 `public/{key}.txt` 검증 파일을 이미 배포했다(공개 파일, 민감정보 아님). GitHub Secrets에도 `INDEXNOW_KEY`가 이미 등록되어 있다. 이제 실제로 배포될 때마다 IndexNow에 URL 목록을 통지하는 스크립트와 워크플로우 연동만 남았다.

## 작업

`scripts/notify-indexnow.ts`를 작성하고, `.github/workflows/deploy.yml`의 rsync 배포 스텝 **이후**에 실행되도록 새 스텝을 추가한다.

**스크립트 요구사항**:

- 빌드 산출물 `out/sitemap.xml`을 읽어 모든 `<loc>` 태그의 URL을 추출한다. URL 개수가 수십 개 수준이므로, 변경분만 추적하는 diff 로직 없이 **매번 전체 URL 목록**을 통지한다(이미 결정된 사항 — 구현을 단순하게 유지하기 위함).
- `POST https://api.indexnow.org/indexnow` 로 아래 형태의 JSON body를 전송한다:
  ```json
  {
    "host": "bitkittools.com",
    "key": "<INDEXNOW_KEY 값>",
    "keyLocation": "https://bitkittools.com/<INDEXNOW_KEY 값>.txt",
    "urlList": ["https://bitkittools.com/...", "..."]
  }
  ```
  - `key` 값은 `process.env.INDEXNOW_KEY`에서 읽는다 — 절대 하드코딩하지 않는다.
  - `keyLocation`도 같은 환경변수를 문자열 템플릿에 조합해서 동적으로 구성한다.
  - `process.env.INDEXNOW_KEY`가 없으면(로컬 실행 등) 명확한 에러 메시지를 콘솔에 출력하고 정상 종료한다(스크립트가 크래시하며 워크플로우를 실패시키면 안 됨).
- API 호출이 실패(네트워크 오류, 4xx/5xx 응답)해도 **에러를 콘솔에 로그만 남기고 스크립트를 성공으로 종료**한다 — IndexNow 통지 실패가 배포 자체의 성공 여부에 영향을 줘서는 안 된다(CLAUDE.md rule 13의 "명확한 에러 UI/로그" 원칙을 이 컨텍스트에 맞게 적용한 것).

**워크플로우 연동 요구사항**:

- `.github/workflows/deploy.yml`의 기존 `burnett01/rsync-deployments` 스텝 **다음**에 새 스텝을 추가한다(배포 실패 시 존재하지 않는 페이지를 통지하지 않기 위함).
- 새 스텝은 `env: INDEXNOW_KEY: ${{ secrets.INDEXNOW_KEY }}` 로 시크릿을 스크립트에 전달하고, `run: npx tsx scripts/notify-indexnow.ts` 로 실행한다.

## Acceptance Criteria

```bash
npm run build
INDEXNOW_KEY=test-key npx tsx scripts/notify-indexnow.ts
```

빌드가 성공해 `out/sitemap.xml`이 생성되고, 두 번째 커맨드가 (실제 IndexNow API 응답이 실패하더라도) 스크립트 자체는 크래시 없이 정상 종료해야 한다. 추가로 수정한 `.github/workflows/deploy.yml`이 유효한 YAML 문법이어야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `INDEXNOW_KEY` 값이 파일에 하드코딩되지 않았는가? (CLAUDE.md rule 4)
   - `out/sitemap.xml` 파싱 로직이 실제 빌드 산출물의 실제 XML 포맷과 맞는가? (직접 빌드해서 `out/sitemap.xml` 내용을 확인해볼 것)
   - IndexNow 통지 실패 시나리오(예: 잘못된 키, 네트워크 오류)에서도 스크립트가 비정상 종료(non-zero exit code)하지 않는가?
   - 새 워크플로우 스텝이 rsync 배포 스텝보다 **뒤**에 위치하는가?
3. 결과에 따라 `phases/8-indexnow-notify/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `INDEXNOW_KEY` 값이나 `public/{key}.txt`의 실제 파일명을 스크립트에 하드코딩하지 마라. 반드시 환경변수에서 동적으로 읽어라.
- IndexNow 통지 실패로 `deploy.yml` 전체 워크플로우가 실패로 표시되게 만들지 마라.
- 변경분 diff 추적 로직을 추가하지 마라(이미 "전체 URL 매번 통지"로 스코프가 결정됨 — 불필요한 복잡도를 추가하지 않는다).
- rsync 배포 스텝(`Deploy to EC2 via rsync`)을 수정하지 마라. 이유: 이미 실전 검증을 마친 안정 상태이므로 이 step의 스코프 밖이다.
- 기존 테스트를 깨뜨리지 마라.

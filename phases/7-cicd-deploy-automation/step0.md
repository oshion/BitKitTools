# Step 0: deploy-workflow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 배포 현황을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 ADR-001: Static Export 채택, ADR-010: AWS EC2 + Nginx 배포)
- `/package.json` (`build` 스크립트 정의 확인 — `next build && node scripts/postbuild.mjs && tsx scripts/generate-rss.ts`)
- `/SERVICE-SETUP.md` ("배포 현황" 섹션 — 현재 EC2/Nginx가 Static Export 산출물을 어떻게 서빙하는지)

이 프로젝트는 지금까지 사람이 로컬에서 `npm run build` 실행 후 `out/` 폴더를 수동으로 scp/rsync로 EC2에 옮기는 방식으로 배포해왔다. 이 step은 그 수동 과정을 GitHub Actions로 완전히 대체하는 작업이다.

## 작업

`.github/workflows/deploy.yml` 을 생성한다. `main` 브랜치에 push(merge 포함)될 때 자동으로 정적 사이트를 빌드하고 EC2 서버로 배포하는 워크플로우다.

**요구사항**:

- Trigger: `push` to `main` 브랜치
- Runner: `ubuntu-latest`
- Job 순서:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` — Node 20 LTS 사용 (프로젝트에 `.nvmrc`가 없으면 20으로 고정)
  3. `npm ci`
  4. `npm run build` — `package.json`에 정의된 스크립트를 그대로 실행한다. 이 스크립트가 최종적으로 `out/` 디렉토리를 생성한다. 별도로 `next build`를 직접 호출하지 말고 반드시 `npm run build`를 사용해 postbuild/RSS 생성 단계가 누락되지 않게 한다.
  5. `out/` 디렉토리 전체를 rsync-over-SSH로 EC2 서버에 배포한다. 검증된 rsync SSH GitHub Action(예: `burnett01/rsync-deployments`)을 사용하고, 아래 GitHub Secrets를 이름으로만 참조한다(실제 값은 절대 파일에 적지 않는다):
     - `EC2_HOST`
     - `EC2_USER`
     - `EC2_SSH_PORT` (기본 22가 아니므로 반드시 명시적으로 지정해야 한다)
     - `EC2_SSH_KEY` (OpenSSH 포맷 프라이빗 키)
     - `EC2_TARGET_DIR`

**세부 설계 지침**:

- rsync 옵션에 `--delete`를 포함해, 로컬(빌드 산출물)에서 사라진 파일이 서버에도 반영되도록 한다 — Static Export는 매번 전체를 재생성하므로 이전 빌드의 잔여 파일이 서버에 계속 쌓이는 걸 방지해야 한다. 단 `--delete`는 대상 경로를 정확히 `${{ secrets.EC2_TARGET_DIR }}`로 한정했을 때만 안전하다. 워크플로우 파일에 주석으로 이 위험(잘못된 경로 지정 시 서버의 다른 파일이 삭제될 수 있음)을 명시하라.
- SSH host key 검증을 임의로 끄지 마라(`StrictHostKeyChecking=no` 같은 설정 금지) — 사용하는 rsync action이 기본 제공하는 host key 처리 방식을 따르거나, 필요하면 `ssh-keyscan`으로 known_hosts를 사전에 채우는 방식을 사용하라.
- 이 워크플로우는 오직 "빌드 + EC2 배포"만 담당한다. IndexNow 알림, GSC sitemap 재제출(ping) 로직은 포함하지 않는다 — 별도 phase에서 다룰 예정이다.

## Acceptance Criteria

```bash
npm run build
```

로컬에서 위 커맨드가 그대로 성공해야 한다(워크플로우가 러너에서 실행할 것과 동일한 커맨드). 추가로 생성한 `.github/workflows/deploy.yml`이 유효한 YAML 문법인지 확인한다(예: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"` 또는 동급 방법).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - Static Export(ADR-001) 산출물(`out/`)만 배포 대상으로 삼았는가? SSR/서버 런타임을 요구하는 구성을 추가하지 않았는가?
   - 시크릿 값을 워크플로우 파일에 하드코딩하지 않았는가? (CLAUDE.md rule 4 — 환경변수 보안)
   - `app/api/` 관련 로직을 추가하지 않았는가? (CLAUDE.md rule 3)
3. 결과에 따라 `phases/7-cicd-deploy-automation/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: 실제 배포 성공 여부 확인) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 실제 시크릿 값(호스트 IP, 포트, 키 등)을 파일에 하드코딩하지 마라. 이유: 이 레포는 Public이라 커밋 즉시 전 세계에 노출된다.
- `.env.local`/`.env.production` 파일 내용을 워크플로우 로그에 출력하거나 커밋하지 마라.
- 이 워크플로우에서 GSC ping이나 IndexNow 알림 로직을 추가하지 마라. 이유: 별도 phase로 스코프가 분리되어 있다.
- Playwright, Vitest 등 이 프로젝트가 채택하지 않은 도구를 이 워크플로우에 끌어들이지 마라. 이유: ADR-003이 Jest를 명시적으로 채택했다.
- 기존 테스트를 깨뜨리지 마라.

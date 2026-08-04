# Step 1: gsc-sitemap-notify

## 읽어야 할 파일

먼저 아래 파일들을 읽고 기존 워크플로우 구조와 이전 step의 결과물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.github/workflows/deploy.yml` (배포 성공 후 이 step에서 새 스텝을 추가한다)
- `/.github/workflows/collect-data.yml` (이전 step에서 만든 `check-indexing-status.ts`를 이 워크플로우에 연동한다)
- `/scripts/notify-indexnow.ts` (배포 후 알림 스크립트의 기존 패턴 참고 — 실패해도 배포 자체를 막지 않는 방식)
- `/scripts/check-indexing-status.ts` (이전 step 산출물)

## 작업

### 1. 최신 Google 공식 정책 확인 — 반드시 먼저 조사할 것

Google이 과거 제공하던 sitemap ping 엔드포인트(`https://www.google.com/ping?sitemap=...`)를 **더 이상 지원하지 않는다고 공식 발표한 적이 있다**(deprecated 가능성). 코드를 작성하기 전에 WebFetch 등으로 Google의 최신 공식 문서/블로그(Search Central 블로그, Search Console 도움말)를 확인해서 다음을 판단하라:

- ping 엔드포인트가 여전히 유효한가? → 유효하면 배포 후 이 URL로 GET 요청을 보내는 방식으로 구현한다.
- 만약 공식적으로 폐지/비권장 상태라면 → 억지로 죽은 엔드포인트를 호출하는 코드를 만들지 마라. 대신: (a) `robots.txt`가 이미 `sitemap.xml` 경로를 올바르게 안내하고 있는지 확인(자동 발견에 의존), (b) 이전 step에서 만든 `check-indexing-status.ts`의 결과(`/data/indexing-status.json`)에서 미색인 상태인 URL이 있으면 콘솔/로그에 눈에 띄게 남겨서 나중에 Phase 2 리포트가 이 정보를 활용할 수 있게 한다. 즉 "능동적 알림"이 불가능하면 "상태 가시성 확보"로 스코프를 조정한다.

조사 결과와 최종 판단 근거를 스크립트 상단 주석에 명확히 남겨라 — 나중에 이 결정을 다시 검토할 사람이 왜 이렇게 구현했는지 바로 알 수 있어야 한다.

### 2. `scripts/notify-gsc-reindex.ts` 작성

위 조사 결과에 따라 구현한다. ping 방식이 유효하다면:
- `https://www.google.com/ping?sitemap=https://bitkittools.com/sitemap.xml` 로 GET 요청
- 실패해도(4xx/5xx, 네트워크 오류) 에러를 로그만 남기고 스크립트는 정상 종료한다(`notify-indexnow.ts`와 동일한 원칙 — 이 알림 실패가 배포 자체를 실패시키면 안 된다)

### 3. 워크플로우 연동

- `.github/workflows/deploy.yml`: 기존 "Notify IndexNow" 스텝 다음에 "Notify GSC" 스텝을 추가해 `notify-gsc-reindex.ts`를 실행한다(구현 방식이 ping이든 로그 남기기든 동일하게 배포 후 실행).
- `.github/workflows/collect-data.yml`: "Run analytics collection" 스텝과 "Process analytics data" 스텝 사이(또는 적절한 위치)에 `npx tsx scripts/check-indexing-status.ts` 실행 스텝을 추가한다. `GOOGLE_SERVICE_ACCOUNT_JSON` 시크릿은 이미 이 워크플로우에 주입되어 있으니 재사용한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
```
`.github/workflows/deploy.yml`과 `.github/workflows/collect-data.yml`이 유효한 YAML 문법이어야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - ping 엔드포인트의 현재 상태를 실제로 조사했는가(추측으로 구현하지 않았는가)? 조사 근거가 코드 주석에 남아있는가?
   - `notify-gsc-reindex.ts` 실패가 배포 워크플로우 전체를 실패시키지 않는가?
   - `check-indexing-status.ts`가 `collect-data.yml`에 올바르게 연동됐는가(시크릿 재사용, 적절한 순서)?
3. 결과에 따라 `phases/12-gsc-indexing-ping/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단
3. 이 step이 phase의 마지막 step이므로, 전체 완료 후 `npm run lint && npm test && npm run build`를 한 번 더 실행해 phase 전체가 정상 동작하는지 최종 확인한다.

## 금지사항

- 조사 없이 ping 엔드포인트가 유효하다고 가정하고 구현하지 마라.
- 배포 자체가 GSC 알림 실패로 막히게 만들지 마라.
- `deploy.yml`의 rsync/IndexNow 스텝이나 `collect-data.yml`의 기존 스텝 순서를 불필요하게 재배치하지 마라(새 스텝만 적절한 위치에 추가).
- 기존 테스트를 깨뜨리지 마라.

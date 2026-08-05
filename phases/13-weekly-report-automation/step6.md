# Step 6: slack-delivery

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step들의 산출물과 기존 알림 스크립트 패턴을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/generate-report.ts` (step 4 — 리포트가 `data/reports/{연도}/{날짜}.md`에 저장됨)
- `/scripts/generate-strategy-review.ts` (step 5 — 정체 감지 시 같은 파일에 섹션이 추가됨)
- `/scripts/notify-indexnow.ts` (실패해도 워크플로우를 막지 않는 기존 "알림" 스크립트의 표준 패턴 — 이 스크립트도 동일한 원칙을 따른다)
- `/SERVICE-SETUP.md`의 "8. Slack (주간 리포트 알림)" 섹션 (Webhook 용도/설정 배경)

## 작업

`scripts/post-slack-report.ts`를 작성한다 (CLI 진입점, `npx tsx scripts/post-slack-report.ts`로 실행).

### 1. 오늘자 리포트 읽기

- 실행일 기준 `data/reports/{연도}/{YYYY-MM-DD}.md`를 읽는다. 파일이 없으면 `console.warn`으로 로그만 남기고 정상 종료(exit 0) — Slack 발송 실패가 전체 워크플로우를 막으면 안 된다는 원칙(`notify-indexnow.ts`와 동일).

### 2. Slack Block Kit 포맷팅

- 마크다운 리포트를 Slack Block Kit `blocks` 배열로 변환한다:
  - 최상단에 `header` 블록으로 "📊 주간 리포트 — {날짜}" 표시
  - 마크다운의 `## ` 제목 단위로 섹션을 나눠 각각 `section` 블록(`mrkdwn` 타입 `text`)으로 변환. 마크다운 `**bold**`는 Slack mrkdwn에서 `*bold*` 문법이 다르므로 `**text**` → `*text*`로 치환한다.
  - 섹션 사이에 `divider` 블록을 넣는다.
  - **Slack 블록 하나의 `text.text`는 최대 3000자 제한**이 있다 — 섹션 내용이 이를 넘으면 여러 `section` 블록으로 쪼갠다(문단/줄바꿈 단위로 자연스럽게 분할, 문장 중간에서 자르지 않도록 주의).
  - 리포트 원문이 너무 길어 Slack 메시지 전체 블록 수(50개) 제한에 걸릴 가능성에 대비해, 블록 수가 45개를 넘으면 그 이후 내용은 생략하고 마지막 블록에 "전체 내용은 `data/reports/{연도}/{날짜}.md`에서 확인하세요"라는 안내 섹션을 추가한다.

### 2. 발송

- `SLACK_WEBHOOK_URL` 환경변수가 없으면 `console.warn`으로 로그만 남기고 정상 종료(exit 0) — `notify-indexnow.ts`의 "키 없으면 스킵" 패턴과 동일.
- Webhook에 `POST { blocks }` (JSON body)로 전송한다.
- 네트워크 오류/4xx/5xx 응답 모두 에러 로그만 남기고 **절대 `process.exit(1)`하지 않는다** — 이 스크립트의 실패가 워크플로우 전체(및 뒤이은 git commit 스텝)를 막으면 안 된다.

### 테스트

`scripts/lib/__tests__/formatSlackBlocks.test.ts`를 작성하려면 포맷팅 로직을 `scripts/lib/formatSlackBlocks.ts`라는 순수 함수로 분리하는 게 좋다:

```typescript
export interface SlackBlock {
  type: string
  [key: string]: unknown
}

export function formatReportAsSlackBlocks(markdown: string, date: string): SlackBlock[]
```

이 함수를 `scripts/post-slack-report.ts`가 import해서 쓰고, 아래를 테스트로 검증한다:
- `## ` 제목 단위로 섹션이 분리되는가
- `**bold**` → `*bold*` 치환이 되는가
- 3000자를 넘는 섹션이 여러 블록으로 쪼개지는가
- 블록 수 45개 초과 시 안내 섹션으로 마무리되는가

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

`SLACK_WEBHOOK_URL` 없이, 그리고 `data/reports/` 안에 오늘 날짜 파일이 없는 상태로 로컬 실행 시 둘 다 크래시 없이 정상 종료(exit 0)되는지 확인한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `SLACK_WEBHOOK_URL` 부재, 리포트 파일 부재 둘 다 exit 0으로 조용히 스킵하는가?
   - Slack 발송 실패(네트워크/4xx/5xx)가 `process.exit(1)`을 호출하지 않는가?
   - 포맷팅 로직이 순수 함수로 분리되어 테스트 가능한가?
   - 3000자/45블록 제한이 실제로 처리되는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 6을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 스크립트의 어떤 실패 경로도 `process.exit(1)`을 호출하지 마라 — 항상 정상 종료(0)해야 한다.
- Webhook URL을 하드코딩하지 마라.
- 기존 테스트를 깨뜨리지 마라.

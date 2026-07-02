이 프로젝트의 변경 사항을 리뷰하라.

먼저 다음 문서들을 읽어라:
- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`

---

## Step 1: 코드 레벨 자동 탐지

아래 명령어를 직접 실행하고 결과를 기록하라.
출력이 있으면 위반 존재, 없으면 통과다.

```bash
# 1. any 타입 사용 여부
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"

# 2. lib/mock/ 을 컴포넌트에서 직접 import 여부
grep -rn "from.*lib/mock" src/components/ src/hooks/ src/app/ --include="*.ts" --include="*.tsx"

# 3. components/ 에서 app/api/ 직접 fetch 여부
grep -rn "fetch.*api\/" src/components/ src/hooks/ --include="*.ts" --include="*.tsx"

# 4. app/ 페이지에서 app/api/ 직접 import 여부
grep -rn "from.*app/api" src/app/ --include="*.ts" --include="*.tsx"

# 5. NEXT_PUBLIC_ 환경변수 서버 시크릿 노출 여부
grep -rn "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" | grep -v "// "
```

---

## Step 2: 체크리스트 확인

Step 1 결과를 바탕으로 아래 항목을 판정하라.

| 항목 | 확인 방법 | 결과 | 비고 |
|------|-----------|------|------|
| any 타입 없음 | grep 결과 | ✅/❌ | |
| mock 직접 import 없음 | grep 결과 | ✅/❌ | |
| app/api 직접 접근 없음 | grep 결과 | ✅/❌ | |
| NEXT_PUBLIC_ 시크릿 없음 | grep 결과 | ✅/❌ | |
| ARCHITECTURE.md 디렉토리 구조 준수 | 파일 목록 확인 | ✅/❌ | |
| ADR 기술 스택 준수 | package.json 확인 | ✅/❌ | |
| 새 기능에 테스트 존재 | 변경 파일 대비 test 파일 확인 | ✅/❌ | |
| 빌드 통과 | `npm run build` 실행 | ✅/❌ | |

---

## Step 3: 위반 사항 처리

위반이 있으면 수정 후 Step 1부터 다시 실행하라.
모든 항목이 ✅ 가 될 때까지 반복한다.

#!/bin/bash
# tdd-guard.sh
# 구현 파일(components/, lib/, hooks/)을 수정할 때
# 대응하는 테스트 파일이 없으면 차단한다.

INPUT=$(cat 2>/dev/null || true)

# file_path 추출 (PreToolUse 훅 payload에서 tool_input.file_path에 위치)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# file_path 없으면 통과
[ -z "$FILE_PATH" ] && exit 0

# .ts / .tsx 파일만 적용
case "$FILE_PATH" in
    *.ts|*.tsx) ;;
    *) exit 0 ;;
esac

# 이미 테스트 파일이면 통과
case "$FILE_PATH" in
    *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) exit 0 ;;
esac

# 적용 범위: components/, lib/, hooks/ 만
case "$FILE_PATH" in
    */components/*|*/lib/*|*/hooks/*) ;;
    *) exit 0 ;;
esac

# 대응하는 테스트 파일 존재 확인
DIR=$(dirname "$FILE_PATH")
BASENAME=$(basename "$FILE_PATH" | sed 's/\.[^.]*$//')

TEST_CANDIDATES=(
    "${DIR}/${BASENAME}.test.ts"
    "${DIR}/${BASENAME}.test.tsx"
    "${DIR}/${BASENAME}.spec.ts"
    "${DIR}/${BASENAME}.spec.tsx"
    "${DIR}/__tests__/${BASENAME}.test.ts"
    "${DIR}/__tests__/${BASENAME}.test.tsx"
)

for TEST_FILE in "${TEST_CANDIDATES[@]}"; do
    [ -f "$TEST_FILE" ] && exit 0
done

# 테스트 파일 없음 — 차단
printf "\n🚫 TDD GUARD: 테스트 파일이 없습니다.\n" >&2
printf "   구현 파일: %s\n" "$FILE_PATH" >&2
printf "   먼저 아래 파일을 작성하세요:\n" >&2
printf "   → %s/%s.test.tsx\n\n" "$DIR" "$BASENAME" >&2
exit 1

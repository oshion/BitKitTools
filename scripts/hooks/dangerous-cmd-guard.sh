#!/bin/bash
# dangerous-cmd-guard.sh
# 위험한 명령어가 감지되면 실행을 차단한다.

INPUT=$(cat 2>/dev/null || true)

# 차단할 명령어 패턴
BLOCKED_PATTERNS=(
    'rm\s+-rf'
    'git\s+push\s+--force'
    'git\s+reset\s+--hard'
    'DROP\s+TABLE'
)

for PATTERN in "${BLOCKED_PATTERNS[@]}"; do
    if echo "$INPUT" | grep -qE "$PATTERN"; then
        printf "\n🚫 DANGEROUS COMMAND GUARD: 위험한 명령어가 차단되었습니다.\n" >&2
        printf "   패턴: %s\n\n" "$PATTERN" >&2
        exit 1
    fi
done

exit 0

#!/bin/bash
# ralph-loop.sh — Generic self-verifying agent loop
# Usage: ralph-loop.sh <skill-cmd> [max-iter] [state-file]
#
# Exit codes:
#   0 = completed (state file shows overall_status: completed)
#   1 = max iterations reached
#   2 = stale (state unchanged between iterations)
#   3 = usage error
#   4 = awaiting human input

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_CMD="${1:?Usage: ralph-loop.sh <skill-cmd> [max-iter] [state-file]}"
MAX_ITER="${2:-15}"
STATE_FILE="${3:-}"

# V-3: Pre-flight — validate claude CLI exists
if ! command -v claude &>/dev/null; then
  echo "ERROR: claude CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code"
  exit 3
fi

# V-3: Pre-flight — validate agent-browser exists
if ! command -v agent-browser &>/dev/null; then
  echo "WARN: agent-browser CLI not found. Browser testing may fail."
fi

# RT-6: Input validation — whitelist allowed characters only
# Allow: alphanumeric, space, quotes, slashes, dots, dashes, underscores, equals
if [[ ! "$SKILL_CMD" =~ ^[a-zA-Z0-9\ \"\'\-\_\.\/\=\@\:\,]+$ ]]; then
  echo "ERROR: SKILL_CMD contains disallowed characters (whitelist: alphanumeric, spaces, quotes, paths)"
  exit 3
fi

# SDD Pre-Flight: validate infrastructure before burning iterations
if [[ -f "$SCRIPT_DIR/sdd-preflight.sh" ]]; then
  echo "=== SDD Pre-Flight Check ==="
  bash "$SCRIPT_DIR/sdd-preflight.sh" || { echo "=== PRE-FLIGHT FAILED ==="; exit 3; }
fi

PREV_HASH=""

for i in $(seq 1 "$MAX_ITER"); do
  echo "=== Ralph Loop: Iteration $i/$MAX_ITER ==="
  echo "=== Command: $SKILL_CMD ==="
  echo "=== $(date -Iseconds) ==="

  # RT-2: Check completion BEFORE running skill
  if [[ -n "$STATE_FILE" && -f "$STATE_FILE" ]]; then
    STATUS=$(grep -oP '(?<=overall_status: )\S+' "$STATE_FILE" 2>/dev/null || echo "unknown")
    if [[ "$STATUS" == "completed" ]]; then
      VERDICT=$(grep -oP '(?<=overall_verdict: )\S+' "$STATE_FILE" 2>/dev/null || echo "unknown")
      echo "=== COMPLETE (pre-check): verdict=$VERDICT ==="
      exit 0
    fi
    if [[ "$STATUS" == "awaiting_human" ]]; then
      echo "=== AWAITING HUMAN: Pausing for human input ==="
      exit 4
    fi
  fi

  # V-12: Close orphan browser before next iteration
  agent-browser close 2>/dev/null || true

  # Run skill — capture exit code
  SKILL_EXIT=0
  claude -p "$SKILL_CMD" --model opus --output-format=stream-json || SKILL_EXIT=$?
  echo "=== Skill exit code: $SKILL_EXIT ==="

  # Exit detection (if state file provided)
  if [[ -n "$STATE_FILE" && -f "$STATE_FILE" ]]; then
    STATUS=$(grep -oP '(?<=overall_status: )\S+' "$STATE_FILE" 2>/dev/null || echo "unknown")
    CURR_HASH=$(md5sum "$STATE_FILE" | cut -d' ' -f1)

    echo "=== Status: $STATUS | Hash: ${CURR_HASH:0:8} ==="

    # Completion check
    if [[ "$STATUS" == "completed" ]]; then
      VERDICT=$(grep -oP '(?<=overall_verdict: )\S+' "$STATE_FILE" 2>/dev/null || echo "unknown")
      echo "=== COMPLETE: verdict=$VERDICT ==="
      exit 0
    fi

    # Awaiting human check
    if [[ "$STATUS" == "awaiting_human" ]]; then
      echo "=== AWAITING HUMAN: Pausing for human input ==="
      exit 4
    fi

    # Staleness detection (checked AFTER completion — RT-2)
    if [[ -n "$PREV_HASH" && "$CURR_HASH" == "$PREV_HASH" ]]; then
      echo "=== STALE: State unchanged between iterations ==="
      exit 2
    fi
    PREV_HASH="$CURR_HASH"
  fi

  sleep 3
done

echo "=== MAX ITERATIONS ($MAX_ITER) reached ==="
exit 1

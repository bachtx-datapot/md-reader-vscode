#!/bin/bash
# sdd-preflight.sh — Validate all SDD prerequisites before ralph-loop
# Usage: bash .claude/scripts/sdd-preflight.sh
# Exit 0 = all green, exit 1 = blocking failure, exit 3 = usage error
#
# Checks: Node, pnpm, Docker, Postgres, Redis, dev server, agent-browser,
#          claude CLI, env vars, qa-config, seed data, TypeScript compilation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FAILURES=0
WARNINGS=0

# Source env files (same order as seed scripts)
[[ -f "$PROJECT_ROOT/.env.local" ]] && set -a && source "$PROJECT_ROOT/.env.local" && set +a
[[ -f "$PROJECT_ROOT/.env" ]] && set -a && source "$PROJECT_ROOT/.env" && set +a

echo "=== SDD Pre-Flight Check ==="
echo "=== $(date -Iseconds) ==="
echo ""

# Gate runner (reuses pattern from scripts/validate/quality-gate.sh)
run_gate() {
  local name="$1"
  local blocking="$2"
  shift 2
  if "$@" >/dev/null 2>&1; then
    echo "  PASS: $name"
  else
    if [[ "$blocking" == "BLOCKS" ]]; then
      echo "  FAIL: $name [BLOCKING]"
      FAILURES=$((FAILURES + 1))
    else
      echo "  WARN: $name [non-blocking]"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
}

# --- P1: Node.js ---
echo "--- Runtime ---"
run_gate "P1 Node.js 20+" "BLOCKS" bash -c 'node --version | grep -qE "^v2[0-9]"'

# --- P2: pnpm ---
run_gate "P2 pnpm 10+" "BLOCKS" bash -c 'pnpm --version | grep -qE "^[1-9][0-9]"'

# --- P3: Docker ---
echo ""
echo "--- Infrastructure ---"
run_gate "P3 Docker running" "BLOCKS" docker info

# --- P4: Postgres ---
if [[ -n "${DATABASE_URL:-}" ]]; then
  run_gate "P4 Postgres reachable" "BLOCKS" psql "$DATABASE_URL" -c "SELECT 1"
else
  echo "  FAIL: P4 DATABASE_URL not set [BLOCKING]"
  FAILURES=$((FAILURES + 1))
fi

# --- P5: Redis ---
if [[ -n "${REDIS_URL:-}" ]]; then
  run_gate "P5 Redis reachable" "BLOCKS" bash -c "redis-cli -u '$REDIS_URL' ping | grep -q PONG"
else
  echo "  FAIL: P5 REDIS_URL not set [BLOCKING]"
  FAILURES=$((FAILURES + 1))
fi

# --- P6: Dev server ---
run_gate "P6 Dev server alive (localhost:3201)" "BLOCKS" curl -sf http://localhost:3201

# --- P7: agent-browser ---
echo ""
echo "--- Tools ---"
run_gate "P7 agent-browser CLI" "WARNS" which agent-browser

# --- P8: claude CLI ---
run_gate "P8 claude CLI" "BLOCKS" which claude

# --- P9: Env vars ---
echo ""
echo "--- Environment ---"
for var in DATABASE_URL REDIS_URL BETTER_AUTH_SECRET PAYLOAD_SECRET; do
  if [[ -n "${!var:-}" ]]; then
    echo "  PASS: P9 $var set"
  else
    echo "  FAIL: P9 $var missing [BLOCKING]"
    FAILURES=$((FAILURES + 1))
  fi
done

# --- P10: QA config ---
echo ""
echo "--- QA Setup ---"
QA_CONFIG="$PROJECT_ROOT/quality-reports/.qa-config.yaml"
if [[ -f "$QA_CONFIG" ]]; then
  echo "  PASS: P10 qa-config.yaml exists"
else
  echo "  WARN: P10 qa-config.yaml missing — auto-generating..."
  WARNINGS=$((WARNINGS + 1))
  if [[ -f "$SCRIPT_DIR/sdd-generate-qa-config.sh" ]]; then
    bash "$SCRIPT_DIR/sdd-generate-qa-config.sh" && echo "  PASS: P10 qa-config.yaml generated" || echo "  WARN: P10 qa-config.yaml generation failed"
  else
    echo "  WARN: P10 sdd-generate-qa-config.sh not found"
  fi
fi

# --- P11: Seed data ---
if [[ -n "${DATABASE_URL:-}" ]]; then
  USER_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM \"user\"" 2>/dev/null || echo "0")
  if [[ "$USER_COUNT" -gt 0 ]]; then
    echo "  PASS: P11 Seed data present ($USER_COUNT users)"
  else
    echo "  WARN: P11 No seed data — run: pnpm --filter ops seed:init"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# --- P12: TypeScript ---
echo ""
echo "--- Compilation ---"
echo "  Running pnpm check-types..."
if pnpm check-types >/dev/null 2>&1; then
  echo "  PASS: P12 TypeScript compiles"
else
  echo "  FAIL: P12 TypeScript errors [BLOCKING]"
  FAILURES=$((FAILURES + 1))
fi

# --- Summary ---
echo ""
echo "========================================"
if [[ $FAILURES -eq 0 ]]; then
  echo "PRE-FLIGHT PASSED ($WARNINGS warnings)"
  exit 0
else
  echo "PRE-FLIGHT FAILED — $FAILURES blocking, $WARNINGS warnings"
  exit 1
fi

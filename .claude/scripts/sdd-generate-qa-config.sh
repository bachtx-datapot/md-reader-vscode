#!/bin/bash
# sdd-generate-qa-config.sh — Generate qa-config.yaml from seed credentials
# Usage: bash .claude/scripts/sdd-generate-qa-config.sh
# Writes to quality-reports/.qa-config.yaml
# Credentials sourced from scripts/seed/README.md (known test users)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
QA_CONFIG="$PROJECT_ROOT/quality-reports/.qa-config.yaml"

# Source env
[[ -f "$PROJECT_ROOT/.env.local" ]] && set -a && source "$PROJECT_ROOT/.env.local" && set +a
[[ -f "$PROJECT_ROOT/.env" ]] && set -a && source "$PROJECT_ROOT/.env" && set +a

# Ensure quality-reports dir exists
mkdir -p "$PROJECT_ROOT/quality-reports"

# Check if seed data exists
if [[ -n "${DATABASE_URL:-}" ]]; then
  USER_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM \"user\"" 2>/dev/null || echo "0")
  if [[ "$USER_COUNT" -eq 0 ]]; then
    echo "No seed data found. Running seed:init..."
    cd "$PROJECT_ROOT" && pnpm --filter ops seed:init
  fi
fi

# Generate qa-config from known seed credentials
# Split heredoc: quoted block for credentials (no expansion), then append dynamic values
cat > "$QA_CONFIG" << 'YAML'
# qa-config.yaml — Auto-generated from seed data
# See scripts/seed/README.md for credential source
# NEVER commit this file — it's gitignored
accounts:
  super-admin:
    email: "superadmin@datapot.vn"
    password: "SuperAdmin2026@"
    tenant: "default"
  admin:
    email: "admin@datapot.vn"
    password: "Admin2026@"
    tenant: "default"
  staff:
    email: "coordinator@datapot.vn"
    password: "Coordinator2026@"
    tenant: "default"
  sales:
    email: "sales@datapot.vn"
    password: "Sales2026@"
    tenant: "default"
  sales-manager:
    email: "salesmanager@datapot.vn"
    password: "SalesManager2026@"
    tenant: "default"
  finance:
    email: "finance@datapot.vn"
    password: "Finance2026@"
    tenant: "default"
  support:
    email: "support@datapot.vn"
    password: "Support2026@"
    tenant: "default"
  trainer:
    email: "trainer@datapot.vn"
    password: "Trainer2026@"
    tenant: "default"
  customer:
    email: "student@datapot.vn"
    password: "Student2026@"
    tenant: "default"
  corporate:
    email: "corporate@datapot.vn"
    password: "Corporate2026@"
    tenant: "default"
YAML
# Unquoted heredoc for dynamic values (DATABASE_URL expands)
cat >> "$QA_CONFIG" << YAML
database:
  url: "${DATABASE_URL:-postgresql://localhost:5432/datapot}"
dev_server:
  ops_url: "http://localhost:3201"
  website_url: "http://localhost:3301"
YAML

echo "Generated: $QA_CONFIG (10 accounts)"

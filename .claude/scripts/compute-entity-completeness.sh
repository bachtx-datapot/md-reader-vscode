#!/usr/bin/env bash
# compute-entity-completeness.sh — Scan codebase for entity completeness dimensions
# Usage: ./compute-entity-completeness.sh [module_name|all]
# Output: per-module YAML to stdout (pipe to file)
#
# Security: validates entity names, quotes all variables, uses grep -F for fixed strings.
# Accuracy: uses table_name from registry, route_segment for UI detection, exact file matching.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MODULES_DIR="$REPO_ROOT/apps/ops/src/modules"
APP_DIR="$REPO_ROOT/apps/ops/src/app"
TESTS_DIR="$REPO_ROOT/tests"
REGISTRY="$REPO_ROOT/docs/product/registry/en-entities.yaml"

TARGET_MODULE="${1:-all}"

# Validate table name format (security)
validate_name() {
  local name="$1"
  if [[ ! "$name" =~ ^[a-z][a-z0-9_]{1,50}$ ]]; then
    echo "WARN: Invalid entity name: $name — skipping" >&2
    return 1
  fi
  return 0
}

# Convert table_name to kebab-case (e.g., crm_lead → crm-lead)
to_kebab() {
  echo "$1" | tr '_' '-'
}

# Convert module prefix to module directory
resolve_module_dir() {
  local module="$1"
  case "$module" in
    crm) echo "crm" ;;
    cms|cms-ecommerce) echo "cms" ;;
    lms|enrollment|trainer) echo "lms" ;;
    billing) echo "finance/billing" ;;
    general-ledger) echo "finance/general-ledger" ;;
    management-accounting) echo "finance/management-accounting" ;;
    finance|finance-accounting) echo "finance" ;;
    com|communication) echo "com" ;;
    sup|support) echo "sup" ;;
    infra) echo "infra" ;;
    persons) echo "persons" ;;
    master-data) echo "master-data" ;;
    orders) echo "orders" ;;
    shared) echo "shared" ;;
    *) echo "$module" ;;
  esac
}

# Check dimension: schema exists
check_schema() {
  local table_name="$1"
  local module_dir="$2"
  local kebab
  kebab="$(to_kebab "$table_name")"

  # Check for exact schema file (kebab-case or snake_case)
  if [ -f "$MODULES_DIR/$module_dir/schema/$kebab.ts" ] || \
     [ -f "$MODULES_DIR/$module_dir/schema/$table_name.ts" ] || \
     [ -f "$MODULES_DIR/$module_dir/schema/${kebab}-schema.ts" ]; then
    echo "true"
  else
    # Also check if table is defined in a combined schema file
    if grep -rqF "export const $table_name" "$MODULES_DIR/$module_dir/schema/" 2>/dev/null; then
      echo "true"
    else
      echo "false"
    fi
  fi
}

# Check dimension: service exists
check_service() {
  local table_name="$1"
  local module_dir="$2"
  # Strip module prefix for service name (e.g., crm_lead → lead)
  local entity_name="${table_name#*_}"
  local entity_kebab
  entity_kebab="$(echo "$entity_name" | tr '_' '-')"

  if ls "$MODULES_DIR/$module_dir/services/"*"$entity_kebab"* 2>/dev/null | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: router exists
check_router() {
  local table_name="$1"
  local module_dir="$2"
  local entity_name="${table_name#*_}"
  local entity_kebab
  entity_kebab="$(echo "$entity_name" | tr '_' '-')"

  if grep -rqF "$entity_name" "$MODULES_DIR/$module_dir/router"*.ts 2>/dev/null || \
     grep -rqF "$entity_kebab" "$MODULES_DIR/$module_dir/routers/" 2>/dev/null; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: events emitted
check_events() {
  local table_name="$1"
  local module_dir="$2"
  local prefix="${table_name%%_*}"
  local entity_name="${table_name#*_}"

  if grep -rqF "emitOutboxEvent" "$MODULES_DIR/$module_dir/services/" 2>/dev/null && \
     grep -rqF "$prefix.$entity_name" "$MODULES_DIR/$module_dir/services/" 2>/dev/null; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: RBAC (permissionProcedure per procedure)
check_rbac() {
  local module_dir="$1"

  if grep -rqF "permissionProcedure" "$MODULES_DIR/$module_dir/router"*.ts 2>/dev/null || \
     grep -rqF "permissionProcedure" "$MODULES_DIR/$module_dir/routers/" 2>/dev/null; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: UI form exists
check_form() {
  local route_segment="$1"
  [ -z "$route_segment" ] && echo "false" && return

  if find "$APP_DIR" -path "*/$route_segment/create/*" -name "*.tsx" 2>/dev/null | grep -q . || \
     find "$APP_DIR" -path "*/$route_segment/*form*" -name "*.tsx" 2>/dev/null | grep -q . || \
     find "$APP_DIR" -path "*/$route_segment/new/*" -name "*.tsx" 2>/dev/null | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: UI table/list exists
check_table() {
  local route_segment="$1"
  [ -z "$route_segment" ] && echo "false" && return

  if find "$APP_DIR" -path "*/$route_segment/page.tsx" 2>/dev/null | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: UI detail page exists
check_detail() {
  local route_segment="$1"
  [ -z "$route_segment" ] && echo "false" && return

  if find "$APP_DIR" -path "*/$route_segment/\[code\]/*" -name "*.tsx" 2>/dev/null | grep -q . || \
     find "$APP_DIR" -path "*/$route_segment/\[code\]/page.tsx" 2>/dev/null | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: unit test exists
check_unit_test() {
  local table_name="$1"
  local entity_name="${table_name#*_}"
  local entity_name_kebab
  entity_name_kebab="$(echo "$entity_name" | tr '_' '-')"

  if find "$TESTS_DIR" -name "*$entity_name_kebab*" -not -path "*/e2e/*" 2>/dev/null | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}

# Check dimension: e2e test exists
check_e2e_test() {
  local table_name="$1"
  local entity_name="${table_name#*_}"
  local entity_name_kebab
  entity_name_kebab="$(echo "$entity_name" | tr '_' '-')"

  if find "$TESTS_DIR/e2e" -name "*$entity_name_kebab*" 2>/dev/null | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}

# Calculate auto-level from dimensions
calc_level() {
  local classification="$1"
  local schema="$2" service="$3" router="$4" events="$5" rbac="$6"
  local form="$7" table="$8" detail="$9"
  local field_parity="${10}" unit_test="${11}" e2e_test="${12}" persona="${13}"

  case "$classification" in
    junction)
      [ "$schema" = "true" ] && echo "L2" || echo "L1"
      return ;;
    backend_only)
      if [ "$schema" = "true" ] && [ "$service" = "true" ] && [ "$router" = "true" ]; then
        [ "$unit_test" = "true" ] && echo "L5" || echo "L3"
      elif [ "$schema" = "true" ]; then
        echo "L2"
      else
        echo "L1"
      fi
      return ;;
    reference)
      if [ "$schema" = "true" ] && [ "$table" = "true" ]; then
        echo "L4"
      elif [ "$schema" = "true" ]; then
        echo "L2"
      else
        echo "L1"
      fi
      return ;;
  esac

  # crud classification — matches _meta.yaml level_calc
  if [ "$schema" != "true" ]; then echo "L1"; return; fi
  if [ "$service" != "true" ] || [ "$router" != "true" ] || [ "$events" != "true" ] || [ "$rbac" != "true" ]; then echo "L2"; return; fi
  if [ "$form" != "true" ] || [ "$table" != "true" ] || [ "$detail" != "true" ]; then echo "L3"; return; fi
  if [ "$field_parity" != "true" ] || [ "$unit_test" != "true" ] || [ "$e2e_test" != "true" ] || [ "$persona" != "true" ]; then echo "L4"; return; fi
  echo "L5"
}

echo "# Entity Completeness — computed $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Module: $TARGET_MODULE"
echo "# Script: compute-entity-completeness.sh"
echo ""
echo "# NOTE: This is a detection output. Manual review required for accuracy."
echo "# Use level_override to correct false positives/negatives."
echo ""

# Main iteration loop — parse entities from registry YAML
# Requires python3 with PyYAML
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 required for YAML parsing" >&2
  exit 1
fi

python3 -c "
import yaml, json, sys
with open('$REGISTRY') as f:
    data = yaml.safe_load(f)
for eid, e in data.get('entries', {}).items():
    mod = e.get('module', '')
    tn = e.get('table_name') or ''
    rs = e.get('route_segment', '')
    cl = e.get('classification', 'crud')
    if '$TARGET_MODULE' != 'all' and mod != '$TARGET_MODULE':
        continue
    if not tn or tn == '~':
        continue
    print(json.dumps({'id': eid, 'module': mod, 'table_name': tn, 'route_segment': rs, 'classification': cl}))
" | while IFS= read -r line; do
  entity_id="$(echo "$line" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")"
  module="$(echo "$line" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['module'])")"
  table_name="$(echo "$line" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['table_name'])")"
  route_segment="$(echo "$line" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['route_segment'])")"
  classification="$(echo "$line" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['classification'])")"

  validate_name "$table_name" || continue
  module_dir="$(resolve_module_dir "$module")"

  # Run dimension checks
  schema="$(check_schema "$table_name" "$module_dir")"
  service="$(check_service "$table_name" "$module_dir")"
  router="$(check_router "$table_name" "$module_dir")"
  events="$(check_events "$table_name" "$module_dir")"
  rbac="$(check_rbac "$module_dir")"
  form="$(check_form "$route_segment")"
  table="$(check_table "$route_segment")"
  detail="$(check_detail "$route_segment")"
  unit_test="$(check_unit_test "$table_name")"
  e2e_test="$(check_e2e_test "$table_name")"
  field_parity="false"  # Requires manual check or field-parity-check.md
  persona="false"        # Requires manual walkthrough log

  level="$(calc_level "$classification" "$schema" "$service" "$router" "$events" "$rbac" "$form" "$table" "$detail" "$field_parity" "$unit_test" "$e2e_test" "$persona")"

  echo "  $table_name:"
  echo "    entity_id: $entity_id"
  echo "    classification: $classification"
  echo "    level: $level"
  echo "    level_override:"
  echo "    surfaces: [ops]"
  echo "    dimensions:"
  echo "      schema: $schema"
  echo "      service: $service"
  echo "      router: $router"
  echo "      events: $events"
  echo "      rbac: $rbac"
  echo "      form: $form"
  echo "      table: $table"
  echo "      detail: $detail"
  echo "      field_parity: $field_parity"
  echo "      unit_test: $unit_test"
  echo "      e2e_test: $e2e_test"
  echo "      persona: $persona"
  echo "    notes: \"$level — auto-detected\""
  echo ""
done

echo "Done. Redirect output to completeness YAML files." >&2

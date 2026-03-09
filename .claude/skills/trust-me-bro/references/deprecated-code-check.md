# Deprecated Code Check — Known Anti-Patterns

Scans codebase for deprecated patterns, legacy prefixes, and convention violations.

**When to run:** SDD SCAN phase (dev gate, check D10).
**Scope:** All module source files (schema, services, routers).

## 1. Grep Patterns

Run each pattern against the codebase. Exclude: `node_modules/`, `.legacy/`, `quality-reports/`, `*.test.ts`.

### HIGH Severity — Must Fix

```bash
# Deprecated event emission (use emitOutboxEvent instead)
grep -rn 'publishEvent(' apps/ops/src/modules/ --include="*.ts" \
  --exclude-dir=node_modules --exclude="*.test.ts"

# Mutations without RBAC (must use permissionProcedure)
grep -rnE 'protectedProcedure\s*\.\s*mutation' apps/ops/src/modules/ --include="*.ts" \
  --exclude-dir=node_modules --exclude="*.test.ts"

# Wrong money type (VND must use bigint, not numeric/decimal/integer)
grep -rnE '(numeric|decimal)\(\)' apps/ops/src/modules/*/schema/*.ts \
  --exclude-dir=node_modules

# Old table prefixes in active schema (migration pending)
grep -rn "pgTable('enr_" apps/ops/src/modules/ --include="*.ts" --exclude-dir=.legacy
grep -rn "pgTable('trn_" apps/ops/src/modules/ --include="*.ts" --exclude-dir=.legacy
grep -rn "pgTable('adm_" apps/ops/src/modules/ --include="*.ts" --exclude-dir=.legacy
```

### MEDIUM Severity — Should Fix

```bash
# console.log in production code (use createModuleLogger)
grep -rn 'console\.log' apps/ops/src/modules/*/services/*.ts \
  --exclude-dir=node_modules --exclude="*.test.ts"

# pgEnum usage (should use md_choices)
grep -rn 'pgEnum' apps/ops/src/modules/*/schema/*.ts \
  --exclude-dir=node_modules

# Stale module imports (consolidated modules)
grep -rn "from.*enrollment/" apps/ops/src/modules/ --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.legacy
grep -rn "from.*trainer/" apps/ops/src/modules/ --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.legacy

# Missing data-testid on interactive elements
grep -rlE '<(Button|Input|Select|Dialog)' apps/ops/src/app/ --include="*.tsx" | \
  xargs grep -L 'data-testid' 2>/dev/null
```

## 2. Known Exceptions

Do NOT flag these as findings:

| Pattern | Exception Reason |
|---------|-----------------|
| `pgEnum` in `shared/schema/` | Better Auth framework requires it |
| `console.log` in `scripts/` | Seed/dev scripts, not production |
| `console.log` in `*.test.ts` | Test output, acceptable |
| `enr_`/`trn_` in `.legacy/` | Archived, not active code |
| `publishEvent` in comments/docs | Documentation references |
| `numeric()` in non-money columns | Acceptable for percentages, rates |

## 3. Scoring

Count findings per severity after excluding known exceptions:

| Severity | Threshold | Action |
|----------|-----------|--------|
| HIGH | 0 allowed | Must fix in DO phase or defer with justification |
| MEDIUM | Report only | Log to registry, defer acceptable |

## 4. Output Format

For each finding, log to issue-registry:

```markdown
| SDD-{NNN} | {high|medium} | D10-deprecated | {file}:{line} — {pattern description} | grep output | {convention reference} | self | open | — | — |
```

Summary:

```markdown
## Deprecated Code Report

| Pattern | Hits | Severity | Files Affected |
|---------|------|----------|---------------|
| publishEvent() | {N} | HIGH | {list} |
| protectedProcedure.mutation | {N} | HIGH | {list} |
| Wrong money type | {N} | HIGH | {list} |
| Old table prefix | {N} | HIGH | {list} |
| console.log in services | {N} | MEDIUM | {list} |
| pgEnum usage | {N} | MEDIUM | {list} |
| Stale module imports | {N} | MEDIUM | {list} |

**Total: {N} HIGH, {M} MEDIUM — {PASS|FAIL}**
Issues logged to registry: {N}
```

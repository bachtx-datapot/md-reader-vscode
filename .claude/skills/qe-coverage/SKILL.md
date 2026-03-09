# qe-coverage — Test Coverage Gap Analysis

## Metadata
name: qe-coverage
description: "Analyze test coverage gaps and prioritize missing tests"
argument-hint: "[module-path]"
attribution: "Adapted from agentic-qe (MIT) by proffesor-for-testing"

## Invocation
```
/qe-coverage
/qe-coverage src/server/modules/crm
/qe-coverage --report-only
```

## What It Does

1. **Run Vitest** with coverage: `pnpm vitest run --coverage`
2. **Parse coverage report** (lcov/json) for line/branch/function metrics
3. **Cross-reference** with page-surface-registry.md:
   - Routes without E2E specs
   - Modules with < 70% branch coverage
   - Services without unit tests
4. **Prioritize gaps** by risk:
   - Money-handling code (finance) = HIGH
   - Auth/RBAC code = HIGH
   - CRUD operations = MEDIUM
   - UI display logic = LOW
5. **Output:** gap report with recommended test files to create

## Analysis Approach

### File-Level Coverage
Which source files have no corresponding test files?
```bash
# Find untested service files
for f in $(find src/server/modules -name "*.service.ts"); do
  test_file="${f%.ts}.test.ts"
  if [ ! -f "$test_file" ]; then
    echo "UNTESTED: $f"
  fi
done
```

### Route-Level Coverage
Which routes in page-surface-registry have no E2E spec?
1. Read `docs/product/page-surface-registry.md`
2. Glob `tests/e2e/**/*.spec.ts`
3. Diff: routes without matching spec file

### Branch-Level Coverage
Which decision branches are untested?
Parse Vitest coverage JSON:
- `branches.covered / branches.total < 0.7` → flag module
- Focus on service files (business logic, not UI)

### Risk-Weighted Prioritization

| Module Pattern | Risk | Rationale |
|---------------|------|-----------|
| `modules/finance/**` | HIGH | Money handling |
| `**/auth/**`, `**/rbac/**` | HIGH | Security critical |
| `**/services/*.ts` | MEDIUM | Business logic |
| `**/schema/*.ts` | MEDIUM | Data integrity |
| `**/router*.ts` | MEDIUM | API surface |
| `app/**/*.tsx` | LOW | UI display |
| `components/**` | LOW | Shared UI |

## Output Format

```markdown
# Coverage Gap Report

**Date:** {date}
**Overall:** {line%} lines, {branch%} branches, {fn%} functions

## Critical Gaps (HIGH risk, no tests)

| File | Type | Risk | Recommended Test |
|------|------|------|-----------------|
| {path} | {service/router/schema} | HIGH | tests/{recommended-path} |

## Route Coverage

| Route | E2E Spec | Status |
|-------|----------|--------|
| /crm/leads | tests/e2e/crm/leads.spec.ts | Covered |
| /finance/invoices | — | **MISSING** |

## Module Summary

| Module | Line % | Branch % | Status |
|--------|--------|----------|--------|
| crm | 82% | 71% | OK |
| finance | 45% | 32% | **BELOW THRESHOLD** |

## Recommendations
1. {Highest priority gap + suggested action}
2. ...
```

## Integration Notes
- Does NOT generate tests (use `/qe-test-gen` for that)
- Does NOT validate live behavior (use `/qa-validate` for that)
- Pure analysis + reporting

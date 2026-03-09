# qe-test-gen — E2E Test Scaffolding

## Metadata
name: qe-test-gen
description: "Generate Playwright E2E spec files from source code analysis"
argument-hint: "<module-or-path>"
attribution: "Adapted from agentic-qe (MIT) by proffesor-for-testing"

## Invocation
```
/qe-test-gen src/server/modules/crm
/qe-test-gen crm
/qe-test-gen --coverage-gaps
```

**V-6 (Decoupled):** This skill does NOT call `/qa-validate`. They are independent.
- `/qe-test-gen` generates permanent test files for CI/CD
- `/qa-validate` validates live behavior via browser

## What It Does

1. **Analyze source code:** routes, schemas, services, types for the target module
2. **Read page-surface-registry.md:** route → spec mapping, find uncovered routes
3. **Generate Playwright spec files** with:
   - `data-testid` selectors (extracted from source analysis)
   - Auth state setup (admin + staff roles via `global-setup.ts`)
   - CRUD lifecycle tests (create → read → update → delete)
   - Error scenario tests (validation failures, permission denials)
   - Cross-tenant isolation tests
4. **Output** to `tests/e2e/{domain}/` matching Playwright config projects

## Generation Strategy

### Pattern-Based
Analyze router → generate test per procedure:
- `{module}.list` → list page test (load, pagination, search)
- `{module}.getByCode` → detail page test (load, display fields)
- `{module}.create` → create flow test (form fill, submit, verify)
- `{module}.update` → edit flow test (load existing, modify, verify)
- `{module}.delete` → delete test (confirm dialog, soft delete, verify)

### Coverage-Driven (`--coverage-gaps`)
Read existing specs → find uncovered routes:
1. Glob `tests/e2e/**/*.spec.ts`
2. Compare against `page-surface-registry.md`
3. List routes without specs → generate stubs for missing ones

### Story-Driven
Read user stories → generate acceptance test per AC:
1. Read `docs/product/requirements/{domain}/02-user-stories.md`
2. Extract Given/When/Then scenarios
3. Generate Playwright test per BDD scenario

## Our Stack Conventions

Load: `references/patterns.md`

- **Framework:** Playwright (not Jest/Mocha)
- **Assertions:** Playwright `expect` (not chai)
- **Selectors:** `data-testid` convention (our standard)
- **Auth:** `storageState` from `global-setup.ts`
- **Config:** `apps/ops/playwright.config.ts` projects
- **File naming:** `{feature}.e2e.spec.ts`
- **Location:** `tests/e2e/{domain}/{sub}/`

## Output Format

Each generated spec includes:
```typescript
import { test, expect } from '@playwright/test';

test.describe('{Module} - {Feature}', () => {
  test('{test-title}', async ({ page }) => {
    // Navigate-First: start from root, click through
    await page.goto('/');
    // ... test steps with data-testid selectors
  });
});
```

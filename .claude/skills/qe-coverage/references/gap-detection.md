# Gap Detection Patterns

Attribution: Adapted from agentic-qe (MIT) by proffesor-for-testing

## Coverage Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Line coverage | < 70% | Flag module |
| Branch coverage | < 60% | Flag module (critical) |
| Function coverage | < 80% | Flag module |
| E2E route coverage | < 50% | Flag domain |

## File Matching Rules

### Unit Test Pairing
```
src/server/modules/{mod}/services/{name}.ts
→ tests/unit/{mod}/{name}.test.ts
OR src/server/modules/{mod}/services/{name}.test.ts
```

### E2E Spec Pairing
```
apps/ops/src/app/(ops)/{section}/page.tsx
→ tests/e2e/{domain}/{section}.e2e.spec.ts
```

### Route → Domain Mapping
| Route prefix | Domain | E2E dir |
|-------------|--------|---------|
| /crm/ | marketing-sales | tests/e2e/crm/ |
| /com/ | marketing-sales | tests/e2e/com/ |
| /cms/ | marketing-sales | tests/e2e/cms/ |
| /sup/ | marketing-sales | tests/e2e/sup/ |
| /lms/ | learning-experience | tests/e2e/lms/ |
| /finance/ | finance | tests/e2e/finance/ |
| /settings/ | infra | tests/e2e/infra/ |

## Vitest Coverage Parsing

### lcov format
```bash
pnpm vitest run --coverage --reporter=lcov
# Parse: geninfo output in coverage/lcov.info
```

### JSON format (preferred)
```bash
pnpm vitest run --coverage --reporter=json
# Parse: coverage/coverage-final.json
```

### Key fields in JSON
```json
{
  "path/to/file.ts": {
    "s": { "0": 5, "1": 0 },     // statements: key=id, val=hit count
    "b": { "0": [3, 0] },         // branches: key=id, val=[if-hits, else-hits]
    "f": { "0": 5, "1": 0 },     // functions: key=id, val=hit count
    "fnMap": { ... },              // function name/location map
    "branchMap": { ... }           // branch location map
  }
}
```

## Priority Scoring

```
score = risk_weight * (1 - coverage_ratio)
```

| Risk Weight | Module Pattern |
|------------|---------------|
| 10 | finance/*, auth/*, rbac/* |
| 7 | services/*.ts (business logic) |
| 5 | schema/*.ts, router*.ts |
| 3 | app/**/*.tsx (pages) |
| 1 | components/** (shared UI) |

Sort gaps by descending score → top 10 = recommended priorities.

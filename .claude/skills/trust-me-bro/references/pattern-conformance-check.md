# Pattern Conformance Check — Code vs .claude/patterns/*

Scores domain code against canonical patterns. Discrepancies logged as issue-registry entries.

**When to run:** SDD SCAN phase (dev gate, check D5).
**Scope:** All code files in the target domain's module directory.

## 1. Determine File Types

For each file in the domain, classify:

| Path Pattern | File Type | Pattern File |
|-------------|-----------|-------------|
| `modules/*/schema/*` | schema | `.claude/patterns/schema.md` |
| `modules/*/router*.ts`, `modules/*/routers/*` | router | `.claude/patterns/router.md` |
| `modules/*/services/*` | service | `.claude/patterns/service.md` |
| `shared/events/*` | event | `.claude/patterns/event.md` |
| `app/**/*.tsx` | ui-page | `.claude/patterns/ui-page.md` |
| `components/**` | ui-component | `.claude/patterns/crud-form.md` + `crud-list.md` |
| `tests/**` | test | `.claude/patterns/test.md` |

## 2. Check Each Convention (grep-able, not subjective)

### Schema Conventions
```bash
grep -c '\.\.\.baseColumns' {file}           # Must be >0
grep -c 'bigint.*mode.*number' {file}        # Money fields
grep -c 'defaultRandom\|baseColumns' {file}   # UUID default (baseColumns provides it)
grep -c 'pgEnum' {file}                      # Must be 0
grep -cE "pgTable\('[a-z_]+s'" {file}        # Plural name check (bad)
```

### Router Conventions
```bash
grep -c 'permissionProcedure' {file}         # Mutations must use this
grep -c 'protectedProcedure.*mutation' {file} # Should be 0
grep -c 'z\.object' {file}                   # Input validation
grep -c 'TRPCError' {file}                   # Error handling
```

### Service Conventions
```bash
grep -c 'createModuleLogger' {file}          # Must be >0
grep -c 'console\.log' {file}               # Must be 0
grep -c 'emitOutboxEvent' {file}             # Event emission
grep -c 'publishEvent' {file}               # Must be 0 (deprecated)
```

### UI Conventions
```bash
grep -c 'data-testid' {file}                # Must be >0 for interactive
grep -c 'ListPage\|DetailPage\|DataTable\|CrudSheet' {file}  # Recipe usage
```

### Test Conventions
```bash
grep -c 'createTestCaller' {file}            # Test helper usage
grep -c 'useDbFixture' {file}               # DB fixture usage
grep -c 'rejects\.toThrow\|rejects\.toMatchObject' {file}  # Error scenarios
```

## 3. Score Calculation

| Convention | Weight | Applies To |
|------------|--------|-----------|
| baseColumns spread | 2 | schema |
| Money = bigint | 2 | schema |
| UUID = defaultRandom | 1 | schema |
| No pgEnum | 2 | schema |
| Singular table name | 1 | schema |
| permissionProcedure for mutations | 3 | router |
| Zod input validation | 2 | router |
| createModuleLogger | 1 | service |
| No console.log | 1 | service |
| emitOutboxEvent (not publishEvent) | 2 | service/event |
| data-testid present | 1 | UI |
| Recipe components used | 2 | UI |
| 5-scenario test coverage | 2 | test |
| Test helpers used | 1 | test |

**Score per file:** `{conforming_conventions}/{applicable_conventions} = {percentage}%`

## 4. Aggregate for Domain

```
Domain conformance = average of all file scores
```

Thresholds:
- >=80%: PASS
- 60-79%: WARN — log medium-severity issues to registry
- <60%: FAIL — log high-severity issues to registry

## 5. Output and Registry Logging

For each file below threshold, log to issue-registry:

```markdown
| SDD-{NNN} | {high|medium} | D5-pattern | {domain}: {file} — {convention violated} | grep output | {why it diverges} | self | open | — | — |
```

Summary output:

```markdown
## Pattern Conformance Report — {domain}

| File | Type | Score | Issues |
|------|------|-------|--------|
| {path} | schema | {N}% | {list of non-conforming conventions} |
| {path} | router | {N}% | {list} |

**Domain aggregate: {N}% — {PASS|WARN|FAIL}**
Issues logged to registry: {N}
```

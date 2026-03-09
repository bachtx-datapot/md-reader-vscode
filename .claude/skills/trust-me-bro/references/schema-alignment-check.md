# Schema Alignment Check

Compares actual Drizzle schema files against table specifications in `04-database-design-{domain}.md`.
Discrepancies are logged as issue-registry entries — never silently accepted.

**When to run:** SDD SCAN phase (dev gate, check D3).
**Scope:** All tables in the target domain's schema directory.

---

## Step 1: Locate Files

Identify all tables in the target domain's schema directory.

For each table `{table_name}`:
- Schema file: `apps/ops/src/modules/{domain}/schema/{slug}.ts` (Glob to find)
- Design spec: section in `docs/product/tech-design/04-database-design-{domain}.md`
  (or `docs/product/requirements/{domain}/04-database-design.md`)

<!-- Red Team H8: If neither spec file path resolves, the check silently produces CLEAN.
     Fix: explicit missing-spec handling below. -->

**If spec file not found at either path:**
1. Log to issue-registry:
   ```
   | SDD-{NNN} | high | D3-schema | SCHEMA_SPEC_MISSING: 04-database-design not found for {domain} | grep output | Spec file missing or mislocated | self | open | — | — |
   ```
2. Output: `SCHEMA_SPEC_MISSING — check skipped for {domain}. Logged to issue-registry.`
3. Skip to Step 7 with status `SCHEMA_SPEC_MISSING` — do NOT emit CLEAN.

---

## Step 2: Extract Design Spec

From `04-database-design.md`, for each table, parse:
- Column names and types
- Nullable vs NOT NULL
- Default values
- Index declarations
- Foreign key references

Use Read tool — parse the markdown table for the relevant `lms_xxx` / `crm_xxx` etc. section.

---

## Step 3: Extract Actual Schema

From the Drizzle schema file (`.ts`), identify:
- `pgTable('table_name', { ... })` columns with types
- `index()` / `uniqueIndex()` declarations
- `.references()` foreign key calls
- `.notNull()` / `.$default()` annotations

Use Grep + Read — do NOT run the DB; parse the TypeScript source only.

---

## Step 4: Diff and Classify

Compare design spec vs actual Drizzle schema:

| Discrepancy Type | Example | Severity |
|-----------------|---------|----------|
| Missing column | spec has `max_capacity`, schema doesn't | HIGH |
| Extra column | schema has `notes`, spec doesn't | MEDIUM |
| Wrong type | spec: `INT`, schema: `varchar` | HIGH |
| Nullable mismatch | spec: NOT NULL, schema: nullable | MEDIUM |
| Missing index | spec lists index on FK, schema lacks it | MEDIUM |
| Missing FK reference | spec has `.references()`, schema uses plain column | HIGH |
| Name mismatch | spec: `created_by_id`, schema: `creator_id` | HIGH |

**Acceptable gaps (skip these):**
- Drizzle helper columns added by framework (e.g., `createdAt` added by `timestamps()`)
- `id` column using `uuid('id').primaryKey().defaultRandom()` — standard, not in spec
<!-- Red Team H5: ...baseColumns spread injects 6 columns not in spec. Previously caused false HIGH alerts.
     Fix: explicitly enumerate all columns injected by baseColumns and treat as acceptable. -->
- `...baseColumns` spread and all columns it injects: `id`, `created_at`, `updated_at`, `created_by`, `updated_by` (verify against `src/shared/db/base-columns.ts` if column names differ)

---

## Step 5: Log Discrepancies

For each discrepancy found, append to issue-registry:

```markdown
| SDD-{NNN} | {high|medium} | D3-schema | {domain}: {table_name}.{column} — {discrepancy} | Spec: {spec_value}, Code: {code_value} | {root cause analysis} | self | open | — | — |
```

---

## Step 6: Classify Impact

After logging all discrepancies:

| Count/Severity | Action |
|---------------|--------|
| 0 discrepancies | Log `Schema alignment: {table_name} matches spec` |
| MEDIUM only | Log to issue-registry, DO phase decides fix vs defer |
| 1+ HIGH | Log to issue-registry as `high` severity — DO phase must fix or defer with justification |
| Cross-domain impact | Log as `critical` severity — blocks gate completion |

---

## Step 7: Output

```
Schema alignment check — {domain}
  Tables checked: {N}
  Discrepancies: {high_count} HIGH, {medium_count} MEDIUM
  Issues logged to registry: {total_count}
  Status: {CLEAN | DELTAS_LOGGED | CRITICAL}
```

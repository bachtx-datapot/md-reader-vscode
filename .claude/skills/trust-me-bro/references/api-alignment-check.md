# API Alignment Check — tRPC Procedures vs 05-api-design Spec

Compares actual router files against procedure specifications in `05-api-design-{domain}.md`.
Discrepancies are logged as issue-registry entries.

**When to run:** SDD SCAN phase (dev gate, check D4).
**Scope:** All routers in the target domain's module directory.

## 2. Locate Files

```
Router files: apps/ops/src/modules/{module}/router*.ts, routers/*.ts
API spec: docs/product/tech-design/05-api-design-{domain}.md
```

## 3. Extract Design Spec

From 05-api-design, extract per router:
- Procedure names (list, get, create, update, delete, custom)
- Input types (Zod schema shape)
- Auth requirements (permissionProcedure vs protectedProcedure)
- HTTP method semantics (query vs mutation)

## 4. Extract Actual Code

From router files, extract:
- `router({})` procedure names
- `.input(z.object({...}))` field names
- Middleware used (permissionProcedure, protectedProcedure, publicProcedure)
- Query vs mutation designation

## 5. Diff and Classify

| Finding | Severity | Action |
|---------|----------|--------|
| Procedure in spec but missing from code | HIGH | Implementation gap — BUG |
| Procedure in code but missing from spec | MEDIUM | Extra work — log as API-DELTA |
| Wrong auth level (protectedProcedure where spec says permission) | HIGH | Security gap — BUG |
| Input field mismatch (spec has field, code doesn't) | HIGH | Data loss risk — BUG |
| Missing error handling (spec defines error, code throws generic) | MEDIUM | Quality gap |

## 6. Log Discrepancies

For each discrepancy found, append to issue-registry:

```markdown
| SDD-{NNN} | {high|medium} | D4-api | {domain}: {procedure_name} — {description} | Source: {router_file}:{line} | {root cause analysis} | self | open | — | — |
```

## 7. Output Summary

```markdown
## API Alignment Report — {domain}
Procedures checked: {N}
Match: {N} | Missing from code: {N} | Extra in code: {N}
Auth alignment: {N}/{N} correct
Input schema parity: {N}/{N} matching
Issues logged to registry: {N}
```

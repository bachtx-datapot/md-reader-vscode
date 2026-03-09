# Trigger Table — File Pattern → Required Reading

When implementing or modifying code, use this table to determine what context to load BEFORE writing code.

## Module → Domain Mapping

Resolve `{domain}` in spec paths using this table:

| Module Dir | Tech Design Domain | Table Prefix | Spec Path Prefix |
|------------|-------------------|--------------|------------------|
| crm | marketing-sales | crm_ | `docs/product/tech-design/*-marketing-sales.md` |
| com | marketing-sales | com_ | `docs/product/tech-design/*-marketing-sales.md` |
| cms | marketing-sales | cms_ | `docs/product/tech-design/*-marketing-sales.md` |
| sup | marketing-sales | sup_ | `docs/product/tech-design/*-marketing-sales.md` |
| lms | learning-experience | lms_ | `docs/product/tech-design/*-learning-experience.md` |
| finance/* | finance | fin_ | `docs/product/tech-design/*-finance.md` |
| infra | infra | inf_ | `docs/product/tech-design/*-infra.md` |
| orders | orders | ord_ | `docs/product/tech-design/*-orders.md` |
| master-data | (cross-domain) | md_ | `docs/codebase-summary.md` + existing module files |
| persons | (cross-domain) | prs_ | `docs/codebase-summary.md` + existing module files |

**Notes:**
- `cmp` (campaign) merged into `com/` — no standalone `cmp/` dir. Tables use `com_` prefix.
- `finance/` is a parent dir with sub-modules: `billing/`, `general-ledger/`, `management-accounting/`. All use `fin_` prefix.
- Event prefix matches table prefix: `crm.`, `fin.`, `lms.`, `inf.`, `com.`, `sup.`, `cms.`
- `infra` module uses `inf.` event prefix (NOT `infra.`).
- `04-database-design-shared.md` is legacy — original platform/shared schema now covered by `*-infra.md`.

## Routing Table

| File Pattern | Must Read Before Implementing |
|-------------|-------------------------------|
| `modules/*/schema/*` | `.claude/patterns/schema.md` + `04-database-design-{domain}.md` |
| `modules/*/router*.ts` | `.claude/patterns/router.md` + `05-api-design-{domain}.md` |
| `modules/*/routers/*` | `.claude/patterns/router.md` + `05-api-design-{domain}.md` |
| `modules/*/services/*` | `.claude/patterns/service.md` + `.claude/patterns/event.md` |
| `app/**/page.tsx` (list pages) | `.claude/patterns/crud-list.md` |
| `app/**/*form*` or `**/create/*` or `**/edit/*` | `.claude/patterns/crud-form.md` |
| `app/**/[code]/*` | `.claude/patterns/crud-detail.md` + `.claude/patterns/ui-page.md` |
| `components/**` | `.claude/patterns/crud-form.md` + `.claude/patterns/crud-list.md` |
| `tests/**` | `.claude/patterns/test.md` |
| `shared/events/*` | `.claude/patterns/event.md` + `docs/event-conventions.md` |

## No-Spec Fallback

If `04-*` or `05-*` doc not found for a module:
1. Read `docs/codebase-summary.md` + existing module files
2. Log as `SPEC_GAP` in requirement-delta.md
3. Do NOT block implementation — proceed with pattern-only guidance

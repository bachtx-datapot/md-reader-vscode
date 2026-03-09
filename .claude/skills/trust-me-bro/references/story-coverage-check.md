# Story Coverage Check — User Stories vs Implemented Pages

Verifies user stories have corresponding implemented routes in page-surface-registry.

**When to run:** SDD SCAN phase (dev gate, check D9).
**Scope:** All domains with `02-user-stories.md` files.

## 1. Extract Story IDs

Parse user stories from `docs/product/requirements/{domain}/02-user-stories.md`:

```bash
# Extract story IDs and titles (pattern: US-XXX-NNN or ### US-XXX-NNN)
grep -oP 'US-[A-Z]+-\d+' docs/product/requirements/*/02-user-stories.md | sort -u
```

For each story, extract:
- **ID:** `US-{MOD}-{NNN}`
- **Priority:** Must / Should / Could / Won't (MoSCoW)
- **Type:** UI story (contains "page", "view", "form", "list", "dashboard", "screen") vs backend-only

## 2. Extract Implemented Routes

Parse `docs/product/page-surface-registry.md`:

```bash
# Extract route + status + story refs
grep -E '^\|' docs/product/page-surface-registry.md | grep -v '^\| Route' | grep -v '^\|---'
```

For each route, extract:
- **Route path**
- **Status:** Done / Change Needed / Planned / Backlog
- **Stories column:** story IDs referenced

## 3. Cross-Reference

For each UI story:

| Story Priority | Route Status | Finding | Severity |
|---------------|-------------|---------|----------|
| Must-have | Done | OK — covered | — |
| Must-have | Change Needed | Gap — needs update | MEDIUM |
| Must-have | Planned / Backlog | Gap — not implemented | HIGH |
| Must-have | Not referenced | Gap — missing from registry | HIGH |
| Should-have | Done | OK — covered | — |
| Should-have | Not referenced | Gap — unplanned | MEDIUM |
| Could-have | Not referenced | Acceptable — log only | LOW |

**Skip backend-only stories.** Heuristic: story description does NOT contain any of: "page", "view", "form", "list", "dashboard", "screen", "navigate", "click", "display", "show".

## 4. Domain Mapping

| Domain Dir | Story Prefix | Registry Section |
|------------|-------------|-----------------|
| infra | US-INF, US-PLT | Platform |
| marketing-sales | US-CRM, US-CMP, US-COM, US-SUP, US-CMS | Marketing & Sales |
| learning-experience | US-LMS, US-ENR, US-TRN | Learning Experience |
| finance-accounting | US-FIN, US-BIL | Finance & Accounting |
| orders | US-ORD | Order Management |

## 5. Output Format

For each gap, log to issue-registry:

```markdown
| SDD-{NNN} | {high|medium|low} | D9-story | {domain}: {story_id} — {title} has no Done route | story file line | MoSCoW={priority} | self | open | — | — |
```

Summary:

```markdown
## Story Coverage Report — {domain}

| Priority | Total Stories | UI Stories | Covered (Done) | Gaps | Status |
|----------|-------------|-----------|---------------|------|--------|
| Must | {N} | {N} | {N} | {N} | {PASS|FAIL} |
| Should | {N} | {N} | {N} | {N} | {PASS|WARN} |
| Could | {N} | {N} | {N} | {N} | — |

Issues logged to registry: {N}
```

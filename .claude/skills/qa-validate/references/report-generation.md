# Report Generation Pipeline

## When to Generate
After ALL stages complete (or all remaining stages after skips).

## Report Types

### 1. Executive Summary (CEO-facing)
- Template: `templates/executive-summary.md`
- Output: `quality-reports/{run-id}/reports/executive-summary.md`
- Scorecard table (stage | verdict | findings | fixes | duration)
- Critical issues list
- Proposals for human review
- Skipped items (Level 3 handoffs)
- Evidence directory links
- **MUST be < 1 page** (Anti-Pattern AP-4)

### 2. Basic User Report (evidence-based)
- Template: `templates/basic-user-report.md`
- Output: `quality-reports/{run-id}/reports/basic-user.md`
- Step-by-step table with screenshots
- Each step: action | expected | actual | verdict | evidence path
- Failures: classification + error details
- Cross-user verification results

### 3. Git-Tracked Summary (for PR/team)
- Output: `plans/reports/qa-{run-id}.md`
- Compact summary (< 40 lines)
- Verdict, key findings, fix count, skip count
- Link to full reports in quality-reports/

### 4. Workflow Report (cross-domain flows)
- Template: `templates/workflow-report.md`
- Output: `quality-reports/{run-id}/reports/workflow.md`
- Per-workflow step table: role | action | route | expected | actual | DB check | event check | verdict
- Cross-domain event chain verification
- Failure classification: CHAIN_BREAK, ROLE_DENIED, EVENT_MISSING, DATA_MISMATCH, UI_ERROR

### 5. Permission Matrix Report (role × route grid)
- Template: `templates/permission-matrix-report.md`
- Output: `quality-reports/{run-id}/reports/permission-matrix.md`
- Matrix summary: 12 roles × (routes tested, positive OK, negative OK, scope OK, mutations denied)
- 5 phase detail tables (positive, negative, mutation, scope, cross-tenant)
- CRITICAL findings: NEGATIVE_ALLOWED, SCOPE_LEAK, TENANT_LEAK, MUTATION_ALLOWED

### 6. Systematic Edge Case Report (input/flow/state)
- Template: `templates/systematic-edge-case-report.md`
- Output: `quality-reports/{run-id}/reports/systematic-edge-case.md`
- 3 category tables: input validation, flow interruption, state edge cases
- DB integrity verification (XSS, Vietnamese encoding, orphans, duplicates)
- CRITICAL findings: XSS_STORED, SQLI_VULNERABLE

### 7. Human Handoff (Level 3 skips only)
- Template: `templates/proposals-handoff.md`
- Output: `quality-reports/{run-id}/proposals/human-handoff.md`
- Per-skipped TC: what was tried, why it failed, evidence, recommendation

## Generation Rules
- Executive summary MUST be < 1 page
- All reports use relative paths for evidence links
- Screenshots: `./evidence/screenshots/{stage}/step-{N}-{action}.png`
- DB checks: `./evidence/db-checks/step-{N}-{query}.json`
- Videos: `./evidence/videos/{stage}/flow.webm`

## Page Surface Registry Update (V-8)
After successful run, update `docs/product/page-surface-registry.md`:
- For each route tested, set `Last Tested` column to today's date
- Only update routes where verdict = PASS

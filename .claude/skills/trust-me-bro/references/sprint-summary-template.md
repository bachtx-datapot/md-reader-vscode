# Gate Summary — Data Source Mapping

Companion to `templates/gate-summary.md`. Maps each summary field to its data source.

## Data Sources

| Field | Source |
|-------|--------|
| Issues found/fixed/deferred | `issue-registry.md` status counts |
| By severity | `issue-registry.md` severity counts |
| Check results | SCAN phase output per `references/scan-checks.md` |
| Domain status | Per-domain issue counts from registry |
| Iterations | `sdd-state.yaml` `iteration` field |
| Verdict | `sdd-state.yaml` `overall_verdict` field |
| Files changed | `git diff --stat {base_branch}..HEAD` |
| Tests | `/test` skill output |
| Coverage | `/qe-coverage` skill output (dev gate) |
| Schema alignment | `references/schema-alignment-check.md` output (dev gate) |
| API alignment | `references/api-alignment-check.md` output (dev gate) |
| Pattern conformance | `references/pattern-conformance-check.md` output (dev gate) |
| Code review score | `/code-review` skill output (dev gate) |
| Screenshots | `quality-reports/sdd-{run-id}/evidence/screenshots/` |
| Known debt | `templates/known-debt.md` working copy |

## Formatting Rules

- **1 page maximum** — if it doesn't fit, cut details (link to full reports)
- **Numbers over prose** — metrics speak louder
- **Status text:** passed/done use plain text, no emoji
- **Link to evidence** — don't inline evidence, link to quality-reports/
- **No raw output** — summary stats only

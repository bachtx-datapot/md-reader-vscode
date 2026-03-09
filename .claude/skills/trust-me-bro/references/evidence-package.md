# Evidence Package — Standardized Per-Iteration Evidence

Generated after each DONE phase verification. Summary stats only — no raw output, no secrets.

## Template

Write to `quality-reports/sdd-{run-id}/evidence/scan-{N}/evidence-summary.md`:

```markdown
## Evidence Package — Iteration {N}, {gate} gate

### Build
- Compilation: `pnpm tsc --noEmit` → {pass/fail}

### Tests
- Total: {N} | Pass: {N} | Fail: {N} | Skip: {N}
- Line coverage: {N}% | Branch coverage: {N}%

### Spec Compliance (dev gate only)
- Schema alignment: {match}/{total} tables — {CLEAN/discrepancies}
- API alignment: {match}/{total} procedures

### Pattern Conformance (dev gate only)
- Score: {N}% ({PASS/WARN/FAIL})
- Files checked: {N}
- Non-conforming: {list of conventions violated, if any}

### Visual Evidence (CEO gate, browser QA)
- Screenshots: {count} in evidence/screenshots/
- Viewports: desktop ({count}) + mobile ({count})
- AI verdicts: {N} PASS / {N} WARN / {N} FAIL
- Data presence: {N}/{total} pages show real data rows

### Issue Registry Snapshot
- Total: {N} | Open: {N} | Fixed: {N} | Deferred: {N} | Awaiting Human: {N}
```

## Security Rules

- **NO raw test output** — summary numbers only
- **NO tokens, URLs, or credentials** — sanitize screenshots
- **NO full stack traces** — reference file:line only
- Raw output stays in `quality-reports/` (gitignored). Evidence captures aggregated stats.

## Data Sources

| Field | Source |
|-------|--------|
| Build | `pnpm tsc --noEmit` exit code |
| Tests | `/test` skill output |
| Schema alignment | `references/schema-alignment-check.md` output |
| API alignment | `references/api-alignment-check.md` output |
| Pattern conformance | `references/pattern-conformance-check.md` output |
| Screenshots | `quality-reports/sdd-{run-id}/evidence/screenshots/` |
| Issue registry | `quality-reports/sdd-{run-id}/issue-registry.md` |

## When to Generate

- After each DONE phase verification
- Before updating sdd-state.yaml for the iteration
- Evidence is referenced in the gate summary

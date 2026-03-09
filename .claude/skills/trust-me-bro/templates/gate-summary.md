# {Gate} Gate Summary — {date}

**Run ID:** {run-id}
**Gate:** {ceo|dev}
**Verdict:** {pass | pass_with_debt | fail}
**Iterations:** {N} scans, {N} fix cycles

## Numbers
- Issues found: {total} | Fixed: {N} | Deferred: {N} | Awaiting human: {N}
- By severity: {critical} critical, {high} high, {medium} medium, {low} low

## Checks Run

| Check | Result | Issues Found |
|-------|--------|-------------|
| Typecheck | pass/fail | {N} |
| Unit tests | pass/fail | {N} |
| ... per scan-checks.md | ... | ... |

## Deferred Items
See `known-debt.md` for {N} items deferred with justification.

## Domains
| Domain | Status | Issues |
|--------|--------|--------|
| Infra | clean/issues | {N} |
| MKS | clean/issues | {N} |
| LXP | clean/issues | {N} |
| Finance | clean/issues | {N} |

## Evidence
- Raw: `quality-reports/sdd-{run-id}/`
- Issue registry: `plans/handoff/issue-registry.md`
- Known debt: `plans/handoff/known-debt.md`

# Basic User Report

**Process:** {process-name}
**Run ID:** {run-id}
**Date:** {date}
**Verdict:** {PASS | FAIL}

## Flow Steps

| # | Action | Expected | Actual | Verdict | Evidence |
|---|--------|----------|--------|---------|----------|
| 1 | {action} | {expected} | {actual} | PASS/FAIL | [screenshot](./evidence/...) |

## Failures

### {TC-ID}: {title}
- **Classification:** BUG / MISSING / DESIGN
- **Error:** {error message}
- **Screenshot:** [error state](./evidence/...)
- **Console errors:** {summary}
- **Escalation:** Level {N} -> {outcome}

## Cross-User Verification

| Check | User | Expected | Actual | Verdict |
|-------|------|----------|--------|---------|
| Data visible to admin | admin@test.com | Yes | {actual} | PASS/FAIL |

## Cross-Tenant Isolation (RT-7)

| Check | Tenant User | Expected | Actual | Verdict |
|-------|-------------|----------|--------|---------|
| Data NOT visible | other_tenant | 403/empty | {actual} | PASS/FAIL |

## Summary
- Steps completed: {N}/{total}
- Failures: {count}
- Fixes applied: {count}
- Skipped (L3): {count}

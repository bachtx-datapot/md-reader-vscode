# Workflow Report

**Process:** {process-name}
**Run ID:** {run-id}
**Date:** {date}
**Workflows Tested:** {count} (P0: {n}, P1: {n}, P2: {n})
**Verdict:** {PASS | FAIL}

## Workflow Results

### {W-ID}: {workflow-name}

**Domains:** {domain} → {domain}
**Roles:** {role} → {role} → ...

| # | Role | Action | Route | Expected | Actual | DB Check | Event Check | Verdict | Evidence |
|---|------|--------|-------|----------|--------|----------|-------------|---------|----------|
| 1 | {role} | {action} | {route} | {expected} | {actual} | PASS/FAIL | PASS/FAIL/N/A | PASS/FAIL | [screenshot](...) |

### Cross-Domain Event Chain

| Step | Event Type | Expected | Found in Outbox | Latency | Verdict |
|------|-----------|----------|-----------------|---------|---------|
| {N} | {event.type} | Row exists | {yes/no} | {ms} | PASS/FAIL |

---

## Failures

### {TC-ID}: {title}
- **Workflow:** {W-ID}
- **Step:** {N}
- **Role:** {role}
- **Route:** {route}
- **Error:** {description}
- **Evidence:** [screenshot](./evidence/...) | [db-check](./evidence/...)
- **Escalation:** {Level N → outcome}

## Summary

| Metric | Value |
|--------|-------|
| Workflows tested | {N} |
| Steps executed | {N} |
| Role switches | {N} |
| Cross-domain events verified | {N} |
| Failures | {N} |
| Fixes applied | {N} |
| Skipped (Level 3) | {N} |
